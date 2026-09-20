import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { env, mutation, query } from "./_generated/server";
import { requireProfile, recordEvent } from "./lib/access";

const institutionCode = "ATBU";

export const me = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      profileId: v.id("userProfiles"),
      userId: v.id("users"),
      email: v.string(),
      displayName: v.string(),
      role: v.union(
        v.literal("researcher"),
        v.literal("partner"),
        v.literal("supervisor"),
        v.literal("ip_officer"),
        v.literal("security_officer"),
        v.literal("administrator"),
      ),
      department: v.union(v.string(), v.null()),
      institutionName: v.string(),
      active: v.boolean(),
    }),
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();
    const user = await ctx.db.get(userId);
    if (!profile || !user) return null;
    const institution = await ctx.db.get(profile.institutionId);
    return {
      profileId: profile._id,
      userId,
      email: user.email ?? "",
      displayName: profile.displayName,
      role: profile.role,
      department: profile.department ?? null,
      institutionName: institution?.name ?? "ATBU",
      active: profile.active,
    };
  },
});

export const ensureProfile = mutation({
  args: { displayName: v.string(), department: v.optional(v.string()) },
  returns: v.id("userProfiles"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Authentication required.");
    const user = await ctx.db.get(userId);
    if (!user?.emailVerificationTime)
      throw new Error("Verify your email before creating a RIPATS profile.");
    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();
    if (existing) return existing._id;
    let institution = await ctx.db
      .query("institutions")
      .withIndex("by_code", (q) => q.eq("code", institutionCode))
      .unique();
    if (!institution) {
      const institutionId = await ctx.db.insert("institutions", {
        name: "Abubakar Tafawa Balewa University",
        code: institutionCode,
        domain: "atbu.edu.ng",
        createdAt: Date.now(),
      });
      institution = await ctx.db.get(institutionId);
    }
    if (!institution) throw new Error("Institution setup failed.");
    const metrics = await ctx.db
      .query("institutionMetrics")
      .withIndex("by_institution_id", (q) =>
        q.eq("institutionId", institution._id),
      )
      .unique();
    if (!metrics)
      await ctx.db.insert("institutionMetrics", {
        institutionId: institution._id,
        researchCount: 0,
        pendingAccessRequests: 0,
        openSecurityAlerts: 0,
        verifiedVersions: 0,
        updatedAt: Date.now(),
      });
    const profileId = await ctx.db.insert("userProfiles", {
      userId,
      institutionId: institution._id,
      role: user?.email?.toLowerCase().endsWith("@atbu.edu.ng")
        ? "researcher"
        : "partner",
      displayName: args.displayName.trim(),
      department: args.department?.trim() || undefined,
      active: true,
      createdAt: Date.now(),
    });
    const profile = await ctx.db.get(profileId);
    if (profile)
      await recordEvent(
        ctx,
        profile,
        "account.created",
        "Researcher profile created.",
      );
    return profileId;
  },
});

export const updateProfile = mutation({
  args: {
    displayName: v.string(),
    department: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);
    const displayName = args.displayName.trim();
    if (displayName.length < 2)
      throw new Error("Display name must be at least 2 characters.");
    await ctx.db.patch(profile._id, {
      displayName,
      department: args.department?.trim() || undefined,
    });
    await recordEvent(ctx, profile, "account.profile.updated", "Updated profile settings.");
    return null;
  },
});

export const bootstrapAdministrator = mutation({
  args: { code: v.string(), displayName: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Authentication required.");
    const configuredEnv = env as typeof env & {
      readonly ATBU_BOOTSTRAP_CODE?: string;
      readonly ATBU_ADMIN_EMAIL?: string;
    };
    if (
      !configuredEnv.ATBU_BOOTSTRAP_CODE ||
      args.code !== configuredEnv.ATBU_BOOTSTRAP_CODE
    )
      throw new Error("Invalid administrator setup code.");
    const user = await ctx.db.get(userId);
    if (!user?.emailVerificationTime)
      throw new Error("Verify your email before configuring administration.");
    if (
      !user?.email ||
      !configuredEnv.ATBU_ADMIN_EMAIL ||
      user.email.toLowerCase() !== configuredEnv.ATBU_ADMIN_EMAIL.toLowerCase()
    ) {
      throw new Error(
        "This account is not authorized for initial administration.",
      );
    }
    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();
    let institution = await ctx.db
      .query("institutions")
      .withIndex("by_code", (q) => q.eq("code", institutionCode))
      .unique();
    if (!institution) {
      const id = await ctx.db.insert("institutions", {
        name: "Abubakar Tafawa Balewa University",
        code: institutionCode,
        domain: "atbu.edu.ng",
        createdAt: Date.now(),
      });
      institution = await ctx.db.get(id);
    }
    if (!institution) throw new Error("Institution setup failed.");
    const metrics = await ctx.db
      .query("institutionMetrics")
      .withIndex("by_institution_id", (q) =>
        q.eq("institutionId", institution._id),
      )
      .unique();
    if (!metrics)
      await ctx.db.insert("institutionMetrics", {
        institutionId: institution._id,
        researchCount: 0,
        pendingAccessRequests: 0,
        openSecurityAlerts: 0,
        verifiedVersions: 0,
        updatedAt: Date.now(),
      });
    const otherAdministrators = await ctx.db
      .query("userProfiles")
      .withIndex("by_institution_id_and_role", (q) =>
        q.eq("institutionId", institution!._id).eq("role", "administrator"),
      )
      .take(1);
    if (otherAdministrators.length > 0)
      throw new Error("Initial administrator has already been configured.");
    const profileId = existingProfile
      ? existingProfile._id
      : await ctx.db.insert("userProfiles", {
          userId,
          institutionId: institution._id,
          role: "administrator",
          displayName: args.displayName.trim(),
          active: true,
          createdAt: Date.now(),
        });
    if (existingProfile)
      await ctx.db.patch(existingProfile._id, {
        role: "administrator",
        displayName: args.displayName.trim(),
        active: true,
      });
    const profile = await ctx.db.get(profileId);
    if (profile)
      await recordEvent(
        ctx,
        profile,
        "admin.bootstrap",
        "Initial ATBU administrator configured.",
      );
    return null;
  },
});

export const listInstitutionUsers = query({
  args: {},
  returns: v.array(
    v.object({
      profileId: v.id("userProfiles"),
      displayName: v.string(),
      email: v.string(),
      department: v.union(v.string(), v.null()),
      role: v.union(
        v.literal("researcher"),
        v.literal("partner"),
        v.literal("supervisor"),
        v.literal("ip_officer"),
        v.literal("security_officer"),
        v.literal("administrator"),
      ),
      active: v.boolean(),
    }),
  ),
  handler: async (ctx) => {
    const profile = await requireProfile(ctx);
    if (profile.role !== "administrator")
      throw new Error("Administrator role required.");
    const profiles = await ctx.db
      .query("userProfiles")
      .withIndex("by_institution_id_and_role", (q) =>
        q.eq("institutionId", profile.institutionId),
      )
      .take(100);
    const users = [];
    for (const item of profiles) {
      const user = await ctx.db.get(item.userId);
      users.push({
        profileId: item._id,
        displayName: item.displayName,
        email: user?.email ?? "",
        department: item.department ?? null,
        role: item.role,
        active: item.active,
      });
    }
    return users;
  },
});

export const setRole = mutation({
  args: {
    profileId: v.id("userProfiles"),
    role: v.union(
      v.literal("researcher"),
      v.literal("partner"),
      v.literal("supervisor"),
      v.literal("ip_officer"),
      v.literal("security_officer"),
      v.literal("administrator"),
    ),
    active: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const actor = await requireProfile(ctx);
    if (actor.role !== "administrator")
      throw new Error("Administrator role required.");
    const target = await ctx.db.get(args.profileId);
    if (!target || target.institutionId !== actor.institutionId)
      throw new Error("User profile not found.");
    if (
      target._id === actor._id &&
      (args.role !== "administrator" || !args.active)
    )
      throw new Error("You cannot suspend or remove your own administrator role.");
    await ctx.db.patch(target._id, { role: args.role, active: args.active });
    await recordEvent(
      ctx,
      actor,
      "user.role.updated",
      `Updated ${target.displayName} to ${args.role}; active=${args.active}.`,
    );
    return null;
  },
});
