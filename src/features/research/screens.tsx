/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRef, useState, type FormEvent } from "react";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronDown, Clock3, Download, FileCheck2, Fingerprint, LockKeyhole, Pencil, Search, Trash2, Upload, XCircle } from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { dateLabel, errorText, roleNames } from "../core/constants";
import type { Classification, Profile, Research } from "../core/types";
import { Badge, ClassificationBadge, Empty, Loading, Mark, PageHeading, PanelHeader, PrimaryButton, RecordRows, SecondaryButton, TextArea, TextField } from "../../components/ui/product";
import { useToast } from "../../components/ui/toast";
import { accessDeviceKey } from "../core/accessDevice";
export function RegistryPage({
  admin = false,
}: {
  admin?: boolean;
}) {
  const [filter, setFilter] = useState<Classification | "all">("all");
  const [search, setSearch] = useState("");
  const me = useQuery(api.account.me, {}) as Profile | null | undefined;
  const mine = usePaginatedQuery(
    api.research.listMine,
    admin ? "skip" : {},
    { initialNumItems: 25 },
  );
  const institution = usePaginatedQuery(
    api.research.listInstitution,
    admin ? (filter === "all" ? {} : { classification: filter }) : "skip",
    { initialNumItems: 25 },
  );
  const page = admin ? institution : mine;
  const rows = (page.results as Research[]).filter(
    (record) =>
      !search ||
      `${record.title} ${record.researchId} ${record.field} ${record.department}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const workspace = admin ? "/admin" : "/app";
  const canRegister = !admin
    ? ["researcher", "partner", "supervisor"].includes(me?.role ?? "")
    : ["administrator", "ip_officer"].includes(me?.role ?? "");
  return (
    <>
      <PageHeading
        eyebrow={admin ? "ATBU RESEARCH REGISTRY" : "MY RESEARCH WORKSPACE"}
        title={admin ? "Research registry" : "My research"}
        detail="Register, classify, verify and manage research records."
        action={
          canRegister && (
            <Link
              className="rp-primary"
              to={`${workspace}/research/new`}
            >
              <Upload /> Upload research
            </Link>
          )
        }
      />
      <div className="rp-toolbar">
        <label className="rp-search">
          <Search />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search title, ID, field or department"
          />
        </label>
        <select
          value={filter}
          onChange={(event) =>
            setFilter(event.target.value as Classification | "all")
          }
        >
          <option value="all">All classifications</option>
          <option value="public">Public</option>
          <option value="restricted">Restricted</option>
          <option value="confidential">Confidential</option>
          <option value="ip_sensitive">IP-Sensitive</option>
        </select>
        <span>{rows.length} loaded</span>
      </div>
      <section className="rp-panel rp-registry">
        <div className="rp-table-head">
          <span>Research record</span>
          <span>Classification</span>
          <span>Status</span>
          <span>Last updated</span>
          <span />
        </div>
        {rows.length ? (
          <RecordRows rows={rows} />
        ) : (
          <Empty
            title="No matching records"
            detail="Adjust your search or classification filter."
          />
        )}
        {page.status === "LoadingFirstPage" && <Loading />}
        {page.status === "CanLoadMore" && (
          <button
            className="rp-secondary load-more"
            onClick={() => page.loadMore(25)}
          >
            Load more research <ChevronDown />
          </button>
        )}
      </section>
    </>
  );
}

export function ResearchDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const [now] = useState(() => Date.now());
  const me = useQuery(api.account.me, {}) as Profile | null | undefined;
  const record = useQuery(api.research.get, {
    id: id as Id<"research">,
    now,
    deviceKey: accessDeviceKey(),
  }) as any;
  const update = useMutation(api.research.update);
  const decideSubmission = useMutation(api.research.decideSubmission);
  const remove = useMutation(api.research.remove);
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [recordError, setRecordError] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewNote, setReviewNote] = useState("");
  const { showToast } = useToast();
  if (record === undefined || me === undefined) return <Loading />;
  if (!record)
    return (
      <Empty
        title="Research record unavailable"
        detail="This record does not exist or your account does not have access."
      />
    );
  const canManage =
    record.ownerProfileId === me?.profileId ||
    ["administrator", "ip_officer"].includes(me?.role ?? "");
  const canReview =
    ["administrator", "ip_officer"].includes(me?.role ?? "") &&
    record.status === "submitted";
  const canUpload = record.ownerProfileId === me?.profileId;
  const canDelete = canManage && record.status === "draft" && !record.innovationPublished;
  const saveRecord = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveBusy(true);
    setRecordError("");
    const form = new FormData(event.currentTarget);
    try {
      await update({
        id: record._id,
        title: String(form.get("title")).trim(),
        abstract: String(form.get("abstract")).trim(),
        innovationSummary: String(form.get("innovationSummary")).trim() || undefined,
        field: String(form.get("field")).trim(),
        department: String(form.get("department")).trim(),
        classification: String(form.get("classification")) as Classification,
        stage: String(form.get("stage")).trim(),
        problemStatement: String(form.get("problemStatement")).trim() || undefined,
        application: String(form.get("application")).trim() || undefined,
        collaborationSought: String(form.get("collaborationSought")).trim() || undefined,
      });
      setEditing(false);
      showToast({ kind: "success", title: "Research record updated" });
    } catch (error) {
      const message = errorText(error);
      setRecordError(message);
      showToast({ kind: "error", title: "Record was not saved", detail: message });
    } finally {
      setSaveBusy(false);
    }
  };
  const deleteRecord = async () => {
    if (
      !window.confirm(
        "Delete this unpublished draft and its uploaded versions? This cannot be undone.",
      )
    )
      return;
    setDeleteBusy(true);
    setRecordError("");
    try {
      await remove({ id: record._id });
      showToast({ kind: "success", title: "Draft research record deleted" });
      navigate(location.pathname.startsWith("/admin") ? "/admin/research" : "/app/research", { replace: true });
    } catch (error) {
      const message = errorText(error);
      setRecordError(message);
      showToast({ kind: "error", title: "Record was not deleted", detail: message });
    } finally {
      setDeleteBusy(false);
    }
  };
  const reviewSubmission = async (decision: "approved" | "rejected") => {
    setReviewBusy(true);
    setReviewError("");
    try {
      await decideSubmission({
        id: record._id,
        decision,
        note: reviewNote.trim() || undefined,
      });
      showToast({
        kind: decision === "approved" ? "success" : "warning",
        title:
          decision === "approved"
            ? "Research authorized and published"
            : "Research submission rejected",
      });
      setReviewNote("");
    } catch (error) {
      const message = errorText(error);
      setReviewError(message);
      showToast({ kind: "error", title: "Review decision failed", detail: message });
    } finally {
      setReviewBusy(false);
    }
  };
  return (
    <>
      <Link
        className="rp-back"
        to={location.pathname.startsWith("/admin") ? "/admin/research" : "/app/research"}
      >
        <ArrowLeft /> Back to research
      </Link>
      <PageHeading
        eyebrow={record.researchId}
        title={record.title}
        detail={`${record.department} · ${record.field} · ${roleNames[me?.role ?? "researcher"]}`}
        action={
          <>
            {canManage && (
              <SecondaryButton onClick={() => setEditing((value) => !value)}>
                <Pencil /> {editing ? "Cancel editing" : "Edit record"}
              </SecondaryButton>
            )}
            <ClassificationBadge value={record.classification} />
            <Badge tone={record.status}>
              {record.status.replaceAll("_", " ")}
            </Badge>
          </>
        }
      />
      <div className="rp-detail-grid">
        <section className="rp-panel rp-detail-main">
          <PanelHeader
            title="Research abstract"
            detail="Institutional research record"
          />
          <div className="rp-detail-body">
            {editing ? (
              <form className="rp-form rp-record-form" onSubmit={saveRecord}>
                <div className="rp-form-grid">
                  <TextField name="title" label="Research title" defaultValue={record.title} required />
                  <TextField name="field" label="Research field" defaultValue={record.field} required />
                  <TextField name="department" label="Academic department" defaultValue={record.department} required />
                  <label className="rp-field">
                    <span>Research classification</span>
                    <select name="classification" defaultValue={record.classification}>
                      <option value="public">Public</option>
                      <option value="restricted">Restricted</option>
                      <option value="confidential">Confidential</option>
                      <option value="ip_sensitive">IP-Sensitive</option>
                    </select>
                  </label>
                  <TextField name="stage" label="Development stage" defaultValue={record.stage} required />
                  <TextArea className="wide" name="abstract" label="Internal research abstract" defaultValue={record.abstract} required />
                  <TextArea className="wide" name="innovationSummary" label="Approved innovation summary" defaultValue={record.innovationSummary ?? ""} />
                  <TextArea className="wide" name="problemStatement" label="Problem addressed" defaultValue={record.problemStatement ?? ""} />
                  <TextField name="application" label="Potential application" defaultValue={record.application ?? ""} />
                  <TextField name="collaborationSought" label="Collaboration sought" defaultValue={record.collaborationSought ?? ""} />
                </div>
                {recordError && <div className="rp-error">{recordError}</div>}
                <footer>
                  <span><LockKeyhole /> Changes remain internal until an IP officer publishes an approved profile.</span>
                  <PrimaryButton disabled={saveBusy}>{saveBusy ? "Saving…" : "Save changes"} <Check /></PrimaryButton>
                </footer>
              </form>
            ) : (
              <>
                <p>{record.abstract}</p>
                <div className="rp-detail-metadata">
                  <div><small>Classification</small><ClassificationBadge value={record.classification} /></div>
                  <div><small>Development stage</small><strong>{record.stage}</strong></div>
                  <div><small>Department</small><strong>{record.department}</strong></div>
                  <div><small>Last updated</small><strong>{dateLabel(record.updatedAt)}</strong></div>
                </div>
                <PanelHeader title="Approved innovation summary" detail="Only this text is publicly displayed" />
                <p>{record.innovationSummary || "No public innovation summary has been added."}</p>
              </>
            )}
            {canReview && (
              <div className="rp-publication-action">
                <strong>Institutional review</strong>
                <p>
                  Authorize this submitted paper to make its approved innovation
                  summary visible in the public archive, or reject it for revision.
                </p>
                <TextArea
                  label="Review note"
                  value={reviewNote}
                  onChange={(event) => setReviewNote(event.target.value)}
                />
                <div className="rp-review-actions">
                  <PrimaryButton
                    disabled={reviewBusy}
                    onClick={() => void reviewSubmission("approved")}
                  >
                    <CheckCircle2 /> {reviewBusy ? "Saving…" : "Authorize and publish"}
                  </PrimaryButton>
                  <SecondaryButton
                    disabled={reviewBusy}
                    onClick={() => void reviewSubmission("rejected")}
                  >
                    <XCircle /> Reject submission
                  </SecondaryButton>
                </div>
                {reviewError && <div className="rp-error">{reviewError}</div>}
              </div>
            )}
            {canDelete && !editing && (
              <div className="rp-danger-action">
                <div>
                  <strong>Delete draft research record</strong>
                  <p>This permanently removes the draft and any uploaded versions.</p>
                </div>
                <button className="rp-danger-button" disabled={deleteBusy} onClick={() => void deleteRecord()}>
                  <Trash2 /> {deleteBusy ? "Deleting…" : "Delete draft"}
                </button>
              </div>
            )}
            {!editing && recordError && <div className="rp-error">{recordError}</div>}
          </div>
        </section>
        <section className="rp-panel">
          <PanelHeader
            title="Authoritative versions"
            detail="Each submitted version retains its own fingerprint"
          />
          <div className="rp-version-list">
            {record.versions?.map((version: any) => (
              <VersionRow
                key={version._id}
                version={version}
                canDownload
              />
            ))}
            {!record.versions?.length && (
              <Empty
                title="No versions yet"
                detail="Upload the first authoritative research file."
              />
            )}
          </div>
        </section>
        <aside>{canUpload && <VersionUpload id={record._id} />}</aside>
      </div>
    </>
  );
}
function VersionRow({
  version,
  canDownload,
}: {
  version: any;
  canDownload: boolean;
}) {
  const getUrl = useMutation(api.research.getVersionDownloadUrl);
  const { showToast } = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [integrityResult, setIntegrityResult] = useState("");
  const verifyLocalFile = async (file?: File) => {
    if (!file) return;
    setIntegrityResult("Checking fingerprint…");
    try {
      const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
      const fingerprint = Array.from(new Uint8Array(digest))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
      setIntegrityResult(
        fingerprint === version.sha256.toLowerCase()
          ? "Local file matches this registered version."
          : "Local file does not match this registered version.",
      );
    } catch {
      setIntegrityResult("This browser could not verify the local file.");
    }
  };
  const getFile = async () => {
    setBusy(true);
    try {
      const url = await getUrl({
        versionId: version._id,
        deviceKey: accessDeviceKey(),
      });
      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
        showToast({ kind: "success", title: "Download started" });
      }
    } catch (error) {
      showToast({
        kind: "error",
        title: "Download unavailable",
        detail: errorText(error),
      });
    } finally {
      setBusy(false);
    }
  };
  return (
    <article>
      <Mark tone="green">
        <FileCheck2 />
      </Mark>
      <div>
        <strong>
          Version {version.versionNumber} · {version.fileName}
        </strong>
        <small>
          {dateLabel(version.createdAt)}
          {version.notes ? ` · ${version.notes}` : ""}
        </small>
        <code>SHA-256 · {version.sha256}</code>
        {integrityResult && <small>{integrityResult}</small>}
      </div>
      {canDownload && (
        <>
          <input
            ref={fileInput}
            hidden
            type="file"
            onChange={(event) => void verifyLocalFile(event.target.files?.[0])}
          />
          <button
            title="Verify a local file against this fingerprint"
            onClick={() => fileInput.current?.click()}
          >
            <Fingerprint />
          </button>
        </>
      )}
      {canDownload && (
        <button
          title="Download registered file"
          disabled={busy}
          onClick={() => void getFile()}
        >
          <Download />
        </button>
      )}
    </article>
  );
}
function VersionUpload({ id }: { id: Id<"research"> }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const urlMutation = useMutation(api.research.generateUploadUrl);
  const addVersion = useMutation(api.research.addVersion);
  const { showToast } = useToast();
  const upload = async (file: File) => {
    setBusy(true);
    setMessage("");
    try {
      const allowedTypes = new Set([
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/csv",
        "text/plain",
        "application/zip",
      ]);
      if (file.size > 25 * 1024 * 1024 || !allowedTypes.has(file.type))
        throw new Error("Choose an approved document format up to 25 MB.");
      const url = await urlMutation({ id });
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!response.ok) throw new Error("The file upload did not complete.");
      const payload: unknown = await response.json();
      if (
        !payload ||
        typeof payload !== "object" ||
        !("storageId" in payload) ||
        typeof payload.storageId !== "string"
      )
        throw new Error("The uploaded file could not be verified.");
      await addVersion({
        id,
        storageId: payload.storageId as Id<"_storage">,
        fileName: file.name,
      });
      setMessage("Version registered and fingerprinted.");
      showToast({
        kind: "success",
        title: "Version registered",
        detail: "The file fingerprint was recorded in the research history.",
      });
    } catch (e) {
      const message = errorText(e);
      setMessage(message);
      showToast({ kind: "error", title: "Version upload failed", detail: message });
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="rp-panel rp-upload-panel">
      <PanelHeader
        title="Add research version"
        detail="Upload a new authoritative file"
      />
      <label className="rp-dropzone">
        <Upload />
        <strong>
          {busy ? "Uploading and verifying…" : "Choose a research file"}
        </strong>
        <small>PDF, DOCX, XLSX, CSV, TXT or ZIP up to 25 MB.</small>
        <input
          type="file"
          disabled={busy}
          onChange={(e) =>
            e.target.files?.[0] && void upload(e.target.files[0])
          }
        />
      </label>
      {message && <p className="rp-inline-message">{message}</p>}
    </section>
  );
}
export function RequestAccess({ id }: { id: Id<"research"> }) {
  const send = useMutation(api.research.requestAccess);
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const { showToast } = useToast();
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await send({
        researchId: id,
        organization: String(form.get("organization")),
        purpose: String(form.get("purpose")),
        durationHours: Number(form.get("duration")),
        requestedScopes: {
          view: form.get("scope-view") === "on",
          download: form.get("scope-download") === "on",
          summary: form.get("scope-summary") === "on",
        },
      });
      setMsg("Access request submitted.");
      setOpen(false);
      showToast({
        kind: "success",
        title: "Access request submitted",
        detail: "You will see the decision in your access requests.",
      });
    } catch (e) {
      const message = errorText(e);
      setMsg(message);
      showToast({ kind: "error", title: "Access request failed", detail: message });
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="rp-panel">
      <PanelHeader
        title="Controlled access"
        detail="Request purpose-bound access"
      />
      <div className="rp-request-box">
        <LockKeyhole />
        <p>
          Full research materials remain restricted until an authorized reviewer
          approves access.
        </p>
        {!open ? (
          <SecondaryButton onClick={() => setOpen(true)}>
            Request access <ArrowRight />
          </SecondaryButton>
        ) : (
          <form onSubmit={submit}>
            <TextField name="organization" label="Organization" required />
            <TextArea name="purpose" label="Purpose for access" required />
            <fieldset className="rp-scope-options">
              <legend>Requested access</legend>
              <label><input type="checkbox" name="scope-view" defaultChecked /> View / read the protected paper</label>
              <label><input type="checkbox" name="scope-summary" defaultChecked /> Receive the research summary</label>
              <label><input type="checkbox" name="scope-download" /> Download a copy</label>
            </fieldset>
            <TextField
              name="duration"
              label="Access duration (hours)"
              type="number"
              min={1}
              max={720}
              defaultValue={72}
              required
            />
            <PrimaryButton disabled={busy}>
              {busy ? "Submitting…" : "Submit request"} <ArrowRight />
            </PrimaryButton>
          </form>
        )}
        {msg && <small>{msg}</small>}
      </div>
    </section>
  );
}

export function NewResearchPage({
  admin = false,
}: {
  admin?: boolean;
}) {
  const create = useMutation(api.research.create);
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { showToast } = useToast();
  const workspace = admin ? "/admin" : "/app";
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const id = await create({
        title: String(form.get("title")),
        abstract: String(form.get("abstract")),
        innovationSummary: String(form.get("innovationSummary")) || undefined,
        field: String(form.get("field")),
        department: String(form.get("department")),
        classification: String(form.get("classification")) as Classification,
        stage: String(form.get("stage")),
        problemStatement: String(form.get("problem")) || undefined,
        application: String(form.get("application")) || undefined,
        collaborationSought: String(form.get("collaboration")) || undefined,
      });
      showToast({ kind: "success", title: "Research record created", detail: "Add the authoritative file version to establish its fingerprint." });
      navigate(`${workspace}/research/${id}`);
    } catch (cause) {
      const message = errorText(cause);
      setError(message);
      showToast({ kind: "error", title: "Research registration failed", detail: message });
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <Link className="rp-back" to={`${workspace}/research`}>
        <ArrowLeft /> Back to research
      </Link>
      <PageHeading
        eyebrow="RESEARCH LIFECYCLE · REGISTER"
        title="Upload research"
        detail="Register the research metadata first, then add the authoritative file version and SHA-256 fingerprint."
      />
      <form className="rp-panel rp-form" onSubmit={submit}>
        <div className="rp-form-grid">
          <TextField
            name="title"
            label="Research title"
            placeholder="Enter the working title"
            required
          />
          <TextField
            name="field"
            label="Research field"
            placeholder="e.g. Renewable energy"
            required
          />
          <TextField
            name="department"
            label="Academic department"
            placeholder="Researcher department"
            required
          />
          <label className="rp-field">
            <span>Research classification</span>
            <select name="classification" defaultValue="restricted">
              <option value="public">Public</option>
              <option value="restricted">Restricted</option>
              <option value="confidential">Confidential</option>
              <option value="ip_sensitive">IP-Sensitive</option>
            </select>
          </label>
          <TextField
            name="stage"
            label="Development stage"
            placeholder="e.g. Early research, validation, prototype"
            required
          />
          <TextArea
            className="wide"
            name="abstract"
            label="Internal research abstract"
            placeholder="Summarize the work for authorized institutional users"
            required
          />
          <TextArea
            className="wide"
            name="innovationSummary"
            label="Approved innovation summary"
            placeholder="Optional text for later public discovery. Full research material remains protected."
          />
          <TextArea
            className="wide"
            name="problem"
            label="Problem addressed"
            placeholder="Optional problem summary"
          />
          <TextField
            name="application"
            label="Potential application"
            placeholder="Optional"
          />
          <TextField
            name="collaboration"
            label="Collaboration sought"
            placeholder="Optional"
          />
        </div>
        {error && <div className="rp-error">{error}</div>}
        <footer>
          <span>
            <LockKeyhole /> Restricted files are not published by default.
          </span>
          <PrimaryButton disabled={busy}>
            {busy ? "Creating…" : "Create research record"} <ArrowRight />
          </PrimaryButton>
        </footer>
      </form>
    </>
  );
}

export function AccessPage({ owner = false }: { owner?: boolean }) {
  const [status, setStatus] = useState<
    "pending" | "approved" | "declined" | "expired" | undefined
  >("pending");
  const ownerPage = usePaginatedQuery(
    api.research.listOwnedAccessRequests,
    owner ? { status } : "skip",
    { initialNumItems: 25 },
  );
  const institutionalPage = usePaginatedQuery(
    api.research.listAccessRequests,
    owner ? "skip" : { status },
    { initialNumItems: 25 },
  );
  const page = owner ? ownerPage : institutionalPage;
  const decide = useMutation(api.research.decideAccess);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const { showToast } = useToast();
  const decideRequest = async (
    id: Id<"accessRequests">,
    decision: "approved" | "declined",
  ) => {
    setBusy(id);
    try {
      await decide({ id, decision });
      showToast({
        kind: "success",
        title: decision === "approved" ? "Limited access approved" : "Access request declined",
      });
    } catch (e) {
      const message = errorText(e);
      setError(message);
      showToast({ kind: "error", title: "Decision was not saved", detail: message });
    } finally {
      setBusy(null);
    }
  };
  return (
    <>
      <PageHeading
        eyebrow="DISCLOSURE GOVERNANCE"
        title={owner ? "Requests for my research" : "Access review queue"}
        detail={
          owner
            ? "Review purpose, organization, scope and duration before granting access to your protected research."
            : "Review purpose, organization, scope and duration before granting external access."
        }
      />
      <div className="rp-tabs">
        {(["pending", "approved", "declined", "expired"] as const).map((x) => (
          <button
            className={status === x ? "active" : ""}
            onClick={() => setStatus(x)}
            key={x}
          >
            {x}
          </button>
        ))}
      </div>
      {error && <div className="rp-error">{error}</div>}
      <section className="rp-request-list">
        {page.results.map((r: any) => (
          <article className="rp-panel rp-access-card" key={r._id}>
            <header>
              <span className="rp-avatar">
                {r.requesterName
                  .split(" ")
                  .map((x: string) => x[0])
                  .slice(0, 2)
                  .join("")}
              </span>
              <div>
                <strong>{r.requesterName}</strong>
                <small>
                  {r.requesterEmail} · {r.organization}
                </small>
              </div>
              <Badge tone={r.risk}>{r.risk} risk</Badge>
              <Badge tone={r.status}>{r.status}</Badge>
            </header>
            <div className="rp-access-details">
              <div>
                <small>Research requested</small>
                <strong>
                  {r.researchTitle} · {r.researchCode}
                </strong>
              </div>
              <div>
                <small>Stated purpose</small>
                <p>{r.purpose}</p>
              </div>
              <div>
                <small>Requested duration</small>
                <strong>
                  <Clock3 /> {r.durationHours} hours
                </strong>
              </div>
            </div>
            {r.status === "pending" && (
              <footer>
                <SecondaryButton
                  disabled={busy === r._id}
                  onClick={() => void decideRequest(r._id, "declined")}
                >
                  <XCircle /> Decline
                </SecondaryButton>
                <PrimaryButton
                  disabled={busy === r._id}
                  onClick={() => void decideRequest(r._id, "approved")}
                >
                  <CheckCircle2 />{" "}
                  {busy === r._id ? "Saving…" : "Approve limited access"}
                </PrimaryButton>
              </footer>
            )}
          </article>
        ))}
        {page.status === "LoadingFirstPage" && <Loading />}
        {page.results.length === 0 && page.status !== "LoadingFirstPage" && (
          <Empty
            title={`No ${status ?? ""} access requests`}
            detail="Requests will appear here when a researcher shares an approved discovery profile."
          />
        )}
        {page.status === "CanLoadMore" && (
          <button
            className="rp-secondary load-more"
            onClick={() => page.loadMore(25)}
          >
            Load more <ChevronDown />
          </button>
        )}
      </section>
    </>
  );
}
