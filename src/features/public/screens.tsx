/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useConvexAuth } from "@convex-dev/auth/react";
import { usePaginatedQuery, useQuery } from "convex/react";
import { Activity, ArrowRight, Building2, ChevronDown, ClipboardCheck, FileText, Fingerprint, GraduationCap, KeyRound, LibraryBig, LockKeyhole, LogIn, Search, ShieldAlert, ShieldCheck, SlidersHorizontal, UserCheck } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../../convex/_generated/api";
import { Brand, Badge, ClassificationBadge, Empty, Loading, Mark } from "../../components/ui/product";
import type { Classification, Profile } from "../core/types";
import { RequestAccess } from "../research/screens";
function PublicHeader() {
  return (
    <header className="rp-public-nav">
      <Brand />
      <nav>
        <a href="/#platform">Platform</a>
        <Link to="/research">Innovation archive</Link>
        <a href="/#governance">Governance</a>
        <Link to="/documentation">Documentation</Link>
      </nav>
      <div>
        <Link className="rp-login-link" to="/sign-in">
          <LogIn /> Sign in
        </Link>
        <Link className="rp-primary" to="/sign-up">
          Create account <ArrowRight />
        </Link>
      </div>
    </header>
  );
}
export function LandingPage() {
  return (
    <div className="rp-public">
      <PublicHeader />
      <main>
        <section className="rp-hero">
          <div className="rp-hero-image" />
          <div className="rp-hero-inner">
            <div className="rp-hero-copy">
              <span className="rp-eyebrow">
                Abubakar Tafawa Balewa University · Bauchi
              </span>
              <h1>RIPATS</h1>
              <h2>
                Protect university research.
                <br />
                <em>Move innovation forward.</em>
              </h2>
              <p>
                One trusted workspace for research provenance, controlled
                disclosure, institutional oversight and responsible
                collaboration.
              </p>
              <div className="rp-hero-actions">
                <Link className="rp-primary" to="/sign-up">
                  Create your research account <ArrowRight />
                </Link>
                <Link className="rp-light-link" to="/research">
                  Explore approved innovations <ArrowRight />
                </Link>
              </div>
              <div className="rp-hero-proof">
                <span>
                  <Fingerprint /> Version integrity
                </span>
                <span>
                  <LockKeyhole /> Controlled access
                </span>
                <span>
                  <Activity /> Accountable activity
                </span>
              </div>
            </div>
            <div className="rp-hero-note">
              <span>RESEARCH PROTECTION INFRASTRUCTURE</span>
              <strong>Protect → Verify → Control → Track → Connect</strong>
            </div>
          </div>
        </section>
        <section className="rp-value-strip">
          <div>
            <strong>01</strong>
            <span>Verified research provenance</span>
          </div>
          <div>
            <strong>02</strong>
            <span>Purpose-bound disclosure</span>
          </div>
          <div>
            <strong>03</strong>
            <span>Institutional governance</span>
          </div>
          <div>
            <strong>04</strong>
            <span>Safe innovation discovery</span>
          </div>
        </section>
        <section className="rp-section" id="platform">
          <header className="rp-section-heading">
            <span className="rp-eyebrow">The RIPATS lifecycle</span>
            <h2>
              A trusted record from first submission to legitimate
              collaboration.
            </h2>
            <p>
              Research protection should move with the work. RIPATS connects the
              steps that are often scattered across emails, repositories and
              spreadsheets.
            </p>
          </header>
          <div className="rp-lifecycle">
            {[
              [
                FileText,
                "Register",
                "Create a durable research record and establish its institutional relationship.",
              ],
              [
                UserCheck,
                "Verify",
                "Confirm researcher, supervisor, academic unit and authority.",
              ],
              [
                LockKeyhole,
                "Protect",
                "Classify each package and fingerprint every registered version.",
              ],
              [
                KeyRound,
                "Control",
                "Approve access with a stated purpose, limited scope and expiry.",
              ],
              [
                Activity,
                "Track",
                "Keep an accountable history of decisions, access and security events.",
              ],
              [
                Building2,
                "Connect",
                "Hand approved disclosures to institutional IP and transfer processes.",
              ],
            ].map(([Icon, title, copy], i) => (
              <article key={String(title)}>
                <small>0{i + 1}</small>
                <Mark tone="green">
                  <Icon />
                </Mark>
                <h3>{title as string}</h3>
                <p>{copy as string}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="rp-discovery">
          <div className="rp-section rp-discovery-inner">
            <div>
              <span className="rp-eyebrow">Responsible discovery</span>
              <h2>
                Let partners find the opportunity.
                <br />
                <em>Keep the evidence protected.</em>
              </h2>
              <p>
                Approved public profiles describe the problem, application and
                development stage. Research files, datasets, source code and
                unpublished findings remain behind institutional review.
              </p>
              <Link className="rp-secondary" to="/research">
                Browse innovation archive <ArrowRight />
              </Link>
            </div>
            <div className="rp-profile-demo">
              <header>
                <Badge tone="green">Approved innovation profile</Badge>
                <span>ATBU · Renewable Energy</span>
              </header>
              <h3>Solar-Powered Cold Chain for Rural Clinics</h3>
              <p>
                A modular thermal storage system designed for vaccine
                preservation across off-grid health centres.
              </p>
              <footer>
                <span>
                  <LockKeyhole /> Full research package protected
                </span>
                <span>
                  <ArrowRight />
                </span>
              </footer>
            </div>
          </div>
        </section>
        <section className="rp-section">
          <header className="rp-section-heading">
            <span className="rp-eyebrow">Purpose-built protection</span>
            <h2>Evidence, permissions and accountability in one place.</h2>
          </header>
          <div className="rp-feature-grid">
            {[
              [
                Fingerprint,
                "Provenance & integrity",
                "Record IDs, timestamps, version history and SHA-256 fingerprints give each file an authoritative history.",
              ],
              [
                SlidersHorizontal,
                "Classification policy",
                "Public, Restricted, Confidential and IP-Sensitive classifications shape the default disclosure boundary.",
              ],
              [
                KeyRound,
                "Controlled access",
                "Review who is asking, why, what they need and for how long before protected access is granted.",
              ],
              [
                ClipboardCheck,
                "Institutional review",
                "Route sensitive disclosures through supervisor, IP and security roles with a clear decision trail.",
              ],
              [
                ShieldAlert,
                "Security monitoring",
                "Surface repeated failures, unusual download patterns and privilege changes for investigation.",
              ],
              [
                LibraryBig,
                "Repository complement",
                "RIPATS adds lifecycle protection around institutional repositories and national discovery services.",
              ],
            ].map(([Icon, title, copy]) => (
              <article key={String(title)}>
                <Mark tone="green">
                  <Icon />
                </Mark>
                <h3>{title as string}</h3>
                <p>{copy as string}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="rp-classification" id="governance">
          <div className="rp-section rp-class-inner">
            <div>
              <span className="rp-eyebrow">
                Classification before disclosure
              </span>
              <h2>Not every research file should be public.</h2>
              <p>
                Visibility follows institutional review and the needs of the
                work. Authentication alone does not grant access to every
                research package.
              </p>
              <Link to="/documentation" className="rp-text-link">
                Read the classification guide <ArrowRight />
              </Link>
            </div>
            <div className="rp-class-list">
              {[
                [
                  "public",
                  "Approved abstracts and published work",
                  "Discoverable",
                ],
                [
                  "restricted",
                  "Full academic work and supporting material",
                  "Authorized users",
                ],
                [
                  "confidential",
                  "Unpublished results, sensitive data and code",
                  "Explicit approval",
                ],
                [
                  "ip_sensitive",
                  "Potential patent or commercial material",
                  "Institutional IP review",
                ],
              ].map(([level, description, rule]) => (
                <article key={level}>
                  <ClassificationBadge value={level as Classification} />
                  <span>{description}</span>
                  <small>{rule}</small>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section className="rp-section rp-roles">
          <header className="rp-section-heading">
            <span className="rp-eyebrow">
              One institution, distinct responsibilities
            </span>
            <h2>Workspaces shaped around the people doing the work.</h2>
          </header>
          <div className="rp-role-grid">
            <article>
              <GraduationCap />
              <h3>Researchers</h3>
              <p>
                Register projects, manage authoritative versions, classify
                material and respond to requests on your work.
              </p>
              <Link to="/sign-up">
                Create researcher account <ArrowRight />
              </Link>
            </article>
            <article>
              <UserCheck />
              <h3>Supervisors & IP officers</h3>
              <p>
                Verify research relationships, review disclosure summaries and
                guide sensitive innovation through institutional channels.
              </p>
              <Link to="/sign-in">
                Institutional sign in <ArrowRight />
              </Link>
            </article>
            <article>
              <ShieldCheck />
              <h3>Research administrators</h3>
              <p>
                Monitor university-wide governance queues, security events, user
                roles and academic-unit coverage.
              </p>
              <Link to="/sign-in">
                Administrator sign in <ArrowRight />
              </Link>
            </article>
          </div>
        </section>
        <section className="rp-faq rp-section">
          <div>
            <span className="rp-eyebrow">Clear boundaries</span>
            <h2>Designed to complement research infrastructure.</h2>
          </div>
          <div>
            {[
              [
                "Does RIPATS replace TERAS or NIRIS?",
                "No. It complements repository and federated discovery services with protection, provenance, access controls and security monitoring.",
              ],
              [
                "Does RIPATS grant patents or establish ownership?",
                "No. Patent decisions and formal technology transfer remain with the university and relevant national processes. RIPATS records and governs the digital lifecycle.",
              ],
              [
                "Can partners discover work without receiving the full research?",
                "Yes. Public innovation profiles reveal only the approved summary. Protected materials require explicit access review.",
              ],
              [
                "What does a researcher need to get started?",
                "An account, institutional affiliation, research title and initial classification. A supervisor or institutional officer can verify the relationship during review.",
              ],
            ].map(([q, a]) => (
              <details key={q}>
                <summary>
                  {q}
                  <ChevronDown />
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="rp-cta">
          <span className="rp-eyebrow">
            ATBU research, responsibly protected
          </span>
          <h2>Give important work a trusted path forward.</h2>
          <p>
            Register the work, protect the evidence and make approved innovation
            easier to discover.
          </p>
          <Link className="rp-primary" to="/sign-up">
            Create your account <ArrowRight />
          </Link>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
function PublicFooter() {
  return (
    <footer className="rp-public-footer">
      <Brand inverse />
      <span>Research Innovation, Patent and Tracking System</span>
      <Link to="/research">Innovation archive</Link>
      <Link to="/documentation">Documentation</Link>
      <small>Abubakar Tafawa Balewa University · Bauchi, Nigeria</small>
    </footer>
  );
}

export function PublicArchive() {
  const [search, setSearch] = useState("");
  const { results, loadMore, status } = usePaginatedQuery(
    api.research.publicProfiles,
    { search: search || undefined },
    { initialNumItems: 12 },
  );
  return (
    <div className="rp-public">
      <PublicHeader />
      <main>
        <section className="rp-archive-hero">
          <span className="rp-eyebrow">ATBU innovation archive</span>
          <h1>Discover work approved for visibility.</h1>
          <p>
            Public profiles reveal the opportunity while unpublished files and
            sensitive research remain protected.
          </p>
          <label>
            <Search />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, application or research field"
            />
          </label>
        </section>
        <section className="rp-section">
          <div className="rp-section-heading compact">
            <span className="rp-eyebrow">Public innovation profiles</span>
            <h2>Research discovery with clear boundaries.</h2>
          </div>
          <div className="rp-public-grid">
            {results.map((item: any) => (
              <article key={item._id}>
                <header>
                  <Badge tone="green">Approved profile</Badge>
                  <span>{item.stage}</span>
                </header>
                <small>
                  {item.field} · {item.researchId}
                </small>
                <h3>{item.title}</h3>
                <p>{item.abstract}</p>
                <footer>
                  <span>{item.application || "Research collaboration"}</span>
                  <Link to={`/research/${item.researchId}`}>
                    View approved summary <ArrowRight />
                  </Link>
                </footer>
              </article>
            ))}
          </div>
          {results.length === 0 && status != "LoadingFirstPage" && (
            <Empty
              title="No public profiles yet"
              detail="Approved innovation profiles will appear here when the university publishes them."
            />
          )}
          {status === "LoadingFirstPage" && <Loading />}
          {!results.length ? null : status === "CanLoadMore" ? (
            <button
              className="rp-secondary load-more"
              onClick={() => loadMore(12)}
            >
              Load more <ChevronDown />
            </button>
          ) : null}
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}

export function PublicInnovationPage() {
  const { researchId } = useParams();
  const record = useQuery(api.research.publicProfileById, {
    researchId: researchId ?? "",
  }) as any;
  const { isAuthenticated } = useConvexAuth();
  const me = useQuery(api.account.me, isAuthenticated ? {} : "skip") as
    Profile | null | undefined;

  if (record === undefined || (isAuthenticated && me === undefined))
    return <Loading full />;
  if (!record)
    return (
      <main className="rp-public">
        <PublicHeader />
        <section className="rp-archive-hero">
          <span className="rp-eyebrow">Innovation profile unavailable</span>
          <h1>This profile is not publicly available.</h1>
          <Link to="/research" className="rp-secondary">
            Return to innovation archive
          </Link>
        </section>
        <PublicFooter />
      </main>
    );

  return (
    <main className="rp-public">
      <PublicHeader />
      <section className="rp-archive-hero">
        <span className="rp-eyebrow">
          {record.researchId} · {record.field}
        </span>
        <h1>{record.title}</h1>
        <p>{record.abstract}</p>
      </section>
      <section className="rp-section rp-public-profile">
        <article>
          <span className="rp-eyebrow">Approved innovation summary</span>
          <h2>Research opportunity</h2>
          <p>{record.abstract}</p>
          <h3>Potential application</h3>
          <p>{record.application ?? "Institutional research collaboration"}</p>
          <h3>Development stage</h3>
          <p>{record.stage}</p>
          <h3>Collaboration sought</h3>
          <p>
            {record.collaborationSought ??
              "Contact the research team to discuss collaboration."}
          </p>
          <Badge tone="green">Full research package protected</Badge>
        </article>
        <aside>
          <h2>Interested in this work?</h2>
          <p>
            Sign in or create a RIPATS account to submit a purpose-bound access
            request. Institutional review is required before protected material
            is shared.
          </p>
          {isAuthenticated && me ? (
            <RequestAccess id={record._id} />
          ) : (
            <Link className="rp-primary" to="/sign-in">
              Sign in to request access <ArrowRight />
            </Link>
          )}
        </aside>
      </section>
      <PublicFooter />
    </main>
  );
}
