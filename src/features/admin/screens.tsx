/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, type FormEvent } from "react";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { Activity, ArrowRight, BookOpen, Check, CheckCircle2, ChevronDown, Search, ShieldAlert, XCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { accessStateLabel, dateLabel, errorText, roleNames } from "../core/constants";
import type { Role } from "../core/types";
import { Badge, Brand, Empty, Loading, Mark, PageHeading, PanelHeader, PrimaryButton, SecondaryButton, TextField } from "../../components/ui/product";
import { useToast } from "../../components/ui/toast";
import { accessDeviceKey } from "../core/accessDevice";
export function SecurityPage() {
  const page = usePaginatedQuery(
    api.research.listAlerts,
    {},
    { initialNumItems: 25 },
  );
  const resolve = useMutation(api.research.resolveAlert);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const { showToast } = useToast();
  const close = async (id: Id<"securityAlerts">) => {
    setBusy(id);
    try {
      await resolve({ id });
      showToast({ kind: "success", title: "Security alert resolved" });
    } catch (e) {
      const message = errorText(e);
      setError(message);
      showToast({ kind: "error", title: "Alert could not be resolved", detail: message });
    } finally {
      setBusy(null);
    }
  };
  return (
    <>
      <PageHeading
        eyebrow="SECURITY & AUDIT"
        title="Security centre"
        detail="Review alerts and inspect an institution-scoped audit trail."
      />
      <section className="rp-panel">
        <PanelHeader
          title="Security alerts"
          detail="Rule-based security events"
        />
        {page.results.map((a: any) => (
          <article className="rp-alert-row" key={a._id}>
            <Mark tone={a.severity === "high" ? "red" : "gold"}>
              <ShieldAlert />
            </Mark>
            <div>
              <Badge tone={a.severity}>{a.severity}</Badge>
              <h3>{a.title}</h3>
              <p>{a.detail}</p>
              <small>
                {dateLabel(a.createdAt)} · {a.status}
              </small>
            </div>
            {a.status === "open" && (
              <SecondaryButton
                disabled={busy === a._id}
                onClick={() => void close(a._id)}
              >
                <Check /> {busy === a._id ? "Saving…" : "Resolve"}
              </SecondaryButton>
            )}
          </article>
        ))}
        {error && <div className="rp-error">{error}</div>}
        {!page.results.length && page.status !== "LoadingFirstPage" && (
          <Empty
            title="No security alerts"
            detail="Security events will appear as rules are triggered."
          />
        )}
        {page.status === "LoadingFirstPage" && <Loading />}
      </section>
      <section className="rp-panel rp-audit-panel">
        <PanelHeader
          title="Audit trail"
          detail="Administrative and access events"
        />
        <AuditQuery />
      </section>
    </>
  );
}
function AuditQuery() {
  const page = usePaginatedQuery(
    api.research.listAuditEvents,
    {},
    { initialNumItems: 30 },
  );
  return (
    <>
      {page.results.length ? (
        <AuditList events={page.results} />
      ) : page.status !== "LoadingFirstPage" ? (
        <Empty
          title="No audit events yet"
          detail="Important research and access actions are written to the audit trail."
        />
      ) : (
        <Loading />
      )}
      {page.status === "CanLoadMore" && (
        <button
          className="rp-secondary load-more"
          onClick={() => page.loadMore(30)}
        >
          Load older events <ChevronDown />
        </button>
      )}
    </>
  );
}
function AuditList({ events }: { events: any[] }) {
  return (
    <div className="rp-audit-list">
      {events.map((event) => (
        <article key={event._id}>
          <span>
            <Activity />
          </span>
          <div>
            <strong>{event.action.replaceAll(".", " · ")}</strong>
            <p>{event.detail}</p>
            <small>
              {dateLabel(event.createdAt)} · {event.outcome}
            </small>
          </div>
        </article>
      ))}
    </div>
  );
}

export function UsersPage() {
  const users = useQuery(api.account.listInstitutionUsers, {}) as
    | Array<{
        profileId: Id<"userProfiles">;
        displayName: string;
        email: string;
        department: string | null;
        role: Role;
        active: boolean;
      }>
    | undefined;
  const setRole = useMutation(api.account.setRole);
  const [error, setError] = useState("");
  const { showToast } = useToast();
  return (
    <>
      <PageHeading
        eyebrow="INSTITUTIONAL ACCESS"
        title="Users & roles"
        detail="Review university workspace membership and least-privilege roles."
      />
      <section className="rp-panel">
        <div className="rp-table-head user-head">
          <span>Person</span>
          <span>Department</span>
          <span>Role</span>
          <span>Account</span>
          <span />
        </div>
        {users?.map((user) => (
          <article className="rp-user-row" key={user.profileId}>
            <div>
              <span className="rp-avatar">
                {user.displayName
                  .split(" ")
                  .map((x) => x[0])
                  .slice(0, 2)
                  .join("")}
              </span>
              <span>
                <strong>{user.displayName}</strong>
                <small>{user.email}</small>
              </span>
            </div>
            <span>{user.department ?? "—"}</span>
            <select
              value={user.role}
              onChange={(e) =>
                void setRole({
                  profileId: user.profileId,
                  role: e.target.value as Role,
                  active: user.active,
                })
                  .then(() => showToast({ kind: "success", title: "Role updated" }))
                  .catch((err) => {
                    const message = errorText(err);
                    setError(message);
                    showToast({ kind: "error", title: "Role update failed", detail: message });
                  })
              }
            >
              {Object.entries(roleNames).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            <Badge tone={user.active ? "green" : "red"}>
              {user.active ? "Active" : "Suspended"}
            </Badge>
            <button
              title={user.active ? "Suspend account" : "Reactivate account"}
              onClick={() =>
                void setRole({
                  profileId: user.profileId,
                  role: user.role,
                  active: !user.active,
                })
                  .then(() => showToast({ kind: "success", title: "Account status updated" }))
                  .catch((err) => {
                    const message = errorText(err);
                    setError(message);
                    showToast({ kind: "error", title: "Account update failed", detail: message });
                  })
              }
            >
              {user.active ? <XCircle /> : <CheckCircle2 />}
            </button>
          </article>
        ))}
        {users === undefined && <Loading />}
        {error && <div className="rp-error">{error}</div>}
      </section>
    </>
  );
}

export function DocumentationPage() {
  const [search, setSearch] = useState("");
  const [openGuide, setOpenGuide] = useState<string | null>(null);
  const docs = [
    [
      "Registering a research project",
      "Research lifecycle",
      "Create the record, define ownership, set its classification and register the first authoritative version.",
    ],
    [
      "Classification and disclosure",
      "Governance",
      "Apply public, restricted, confidential and IP-sensitive handling consistently.",
    ],
    [
      "Approving external access",
      "Access control",
      "Review identity, purpose, requested scope and expiry before approving protected material.",
    ],
    [
      "File fingerprints and version history",
      "Provenance",
      "Understand how SHA-256 fingerprints evidence file integrity across versions.",
    ],
    [
      "Responding to security alerts",
      "Security",
      "Investigate denied requests, unusual access patterns and administrative changes.",
    ],
    [
      "Innovation profile guidance",
      "Commercialisation",
      "Publish useful summaries while keeping protected evidence restricted.",
    ],
  ].filter(([title, category, detail]) =>
    `${title} ${category} ${detail}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        eyebrow="RIPATS KNOWLEDGE BASE"
        title="Documentation"
        detail="Practical guidance for researchers, supervisors, IP officers and administrators."
      />
      <label className="rp-search doc-search">
        <Search />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search guides"
        />
      </label>
      <section className="rp-doc-grid">
        {docs.map(([title, category, detail]) => (
          <article className="rp-panel" key={title}>
            <Mark tone="green">
              <BookOpen />
            </Mark>
            <Badge>{category}</Badge>
            <h3>{title}</h3>
            <p>{detail}</p>
            <button
              className="rp-text-link"
              aria-expanded={openGuide === title}
              onClick={() => setOpenGuide(openGuide === title ? null : title)}
            >
              {openGuide === title ? "Close guide" : "Read guide"}{" "}
              <ArrowRight />
            </button>
            {openGuide === title && (
              <div className="rp-guide-detail">
                {guideContent[title] ?? detail}
              </div>
            )}
          </article>
        ))}
      </section>
    </>
  );
}

const guideContent: Record<string, string> = {
  "Registering a research project":
    "Create the research record before distributing files. Use the internal abstract for institutional users, choose a classification, and register each authoritative upload as a new version.",
  "Classification and disclosure":
    "Public profiles contain only an approved innovation summary. Restricted, Confidential and IP-Sensitive packages require server-authorized access and should remain unpublished until institutional review is complete.",
  "Approving external access":
    "Confirm the requester's organization and purpose, set an appropriate expiry, and approve only when the request fits the university's disclosure and IP process. Every decision is recorded in the audit trail.",
  "File fingerprints and version history":
    "RIPATS records a SHA-256 fingerprint for every registered file version. The stored fingerprint can be compared with a local file to investigate an integrity dispute.",
  "Responding to security alerts":
    "Review the audit trail with the alert context, limit access when necessary, and resolve the alert only after the institutional response has been recorded.",
  "Innovation profile guidance":
    "Write a concise, non-confidential explanation of the opportunity, application and development stage. Do not include unpublished evidence, data, source code, detailed designs or patent-critical novelty claims.",
};

export function SetupAdminPage() {
  const bootstrap = useMutation(api.account.bootstrapAdministrator);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const nav = useNavigate();
  const { showToast } = useToast();
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await bootstrap({ code, displayName: name });
      showToast({ kind: "success", title: "Administrator configured" });
      nav("/admin");
    } catch (err) {
      const message = errorText(err);
      setError(message);
      showToast({ kind: "error", title: "Administrator setup failed", detail: message });
    }
  };
  return (
    <main className="rp-setup">
      <Brand />
      <form onSubmit={submit}>
        <span className="rp-eyebrow">INITIAL INSTITUTION SETUP</span>
        <h1>Configure ATBU administration.</h1>
        <p>
          This setup is limited to the email and one-time code configured for
          the first ATBU administrator.
        </p>
        <TextField
          label="Administrator display name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <TextField
          label="One-time setup code"
          type="password"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
        />
        {error && <div className="rp-error">{error}</div>}
        <PrimaryButton>
          Configure administrator <ArrowRight />
        </PrimaryButton>
      </form>
    </main>
  );
}

export function MyAccessPage() {
  const page = usePaginatedQuery(
    api.research.myAccessRequests,
    { deviceKey: accessDeviceKey() },
    { initialNumItems: 25 },
  );
  const activate = useMutation(api.research.activateAccess);
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const { showToast } = useToast();
  const activateRequest = async (requestId: Id<"accessRequests">) => {
    setBusy(requestId);
    setError("");
    try {
      await activate({
        requestId,
        accessCode: codes[requestId] ?? "",
        deviceKey: accessDeviceKey(),
      });
      showToast({
        kind: "success",
        title: "Access session activated",
        detail: "This device can now use the approved access scope until expiry.",
      });
    } catch (cause) {
      const message = errorText(cause);
      setError(message);
      showToast({ kind: "error", title: "Access activation failed", detail: message });
    } finally {
      setBusy(null);
    }
  };
  return (
    <>
      <PageHeading
        eyebrow="CONTROLLED ACCESS"
        title="My access requests"
        detail="Track review decisions and expiry dates for requests you have submitted."
      />
      <section className="rp-request-list">
        {page.results.map((r: any) => (
          <article className="rp-panel rp-access-card" key={r._id}>
            <header>
              <div>
                <strong>{r.researchTitle}</strong>
                <small>
                  {r.researchCode} · {r.organization}
                </small>
              </div>
              <Badge tone={r.status}>{accessStateLabel(r.accessState ?? r.status)}</Badge>
            </header>
            <div className="rp-access-details">
              <div>
                <small>Purpose</small>
                <p>{r.purpose}</p>
              </div>
              <div>
                <small>Requested duration</small>
                <strong>{r.durationHours} hours</strong>
              </div>
              <div>
                <small>Decision</small>
                <strong>
                  {r.reviewedAt ? dateLabel(r.reviewedAt) : "Awaiting review"}
                </strong>
              </div>
              {(r.accessState === "approved" || r.accessState === "read_research") && (
                <div>
                  <small>Access expires</small>
                  <strong>{r.expiresAt ? dateLabel(r.expiresAt) : "—"}</strong>
                </div>
              )}
            </div>
            {(r.accessState === "approved" || r.accessState === "read_research") && (
              <footer className="rp-access-activation">
                {r.accessState === "approved" && (
                  <>
                    <TextField
                      label="Access code"
                      value={codes[r._id] ?? ""}
                      onChange={(event) =>
                        setCodes((current) => ({
                          ...current,
                          [r._id]: event.target.value,
                        }))
                      }
                      inputMode="numeric"
                      autoComplete="one-time-code"
                    />
                    <PrimaryButton
                      disabled={busy === r._id || !codes[r._id]?.trim()}
                      onClick={() => void activateRequest(r._id)}
                    >
                      {busy === r._id ? "Activating…" : "Activate this device"}
                    </PrimaryButton>
                  </>
                )}
                {r.accessState === "read_research" && (
                  <Link className="rp-secondary" to={`/app/research/${r.researchId}`}>
                    Read research <ArrowRight />
                  </Link>
                )}
              </footer>
            )}
          </article>
        ))}
        {error && <div className="rp-error">{error}</div>}
        {page.status === "LoadingFirstPage" && <Loading />}
        {page.results.length === 0 && page.status !== "LoadingFirstPage" && (
          <Empty
            title="No access requests yet"
            detail="You have not requested access to a protected research package."
          />
        )}
        {page.status === "CanLoadMore" && (
          <button
            className="rp-secondary load-more"
            onClick={() => page.loadMore(25)}
          >
            Load more requests <ChevronDown />
          </button>
        )}
      </section>
    </>
  );
}
