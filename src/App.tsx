import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bell,
  BookOpen,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  Clock3,
  Database,
  Download,
  Eye,
  FileCheck2,
  FileClock,
  FileText,
  GraduationCap,
  FileSearch,
  Fingerprint,
  FolderArchive,
  History,
  Home,
  KeyRound,
  LayoutDashboard,
  Landmark,
  LibraryBig,
  LockKeyhole,
  LogIn,
  Menu,
  MoreHorizontal,
  Network,
  Plus,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  ScanEye,
  TimerReset,
  Upload,
  UserCheck,
  X,
  XCircle,
} from "lucide-react";
import "./App.css";

type Page =
  | "home"
  | "dashboard"
  | "user-dashboard"
  | "admin-dashboard"
  | "public-research"
  | "research"
  | "archive"
  | "requests"
  | "security"
  | "docs";
type Classification = "Public" | "Restricted" | "Confidential" | "IP-Sensitive";
type Research = {
  id: string;
  title: string;
  abstract: string;
  field: string;
  owner: string;
  department: string;
  classification: Classification;
  status: string;
  stage: string;
  updated: string;
  versions: number;
  hash: string;
  views: number;
  requests: number;
};

const research: Research[] = [
  {
    id: "ATBU-RP-2026-0042",
    title: "Solar-Powered Cold Chain for Rural Clinics",
    abstract:
      "A modular thermal storage system designed to preserve vaccines across off-grid primary healthcare centres.",
    field: "Renewable Energy",
    owner: "Amina Yusuf",
    department: "Mechanical Engineering",
    classification: "IP-Sensitive",
    status: "Institutional review",
    stage: "Prototype",
    updated: "18 Sep 2026",
    versions: 4,
    hash: "7f3a91c8…d04e",
    views: 38,
    requests: 5,
  },
  {
    id: "ATBU-RP-2026-0038",
    title: "Low-Cost Water Quality Sensor Network",
    abstract:
      "Distributed sensing and mobile telemetry for continuous groundwater quality monitoring in semi-arid communities.",
    field: "Environmental Systems",
    owner: "Ibrahim Saleh",
    department: "Computer Engineering",
    classification: "Confidential",
    status: "Supervisor verified",
    stage: "Validation",
    updated: "17 Sep 2026",
    versions: 3,
    hash: "e21d4b76…8a15",
    views: 24,
    requests: 3,
  },
  {
    id: "ATBU-RP-2026-0031",
    title: "Bio-Based Packaging from Groundnut Shells",
    abstract:
      "Converting regional agricultural waste into compostable food packaging with improved moisture resistance.",
    field: "Materials Science",
    owner: "Zainab Mohammed",
    department: "Chemical Engineering",
    classification: "Restricted",
    status: "Disclosure ready",
    stage: "Pilot",
    updated: "14 Sep 2026",
    versions: 6,
    hash: "0c5fa293…bb72",
    views: 61,
    requests: 8,
  },
  {
    id: "ATBU-RP-2026-0027",
    title: "Adaptive Irrigation Scheduling Model",
    abstract:
      "A weather-aware decision model that reduces water use for smallholder farms without lowering crop yield.",
    field: "Agricultural Technology",
    owner: "David Musa",
    department: "Agricultural Engineering",
    classification: "Public",
    status: "Published",
    stage: "Deployed",
    updated: "11 Sep 2026",
    versions: 2,
    hash: "91a6de02…4f31",
    views: 146,
    requests: 12,
  },
  {
    id: "ATBU-RP-2026-0019",
    title: "Campus Microgrid Load Forecasting",
    abstract:
      "Short-term energy demand forecasting for university microgrids using interpretable temporal models.",
    field: "Energy Systems",
    owner: "Fatima Bello",
    department: "Electrical Engineering",
    classification: "Restricted",
    status: "Supervisor verified",
    stage: "Research",
    updated: "08 Sep 2026",
    versions: 5,
    hash: "5bb791ae…72cd",
    views: 33,
    requests: 2,
  },
  {
    id: "ATBU-RP-2025-0114",
    title: "Hausa Speech Corpus for Public Services",
    abstract:
      "A quality-controlled speech dataset supporting accessible voice interfaces for essential public information.",
    field: "Applied AI",
    owner: "Sani Abubakar",
    department: "Computer Science",
    classification: "Confidential",
    status: "Ethics review",
    stage: "Dataset",
    updated: "29 Aug 2026",
    versions: 7,
    hash: "a14cf002…19e6",
    views: 18,
    requests: 4,
  },
];
const innovationProfiles = [
  { id: "ATBU-IN-2026-014", title: "Solar-Powered Cold Chain for Rural Clinics", field: "Renewable Energy", stage: "Prototype", summary: "A modular thermal storage system designed to preserve vaccines across off-grid primary healthcare centres.", application: "Primary healthcare and cold-chain logistics" },
  { id: "ATBU-IN-2026-009", title: "Bio-Based Packaging from Groundnut Shells", field: "Materials Science", stage: "Pilot", summary: "Regional agricultural waste converted into compostable food packaging with improved moisture resistance.", application: "Circular materials and food packaging" },
  { id: "ATBU-IN-2026-006", title: "Adaptive Irrigation Scheduling Model", field: "Agricultural Technology", stage: "Deployed", summary: "A weather-aware decision model that reduces water use for smallholder farms without lowering crop yield.", application: "Climate-smart agriculture" },
];
const activity = [
  [
    UserCheck,
    "Access approved",
    "Dr. Okafor received 72-hour access to RP-0042",
    "12 min ago",
    "green",
  ],
  [
    FileCheck2,
    "Integrity verified",
    "Version 4 of RP-0042 matches its registered fingerprint",
    "43 min ago",
    "green",
  ],
  [
    ShieldAlert,
    "Security rule triggered",
    "Repeated denied access attempts from a new device",
    "2 hrs ago",
    "red",
  ],
  [
    Upload,
    "New version registered",
    "Zainab Mohammed submitted version 6 of RP-0031",
    "4 hrs ago",
    "gold",
  ],
] as const;
const requestSeed = [
  {
    id: 1,
    person: "Dr. Chinedu Okafor",
    org: "Northbridge Health Systems",
    research: "Solar-Powered Cold Chain for Rural Clinics",
    purpose: "Technical due diligence for a regional pilot programme.",
    duration: "72 hours",
    risk: "Low",
    date: "18 Sep 2026",
  },
  {
    id: 2,
    person: "Engr. Halima Garba",
    org: "Bauchi State Water Board",
    research: "Low-Cost Water Quality Sensor Network",
    purpose: "Review sensor performance and evaluate a field trial.",
    duration: "14 days",
    risk: "Medium",
    date: "17 Sep 2026",
  },
  {
    id: 3,
    person: "Maya Chen",
    org: "Circular Materials Lab",
    research: "Bio-Based Packaging from Groundnut Shells",
    purpose: "Explore joint material testing and scale-up partnership.",
    duration: "7 days",
    risk: "Low",
    date: "16 Sep 2026",
  },
];
const docs = [
  [
    "Registering a research project",
    "Research lifecycle",
    "Create a durable research record, assign ownership and submit the first authoritative version.",
  ],
  [
    "Classification and disclosure policy",
    "Governance",
    "Apply Public, Restricted, Confidential and IP-Sensitive controls consistently.",
  ],
  [
    "Approving external access",
    "Access control",
    "Review stated purpose, scope, expiry and institutional authority before granting access.",
  ],
  [
    "File integrity and fingerprints",
    "Provenance",
    "Understand version hashes, comparison checks and authoritative research history.",
  ],
  [
    "Responding to security alerts",
    "Security",
    "Triage unusual access, credential failures, downloads and privilege changes.",
  ],
  [
    "Innovation profile guidelines",
    "Commercialisation",
    "Publish a useful opportunity profile without disclosing protected research material.",
  ],
];

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <button
      className="brand"
      onClick={() => (location.hash = "home")}
      aria-label="RIPATS home"
    >
      <span className="brand-mark">
        <ShieldCheck />
      </span>
      {!compact && (
        <span>
          <strong>RIPATS</strong>
          <small>ATBU Research Protection</small>
        </span>
      )}
    </button>
  );
}
function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={`pill ${tone}`}>{children}</span>;
}
function ClassPill({ value }: { value: Classification }) {
  const tones: Record<Classification, string> = {
    Public: "green",
    Restricted: "blue",
    Confidential: "gold",
    "IP-Sensitive": "red",
  };
  return (
    <Pill tone={tones[value]}>
      <i />
      {value}
    </Pill>
  );
}

function PublicHeader({ go }: { go: (p: Page) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="public-header">
      <Logo />
      <nav className={open ? "open" : ""}>
        <button
          onClick={() => document.querySelector("#platform")?.scrollIntoView()}
        >
          Platform
        </button>
        <button onClick={() => go("public-research")}>Research archive</button>
        <button onClick={() => go("docs")}>Documentation</button>
        <button
          onClick={() => document.querySelector("#about")?.scrollIntoView()}
        >
          About
        </button>
      </nav>
      <div className="public-actions">
        <button className="text-btn" onClick={() => go("user-dashboard")}>
          <LogIn /> Sign in
        </button>
        <button className="primary" onClick={() => go("user-dashboard")}>
          Research workspace <ArrowRight />
        </button>
        <button className="icon-btn mobile-menu" onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  );
}

function HomePage({ go }: { go: (p: Page) => void }) {
  const [faq, setFaq] = useState<number | null>(0);
  return (
    <div className="public-site">
      <PublicHeader go={go} />
      <main>
        <section className="hero-section">
          <div className="hero-copy">
            <div className="eyebrow"><i /> ABUBAKAR TAFAWA BALEWA UNIVERSITY</div>
            <h1>RIPATS</h1>
            <h2>Protecting university research. Advancing its impact.</h2>
            <p>Research Innovation, Patent and Tracking System gives every research output a trusted record, controlled access and a responsible path to collaboration.</p>
            <div className="hero-actions">
              <button className="primary" onClick={() => go("user-dashboard")}>Enter researcher workspace <ArrowRight /></button>
              <button className="hero-link" onClick={() => go("public-research")}>Explore public innovations <ArrowRight /></button>
            </div>
            <div className="hero-trust"><span><ShieldCheck/> Institution governed</span><span><Fingerprint/> Provenance preserved</span><span><History/> Access accountable</span></div>
          </div>
          <div className="hero-caption"><span>ATBU · RESEARCH PROTECTION</span><strong>From first submission to responsible discovery.</strong><small>Bauchi, Nigeria · Research. Innovation. Impact.</small></div>
        </section>
        <section className="impact-bar">
          <div className="prototype-label">Prototype workspace · illustrative records and metrics</div>
          <div>
            <strong>1,284</strong>
            <span>Research records</span>
          </div>
          <div>
            <strong>98.7%</strong>
            <span>Integrity verified</span>
          </div>
          <div>
            <strong>347</strong>
            <span>Controlled disclosures</span>
          </div>
          <div>
            <strong>22</strong>
            <span>Academic units</span>
          </div>
        </section>
        <section className="selected-research section-wrap" id="research-highlights">
          <header className="section-title"><div><span className="kicker">Research with potential</span><h2>Innovation worth discovering.</h2><p>Explore approved summaries from ATBU research. Protected files stay behind researcher and institutional review.</p></div><button className="text-link" onClick={()=>go("public-research")}>View public archive <ArrowRight/></button></header>
          <div className="highlight-grid">{innovationProfiles.map((item,index)=><button key={item.id} onClick={()=>go("public-research")}><span className={`highlight-index highlight-${index+1}`}>0{index+1}</span><small>{item.field} · {item.stage}</small><h3>{item.title}</h3><p>{item.summary}</p><footer><span>{item.id}</span><ArrowRight/></footer></button>)}</div>
        </section>
        <section className="platform" id="platform">
          <header>
            <div>
              <span className="kicker">The RIPATS lifecycle</span>
              <h2>Protection at every point of progress.</h2>
            </div>
            <p>
              One accountable layer connects the people, evidence and decisions
              behind every research output.
            </p>
          </header>
          <div className="lifecycle">
            {[
              [
                Fingerprint,
                "01",
                "Protect",
                "Classify sensitive work and preserve an authoritative fingerprint for every version.",
              ],
              [
                UserCheck,
                "02",
                "Verify",
                "Confirm affiliation, supervision and institutional authority before disclosure.",
              ],
              [
                KeyRound,
                "03",
                "Control",
                "Grant purpose-bound, time-limited access with least privilege.",
              ],
              [
                Activity,
                "04",
                "Track",
                "Record every access, decision, download and integrity event.",
              ],
              [
                Network,
                "05",
                "Connect",
                "Expose safe innovation profiles to credible collaborators and industry.",
              ],
            ].map(([Icon, n, title, text]) => (
              <article key={String(title)}>
                <span className="step-icon">
                  <Icon />
                </span>
                <small>{n as string}</small>
                <h3>{title as string}</h3>
                <p>{text as string}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="feature-band" id="about">
          <div>
            <span className="kicker">Designed for responsible discovery</span>
            <h2>
              Make innovation visible.
              <br />
              Keep the evidence protected.
            </h2>
            <p>
              Public opportunity profiles help legitimate partners find relevant
              work. Protected files remain behind institutional review, explicit
              approval and a complete audit history.
            </p>
            <button className="light-btn" onClick={() => go("public-research")}>
              Browse innovation profiles <ArrowRight />
            </button>
          </div>
          <div>
            {[
              [
                "01",
                "Discover safely",
                "Share the problem, application and development stage without exposing full research packages.",
              ],
              [
                "02",
                "Request with purpose",
                "External partners identify themselves, their organisation, intended use and required duration.",
              ],
              [
                "03",
                "Approve with confidence",
                "Researchers and institutional officers review each request against classification policy.",
              ],
            ].map(([n, t, d]) => (
              <article key={n}>
                <span>{n}</span>
                <div>
                  <h3>{t}</h3>
                  <p>{d}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="ecosystem section-wrap">
          <header className="section-title"><span className="kicker">Built to complement the ecosystem</span><h2>A focused protection layer around research infrastructure.</h2><p>RIPATS works alongside university repositories, TERAS, NIRIS and formal technology-transfer processes. It connects protection and provenance across the research lifecycle without claiming to replace them.</p></header>
          <div className="ecosystem-grid"><article><Landmark/><small>RESEARCH REPOSITORIES</small><h3>Preserve and discover</h3><p>Institutional and national repositories make scholarly outputs findable and accessible.</p><span>Repository layer</span></article><div className="ecosystem-connector"><ArrowRight/><small>COMPLEMENT</small></div><article className="ecosystem-focus"><ShieldCheck/><small>ATBU RIPATS</small><h3>Protect and account</h3><p>Classification, verified versions, controlled access, activity records and safe innovation profiles.</p><span>Lifecycle protection layer</span></article><div className="ecosystem-connector"><ArrowRight/><small>HAND OFF</small></div><article><Network/><small>INNOVATION PARTNERS</small><h3>Evaluate and translate</h3><p>Approved disclosures connect promising work with institutional IP and commercialisation channels.</p><span>Technology transfer</span></article></div>
        </section>
        <section className="capabilities section-wrap" id="capabilities"><header className="section-title"><span className="kicker">A connected operating system</span><h2>Evidence, permissions and people in one place.</h2></header><div className="capability-grid">{[[Fingerprint,'01','Provenance records','Research IDs, registration timestamps, file fingerprints and authoritative version history.'],[LockKeyhole,'02','Classification controls','Public, Restricted, Confidential and IP-Sensitive handling with clear disclosure boundaries.'],[KeyRound,'03','Purpose-bound access','Requests state who needs access, why, to what scope and for how long.'],[Activity,'04','Accountable activity','Auditable events for approvals, denials, views, downloads, changes and verification.'],[ScanEye,'05','Security monitoring','Rule-based alerts surface repeated failures, unusual downloads and privilege changes.'],[Sparkles,'06','Innovation profiles','Useful, discoverable summaries that make impact visible while protected evidence stays gated.']].map(([Icon,n,title,copy])=><article key={String(n)}><span><Icon/></span><small>{n as string}</small><h3>{title as string}</h3><p>{copy as string}</p></article>)}</div></section>
        <section className="classification-section"><div className="section-wrap classification-inner"><div><span className="kicker">Disclosure follows classification</span><h2>Not every research file should be public.</h2><p>Visibility is intentional. A discoverable profile can introduce an innovation while the full research package remains available only to approved people.</p><button className="text-link" onClick={()=>go('docs')}>Read classification guidance <ArrowRight/></button></div><div className="classification-list">{[['Public','Approved abstracts and published work','Discoverable','green'],['Restricted','Full academic work and supporting material','Authorized users','blue'],['Confidential','Unpublished results, data, code and designs','Explicit approval','gold'],['IP-Sensitive','Potential patent or commercial material','Institutional review','red']].map(([name,desc,access,tone])=><article key={name}><span className={`class-mark ${tone}`}/><div><strong>{name}</strong><small>{desc}</small></div><Pill tone={tone}>{access}</Pill></article>)}</div></div></section>
        <section className="journey section-wrap"><header className="section-title"><span className="kicker">The research journey</span><h2>One trusted record. From registration through hand-off.</h2></header><div className="journey-grid">{[[ClipboardCheck,'Register','Create the record and verify the researcher, supervisor and institutional relationship.'],[LockKeyhole,'Protect','Set classification and retain a timestamped, fingerprinted version.'],[FileSearch,'Discover','Expose only approved innovation information to potential collaborators.'],[UserCheck,'Approve','Review each access request for purpose, scope, risk and duration.'],[Activity,'Track','Capture access, permissions, downloads and security signals.'],[Network,'Connect','Coordinate approved disclosures through university IP channels.']].map(([Icon,title,copy],i)=><article key={String(title)}><span className="journey-number">0{i+1}</span><Icon/><h3>{title as string}</h3><p>{copy as string}</p></article>)}</div></section>
        <section className="roles-section"><div className="section-wrap"><header className="section-title"><span className="kicker">One institution, distinct responsibilities</span><h2>Designed for the people who carry research forward.</h2></header><div className="role-grid"><article><GraduationCap/><h3>Researchers</h3><p>Register work, manage versions, classify material and review requests for their research.</p><button onClick={()=>go('user-dashboard')}>Open researcher workspace <ArrowRight/></button></article><article><UserCheck/><h3>Supervisors & IP officers</h3><p>Verify relationships, advise on disclosure and review sensitive innovation before it is shared.</p><button onClick={()=>go('admin-dashboard')}>Open institutional workspace <ArrowRight/></button></article><article><ShieldCheck/><h3>Research administrators</h3><p>Oversee institutional queues, security posture, audit history and unit-level activity.</p><button onClick={()=>go('admin-dashboard')}>Open administrator dashboard <ArrowRight/></button></article></div></div></section>
        <section className="faq-section section-wrap"><header className="section-title"><span className="kicker">Common questions</span><h2>Clear boundaries for trusted research.</h2></header><div className="faq-list">{[['Does RIPATS replace TERAS or NIRIS?','No. RIPATS complements repositories and federated discovery services. Its focus is lifecycle protection: provenance, classification, controlled access, monitoring and accountable disclosure.'],['Does RIPATS grant patents or determine ownership?','No. It records research events and supports institutional workflows. Patent filing, ownership decisions and formal technology transfer remain with the appropriate university and national processes.'],['Can a collaborator discover an innovation without seeing the full research?','Yes. A public innovation profile can describe the problem, application and development stage. Sensitive files remain protected until access is explicitly reviewed and approved.'],['What evidence is retained for each research version?','The record can include a Research ID, registration time, version history and cryptographic fingerprint, alongside access and permission events.']].map(([q,a],i)=><article key={q}><button onClick={()=>setFaq(faq===i?null:i)}><span>{q}</span><ChevronDown className={faq===i?'expanded':''}/></button>{faq===i&&<p>{a}</p>}</article>)}</div></section>
        <section className="closing-band"><div><span className="kicker">ATBU research, responsibly protected</span><h2>Give important work a trusted path forward.</h2><p>Start with a verified record. Keep sensitive evidence in the right hands. Make promising innovation easier to find.</p><div><button className="primary" onClick={()=>go('user-dashboard')}>Enter researcher workspace <ArrowRight/></button><button className="outline-light" onClick={()=>go('admin-dashboard')}>Administrator access</button></div></div></section>
      </main>
      <footer>
        <Logo />
        <p>Research Innovation, Patent and Tracking System</p>
        <span>Abubakar Tafawa Balewa University · Bauchi, Nigeria</span>
        <button onClick={()=>go('docs')}>Guidance</button><button onClick={()=>go('admin-dashboard')}>Administration</button>
      </footer>
    </div>
  );
}

function PublicResearchPage({ go }: { go: (p: Page) => void }) {
  const [query, setQuery] = useState("");
  const publicRecords = innovationProfiles.filter((item) => `${item.title} ${item.field} ${item.summary}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="public-site public-archive"><PublicHeader go={go}/><main><section className="public-archive-hero"><span className="kicker">ATBU innovation archive</span><h1>Discover work that is ready to be seen.</h1><p>These approved innovation profiles describe research opportunity without exposing restricted research packages, data or source materials.</p><label><Search/><input value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Search approved innovation profiles"/></label></section><section className="public-archive-body section-wrap"><header className="section-title"><div><span className="kicker">Approved innovation profiles</span><h2>Research discovery with clear boundaries.</h2></div><button className="text-link" onClick={()=>go("home")}><ArrowLeft/> Return to RIPATS</button></header><div className="public-record-grid">{publicRecords.map((item)=><article key={item.id}><header><Pill tone="green">Public profile</Pill><span>{item.stage}</span></header><small>{item.field}</small><h3>{item.title}</h3><p>{item.summary}</p><div><span>Application</span><strong>{item.application}</strong></div><footer><span>{item.id}</span><button onClick={()=>go("user-dashboard")}>Request introduction <ArrowRight/></button></footer></article>)}{publicRecords.length===0&&<div className="empty public-empty"><Search/><h3>No approved profiles match that search.</h3><p>Try another topic or return to the RIPATS portal.</p></div>}</div></section></main><footer><Logo/><p>Research Innovation, Patent and Tracking System</p><span>Abubakar Tafawa Balewa University · Bauchi, Nigeria</span></footer></div>;
}

const userNav: [Page, string, typeof Home][] = [
  ["user-dashboard", "My workspace", LayoutDashboard],
  ["research", "Research registry", LibraryBig],
  ["archive", "My archive", FolderArchive],
  ["requests", "Access requests", KeyRound],
  ["docs", "Documentation", BookOpen],
];
const adminNav: [Page, string, typeof Home][] = [
  ["admin-dashboard", "Institution overview", LayoutDashboard],
  ["research", "Research registry", LibraryBig],
  ["archive", "Institutional archive", FolderArchive],
  ["requests", "Disclosure reviews", KeyRound],
  ["security", "Security centre", ShieldCheck],
  ["docs", "Documentation", BookOpen],
];
function Sidebar({
  page,
  administrator,
  go,
  collapsed,
  setCollapsed,
}: {
  page: Page;
  administrator: boolean;
  go: (p: Page) => void;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}) {
  const items = administrator ? adminNav : userNav;
  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-head">
        <Logo compact={collapsed} />
        <button className="collapse" onClick={() => setCollapsed(!collapsed)}>
          <ChevronRight />
        </button>
      </div>
      <div className="institution">
        <span>AT</span>
        {!collapsed && (
          <div>
            <strong>ATBU</strong>
            <small>Institution workspace</small>
          </div>
        )}
      </div>
      <nav>
        {items.map(([id, label, Icon], i) => (
          <span key={id}>
            {!collapsed && (i === 0 || (administrator && i === 5)) && (
              <small>{i === 0 ? (administrator ? "ADMINISTRATION" : "MY RESEARCH") : "SUPPORT"}</small>
            )}
            <button
              className={page === id ? "active" : ""}
              onClick={() => go(id)}
              title={label}
            >
              <Icon />
              {!collapsed && label}
              {id === "requests" && !collapsed && <b>{administrator ? "8" : "2"}</b>}
            </button>
          </span>
        ))}
      </nav>
      <div className="sidebar-foot">
        <button onClick={() => go("home")}>
          <ArrowLeft />
          {!collapsed && "Public portal"}
        </button>
        <div className="user">
          <span>AU</span>
          {!collapsed && (
            <div>
              <strong>{administrator ? "RIPATS Office" : "Amina Yusuf"}</strong>
              <small>{administrator ? "Administrator" : "Researcher"}</small>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
function Topbar({
  title,
  subtitle,
  onMenu,
}: {
  title: string;
  subtitle: string;
  onMenu: () => void;
}) {
  const [n, setN] = useState(true);
  return (
    <header className="topbar">
      <button className="icon-btn app-menu" onClick={onMenu}>
        <Menu />
      </button>
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="top-actions">
        <Pill tone="gold">Prototype</Pill>
        <button className="global-search">
          <Search /> Search RIPATS <kbd>⌘ K</kbd>
        </button>
        <button className="icon-btn" onClick={() => setN(false)}>
          <Bell />
          {n && <i />}
        </button>
        <button className="help">
          <CircleHelp /> Help
        </button>
      </div>
    </header>
  );
}
function Metric({
  label,
  value,
  change,
  Icon,
  tone,
}: {
  label: string;
  value: string;
  change: string;
  Icon: typeof Home;
  tone: string;
}) {
  return (
    <article className="metric">
      <span className={tone}>
        <Icon />
      </span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
        <em>{change}</em>
      </div>
    </article>
  );
}

function Dashboard({
  go,
  select,
}: {
  go: (p: Page) => void;
  select: (r: Research) => void;
}) {
  return (
    <>
      <section className="welcome">
        <div>
          <small>Saturday, 19 September 2026</small>
          <h2>Good morning, Amina.</h2>
          <p>
            Here is what needs your attention across the research workspace.
          </p>
        </div>
        <button className="primary" onClick={() => go("research")}>
          <Plus /> Register research
        </button>
      </section>
      <section className="metrics">
        <Metric
          label="Protected research"
          value="128"
          change="+12 this month"
          Icon={ShieldCheck}
          tone="green"
        />
        <Metric
          label="Pending requests"
          value="3"
          change="2 require review"
          Icon={KeyRound}
          tone="gold"
        />
        <Metric
          label="Integrity checks"
          value="98.7%"
          change="All critical files verified"
          Icon={Fingerprint}
          tone="blue"
        />
        <Metric
          label="Active alerts"
          value="2"
          change="1 high priority"
          Icon={ShieldAlert}
          tone="red"
        />
      </section>
      <section className="dashboard-grid">
        <div className="panel span-two">
          <PanelHead
            title="Research activity"
            sub="Protected record events over the last six months"
          />
          <div className="chart">
            <svg viewBox="0 0 620 190" preserveAspectRatio="none">
              <defs>
                <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#1f6b50" stopOpacity=".22" />
                  <stop offset="1" stopColor="#1f6b50" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0 165 C55 155,70 120,120 130 S210 95,250 108 S330 48,375 73 S460 35,500 50 S570 18,620 28 L620 190 L0 190Z"
                fill="url(#area)"
              />
              <path
                d="M0 165 C55 155,70 120,120 130 S210 95,250 108 S330 48,375 73 S460 35,500 50 S570 18,620 28"
                fill="none"
                stroke="#1f6b50"
                strokeWidth="3"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            <div>
              <span>Apr</span>
              <span>May</span>
              <span>Jun</span>
              <span>Jul</span>
              <span>Aug</span>
              <span>Sep</span>
            </div>
          </div>
          <div className="legend">
            <span>
              <i className="green" />
              New versions <b>42</b>
            </span>
            <span>
              <i className="gold" />
              Access requests <b>19</b>
            </span>
            <span>
              <i className="blue" />
              Verifications <b>68</b>
            </span>
          </div>
        </div>
        <div className="panel attention">
          <PanelHead title="Needs attention" sub="Priority actions" />
          {[
            [
              KeyRound,
              "Access requests",
              "3 awaiting your decision",
              "requests",
              "gold",
            ],
            [
              AlertTriangle,
              "Security alerts",
              "1 high-priority event",
              "security",
              "red",
            ],
            [
              UserCheck,
              "Verification due",
              "1 record needs review",
              "research",
              "blue",
            ],
          ].map(([Icon, t, s, p, tone]) => (
            <button onClick={() => go(p as Page)} key={String(t)}>
              <span className={String(tone)}>
                <Icon />
              </span>
              <div>
                <strong>{t as string}</strong>
                <small>{s as string}</small>
              </div>
              <ChevronRight />
            </button>
          ))}
        </div>
        <div className="panel span-two">
          <PanelHead
            title="Recently updated research"
            sub="Your institution’s latest protected records"
          />
          <div className="compact-table">
            {research.slice(0, 4).map((r) => (
              <button key={r.id} onClick={() => select(r)}>
                <span className="record-icon">
                  <FileText />
                </span>
                <span>
                  <strong>{r.title}</strong>
                  <small>
                    {r.id} · {r.department}
                  </small>
                </span>
                <ClassPill value={r.classification} />
                <time>{r.updated}</time>
                <ChevronRight />
              </button>
            ))}
          </div>
        </div>
        <div className="panel">
          <PanelHead title="Activity trail" sub="Latest security events" />
          <div className="activity-list">
            {activity.map(([Icon, t, d, time, tone]) => (
              <article key={t}>
                <span className={tone}>
                  <Icon />
                </span>
                <div>
                  <strong>{t}</strong>
                  <p>{d}</p>
                  <small>{time}</small>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function ResearcherDashboard({ go, select }: { go: (p: Page) => void; select: (r: Research) => void }) {
  const myResearch = research.filter((r) => r.owner === "Amina Yusuf" || r.owner === "Ibrahim Saleh");
  return <>
    <section className="welcome"><div><small>MY RESEARCH WORKSPACE · SATURDAY, 19 SEPTEMBER 2026</small><h2>Good morning, Amina.</h2><p>Your research is protected. Here are the next steps in your work.</p></div><button className="primary" onClick={() => go("research")}><Plus/> Register research</button></section>
    <section className="metrics"><Metric label="My research records" value="4" change="2 active projects" Icon={FileText} tone="green"/><Metric label="Access requests" value="2" change="1 needs your decision" Icon={KeyRound} tone="gold"/><Metric label="Versions verified" value="100%" change="All current versions intact" Icon={Fingerprint} tone="blue"/><Metric label="Next milestone" value="24 Sep" change="Disclosure review · RP-0042" Icon={Clock3} tone="red"/></section>
    <section className="dashboard-grid"><div className="panel span-two"><PanelHead title="My research" sub="Records you own or collaborate on"/><div className="compact-table">{myResearch.map(r=><button key={r.id} onClick={()=>select(r)}><span className="record-icon"><FileText/></span><span><strong>{r.title}</strong><small>{r.id} · {r.department}</small></span><ClassPill value={r.classification}/><time>{r.updated}</time><ChevronRight/></button>)}</div></div><div className="panel attention"><PanelHead title="My next actions" sub="Keep your research moving"/><button onClick={()=>go("requests")}><span className="gold"><KeyRound/></span><div><strong>Review collaborator request</strong><small>RP-0042 · expires in 2 days</small></div><ChevronRight/></button><button onClick={()=>select(myResearch[0])}><span className="blue"><UserCheck/></span><div><strong>Confirm disclosure summary</strong><small>Institutional review pending</small></div><ChevronRight/></button><button onClick={()=>go("research")}><span className="green"><Upload/></span><div><strong>Register a new version</strong><small>Keep the authoritative record current</small></div><ChevronRight/></button></div><div className="panel"><PanelHead title="Recent activity" sub="Events on your records"/><div className="activity-list">{activity.slice(0,3).map(([Icon,t,d,time,tone])=><article key={t}><span className={tone}><Icon/></span><div><strong>{t}</strong><p>{d}</p><small>{time}</small></div></article>)}</div></div><div className="panel researcher-guidance"><PanelHead title="Research protection status" sub="RP-0042 · Solar-Powered Cold Chain"/><div className="research-status"><div><Fingerprint/><span><strong>Version fingerprint</strong><small>Verified 18 Sep 2026 · SHA-256</small></span><Pill tone="green">Verified</Pill></div><div><LockKeyhole/><span><strong>Classification</strong><small>Full package visibility</small></span><ClassPill value="IP-Sensitive"/></div><div><ShieldCheck/><span><strong>Disclosure review</strong><small>Institutional IP review in progress</small></span><Pill tone="gold">In review</Pill></div></div></div></section>
  </>;
}

function AdminDashboard({ go, select }: { go: (p: Page) => void; select: (r: Research) => void }) {
  return <>
    <section className="welcome"><div><small>ATBU RESEARCH GOVERNANCE · SATURDAY, 19 SEPTEMBER 2026</small><h2>Institution overview</h2><p>Monitor research protection, approvals and security across the university.</p></div><div className="admin-toolbar"><button className="secondary"><Download/> Export report</button><button className="primary" onClick={()=>go("research")}><Plus/> Add record</button></div></section>
    <section className="metrics"><Metric label="Protected records" value="1,284" change="Across 22 academic units" Icon={ShieldCheck} tone="green"/><Metric label="Awaiting review" value="18" change="6 high-priority disclosures" Icon={ClipboardCheck} tone="gold"/><Metric label="Integrity verified" value="98.7%" change="1,267 records current" Icon={Fingerprint} tone="blue"/><Metric label="Open security alerts" value="2" change="1 high priority · 1 medium" Icon={ShieldAlert} tone="red"/></section>
    <section className="admin-overview"><div className="panel admin-chart"><PanelHead title="Institutional research activity" sub="New records, reviews and controlled disclosures"/><div className="admin-chart-body"><div className="admin-chart-bars">{[['Apr',42,25],['May',52,32],['Jun',46,38],['Jul',68,43],['Aug',76,51],['Sep',88,62]].map(([m,a,b])=><div key={String(m)}><span style={{height:`${a}%`}}/><i style={{height:`${b}%`}}/><small>{m}</small></div>)}</div></div><div className="legend"><span><i className="green"/>New records</span><span><i className="gold"/>Disclosure reviews</span><span>Last 6 months</span></div></div><div className="panel admin-queue"><PanelHead title="Governance queue" sub="Institution-wide work requiring action"/>{[[ClipboardCheck,'Disclosure review','6 IP-sensitive records','research','gold'],[KeyRound,'External access requests','8 waiting on approval','requests','blue'],[UserCheck,'Researcher verification','4 affiliations to confirm','research','green'],[ShieldAlert,'Security incidents','2 alerts to investigate','security','red']].map(([Icon,title,note,target,tone])=><button key={String(title)} onClick={()=>go(target as Page)}><span className={String(tone)}><Icon/></span><div><strong>{title as string}</strong><small>{note as string}</small></div><ChevronRight/></button>)}</div>
      <div className="panel unit-coverage"><PanelHead title="Academic unit coverage" sub="Records with verified ownership and classification"/><div>{[['Engineering','342','96%'],['Agriculture & Agricultural Technology','206','94%'],['Sciences','188','92%'],['Environmental Technology','144','89%'],['Management Technology','102','87%']].map(([unit,count,rate])=><article key={unit}><span>{unit}</span><b>{count}</b><div><i style={{width:rate}}/></div><small>{rate}</small></article>)}</div><button className="text-link" onClick={()=>go('research')}>View all 22 academic units <ArrowRight/></button></div>
      <div className="panel admin-records"><PanelHead title="Recent institutional records" sub="Latest submitted or changed research"/><div className="compact-table">{research.slice(0,4).map(r=><button key={r.id} onClick={()=>select(r)}><span className="record-icon"><FileText/></span><span><strong>{r.title}</strong><small>{r.id} · {r.owner} · {r.department}</small></span><ClassPill value={r.classification}/><time>{r.updated}</time><ChevronRight/></button>)}</div></div>
      <div className="panel admin-events"><PanelHead title="Security and audit events" sub="Latest institution-wide signals"/><div className="activity-list">{activity.map(([Icon,t,d,time,tone])=><article key={t}><span className={tone}><Icon/></span><div><strong>{t}</strong><p>{d}</p><small>{time}</small></div></article>)}</div><button className="text-link" onClick={()=>go('security')}>Open security centre <ArrowRight/></button></div>
    </section>
  </>;
}

function PanelHead({ title, sub }: { title: string; sub: string }) {
  return (
    <header className="panel-head">
      <div>
        <h3>{title}</h3>
        <p>{sub}</p>
      </div>
      <button>
        <MoreHorizontal />
      </button>
    </header>
  );
}

function Registry({
  archived = false,
  personal = false,
  select,
}: {
  archived?: boolean;
  personal?: boolean;
  select: (r: Research) => void;
}) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"All" | Classification>("All");
  const [grid, setGrid] = useState(false);
  const rows = useMemo(
    () =>
      research.filter(
        (r) =>
          (!personal || r.owner === "Amina Yusuf" || r.owner === "Ibrahim Saleh") &&
          `${r.title} ${r.id} ${r.owner} ${r.field}`
            .toLowerCase()
            .includes(q.toLowerCase()) &&
          (filter === "All" || r.classification === filter),
      ),
    [q, filter],
  );
  return (
    <>
      <PageHead
        title={
          archived
            ? personal ? "My research archive" : "Institutional research archive"
            : "Research registry"
        }
        sub={
          archived
            ? "Preserved, versioned records across ATBU academic units."
            : "Register, classify and manage authoritative research records."
        }
        action={!archived}
      />
      <section className="filters">
        <label>
          <Search />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search title, Research ID, researcher or field…"
          />
        </label>
        <div>
          {(
            [
              "All",
              "Public",
              "Restricted",
              "Confidential",
              "IP-Sensitive",
            ] as const
          ).map((x) => (
            <button
              className={filter === x ? "active" : ""}
              onClick={() => setFilter(x)}
              key={x}
            >
              {x}
            </button>
          ))}
        </div>
        <button className="filter-btn">
          <SlidersHorizontal /> Filters
        </button>
        <button className="icon-btn" onClick={() => setGrid(!grid)}>
          {grid ? <Menu /> : <LayoutDashboard />}
        </button>
      </section>
      <div className="result-meta">
        <span>{rows.length} records</span>
        <button>
          Last updated <ChevronDown />
        </button>
      </div>
      {grid ? (
        <section className="research-cards">
          {rows.map((r) => (
            <button key={r.id} onClick={() => select(r)}>
              <header>
                <span className="record-icon">
                  <FileText />
                </span>
                <ClassPill value={r.classification} />
              </header>
              <small>{r.id}</small>
              <h3>{r.title}</h3>
              <p>{r.abstract}</p>
              <footer>
                <span>{r.field}</span>
                <span>v{r.versions}</span>
              </footer>
            </button>
          ))}
        </section>
      ) : (
        <section className="research-table panel">
          <header>
            <span>Research</span>
            <span>Classification</span>
            <span>Status</span>
            <span>Updated</span>
            <span />
          </header>
          {rows.map((r) => (
            <button key={r.id} onClick={() => select(r)}>
              <span className="research-title">
                <span className="record-icon">
                  <FileText />
                </span>
                <span>
                  <strong>{r.title}</strong>
                  <small>
                    {r.id} · {r.owner} · {r.field}
                  </small>
                </span>
              </span>
              <ClassPill value={r.classification} />
              <Pill>{r.status}</Pill>
              <time>{r.updated}</time>
              <MoreHorizontal />
            </button>
          ))}
        </section>
      )}
    </>
  );
}
function PageHead({
  title,
  sub,
  action = false,
}: {
  title: string;
  sub: string;
  action?: boolean;
}) {
  return (
    <section className="page-head">
      <div>
        <h2>{title}</h2>
        <p>{sub}</p>
      </div>
      {action && (
        <button className="primary">
          <Plus /> Register research
        </button>
      )}
    </section>
  );
}

function Detail({ item, back }: { item: Research; back: () => void }) {
  const [tab, setTab] = useState("Overview");
  return (
    <>
      <button className="back" onClick={back}>
        <ArrowLeft /> Back to registry
      </button>
      <section className="detail-head">
        <div>
          <div>
            <span>{item.id}</span>
            <ClassPill value={item.classification} />
            <Pill tone="green">{item.status}</Pill>
          </div>
          <h2>{item.title}</h2>
          <p>
            {item.department} · Lead researcher: {item.owner}
          </p>
        </div>
        <aside>
          <button className="secondary">
            <Download /> Export record
          </button>
          <button className="primary">
            <KeyRound /> Request access
          </button>
        </aside>
      </section>
      <nav className="tabs">
        {["Overview", "Versions", "Access", "Audit trail"].map((x) => (
          <button
            className={tab === x ? "active" : ""}
            onClick={() => setTab(x)}
            key={x}
          >
            {x}
          </button>
        ))}
      </nav>
      {tab === "Overview" ? (
        <section className="detail-grid">
          <div>
            <article className="panel document">
              <h3>Research abstract</h3>
              <p>{item.abstract}</p>
              <div className="metadata">
                {[
                  ["Research field", item.field],
                  ["Development stage", item.stage],
                  ["Academic unit", item.department],
                  ["First registered", "14 February 2026"],
                ].map(([a, b]) => (
                  <div key={a}>
                    <span>{a}</span>
                    <strong>{b}</strong>
                  </div>
                ))}
              </div>
            </article>
            <article className="panel opportunity">
              <PanelHead
                title="Innovation profile"
                sub="Approved information for controlled discovery"
              />
              {[
                [
                  "Problem addressed",
                  "Cold-chain failures reduce access to safe vaccines in remote communities with unreliable electricity.",
                ],
                [
                  "Potential application",
                  "Primary health centres, mobile clinics and last-mile medicine distribution.",
                ],
                [
                  "Collaboration sought",
                  "Field validation, manufacturing partnerships and regional pilot support.",
                ],
              ].map(([a, b]) => (
                <div key={a}>
                  <span>{a}</span>
                  <p>{b}</p>
                </div>
              ))}
            </article>
          </div>
          <aside>
            <article className="panel integrity">
              <span>
                <Fingerprint />
              </span>
              <Pill tone="green">
                <Check /> Verified
              </Pill>
              <h3>File integrity</h3>
              <p>
                The latest registered version matches its authoritative
                fingerprint.
              </p>
              <div>
                <small>SHA-256</small>
                <code>{item.hash}</code>
              </div>
              <div>
                <small>Verified</small>
                <strong>18 Sep 2026, 10:42</strong>
              </div>
              <button className="secondary">Run verification</button>
            </article>
            <article className="panel quick">
              <h3>Record activity</h3>
              <p>
                <Eye />
                Profile views <strong>{item.views}</strong>
              </p>
              <p>
                <KeyRound />
                Access requests <strong>{item.requests}</strong>
              </p>
              <p>
                <FileClock />
                Versions <strong>{item.versions}</strong>
              </p>
            </article>
          </aside>
        </section>
      ) : (
        <section className="panel timeline">
          <h3>
            {tab === "Versions"
              ? "Authoritative version history"
              : tab === "Access"
                ? "Access grants and requests"
                : "Immutable activity record"}
          </h3>
          {tab === "Versions" ? (
            Array.from(
              { length: item.versions },
              (_, i) => item.versions - i,
            ).map((v, i) => (
              <article key={v}>
                <span>
                  <FileCheck2 />
                </span>
                <div>
                  <strong>
                    Version {v} {i === 0 && <Pill tone="green">Current</Pill>}
                  </strong>
                  <p>
                    {i === 0
                      ? "Technical drawings and validation notes updated."
                      : "Registered research package preserved."}
                  </p>
                  <small>
                    {18 - i * 2} Sep 2026 · {item.owner}
                  </small>
                </div>
                <code>{i === 0 ? item.hash : `a${v}c8f91…${v}e20`}</code>
              </article>
            ))
          ) : (
            <div className="empty">
              <KeyRound />
              <h3>No active external access</h3>
              <p>All previous grants have expired or were revoked.</p>
            </div>
          )}
        </section>
      )}
    </>
  );
}

function Requests() {
  const [rows, setRows] = useState(
    requestSeed.map((r) => ({ ...r, state: "Pending" })),
  );
  const decide = (id: number, state: string) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, state } : r)));
  return (
    <>
      <PageHead
        title="Access requests"
        sub="Review external interest and grant limited, purpose-bound access."
      />
      <div className="request-summary">
        <span>
          <b>3</b> Pending
        </span>
        <span>
          <b>14</b> Approved this month
        </span>
        <span>
          <b>2</b> Declined this month
        </span>
        <span>
          <b>0</b> Expiring today
        </span>
      </div>
      <section className="requests">
        {rows.map((r) => (
          <article key={r.id}>
            <header>
              <span>
                {r.person
                  .split(" ")
                  .map((x) => x[0])
                  .slice(-2)
                  .join("")}
              </span>
              <div>
                <h3>{r.person}</h3>
                <p>
                  <Building2 /> {r.org}
                </p>
                <small>Submitted {r.date}</small>
              </div>
              <Pill tone={r.risk === "Low" ? "green" : "gold"}>
                {r.risk} risk
              </Pill>
            </header>
            <main>
              <div>
                <small>Research requested</small>
                <strong>{r.research}</strong>
              </div>
              <div>
                <small>Stated purpose</small>
                <p>{r.purpose}</p>
              </div>
              <div>
                <small>Requested duration</small>
                <strong>
                  <Clock3 /> {r.duration}
                </strong>
              </div>
            </main>
            <footer>
              {r.state === "Pending" ? (
                <>
                  <button
                    className="danger"
                    onClick={() => decide(r.id, "Declined")}
                  >
                    <XCircle /> Decline
                  </button>
                  <button
                    className="primary"
                    onClick={() => decide(r.id, "Approved")}
                  >
                    <CheckCircle2 /> Approve access
                  </button>
                </>
              ) : (
                <Pill tone={r.state === "Approved" ? "green" : "red"}>
                  {r.state}
                </Pill>
              )}
            </footer>
          </article>
        ))}
      </section>
    </>
  );
}

function Security() {
  const [resolved, setResolved] = useState<number[]>([]);
  const alerts = [
    {
      id: 1,
      severity: "High",
      title: "Repeated access denials",
      text: "12 attempts to open an IP-Sensitive record from a newly registered device.",
      user: "m.bello@partner.org",
      time: "2 hours ago",
    },
    {
      id: 2,
      severity: "Medium",
      title: "Unusual download volume",
      text: "Five documents downloaded within nine minutes under one active grant.",
      user: "c.okafor@northbridge.ng",
      time: "Yesterday, 16:22",
    },
  ];
  return (
    <>
      <PageHead
        title="Security centre"
        sub="Monitor risk signals, file integrity and access behaviour."
      />
      <section className="security-score">
        <div className="score">
          <b>92</b>
          <small>/100</small>
        </div>
        <div>
          <Pill tone="green">Strong posture</Pill>
          <h3>Institutional protection score</h3>
          <p>
            Core controls are operating normally. Review one high-priority
            access event.
          </p>
        </div>
        <aside>
          <span>
            <CheckCircle2 /> Authorization checks <b>100%</b>
          </span>
          <span>
            <CheckCircle2 /> Integrity coverage <b>98.7%</b>
          </span>
          <span>
            <AlertTriangle /> Alert resolution <b>81%</b>
          </span>
        </aside>
      </section>
      <section className="security-layout">
        <div>
          <header className="section-head">
            <div>
              <h3>Active alerts</h3>
              <p>Signals requiring human review</p>
            </div>
            <Pill tone="red">{alerts.length - resolved.length} open</Pill>
          </header>
          {alerts
            .filter((a) => !resolved.includes(a.id))
            .map((a) => (
              <article className="alert" key={a.id}>
                <span className={a.severity === "High" ? "red" : "gold"}>
                  <ShieldAlert />
                </span>
                <div>
                  <Pill tone={a.severity === "High" ? "red" : "gold"}>
                    {a.severity}
                  </Pill>
                  <small>{a.time}</small>
                  <h3>{a.title}</h3>
                  <p>{a.text}</p>
                  <code>{a.user}</code>
                </div>
                <aside>
                  <button className="secondary">Investigate</button>
                  <button onClick={() => setResolved([...resolved, a.id])}>
                    <Check /> Mark resolved
                  </button>
                </aside>
              </article>
            ))}
        </div>
        <aside>
          <article className="panel controls">
            <h3>Control status</h3>
            {[
              [LockKeyhole, "Resource authorization", "Active"],
              [Fingerprint, "Integrity monitoring", "Active"],
              [Activity, "Audit logging", "Active"],
              [Database, "Encrypted storage", "Active"],
              [TimerReset, "Backup recovery", "Due"],
            ].map(([Icon, t, s]) => (
              <p key={String(t)}>
                <Icon />
                {t as string}
                <Pill tone={s === "Due" ? "gold" : "green"}>{s as string}</Pill>
              </p>
            ))}
          </article>
        </aside>
      </section>
    </>
  );
}

function Documentation() {
  const [q, setQ] = useState("");
  const rows = docs.filter((d) =>
    d.join(" ").toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <>
      <section className="docs-hero">
        <span className="kicker">RIPATS knowledge base</span>
        <h2>Research protection, clearly documented.</h2>
        <p>
          Practical guidance for researchers, supervisors, IP officers and
          security teams.
        </p>
        <label>
          <Search />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search documentation…"
          />
        </label>
      </section>
      <section className="docs-layout">
        <aside>
          <h3>Browse by topic</h3>
          {[
            "Getting started",
            "Research lifecycle",
            "Governance",
            "Access control",
            "Provenance",
            "Security",
            "Commercialisation",
          ].map((x, i) => (
            <button className={i === 0 ? "active" : ""} key={x}>
              {x}
              <ChevronRight />
            </button>
          ))}
        </aside>
        <main>
          <header className="section-head">
            <div>
              <h3>{q ? "Search results" : "Essential guides"}</h3>
              <p>{rows.length} articles</p>
            </div>
          </header>
          <div className="doc-cards">
            {rows.map(([t, c, d], i) => (
              <button key={t}>
                <span>{i % 2 ? <BookOpen /> : <FileText />}</span>
                <Pill>{c}</Pill>
                <h3>{t}</h3>
                <p>{d}</p>
                <small>
                  5 min read <ArrowRight />
                </small>
              </button>
            ))}
          </div>
        </main>
      </section>
    </>
  );
}

const meta: Record<Page, [string, string]> = {
  home: ["", ""],
  "public-research": ["Innovation archive", "Approved public research profiles"],
  "user-dashboard": ["My workspace", "Your research, access and next actions"],
  "admin-dashboard": ["Institution overview", "Research protection across ATBU"],
  dashboard: ["Overview", "Institution-wide research protection at a glance"],
  research: [
    "Research registry",
    "Authoritative records and controlled disclosure",
  ],
  archive: ["Archive", "Preserved institutional research and version history"],
  requests: ["Access requests", "Review and govern external research access"],
  security: [
    "Security centre",
    "Protection status, alerts and integrity monitoring",
  ],
  docs: ["Documentation", "Guidance for responsible research management"],
};
function Workspace({ page, go, administrator, setAdministrator }: { page: Page; go: (p: Page) => void; administrator: boolean; setAdministrator: (value: boolean) => void }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [selected, setSelected] = useState<Research | null>(null);
  const navigate = (p: Page) => {
    setSelected(null);
    setMobile(false);
    go(p);
  };
  return (
    <div className={`app-shell ${mobile ? "mobile-open" : ""}`}>
      <Sidebar
        page={page}
        administrator={administrator}
        go={navigate}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />
      {mobile && <button className="scrim" onClick={() => setMobile(false)} />}
      <div className="workspace">
        <Topbar
          title={selected ? "Research record" : meta[page][0]}
          subtitle={selected ? selected.id : meta[page][1]}
          onMenu={() => setMobile(true)}
        />
        <main className="workspace-content">
          {selected ? (
            <Detail item={selected} back={() => setSelected(null)} />
          ) : (
            <>
              {page === "user-dashboard" && (
                <ResearcherDashboard go={navigate} select={setSelected} />
              )}
              {page === "admin-dashboard" && (
                <AdminDashboard go={navigate} select={setSelected} />
              )}
              {page === "dashboard" && (
                <Dashboard go={navigate} select={setSelected} />
              )}{" "}
              {page === "research" && <Registry select={setSelected} />}{" "}
              {page === "archive" && <Registry archived personal={!administrator} select={setSelected} />}{" "}
              {page === "requests" && <Requests />}{" "}
              {page === "security" && <Security />}{" "}
              {page === "docs" && <Documentation />}
            </>
          )}
        </main>
        <button className="role-switch" onClick={() => { setAdministrator(!administrator); navigate(administrator ? "user-dashboard" : "admin-dashboard"); }}><span>{administrator ? <GraduationCap/> : <ShieldCheck/>}</span><div><small>SWITCH WORKSPACE</small><strong>{administrator ? "Researcher view" : "Administrator view"}</strong></div><ArrowRight/></button>
      </div>
    </div>
  );
}
function App() {
  const fromHash = (): Page => {
    const h = location.hash.slice(1) as Page;
    return [...userNav, ...adminNav].some(([p]) => p === h) || ["requests","security","archive","public-research"].includes(h) ? h : "home";
  };
  const [page, setPage] = useState<Page>(fromHash);
  const [administrator, setAdministrator] = useState(() => {
    const initialPage = fromHash();
    if (initialPage === "admin-dashboard" || initialPage === "security") return true;
    if (initialPage === "user-dashboard") return false;
    return localStorage.getItem("ripats-workspace") === "admin";
  });
  const go = (p: Page) => {
    location.hash = p;
    setPage(p);
    if (p === "admin-dashboard") {
      setAdministrator(true);
      localStorage.setItem("ripats-workspace", "admin");
    } else if (p === "user-dashboard" || p === "home") {
      setAdministrator(false);
      localStorage.setItem("ripats-workspace", "researcher");
    }
    scrollTo({ top: 0, behavior: "smooth" });
  };
  useEffect(() => {
    const syncRoute = () => {
      const next = fromHash();
      setPage(next);
      if (next === "admin-dashboard" || next === "security") setAdministrator(true);
      if (next === "user-dashboard" || next === "home") setAdministrator(false);
    };
    addEventListener("hashchange", syncRoute);
    return () => removeEventListener("hashchange", syncRoute);
  }, []);
  if (page === "public-research") return <PublicResearchPage go={go}/>;
  return page === "home" ? (
    <HomePage go={go} />
  ) : (
    <Workspace page={page} go={go} administrator={administrator} setAdministrator={setAdministrator} />
  );
}
export default App;
