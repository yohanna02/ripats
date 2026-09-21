import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const role = v.union(
  v.literal("researcher"),
  v.literal("partner"),
  v.literal("supervisor"),
  v.literal("ip_officer"),
  v.literal("security_officer"),
  v.literal("administrator"),
);

const classification = v.union(
  v.literal("public"),
  v.literal("restricted"),
  v.literal("confidential"),
  v.literal("ip_sensitive"),
);

export default defineSchema({
  ...authTables,
  institutions: defineTable({
    name: v.string(),
    code: v.string(),
    domain: v.string(),
    createdAt: v.number(),
  }).index("by_code", ["code"]),
  institutionMetrics: defineTable({
    institutionId: v.id("institutions"),
    researchCount: v.number(),
    pendingAccessRequests: v.number(),
    openSecurityAlerts: v.number(),
    verifiedVersions: v.number(),
    updatedAt: v.number(),
  }).index("by_institution_id", ["institutionId"]),
  userProfiles: defineTable({
    userId: v.id("users"),
    institutionId: v.id("institutions"),
    role,
    displayName: v.string(),
    department: v.optional(v.string()),
    active: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_institution_id_and_role", ["institutionId", "role"]),
  research: defineTable({
    institutionId: v.id("institutions"),
    ownerProfileId: v.id("userProfiles"),
    researchId: v.string(),
    title: v.string(),
    abstract: v.string(),
    innovationSummary: v.optional(v.string()),
    field: v.string(),
    department: v.string(),
    classification,
    stage: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("submitted"),
      v.literal("verified"),
      v.literal("in_review"),
      v.literal("published"),
      v.literal("rejected"),
    ),
    innovationPublished: v.boolean(),
    problemStatement: v.optional(v.string()),
    application: v.optional(v.string()),
    collaborationSought: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_institution_id_and_updated_at", ["institutionId", "updatedAt"])
    .index("by_owner_profile_id_and_updated_at", [
      "ownerProfileId",
      "updatedAt",
    ])
    .index("by_institution_id_and_classification", [
      "institutionId",
      "classification",
    ])
    .index("by_institution_id_and_innovation_published", [
      "institutionId",
      "innovationPublished",
    ])
    .index("by_research_id", ["researchId"]),
  researchVersions: defineTable({
    researchId: v.id("research"),
    versionNumber: v.number(),
    fileName: v.string(),
    contentType: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")),
    sha256: v.string(),
    notes: v.optional(v.string()),
    submittedByProfileId: v.id("userProfiles"),
    createdAt: v.number(),
  })
    .index("by_research_id_and_version_number", ["researchId", "versionNumber"])
    .index("by_research_id", ["researchId"]),
  accessRequests: defineTable({
    institutionId: v.id("institutions"),
    researchId: v.id("research"),
    ownerProfileId: v.optional(v.id("userProfiles")),
    requesterProfileId: v.id("userProfiles"),
    requesterName: v.string(),
    requesterEmail: v.string(),
    organization: v.string(),
    purpose: v.string(),
    durationHours: v.number(),
    requestContext: v.optional(
      v.object({
        sessionId: v.string(),
        sourcePath: v.string(),
        referrer: v.optional(v.string()),
        userAgent: v.string(),
        platform: v.string(),
        locale: v.string(),
        timezone: v.string(),
        channel: v.literal("web"),
      }),
    ),
    requestedScopes: v.optional(
      v.object({
        view: v.boolean(),
        download: v.boolean(),
        summary: v.boolean(),
      }),
    ),
    risk: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("declined"),
      v.literal("expired"),
    ),
    reviewedByProfileId: v.optional(v.id("userProfiles")),
    reviewedAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
    accessCode: v.optional(v.string()),
    sessionDeviceKeyHash: v.optional(v.string()),
    sessionActivatedAt: v.optional(v.number()),
    sessionLastUsedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_institution_id_and_status_and_created_at", [
      "institutionId",
      "status",
      "createdAt",
    ])
    .index("by_requester_profile_id_and_status", [
      "requesterProfileId",
      "status",
    ])
    .index("by_owner_profile_id_and_status", ["ownerProfileId", "status"])
    .index("by_research_id_and_status", ["researchId", "status"]),
  auditEvents: defineTable({
    institutionId: v.id("institutions"),
    actorProfileId: v.optional(v.id("userProfiles")),
    researchId: v.optional(v.id("research")),
    action: v.string(),
    outcome: v.union(
      v.literal("success"),
      v.literal("denied"),
      v.literal("warning"),
    ),
    detail: v.string(),
    createdAt: v.number(),
  })
    .index("by_institution_id_and_created_at", ["institutionId", "createdAt"])
    .index("by_research_id_and_created_at", ["researchId", "createdAt"]),
  notifications: defineTable({
    recipientProfileId: v.id("userProfiles"),
    researchId: v.optional(v.id("research")),
    relatedAccessRequestId: v.optional(v.id("accessRequests")),
    title: v.string(),
    detail: v.string(),
    kind: v.union(
      v.literal("success"),
      v.literal("error"),
      v.literal("info"),
      v.literal("warning"),
    ),
    actionRoute: v.optional(v.string()),
    actionRequired: v.optional(v.boolean()),
    readAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_recipient_profile_id_and_created_at", [
    "recipientProfileId",
    "createdAt",
  ]),
  securityAlerts: defineTable({
    institutionId: v.id("institutions"),
    researchId: v.optional(v.id("research")),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    title: v.string(),
    detail: v.string(),
    status: v.union(v.literal("open"), v.literal("resolved")),
    createdAt: v.number(),
    resolvedAt: v.optional(v.number()),
    resolvedByProfileId: v.optional(v.id("userProfiles")),
  })
    .index("by_institution_id_and_status", ["institutionId", "status"])
    .index("by_institution_id_and_created_at", ["institutionId", "createdAt"]),
});
