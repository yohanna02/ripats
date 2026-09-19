import type { Id } from "../../../convex/_generated/dataModel";

export type Role =
  | "researcher"
  | "partner"
  | "supervisor"
  | "ip_officer"
  | "security_officer"
  | "administrator";

export type Classification =
  | "public"
  | "restricted"
  | "confidential"
  | "ip_sensitive";

export type Research = {
  _id: Id<"research">;
  researchId: string;
  title: string;
  abstract: string;
  field: string;
  department: string;
  classification: Classification;
  stage: string;
  status: string;
  updatedAt: number;
  innovationPublished?: boolean;
  versions?: Array<{
    _id: Id<"researchVersions">;
    versionNumber: number;
    fileName: string;
    sha256: string;
    notes?: string;
    createdAt: number;
  }>;
};

export type Profile = {
  profileId: Id<"userProfiles">;
  userId: Id<"users">;
  email: string;
  displayName: string;
  role: Role;
  department: string | null;
  institutionName: string;
  active: boolean;
};
