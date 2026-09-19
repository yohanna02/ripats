import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { recordEvent } from "./lib/access";

const institutionCode = "ATBU";

/** Idempotently promotes an existing Convex Auth account to administrator. */
export const seedAdministrator = internalMutation({
  args: {
    email: v.string(),
    displayName: v.string(),
  },
  returns: v.object({
    created: v.boolean(),
    profileId: v.id("userProfiles"),
  }),
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .first();
    if (!user) {
      throw new Error(
        `No Convex Auth account exists for ${email}. Register and verify this account first.`,
      );
    }
    if (!user.emailVerificationTime) {
      throw new Error(
        `The Convex Auth account for ${email} must verify its email before it can be seeded as an administrator.`,
      );
    }

    const existingInstitution = await ctx.db
      .query("institutions")
      .withIndex("by_code", (q) => q.eq("code", institutionCode))
      .unique();
    const institutionId: Id<"institutions"> = existingInstitution
      ? existingInstitution._id
      : await ctx.db.insert("institutions", {
        name: "Abubakar Tafawa Balewa University",
        code: institutionCode,
        domain: "atbu.edu.ng",
        createdAt: Date.now(),
      });

    const metrics = await ctx.db
      .query("institutionMetrics")
      .withIndex("by_institution_id", (q) =>
        q.eq("institutionId", institutionId),
      )
      .unique();
    if (!metrics) {
      await ctx.db.insert("institutionMetrics", {
        institutionId,
        researchCount: 0,
        pendingAccessRequests: 0,
        openSecurityAlerts: 0,
        verifiedVersions: 0,
        updatedAt: Date.now(),
      });
    }

    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .unique();
    const displayName = args.displayName.trim() || user.name || email;
    let profileId: Id<"userProfiles">;
    const created = !existingProfile;
    if (existingProfile) {
      profileId = existingProfile._id;
      await ctx.db.patch(existingProfile._id, {
        institutionId,
        role: "administrator",
        displayName,
        active: true,
      });
    } else {
      profileId = await ctx.db.insert("userProfiles", {
        userId: user._id,
        institutionId,
        role: "administrator",
        displayName,
        active: true,
        createdAt: Date.now(),
      });
    }

    const profile = await ctx.db.get(profileId);
    if (!profile) throw new Error("Administrator profile setup failed.");
    await recordEvent(
      ctx,
      profile,
      "admin.seeded",
      "Administrator profile seeded for the ATBU RIPATS workspace.",
    );
    return { created, profileId: profile._id };
  },
});
