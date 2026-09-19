import type { Classification, Role } from "./types";

export const classificationNames: Record<Classification, string> = {
  public: "Public",
  restricted: "Restricted",
  confidential: "Confidential",
  ip_sensitive: "IP-Sensitive",
};

export const roleNames: Record<Role, string> = {
  researcher: "Researcher",
  partner: "External partner",
  supervisor: "Supervisor",
  ip_officer: "IP officer",
  security_officer: "Security officer",
  administrator: "Administrator",
};

export const dateLabel = (stamp: number) =>
  new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(stamp));

export const errorText = (error: unknown) =>
  error instanceof Error
    ? error.message.replace(/^Uncaught Error: /, "")
    : "Something went wrong. Please try again.";

export const isInstitutionalRole = (role: Role) =>
  ["administrator", "ip_officer", "security_officer"].includes(role);
