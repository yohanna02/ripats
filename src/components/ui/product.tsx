import type { ComponentType, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { Activity, ChevronRight, FileText, ShieldCheck } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { classificationNames } from "../../features/core/constants";
import { dateLabel } from "../../features/core/constants";
import type { Classification, Research } from "../../features/core/types";
import type { Id } from "../../../convex/_generated/dataModel";

export function Brand({ inverse = false }: { inverse?: boolean }) {
  return <Link to="/" className={`rp-brand ${inverse ? "inverse" : ""}`}><span><ShieldCheck /></span><b>RIPATS</b><small>ATBU</small></Link>;
}
export function Mark({ children, tone = "neutral" }: { children: ReactNode; tone?: string }) {
  return <span className={`rp-mark ${tone}`}>{children}</span>;
}
export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: string }) {
  return <span className={`rp-badge ${tone}`}>{children}</span>;
}
export function ClassificationBadge({ value }: { value: Classification }) {
  return <Badge tone={value}><i />{classificationNames[value]}</Badge>;
}
export function PrimaryButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={`rp-primary ${props.className ?? ""}`}>{children}</button>;
}
export function SecondaryButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={`rp-secondary ${props.className ?? ""}`}>{children}</button>;
}
export function TextField({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return <label className="rp-field"><span>{label}</span><input {...props} /></label>;
}
export function TextArea({ label, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return <label className="rp-field"><span>{label}</span><textarea {...props} /></label>;
}
export function Loading({ full = false }: { full?: boolean }) {
  return <div className={`rp-loading ${full ? "full" : ""}`}><span /><span /><span /></div>;
}
export function Empty({ title, detail }: { title: string; detail: string }) {
  return <div className="rp-empty"><FileText /><h3>{title}</h3><p>{detail}</p></div>;
}
export function PageHeading({ eyebrow, title, detail, action }: { eyebrow: string; title: string; detail: string; action?: ReactNode }) {
  return <header className="rp-page-heading"><div><span className="rp-eyebrow">{eyebrow}</span><h2>{title}</h2><p>{detail}</p></div>{action}</header>;
}
export function PanelHeader({ title, detail, action, children }: { title: string; detail: string; action?: ReactNode; children?: ReactNode }) {
  return <><header className="rp-panel-head"><div><h3>{title}</h3><p>{detail}</p></div>{action}</header>{children}</>;
}
export function MetricCard({ label, value, detail, Icon, tone = "green" }: { label: string; value: string | number; detail: string; Icon: ComponentType<{ className?: string }>; tone?: string }) {
  return <article className="rp-metric"><Mark tone={tone}><Icon /></Mark><div><small>{label}</small><strong>{value}</strong><span>{detail}</span></div></article>;
}
export function RecordRows({ rows, onOpen }: { rows: Research[]; onOpen?: (id: Id<"research">) => void }) {
  const location = useLocation();
  const workspace = location.pathname.startsWith("/admin") ? "/admin" : "/app";
  const archive = location.pathname.includes("/archive");
  return <div className="rp-record-list">{rows.map((row) => <Link key={row._id} to={onOpen ? "#" : `${workspace}/${archive ? "archive" : "research"}/${row._id}`} onClick={onOpen ? () => onOpen(row._id) : undefined} className="rp-record-row"><Mark tone="green"><FileText /></Mark><span><strong>{row.title}</strong><small>{row.researchId} · {row.field} · {row.department}</small></span><ClassificationBadge value={row.classification} /><Badge tone={row.status}>{row.status.replaceAll("_", " ")}</Badge><time>{dateLabel(row.updatedAt)}</time><ChevronRight /></Link>)}</div>;
}
export function AuditList({ events }: { events: Array<{ _id: string; action: string; detail: string; createdAt: number; outcome: string }> }) {
  return <div className="rp-audit-list">{events.map((event) => <article key={event._id}><span><Activity /></span><div><strong>{event.action.replaceAll(".", " · ")}</strong><p>{event.detail}</p><small>{dateLabel(event.createdAt)} · {event.outcome}</small></div></article>)}</div>;
}
