import { getAuthUserId } from "@convex-dev/auth/server";
import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";

type Context = QueryCtx | MutationCtx;

export async function requireProfile(
  ctx: Context,
): Promise<Doc<"userProfiles">> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) throw new Error("Authentication required.");
  const profile = await ctx.db
    .query("userProfiles")
    .withIndex("by_user_id", (q) => q.eq("userId", userId))
    .unique();
  if (!profile || !profile.active)
    throw new Error("An active RIPATS profile is required.");
  const user = await ctx.db.get(userId);
  if (!user?.emailVerificationTime)
    throw new Error("A verified email is required.");
  return profile;
}

export async function requireAdministrator(
  ctx: Context,
): Promise<Doc<"userProfiles">> {
  const profile = await requireProfile(ctx);
  if (
    profile.role !== "administrator" &&
    profile.role !== "ip_officer" &&
    profile.role !== "security_officer"
  ) {
    throw new Error("Institutional role required.");
  }
  return profile;
}

export async function requireDisclosureOfficer(
  ctx: Context,
): Promise<Doc<"userProfiles">> {
  const profile = await requireProfile(ctx);
  if (profile.role !== "administrator" && profile.role !== "ip_officer") {
    throw new Error("An administrator or IP officer role is required.");
  }
  return profile;
}

export async function recordEvent(
  ctx: MutationCtx,
  profile: Doc<"userProfiles">,
  action: string,
  detail: string,
  outcome: "success" | "denied" | "warning" = "success",
  researchId?: Doc<"research">["_id"],
) {
  await ctx.db.insert("auditEvents", {
    institutionId: profile.institutionId,
    actorProfileId: profile._id,
    researchId,
    action,
    outcome,
    detail,
    createdAt: Date.now(),
  });
}
