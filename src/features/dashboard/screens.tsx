/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, usePaginatedQuery } from "convex/react";
import { ArrowRight, ChevronRight, ClipboardCheck, Download, Fingerprint, KeyRound, LibraryBig, LockKeyhole, Plus, ShieldAlert, ShieldCheck, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../../../convex/_generated/api";
import { accessStateLabel, dateLabel } from "../core/constants";
import type { Profile } from "../core/types";
import { accessDeviceKey } from "../core/accessDevice";
import { AuditList, Badge, Empty, Loading, Mark, MetricCard, PageHeading, PanelHeader, RecordRows } from "../../components/ui/product";
export function ResearcherHome() {
  const data = useQuery(api.research.dashboardSummary, { personal: true }) as any;
  const me = useQuery(api.account.me, {}) as Profile | null | undefined;
  const { results } = usePaginatedQuery(
    api.research.listMine,
    {},
    { initialNumItems: 8 },
  );
  const requests = usePaginatedQuery(
    api.research.myAccessRequests,
    { deviceKey: accessDeviceKey() },
    { initialNumItems: 5 },
  );
  if (data === undefined || me === undefined) return <Loading />;
  const canRegister = ["researcher", "partner", "supervisor"].includes(
    me?.role ?? "",
  );
  return (
    <>
      <PageHeading
        eyebrow="MY RESEARCH WORKSPACE"
        title={`Good morning, ${me?.displayName.split(" ")[0] ?? "researcher"}.`}
        detail="Your research, requests and next actions in one place."
        action={
          canRegister ? (
            <Link className="rp-primary" to="/app/research/new">
              <Plus /> Register research
            </Link>
          ) : undefined
        }
      />
      <section className="rp-metrics">
        <MetricCard
          label="My research records"
          value={data.researchCount}
          detail="Your registered projects"
          Icon={LibraryBig}
        />
        <MetricCard
          label="My access requests"
          value={data.submittedAccessRequests ?? 0}
          detail="Requests you have submitted"
          Icon={KeyRound}
          tone="gold"
        />
        <MetricCard
          label="Registered versions"
          value={data.verifiedVersions ?? "—"}
          detail="SHA-256 fingerprints recorded"
          Icon={Fingerprint}
          tone="blue"
        />
        <MetricCard
          label="Next action"
          value={
            (data.pendingAccessRequests ?? 0) > 0
              ? "Review"
              : "Ready"
          }
          detail={
            (data.pendingAccessRequests ?? 0) > 0
              ? "Review controlled-access requests"
              : "Workspace up to date"
          }
          Icon={ClipboardCheck}
          tone="red"
        />
      </section>
      <div className="rp-columns">
        <section className="rp-panel">
          <PanelHeader
            title="My research"
            detail="Your latest protected records"
            action={
              <Link to="/app/research">
                View all <ArrowRight />
              </Link>
            }
          />
          {results.length ? (
            <RecordRows rows={results} />
          ) : (
            <Empty
              title="No research registered"
              detail="Create your first research record to establish its protected institutional history."
            />
          )}
        </section>
        <section className="rp-panel">
          <PanelHeader
            title="Research integrity"
            detail="Current workspace status"
          />
          <div className="rp-integrity">
            <span>
              <Fingerprint />
            </span>
            <div>
              <strong>Version fingerprints</strong>
              <p>
                Each registered version is checked against its SHA-256
                fingerprint.
              </p>
            </div>
            <Badge tone="green">Active</Badge>
          </div>
          <div className="rp-integrity">
            <span>
              <LockKeyhole />
            </span>
            <div>
              <strong>Disclosure controls</strong>
              <p>
                Restricted packages remain private until an authorized decision.
              </p>
            </div>
            <Badge tone="blue">Enforced</Badge>
          </div>
        </section>
        <section className="rp-panel">
          <PanelHeader
            title="My access requests"
            detail="Status of requests you have submitted"
            action={
              <Link to="/app/access">
                View all <ArrowRight />
              </Link>
            }
          />
          {requests.status === "LoadingFirstPage" ? (
            <Loading />
          ) : requests.results.length ? (
            <div className="rp-audit-list">
              {requests.results.map((r: any) => (
                <article key={r._id}>
                  <span>
                    <KeyRound />
                  </span>
                  <div>
                    <strong>{r.researchTitle}</strong>
                    <p>
                      {r.organization} · {r.purpose}
                    </p>
                    <small>
                      {accessStateLabel(r.accessState ?? r.status)}
                      {r.expiresAt
                        ? ` · access until ${dateLabel(r.expiresAt)}`
                        : ""}
                    </small>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <Empty
              title="No access requests yet"
              detail="Requests you make on public innovation profiles will appear here."
            />
          )}
        </section>
      </div>
    </>
  );
}
export function AdminHome() {
  const data = useQuery(api.research.dashboardSummary, {}) as any;
  if (data === undefined) return <Loading />;
  return (
    <>
      <PageHeading
        eyebrow="ATBU RESEARCH GOVERNANCE"
        title="Institution overview"
        detail="Monitor research protection, approvals and security across the university."
        action={
          <Link className="rp-secondary" to="/admin/research">
            <Download /> Export report
          </Link>
        }
      />
      <section className="rp-metrics">
        <MetricCard
          label="Protected records"
          value={data.researchCount}
          detail="Institution-wide registry"
          Icon={ShieldCheck}
        />
        <MetricCard
          label="Access requests"
          value={data.pendingAccessRequests}
          detail="Awaiting institutional review"
          Icon={KeyRound}
          tone="gold"
        />
        <MetricCard
          label="Open security alerts"
          value={data.openSecurityAlerts ?? 0}
          detail="Require investigation"
          Icon={ShieldAlert}
          tone="red"
        />
        <MetricCard
          label="Verified versions"
          value={data.verifiedVersions ?? "—"}
          detail="Integrity fingerprints recorded"
          Icon={Fingerprint}
          tone="blue"
        />
      </section>
      <div className="rp-admin-grid">
        <section className="rp-panel">
          <PanelHeader
            title="Recent institutional research"
            detail="Latest submissions and updates"
            action={
              <Link to="/admin/research">
                Open registry <ArrowRight />
              </Link>
            }
          />
          {data.research?.length ? (
            <RecordRows rows={data.research} />
          ) : (
            <Empty
              title="No institutional records"
              detail="Research records will appear here after they are registered."
            />
          )}
        </section>
        <section className="rp-panel">
          <PanelHeader
            title="Governance queue"
            detail="Institutional work that needs review"
          />
          <div className="rp-queue-links">
            {data.role !== "security_officer" && (
              <Link to="/admin/access">
                <Mark tone="gold">
                  <KeyRound />
                </Mark>
                <span>
                  <strong>Access requests</strong>
                  <small>{data.pendingAccessRequests} pending decision</small>
                </span>
                <ChevronRight />
              </Link>
            )}
            <Link to="/admin/security">
              <Mark tone="red">
                <ShieldAlert />
              </Mark>
              <span>
                <strong>Security alerts</strong>
                <small>{data.openSecurityAlerts ?? 0} open events</small>
              </span>
              <ChevronRight />
            </Link>
            {data.role === "administrator" && (
              <Link to="/admin/users">
                <Mark tone="blue">
                  <Users />
                </Mark>
                <span>
                  <strong>User roles</strong>
                  <small>Review institutional access</small>
                </span>
                <ChevronRight />
              </Link>
            )}
          </div>
        </section>
        <section className="rp-panel">
          <PanelHeader
            title="Recent audit activity"
            detail="Latest recorded institutional events"
            action={
              <Link to="/admin/security">
                Full audit log <ArrowRight />
              </Link>
            }
          />
          <AuditList events={data.events ?? []} />
        </section>
      </div>
    </>
  );
}
