import {
  paginationOptsValidator,
  paginationResultValidator,
} from "convex/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import {
  requireAdministrator,
  requireDisclosureOfficer,
  requireProfile,
  recordEvent,
} from "./lib/access";

const classification = v.union(
  v.literal("public"),
  v.literal("restricted"),
  v.literal("confidential"),
  v.literal("ip_sensitive"),
);

async function notifyOwner(
  ctx: Parameters<typeof recordEvent>[0],
  record: Doc<"research">,
  title: string,
  detail: string,
  kind: "success" | "error" | "info" | "warning",
) {
  await ctx.db.insert("notifications", {
    recipientProfileId: record.ownerProfileId,
    researchId: record._id,
    title,
    detail,
    kind,
    createdAt: Date.now(),
  });
}

async function notifyProfile(
  ctx: Parameters<typeof recordEvent>[0],
  recipientProfileId: Doc<"userProfiles">["_id"],
  researchId: Doc<"research">["_id"],
  title: string,
  detail: string,
  kind: "success" | "error" | "info" | "warning",
  options?: {
    relatedAccessRequestId?: Doc<"accessRequests">["_id"];
    actionRoute?: string;
    actionRequired?: boolean;
  },
) {
  await ctx.db.insert("notifications", {
    recipientProfileId,
    researchId,
    title,
    detail,
    kind,
    ...(options?.relatedAccessRequestId
      ? { relatedAccessRequestId: options.relatedAccessRequestId }
      : {}),
    ...(options?.actionRoute ? { actionRoute: options.actionRoute } : {}),
    ...(options?.actionRequired ? { actionRequired: true } : {}),
    createdAt: Date.now(),
  });
}

export const listMine = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(v.any()),
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);
    return await ctx.db
      .query("research")
      .withIndex("by_owner_profile_id_and_updated_at", (q) =>
        q.eq("ownerProfileId", profile._id),
      )
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const listInstitution = query({
  args: {
    paginationOpts: paginationOptsValidator,
    classification: v.optional(classification),
  },
  returns: paginationResultValidator(v.any()),
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);
    const rows = args.classification
      ? ctx.db
          .query("research")
          .withIndex("by_institution_id_and_classification", (q) =>
            q
              .eq("institutionId", profile.institutionId)
              .eq("classification", args.classification!),
          )
          .order("desc")
      : ctx.db
          .query("research")
          .withIndex("by_institution_id_and_updated_at", (q) =>
            q.eq("institutionId", profile.institutionId),
          )
          .order("desc");
    return await rows.paginate(args.paginationOpts);
  },
});

export const publicProfiles = query({
  args: {
    paginationOpts: paginationOptsValidator,
    search: v.optional(v.string()),
  },
  returns: paginationResultValidator(
    v.object({
      _id: v.id("research"),
      researchId: v.string(),
      title: v.string(),
      abstract: v.string(),
      field: v.string(),
      stage: v.string(),
      application: v.optional(v.string()),
      status: v.string(),
      protected: v.boolean(),
    }),
  ),
  handler: async (ctx, args) => {
    const institution = await ctx.db
      .query("institutions")
      .withIndex("by_code", (q) => q.eq("code", "ATBU"))
      .unique();
    if (!institution) return { page: [], isDone: true, continueCursor: "" };
    const page = await ctx.db
      .query("research")
      .withIndex("by_institution_id_and_updated_at", (q) =>
        q.eq("institutionId", institution._id),
      )
      .order("desc")
      .paginate(args.paginationOpts);
    const eligible = page.page.filter(
      (record) => record.status === "published" && record.innovationPublished,
    );
    const toProfile = (record: (typeof eligible)[number]) => ({
      _id: record._id,
      researchId: record.researchId,
      title: record.title,
      abstract:
        record.innovationPublished && record.innovationSummary?.trim()
          ? record.innovationSummary
          : "Protected research record. Request authorization to access the full paper.",
      field: record.field,
      stage: record.stage,
      application: record.application,
      status: record.status,
      protected: !(record.innovationPublished && record.innovationSummary?.trim()),
    });
    if (!args.search?.trim())
      return {
        ...page,
        page: eligible.map(toProfile),
      };
    const normalized = args.search.trim().toLowerCase();
    return {
      ...page,
      page: eligible
        .filter((record) =>
          `${record.title} ${record.innovationSummary ?? ""} ${record.field} ${record.application ?? ""}`
            .toLowerCase()
            .includes(normalized),
        )
        .map(toProfile),
    };
  },
});

export const publicProfileById = query({
  args: { researchId: v.id("research") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("research"),
      researchId: v.string(),
      title: v.string(),
      abstract: v.string(),
      field: v.string(),
      stage: v.string(),
      application: v.union(v.string(), v.null()),
      collaborationSought: v.union(v.string(), v.null()),
      status: v.string(),
      protected: v.boolean(),
    }),
  ),
  handler: async (ctx, args) => {
    const record = await ctx.db.get(args.researchId);
    if (
      !record ||
      record.status !== "published" ||
      !record.innovationPublished
    )
      return null;
    return {
      _id: record._id,
      researchId: record.researchId,
      title: record.title,
      abstract:
        record.innovationPublished && record.innovationSummary?.trim()
          ? record.innovationSummary
          : "Protected research record. Request authorization to access the full paper.",
      field: record.field,
      stage: record.stage,
      application: record.application ?? null,
      collaborationSought: record.collaborationSought ?? null,
      status: record.status,
      protected: !(record.innovationPublished && record.innovationSummary?.trim()),
    };
  },
});

export const publicAccessState = query({
  args: {
    researchId: v.id("research"),
    deviceKey: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);
    const record = await ctx.db.get(args.researchId);
    if (!record) return null;
    if (record.ownerProfileId === profile._id)
      return { state: "owner" };

    const statuses = ["pending", "approved", "declined", "expired"] as const;
    const requests = (
      await Promise.all(
        statuses.map((status) =>
          ctx.db
            .query("accessRequests")
            .withIndex("by_research_id_and_status", (q) =>
              q.eq("researchId", record._id).eq("status", status),
            )
            .take(20),
        ),
      )
    )
      .flat()
      .filter((request) => request.requesterProfileId === profile._id)
      .sort((a, b) => b.createdAt - a.createdAt);
    if (!requests.length) return { state: "none" };

    const now = Date.now();
    const activeGrant = requests.find(
      (request) =>
        request.status === "approved" && (request.expiresAt ?? 0) > now,
    );
    if (activeGrant) {
      const sessionActive =
        Boolean(activeGrant.sessionDeviceKeyHash) &&
        activeGrant.sessionDeviceKeyHash === args.deviceKey;
      return {
        state: sessionActive ? "read_research" : "approved",
        expiresAt: activeGrant.expiresAt ?? null,
      };
    }

    const latest = requests[0];
    if (latest.status === "pending") return { state: "awaiting_review" };
    if (latest.status === "declined") return { state: "declined" };
    return { state: "expired" };
  },
});

export const get = query({
  args: { id: v.id("research"), now: v.number(), deviceKey: v.optional(v.string()) },
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);
    const record = await ctx.db.get(args.id);
    if (!record || record.institutionId !== profile.institutionId) return null;
    let allowed =
      record.ownerProfileId === profile._id ||
      ["administrator", "ip_officer"].includes(profile.role);
    if (!allowed) {
      const grants = await ctx.db
        .query("accessRequests")
        .withIndex("by_research_id_and_status", (q) =>
          q.eq("researchId", record._id).eq("status", "approved"),
        )
        .take(30);
      allowed = grants.some(
        (grant) =>
          grant.requesterProfileId === profile._id &&
          (grant.expiresAt ?? 0) > args.now &&
          grant.requestedScopes?.view === true &&
          grant.sessionDeviceKeyHash === args.deviceKey,
      );
    }
    if (!allowed) return null;
    const versions = await ctx.db
      .query("researchVersions")
      .withIndex("by_research_id_and_version_number", (q) =>
        q.eq("researchId", record._id),
      )
      .order("desc")
      .take(50);
    return { ...record, versions };
  },
});

export const myAccessRequests = query({
  args: {
    paginationOpts: paginationOptsValidator,
    deviceKey: v.optional(v.string()),
  },
  returns: paginationResultValidator(v.any()),
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);
    const now = Date.now();
    const page = await ctx.db
      .query("accessRequests")
      .withIndex("by_requester_profile_id_and_status", (q) =>
        q.eq("requesterProfileId", profile._id),
      )
      .order("desc")
      .paginate(args.paginationOpts);
    const enriched = [];
    for (const request of page.page) {
      const research = await ctx.db.get(request.researchId);
      const expired = request.status === "approved" && (request.expiresAt ?? 0) <= now;
      const effectiveStatus = expired ? "expired" : request.status;
      const sessionActive =
        effectiveStatus === "approved" &&
        Boolean(request.sessionDeviceKeyHash && request.sessionDeviceKeyHash === args.deviceKey);
      const accessState =
        effectiveStatus === "pending"
          ? "awaiting_review"
          : effectiveStatus === "declined"
            ? "declined"
            : effectiveStatus === "expired"
              ? "expired"
              : sessionActive
                ? "read_research"
                : "approved";
      const safeRequest = { ...request };
      delete safeRequest.accessCode;
      enriched.push({
        ...safeRequest,
        status: effectiveStatus,
        accessState,
        sessionActive,
        // Keep the request visible even if a related record is removed or
        // becomes unavailable. A request is still useful audit history.
        researchTitle: research?.title ?? "Research record unavailable",
        researchCode: research?.researchId ?? "Unavailable",
      });
    }
    return { ...page, page: enriched };
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    abstract: v.string(),
    innovationSummary: v.optional(v.string()),
    field: v.string(),
    department: v.string(),
    classification,
    stage: v.string(),
    problemStatement: v.optional(v.string()),
    application: v.optional(v.string()),
    collaborationSought: v.optional(v.string()),
  },
  returns: v.id("research"),
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);
    if (
      !["researcher", "partner", "supervisor", "administrator", "ip_officer"].includes(
        profile.role,
      )
    )
      throw new Error("Your account cannot register research.");
    const now = Date.now();
    let researchId = "";
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const suffix = crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase();
      const candidate = `ATBU-RP-${new Date(now).getFullYear()}-${suffix}`;
      const existing = await ctx.db
        .query("research")
        .withIndex("by_research_id", (q) => q.eq("researchId", candidate))
        .first();
      if (!existing) {
        researchId = candidate;
        break;
      }
    }
    if (!researchId) throw new Error("Could not allocate a unique research ID. Try again.");
    const id = await ctx.db.insert("research", {
      institutionId: profile.institutionId,
      ownerProfileId: profile._id,
      researchId,
      title: args.title.trim(),
      abstract: args.abstract.trim(),
      innovationSummary: args.innovationSummary?.trim() || undefined,
      field: args.field.trim(),
      department: args.department.trim(),
      classification: args.classification,
      stage: args.stage.trim(),
      status: "draft",
      innovationPublished: false,
      problemStatement: args.problemStatement,
      application: args.application,
      collaborationSought: args.collaborationSought,
      createdAt: now,
      updatedAt: now,
    });
    const metrics = await ctx.db
      .query("institutionMetrics")
      .withIndex("by_institution_id", (q) =>
        q.eq("institutionId", profile.institutionId),
      )
      .unique();
    if (metrics)
      await ctx.db.patch(metrics._id, {
        researchCount: metrics.researchCount + 1,
        updatedAt: now,
      });
    await recordEvent(
      ctx,
      profile,
      "research.created",
      `Created research record ${researchId}.`,
      "success",
      id,
    );
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("research"),
    title: v.optional(v.string()),
    abstract: v.optional(v.string()),
    innovationSummary: v.optional(v.string()),
    field: v.optional(v.string()),
    department: v.optional(v.string()),
    classification: v.optional(classification),
    stage: v.optional(v.string()),
    problemStatement: v.optional(v.string()),
    application: v.optional(v.string()),
    collaborationSought: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);
    const record = await ctx.db.get(args.id);
    if (!record || record.institutionId !== profile.institutionId)
      throw new Error("Research record not found.");
    const canEdit =
      record.ownerProfileId === profile._id ||
      profile.role === "administrator" ||
      profile.role === "ip_officer";
    if (!canEdit)
      throw new Error("You do not have permission to edit this record.");
    const { id, ...patch } = args;
    await ctx.db.patch(id, { ...patch, updatedAt: Date.now() });
    await recordEvent(
      ctx,
      profile,
      "research.updated",
      `Updated research record ${record.researchId}.`,
      "success",
      id,
    );
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("research") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);
    const record = await ctx.db.get(args.id);
    if (!record || record.institutionId !== profile.institutionId)
      throw new Error("Research record not found.");
    const canDelete =
      record.ownerProfileId === profile._id ||
      profile.role === "administrator" ||
      profile.role === "ip_officer";
    if (!canDelete)
      throw new Error("You do not have permission to delete this record.");
    if (record.status !== "draft" || record.innovationPublished)
      throw new Error(
        "Only unpublished draft records can be deleted. Keep submitted or published records for the institutional audit trail.",
      );

    const accessRequestChecks = await Promise.all(
      (["pending", "approved", "declined", "expired"] as const).map(
        (status) =>
          ctx.db
            .query("accessRequests")
            .withIndex("by_research_id_and_status", (q) =>
              q.eq("researchId", record._id).eq("status", status),
            )
            .first(),
      ),
    );
    if (accessRequestChecks.some(Boolean))
      throw new Error("Records with access requests cannot be deleted.");

    const versions = await ctx.db
      .query("researchVersions")
      .withIndex("by_research_id", (q) => q.eq("researchId", record._id))
      .take(101);
    if (versions.length > 100)
      throw new Error(
        "This record has too many versions to delete in one operation. Contact an administrator.",
      );
    for (const version of versions) {
      if (version.storageId) await ctx.storage.delete(version.storageId);
      await ctx.db.delete(version._id);
    }
    await ctx.db.delete(record._id);

    const metrics = await ctx.db
      .query("institutionMetrics")
      .withIndex("by_institution_id", (q) =>
        q.eq("institutionId", profile.institutionId),
      )
      .unique();
    if (metrics)
      await ctx.db.patch(metrics._id, {
        researchCount: Math.max(0, metrics.researchCount - 1),
        updatedAt: Date.now(),
      });
    await recordEvent(
      ctx,
      profile,
      "research.deleted",
      `Deleted draft research record ${record.researchId}.`,
      "warning",
    );
    return null;
  },
});

export const generateUploadUrl = mutation({
  args: { id: v.id("research") },
  returns: v.string(),
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);
    const record = await ctx.db.get(args.id);
    if (!record || record.ownerProfileId !== profile._id)
      throw new Error("Only the record owner can upload a version.");
    return await ctx.storage.generateUploadUrl();
  },
});

export const addVersion = mutation({
  args: {
    id: v.id("research"),
    storageId: v.id("_storage"),
    fileName: v.string(),
    notes: v.optional(v.string()),
  },
  returns: v.id("researchVersions"),
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);
    const record = await ctx.db.get(args.id);
    if (!record || record.ownerProfileId !== profile._id)
      throw new Error("Only the record owner can add a version.");
    const metadata = await ctx.db.system.get("_storage", args.storageId);
    if (!metadata) throw new Error("Uploaded file is not available.");
    const safeContentTypes = new Set([
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
      "text/plain",
      "application/zip",
    ]);
    const safeName = /^[a-zA-Z0-9][a-zA-Z0-9._ -]{0,180}$/;
    if (
      metadata.size > 25 * 1024 * 1024 ||
      !safeName.test(args.fileName) ||
      !safeContentTypes.has(metadata.contentType ?? "")
    ) {
      await ctx.storage.delete(args.storageId);
      throw new Error(
        "Only approved document formats up to 25 MB can be registered.",
      );
    }
    const latest = await ctx.db
      .query("researchVersions")
      .withIndex("by_research_id_and_version_number", (q) =>
        q.eq("researchId", record._id),
      )
      .order("desc")
      .take(1);
    const versionNumber = (latest[0]?.versionNumber ?? 0) + 1;
    const versionId = await ctx.db.insert("researchVersions", {
      researchId: record._id,
      versionNumber,
      fileName: args.fileName,
      contentType: metadata.contentType ?? undefined,
      storageId: args.storageId,
      sha256: metadata.sha256,
      notes: args.notes,
      submittedByProfileId: profile._id,
      createdAt: Date.now(),
    });
    const now = Date.now();
    const submittedForReview =
      record.status === "draft" || record.status === "rejected";
    await ctx.db.patch(record._id, {
      status: submittedForReview ? "submitted" : record.status,
      innovationPublished: false,
      updatedAt: now,
    });
    const metrics = await ctx.db
      .query("institutionMetrics")
      .withIndex("by_institution_id", (q) =>
        q.eq("institutionId", profile.institutionId),
      )
      .unique();
    if (metrics)
      await ctx.db.patch(metrics._id, {
        verifiedVersions: metrics.verifiedVersions + 1,
        updatedAt: now,
      });
    await recordEvent(
      ctx,
      profile,
      "research.version.created",
      `Registered version ${versionNumber} for ${record.researchId}.`,
      "success",
      record._id,
    );
    if (submittedForReview) {
      await notifyOwner(
        ctx,
        record,
        "Research submitted for review",
        `${record.researchId} is awaiting institutional verification.`,
        "info",
      );
    }
    return versionId;
  },
});

export const myNotifications = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    const profile = await requireProfile(ctx);
    return await ctx.db
      .query("notifications")
      .withIndex("by_recipient_profile_id_and_created_at", (q) =>
        q.eq("recipientProfileId", profile._id),
      )
      .order("desc")
      .take(25);
  },
});

export const markNotificationsRead = mutation({
  args: { ids: v.array(v.id("notifications")) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);
    const now = Date.now();
    for (const id of args.ids.slice(0, 25)) {
      const notification = await ctx.db.get(id);
      if (notification?.recipientProfileId === profile._id && !notification.readAt)
        await ctx.db.patch(notification._id, { readAt: now });
    }
    return null;
  },
});

export const decideSubmission = mutation({
  args: {
    id: v.id("research"),
    decision: v.union(v.literal("approved"), v.literal("rejected")),
    note: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const reviewer = await requireDisclosureOfficer(ctx);
    const record = await ctx.db.get(args.id);
    if (!record || record.institutionId !== reviewer.institutionId)
      throw new Error("Research record not found.");
    if (record.status !== "submitted")
      throw new Error("Only submitted research with an uploaded document can be reviewed.");
    const version = await ctx.db
      .query("researchVersions")
      .withIndex("by_research_id", (q) => q.eq("researchId", record._id))
      .first();
    if (!version) throw new Error("Upload a research document before review.");

    const approved = args.decision === "approved";
    if (approved && !record.innovationSummary?.trim())
      throw new Error("Add an approved public innovation summary before authorizing visibility.");
    const reviewNote = args.note?.trim();
    await ctx.db.patch(record._id, {
      status: approved ? "published" : "rejected",
      innovationPublished: approved,
      updatedAt: Date.now(),
    });
    await recordEvent(
      ctx,
      reviewer,
      `research.submission.${args.decision}`,
      `${approved ? "Authorized" : "Rejected"} ${record.researchId}${reviewNote ? `: ${reviewNote}` : "."}`,
      approved ? "success" : "warning",
      record._id,
    );
    await notifyOwner(
      ctx,
      record,
      approved ? "Research authorized and visible" : "Research submission rejected",
      approved
        ? `${record.researchId} has passed review and is now visible in the public archive.`
        : `${record.researchId} needs changes before it can be resubmitted.${reviewNote ? ` Reviewer note: ${reviewNote}` : ""}`,
      approved ? "success" : "error",
    );
    return null;
  },
});

export const getVersionDownloadUrl = mutation({
  args: { versionId: v.id("researchVersions"), deviceKey: v.optional(v.string()) },
  returns: v.union(v.null(), v.string()),
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);
    const version = await ctx.db.get(args.versionId);
    if (!version) return null;
    const record = await ctx.db.get(version.researchId);
    if (!record || record.institutionId !== profile.institutionId) return null;
    let allowed =
      record.ownerProfileId === profile._id ||
      profile.role === "administrator" ||
      profile.role === "ip_officer";
    if (!allowed) {
      const grants = await ctx.db
        .query("accessRequests")
        .withIndex("by_research_id_and_status", (q) =>
          q.eq("researchId", record._id).eq("status", "approved"),
        )
        .take(20);
      allowed = grants.some(
        (grant) =>
          grant.requesterProfileId === profile._id &&
          (grant.expiresAt ?? 0) > Date.now() &&
          grant.requestedScopes?.download === true &&
          grant.sessionDeviceKeyHash === args.deviceKey,
      );
    }
    if (!allowed) {
      await recordEvent(
        ctx,
        profile,
        "research.file.denied",
        `Denied file access for ${record.researchId}.`,
        "denied",
        record._id,
      );
      const recentDenials = await ctx.db
        .query("auditEvents")
        .withIndex("by_institution_id_and_created_at", (q) =>
          q.eq("institutionId", profile.institutionId),
        )
        .order("desc")
        .take(30);
      const deniedCount = recentDenials.filter(
        (event) =>
          event.actorProfileId === profile._id &&
          event.action === "research.file.denied" &&
          event.researchId === record._id,
      ).length;
      if (deniedCount >= 3) {
        const openAlerts = await ctx.db
          .query("securityAlerts")
          .withIndex("by_institution_id_and_status", (q) =>
            q.eq("institutionId", profile.institutionId).eq("status", "open"),
          )
          .take(100);
        const alreadyOpen = openAlerts.some(
          (alert) =>
            alert.researchId === record._id &&
            alert.title === "Repeated denied file access",
        );
        if (!alreadyOpen) {
          await ctx.db.insert("securityAlerts", {
            institutionId: profile.institutionId,
            researchId: record._id,
            severity: "high",
            title: "Repeated denied file access",
            detail: `A profile made ${deniedCount} denied file access attempts for ${record.researchId}.`,
            status: "open",
            createdAt: Date.now(),
          });
          const metrics = await ctx.db
            .query("institutionMetrics")
            .withIndex("by_institution_id", (q) =>
              q.eq("institutionId", profile.institutionId),
            )
            .unique();
          if (metrics)
            await ctx.db.patch(metrics._id, {
              openSecurityAlerts: metrics.openSecurityAlerts + 1,
              updatedAt: Date.now(),
            });
        }
      }
      return null;
    }
    if (!version.storageId) return null;
    await recordEvent(
      ctx,
      profile,
      "research.file.download",
      `Downloaded ${version.fileName} from ${record.researchId}.`,
      "success",
      record._id,
    );
    return await ctx.storage.getUrl(version.storageId);
  },
});

export const requestAccess = mutation({
  args: {
    researchId: v.id("research"),
    organization: v.string(),
    purpose: v.string(),
    durationHours: v.number(),
    requestContext: v.object({
      sessionId: v.string(),
      sourcePath: v.string(),
      referrer: v.optional(v.string()),
      userAgent: v.string(),
      platform: v.string(),
      locale: v.string(),
      timezone: v.string(),
      channel: v.literal("web"),
    }),
    requestedScopes: v.object({
      view: v.boolean(),
      download: v.boolean(),
      summary: v.boolean(),
    }),
  },
  returns: v.id("accessRequests"),
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);
    const user = await ctx.db.get(profile.userId);
    const record = await ctx.db.get(args.researchId);
    if (!record || record.status !== "published" || !record.innovationPublished)
      throw new Error(
        "Only approved public research records accept access requests.",
      );
    if (record.ownerProfileId === profile._id)
      throw new Error("You already manage this research record.");
    if (args.durationHours < 1 || args.durationHours > 720)
      throw new Error("Access duration must be 1 to 720 hours.");
    if (!args.requestedScopes.view && !args.requestedScopes.download && !args.requestedScopes.summary)
      throw new Error("Select at least one access scope.");
    if (!args.requestContext.sessionId.trim())
      throw new Error("An active browser session is required.");
    const id = await ctx.db.insert("accessRequests", {
      institutionId: record.institutionId,
      researchId: record._id,
      requesterProfileId: profile._id,
      ownerProfileId: record.ownerProfileId,
      requesterName: profile.displayName,
      requesterEmail: user?.email ?? "",
      organization: args.organization.trim(),
      purpose: args.purpose.trim(),
      durationHours: args.durationHours,
      requestContext: {
        sessionId: args.requestContext.sessionId.trim().slice(0, 160),
        sourcePath: args.requestContext.sourcePath.trim().slice(0, 240),
        referrer: args.requestContext.referrer?.trim().slice(0, 500),
        userAgent: args.requestContext.userAgent.trim().slice(0, 500),
        platform: args.requestContext.platform.trim().slice(0, 160),
        locale: args.requestContext.locale.trim().slice(0, 80),
        timezone: args.requestContext.timezone.trim().slice(0, 120),
        channel: "web",
      },
      requestedScopes: args.requestedScopes,
      risk: "low",
      status: "pending",
      createdAt: Date.now(),
    });
    const metrics = await ctx.db
      .query("institutionMetrics")
      .withIndex("by_institution_id", (q) =>
        q.eq("institutionId", record.institutionId),
      )
      .unique();
    if (metrics)
      await ctx.db.patch(metrics._id, {
        pendingAccessRequests: metrics.pendingAccessRequests + 1,
        updatedAt: Date.now(),
      });
    await recordEvent(
      ctx,
      profile,
      "access.requested",
      `Access requested for ${record.researchId}.`,
      "success",
      record._id,
    );
    const owner = await ctx.db.get(record.ownerProfileId);
    // Administrators are the institutional reviewers and should not receive
    // duplicate owner notifications for papers they registered themselves.
    if (owner && owner.role !== "administrator") {
      const reviewRoute =
        owner.role === "ip_officer" ? "/admin/access" : "/app/reviews";
      await notifyProfile(
        ctx,
        owner._id,
        record._id,
        "New access request",
        `${profile.displayName} requested access to ${record.researchId}.`,
        "info",
        {
          relatedAccessRequestId: id,
          actionRoute: reviewRoute,
          actionRequired: true,
        },
      );
      const ownerUser = await ctx.db.get(owner.userId);
      if (ownerUser?.email) {
        await ctx.scheduler.runAfter(0, internal.mail.sendAccessRequestNotice, {
          to: ownerUser.email,
          ownerName: owner.displayName,
          requesterName: profile.displayName,
          researchTitle: record.title,
          researchCode: record.researchId,
          purpose: args.purpose.trim(),
          durationHours: args.durationHours,
          reviewRoute,
        });
      }
    }
    return id;
  },
});

export const listAccessRequests = query({
  args: {
    paginationOpts: paginationOptsValidator,
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("approved"),
        v.literal("declined"),
        v.literal("expired"),
      ),
    ),
  },
  returns: paginationResultValidator(v.any()),
  handler: async (ctx, args) => {
    const profile = await requireDisclosureOfficer(ctx);
    const rows = args.status
      ? ctx.db
          .query("accessRequests")
          .withIndex("by_institution_id_and_status_and_created_at", (q) =>
            q
              .eq("institutionId", profile.institutionId)
              .eq("status", args.status!),
          )
          .order("desc")
      : ctx.db
          .query("accessRequests")
          .withIndex("by_institution_id_and_status_and_created_at", (q) =>
            q.eq("institutionId", profile.institutionId),
          )
          .order("desc");
    const result = await rows.paginate(args.paginationOpts);
    const page = [];
    for (const request of result.page) {
      const record = await ctx.db.get(request.researchId);
      if (record) {
        const safeRequest = { ...request };
        delete safeRequest.accessCode;
        page.push({
          ...safeRequest,
          researchTitle: record.title,
          researchCode: record.researchId,
        });
      }
    }
    return { ...result, page };
  },
});

export const listOwnedAccessRequests = query({
  args: {
    paginationOpts: paginationOptsValidator,
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("approved"),
        v.literal("declined"),
        v.literal("expired"),
      ),
    ),
  },
  returns: paginationResultValidator(v.any()),
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);
    const rows = args.status
      ? ctx.db
          .query("accessRequests")
          .withIndex("by_owner_profile_id_and_status", (q) =>
            q.eq("ownerProfileId", profile._id).eq("status", args.status!),
          )
          .order("desc")
      : ctx.db
          .query("accessRequests")
          .withIndex("by_owner_profile_id_and_status", (q) =>
            q.eq("ownerProfileId", profile._id),
          )
          .order("desc");
    const result = await rows.paginate(args.paginationOpts);
    const page = [];
    for (const request of result.page) {
      const record = await ctx.db.get(request.researchId);
      if (record) {
        const safeRequest = { ...request };
        delete safeRequest.accessCode;
        page.push({
          ...safeRequest,
          researchTitle: record.title,
          researchCode: record.researchId,
        });
      }
    }
    return { ...result, page };
  },
});

export const decideAccess = mutation({
  args: {
    id: v.id("accessRequests"),
    decision: v.union(v.literal("approved"), v.literal("declined")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);
    const request = await ctx.db.get(args.id);
    if (!request || request.status !== "pending")
      throw new Error("Pending access request not found.");
    const record = await ctx.db.get(request.researchId);
    if (!record || record.institutionId !== profile.institutionId)
      throw new Error("Access request not found.");
    const mayDecide =
      record.ownerProfileId === profile._id ||
      profile.role === "administrator" ||
      profile.role === "ip_officer";
    if (!mayDecide)
      throw new Error("You do not have authority to decide this request.");
    const now = Date.now();
    const expiresAt =
      args.decision === "approved"
        ? now + request.durationHours * 60 * 60 * 1000
        : undefined;
    const accessCode =
      args.decision === "approved"
        ? String(Math.floor(100000 + Math.random() * 900000))
        : undefined;
    await ctx.db.patch(request._id, {
      status: args.decision,
      reviewedByProfileId: profile._id,
      reviewedAt: now,
      expiresAt,
      accessCode,
      sessionDeviceKeyHash: undefined,
      sessionActivatedAt: undefined,
      sessionLastUsedAt: undefined,
    });
    const metrics = await ctx.db
      .query("institutionMetrics")
      .withIndex("by_institution_id", (q) =>
        q.eq("institutionId", request.institutionId),
      )
      .unique();
    if (metrics)
      await ctx.db.patch(metrics._id, {
        pendingAccessRequests: Math.max(0, metrics.pendingAccessRequests - 1),
        updatedAt: now,
      });
    await recordEvent(
      ctx,
      profile,
      `access.${args.decision}`,
      `${args.decision} access request for ${record.researchId}.`,
      "success",
      record._id,
    );
    await notifyProfile(
      ctx,
      request.requesterProfileId,
      record._id,
      args.decision === "approved" ? "Access request approved" : "Access request declined",
      args.decision === "approved"
        ? `Your request for ${record.researchId} was approved. Check your email for the activation code, then open My access requests to activate your session.`
        : `Your request for ${record.researchId} was declined.`,
      args.decision === "approved" ? "success" : "error",
      {
        relatedAccessRequestId: request._id,
        actionRoute: "/app/access",
      },
    );
    if (args.decision === "approved" && accessCode && expiresAt) {
      const requester = await ctx.db.get(request.requesterProfileId);
      const requesterUser = requester ? await ctx.db.get(requester.userId) : null;
      if (requester?.displayName && requesterUser?.email) {
        await ctx.scheduler.runAfter(0, internal.mail.sendAccessGrantNotice, {
          to: requesterUser.email,
          requesterName: requester.displayName,
          researchTitle: record.title,
          researchCode: record.researchId,
          accessCode,
          expiresAt,
        });
      }
    }
    return null;
  },
});

export const activateAccess = mutation({
  args: {
    requestId: v.id("accessRequests"),
    accessCode: v.string(),
    deviceKey: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);
    const request = await ctx.db.get(args.requestId);
    if (!request || request.requesterProfileId !== profile._id)
      throw new Error("Access grant not found.");
    if (request.status !== "approved" || (request.expiresAt ?? 0) <= Date.now())
      throw new Error("This access grant has expired or is not approved.");
    if (request.accessCode !== args.accessCode.trim())
      throw new Error("Invalid access code.");
    if (request.sessionDeviceKeyHash && request.sessionDeviceKeyHash !== args.deviceKey)
      throw new Error("This grant is already activated on another device.");
    await ctx.db.patch(request._id, {
      sessionDeviceKeyHash: args.deviceKey,
      sessionActivatedAt: request.sessionActivatedAt ?? Date.now(),
      sessionLastUsedAt: Date.now(),
    });
    await recordEvent(ctx, profile, "access.session.activated", `Activated one-session access for ${request._id}.`, "success", request.researchId);
    return null;
  },
});

export const dashboardSummary = query({
  args: { personal: v.optional(v.boolean()) },
  returns: v.any(),
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);
    if (
      !args.personal &&
      ["administrator", "ip_officer", "security_officer"].includes(
        profile.role,
      )
    ) {
      const records = await ctx.db
        .query("research")
        .withIndex("by_institution_id_and_updated_at", (q) =>
          q.eq("institutionId", profile.institutionId),
        )
        .order("desc")
        .take(8);
      const metrics = await ctx.db
        .query("institutionMetrics")
        .withIndex("by_institution_id", (q) =>
          q.eq("institutionId", profile.institutionId),
        )
        .unique();
      const alerts = await ctx.db
        .query("securityAlerts")
        .withIndex("by_institution_id_and_status", (q) =>
          q.eq("institutionId", profile.institutionId).eq("status", "open"),
        )
        .take(5);
      const events = await ctx.db
        .query("auditEvents")
        .withIndex("by_institution_id_and_created_at", (q) =>
          q.eq("institutionId", profile.institutionId),
        )
        .order("desc")
        .take(8);
      return {
        role: profile.role,
        researchCount: metrics?.researchCount ?? 0,
        pendingAccessRequests: metrics?.pendingAccessRequests ?? 0,
        openSecurityAlerts: metrics?.openSecurityAlerts ?? 0,
        verifiedVersions: metrics?.verifiedVersions ?? 0,
        research:
          profile.role === "security_officer" ? [] : records,
        alerts,
        events,
      };
    }
    const records = await ctx.db
      .query("research")
      .withIndex("by_owner_profile_id_and_updated_at", (q) =>
        q.eq("ownerProfileId", profile._id),
      )
      .order("desc")
      .take(8);
    const ownedIds = new Set(records.map((record) => record._id));
    const mine = [];
    for (const researchId of ownedIds) {
      const requests = await ctx.db
        .query("accessRequests")
        .withIndex("by_research_id_and_status", (q) =>
          q.eq("researchId", researchId).eq("status", "pending"),
        )
        .take(10);
      mine.push(...requests);
    }
    const submittedRequests = await ctx.db
      .query("accessRequests")
      .withIndex("by_requester_profile_id_and_status", (q) =>
        q.eq("requesterProfileId", profile._id),
      )
      .take(1000);
    const events = await ctx.db
      .query("auditEvents")
      .withIndex("by_institution_id_and_created_at", (q) =>
        q.eq("institutionId", profile.institutionId),
      )
      .order("desc")
      .take(8);
    return {
      role: profile.role,
      researchCount: records.length,
      pendingAccessRequests: mine.length,
      submittedAccessRequests: submittedRequests.length,
      verifiedVersions: 0,
      research: records.slice(0, 8),
      events,
    };
  },
});

export const institutionReport = query({
  args: { startAt: v.number(), endAt: v.number() },
  returns: v.object({
    period: v.object({ startAt: v.number(), endAt: v.number() }),
    totals: v.object({
      research: v.number(),
      accessRequests: v.number(),
      alerts: v.number(),
      auditEvents: v.number(),
      deniedEvents: v.number(),
    }),
    classifications: v.object({
      public: v.number(),
      restricted: v.number(),
      confidential: v.number(),
      ip_sensitive: v.number(),
    }),
    researchStatuses: v.record(v.string(), v.number()),
    departments: v.record(v.string(), v.number()),
    accessRequests: v.object({
      pending: v.number(),
      approved: v.number(),
      declined: v.number(),
      expired: v.number(),
    }),
    alertsBySeverity: v.object({
      high: v.number(),
      medium: v.number(),
      low: v.number(),
    }),
    recentEvents: v.array(
      v.object({
        action: v.string(),
        outcome: v.string(),
        createdAt: v.number(),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    const profile = await requireDisclosureOfficer(ctx);
    if (args.startAt > args.endAt)
      throw new Error("Report start date must be before its end date.");
    if (args.endAt - args.startAt > 366 * 24 * 60 * 60 * 1000)
      throw new Error("Report periods cannot exceed one year.");
    const research = await ctx.db
      .query("research")
      .withIndex("by_institution_id_and_updated_at", (q) =>
        q
          .eq("institutionId", profile.institutionId)
          .gte("updatedAt", args.startAt)
          .lte("updatedAt", args.endAt),
      )
      .take(1000);
    const events = await ctx.db
      .query("auditEvents")
      .withIndex("by_institution_id_and_created_at", (q) =>
        q
          .eq("institutionId", profile.institutionId)
          .gte("createdAt", args.startAt)
          .lte("createdAt", args.endAt),
      )
      .order("desc")
      .take(1000);
    const alerts = await ctx.db
      .query("securityAlerts")
      .withIndex("by_institution_id_and_created_at", (q) =>
        q
          .eq("institutionId", profile.institutionId)
          .gte("createdAt", args.startAt)
          .lte("createdAt", args.endAt),
      )
      .take(1000);
    const accessByStatus = await Promise.all(
      (["pending", "approved", "declined", "expired"] as const).map(
        async (status) =>
          ctx.db
            .query("accessRequests")
            .withIndex("by_institution_id_and_status_and_created_at", (q) =>
              q
                .eq("institutionId", profile.institutionId)
                .eq("status", status)
                .gte("createdAt", args.startAt)
                .lte("createdAt", args.endAt),
            )
            .take(1000),
      ),
    );
    const classifications = {
      public: 0,
      restricted: 0,
      confidential: 0,
      ip_sensitive: 0,
    };
    const statuses: Record<string, number> = {};
    const departments: Record<string, number> = {};
    for (const record of research) {
      classifications[record.classification] += 1;
      statuses[record.status] = (statuses[record.status] ?? 0) + 1;
      departments[record.department] = (departments[record.department] ?? 0) + 1;
    }
    return {
      period: { startAt: args.startAt, endAt: args.endAt },
      totals: {
        research: research.length,
        accessRequests: accessByStatus.reduce((sum, requests) => sum + requests.length, 0),
        alerts: alerts.length,
        auditEvents: events.length,
        deniedEvents: events.filter((event) => event.outcome === "denied").length,
      },
      classifications,
      researchStatuses: statuses,
      departments,
      accessRequests: {
        pending: accessByStatus[0].length,
        approved: accessByStatus[1].length,
        declined: accessByStatus[2].length,
        expired: accessByStatus[3].length,
      },
      alertsBySeverity: {
        high: alerts.filter((alert) => alert.severity === "high").length,
        medium: alerts.filter((alert) => alert.severity === "medium").length,
        low: alerts.filter((alert) => alert.severity === "low").length,
      },
      recentEvents: events.slice(0, 10).map((event) => ({
        action: event.action,
        outcome: event.outcome,
        createdAt: event.createdAt,
      })),
    };
  },
});

export const listAuditEvents = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(v.any()),
  handler: async (ctx, args) => {
    const profile = await requireAdministrator(ctx);
    return await ctx.db
      .query("auditEvents")
      .withIndex("by_institution_id_and_created_at", (q) =>
        q.eq("institutionId", profile.institutionId),
      )
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const listAlerts = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(v.any()),
  handler: async (ctx, args) => {
    const profile = await requireAdministrator(ctx);
    return await ctx.db
      .query("securityAlerts")
      .withIndex("by_institution_id_and_created_at", (q) =>
        q.eq("institutionId", profile.institutionId),
      )
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const resolveAlert = mutation({
  args: { id: v.id("securityAlerts") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const profile = await requireAdministrator(ctx);
    const alert = await ctx.db.get(args.id);
    if (!alert || alert.institutionId !== profile.institutionId)
      throw new Error("Security alert not found.");
    await ctx.db.patch(alert._id, {
      status: "resolved",
      resolvedAt: Date.now(),
      resolvedByProfileId: profile._id,
    });
    const metrics = await ctx.db
      .query("institutionMetrics")
      .withIndex("by_institution_id", (q) =>
        q.eq("institutionId", profile.institutionId),
      )
      .unique();
    if (metrics)
      await ctx.db.patch(metrics._id, {
        openSecurityAlerts: Math.max(0, metrics.openSecurityAlerts - 1),
        updatedAt: Date.now(),
      });
    await recordEvent(
      ctx,
      profile,
      "security.alert.resolved",
      `Resolved security alert: ${alert.title}.`,
      "success",
      alert.researchId,
    );
    return null;
  },
});
