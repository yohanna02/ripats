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
      role: v.union(v.literal("researcher"), v.literal("partner"), v.literal("supervisor"), v.literal("ip_officer"), v.literal("security_officer"), v.literal("administrator")),
      department: v.union(v.string(), v.null()),
      institutionName: v.string(),
    }),
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const profile = await ctx.db.query("userProfiles").withIndex("by_user_id", (q) => q.eq("userId", userId)).unique();
    const user = await ctx.db.get(userId);
    if (!profile || !user || !profile.active) return null;
    const institution = await ctx.db.get(profile.institutionId);
    return {
      profileId: profile._id,
      userId,
      email: user.email ?? "",
      displayName: profile.displayName,
      role: profile.role,
      department: profile.department ?? null,
      institutionName: institution?.name ?? "ATBU",
    };
  },
});

export const ensureProfile = mutation({
  args: { displayName: v.string(), department: v.optional(v.string()) },
  returns: v.id("userProfiles"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Authentication required.");
    const existing = await ctx.db.query("userProfiles").withIndex("by_user_id", (q) => q.eq("userId", userId)).unique();
    if (existing) return existing._id;
    let institution = await ctx.db.query("institutions").withIndex("by_code", (q) => q.eq("code", institutionCode)).unique();
    if (!institution) {
      const institutionId = await ctx.db.insert("institutions", { name: "Abubakar Tafawa Balewa University", code: institutionCode, domain: "atbu.edu.ng", createdAt: Date.now() });
      institution = await ctx.db.get(institutionId);
    }
    if (!institution) throw new Error("Institution setup failed.");
    const profileId = await ctx.db.insert("userProfiles", {
      userId,
      institutionId: institution._id,
      role: user?.email?.toLowerCase().endsWith("@atbu.edu.ng") ? "researcher" : "partner",
      displayName: args.displayName.trim(),
      department: args.department?.trim() || undefined,
      active: true,
      createdAt: Date.now(),
    });
    const profile = await ctx.db.get(profileId);
    if (profile) await recordEvent(ctx, profile, "account.created", "Researcher profile created.");
    return profileId;
  },
});

export const bootstrapAdministrator = mutation({
  args: { code: v.string(), displayName: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Authentication required.");
    if (!env.ATBU_BOOTSTRAP_CODE || args.code !== env.ATBU_BOOTSTRAP_CODE) throw new Error("Invalid administrator setup code.");
    const user = await ctx.db.get(userId);
    if (!user?.email || !env.ATBU_ADMIN_EMAIL || user.email.toLowerCase() !== env.ATBU_ADMIN_EMAIL.toLowerCase()) {
      throw new Error("This account is not authorized for initial administration.");
    }
    const existingProfile = await ctx.db.query("userProfiles").withIndex("by_user_id", (q) => q.eq("userId", userId)).unique();
    if (existingProfile) {
      if (existingProfile.role === "administrator") return null;
      throw new Error("Account already has a profile; contact an administrator.");
    }
    let institution = await ctx.db.query("institutions").withIndex("by_code", (q) => q.eq("code", institutionCode)).unique();
    if (!institution) {
      const id = await ctx.db.insert("institutions", { name: "Abubakar Tafawa Balewa University", code: institutionCode, domain: "atbu.edu.ng", createdAt: Date.now() });
      institution = await ctx.db.get(id);
    }
    if (!institution) throw new Error("Institution setup failed.");
    const otherAdministrators = await ctx.db.query("userProfiles").withIndex("by_institution_id_and_role", (q) => q.eq("institutionId", institution!._id).eq("role", "administrator")).take(1);
    if (otherAdministrators.length > 0) throw new Error("Initial administrator has already been configured.");
    const profileId = await ctx.db.insert("userProfiles", { userId, institutionId: institution._id, role: "administrator", displayName: args.displayName.trim(), active: true, createdAt: Date.now() });
    const profile = await ctx.db.get(profileId);
    if (profile) await recordEvent(ctx, profile, "admin.bootstrap", "Initial ATBU administrator configured.");
    return null;
  },
});
