/* eslint-disable react-hooks/purity -- reporting dates are read only when users choose a period. */
import { useState } from "react";
import { useQuery } from "convex/react";
import {
  Activity,
  Download,
  Fingerprint,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { useToast } from "../../components/ui/toast";
import { Empty, Loading, MetricCard, PageHeading } from "../../components/ui/product";

const day = 24 * 60 * 60 * 1000;
const dateInput = (value: number) => new Date(value).toISOString().slice(0, 10);
const localDate = (value: string) => {
  const [year, month, date] = value.split("-").map(Number);
  return new Date(year, month - 1, date);
};
const startOfDay = (value: string) => localDate(value).getTime();
const endOfDay = (value: string) =>
  localDate(value).getTime() + day - 1;
const csvCell = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;

export default function Reports() {
  const [start, setStart] = useState(dateInput(Date.now() - 29 * day));
  const [end, setEnd] = useState(dateInput(Date.now()));
  const { showToast } = useToast();
  const report = useQuery(api.research.institutionReport, {
    startAt: startOfDay(start),
    endAt: endOfDay(end),
  });
  const periodLabel = `${start} to ${end}`;
  const selectRange = (range: "7d" | "30d" | "90d" | "ytd") => {
    const now = Date.now();
    const startAt =
      range === "ytd"
        ? Date.UTC(new Date().getUTCFullYear(), 0, 1)
        : now - (range === "7d" ? 6 : range === "30d" ? 29 : 89) * day;
    setStart(dateInput(startAt));
    setEnd(dateInput(now));
  };
  const exportCsv = () => {
    if (!report) return;
    const rows: unknown[][] = [
      ["RIPATS institutional report", periodLabel],
      ["Metric", "Count"],
      ["Research records updated", report.totals.research],
      ["Access requests", report.totals.accessRequests],
      ["Security alerts", report.totals.alerts],
      ["Audit events", report.totals.auditEvents],
      ["Denied events", report.totals.deniedEvents],
      [],
      ["Research classification", "Count"],
      ...Object.entries(report.classifications),
      [],
      ["Research status", "Count"],
      ...Object.entries(report.researchStatuses),
      [],
      ["Access request status", "Count"],
      ...Object.entries(report.accessRequests),
      [],
      ["Security alert severity", "Count"],
      ...Object.entries(report.alertsBySeverity),
      [],
      ["Department", "Research records"],
      ...Object.entries(report.departments),
      [],
      ["Recent audit activity", "Outcome", "Timestamp"],
      ...report.recentEvents.map((event) => [event.action, event.outcome, new Date(event.createdAt).toISOString()]),
    ];
    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `ripats-institution-report-${start}-${end}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    showToast({ kind: "success", title: "Report exported", detail: "The CSV includes institution-scoped research, access, security and audit totals." });
  };
  if (report === undefined) return <Loading />;
  if (!report) return <Empty title="Report unavailable" detail="The report could not be loaded for this date range." />;
  const maxDepartment = Math.max(1, ...Object.values(report.departments));
  return (
    <>
      <PageHeading
        eyebrow="INSTITUTIONAL INTELLIGENCE"
        title="Reports & exports"
        detail="Review research protection, disclosure decisions, security activity and academic-unit coverage."
        action={<button className="rp-primary" onClick={exportCsv}><Download /> Export CSV</button>}
      />
      <section className="rp-panel rp-report-controls">
        <div className="rp-report-presets" aria-label="Report period">
          {(["7d", "30d", "90d", "ytd"] as const).map((range) => (
            <button key={range} onClick={() => selectRange(range)}>
              {range === "ytd" ? "Year to date" : `Last ${range.slice(0, -1)} days`}
            </button>
          ))}
        </div>
        <label className="rp-field"><span>From</span><input type="date" value={start} max={end} onChange={(event) => setStart(event.target.value)} /></label>
        <label className="rp-field"><span>To</span><input type="date" value={end} min={start} max={dateInput(Date.now())} onChange={(event) => setEnd(event.target.value)} /></label>
        <span className="rp-report-period">{periodLabel}</span>
      </section>
      <section className="rp-metrics">
        <MetricCard label="Research records" value={report.totals.research} detail="Updated during period" Icon={ShieldCheck} />
        <MetricCard label="Access requests" value={report.totals.accessRequests} detail="All decisions in period" Icon={KeyRound} tone="gold" />
        <MetricCard label="Security alerts" value={report.totals.alerts} detail={`${report.alertsBySeverity.high} high severity`} Icon={ShieldAlert} tone="red" />
        <MetricCard label="Integrity events" value={report.totals.auditEvents} detail={`${report.totals.deniedEvents} denied actions`} Icon={Fingerprint} tone="blue" />
      </section>
      <div className="rp-report-grid">
        <section className="rp-panel">
          <header className="rp-panel-head"><div><h3>Research by classification</h3><p>Records updated within the selected period</p></div></header>
          <div className="rp-report-breakdown">
            {Object.entries(report.classifications).map(([name, value]) => <div key={name}><span>{name.replaceAll("_", " ")}</span><strong>{value}</strong><i style={{ width: `${Math.max(2, (value / Math.max(1, report.totals.research)) * 100)}%` }} /></div>)}
          </div>
        </section>
        <section className="rp-panel">
          <header className="rp-panel-head"><div><h3>Disclosure outcomes</h3><p>Access request decisions</p></div></header>
          <div className="rp-report-breakdown">
            {Object.entries(report.accessRequests).map(([name, value]) => <div key={name}><span>{name}</span><strong>{value}</strong><i style={{ width: `${Math.max(2, (value / Math.max(1, report.totals.accessRequests)) * 100)}%` }} /></div>)}
          </div>
        </section>
        <section className="rp-panel">
          <header className="rp-panel-head"><div><h3>Academic-unit coverage</h3><p>Records by department</p></div></header>
          {Object.keys(report.departments).length ? <div className="rp-report-breakdown">{Object.entries(report.departments).sort((a, b) => b[1] - a[1]).map(([name, value]) => <div key={name}><span>{name}</span><strong>{value}</strong><i style={{ width: `${Math.max(2, (value / maxDepartment) * 100)}%` }} /></div>)}</div> : <Empty title="No department activity" detail="Research records will appear after updates in this period." />}
        </section>
        <section className="rp-panel">
          <header className="rp-panel-head"><div><h3>Recent audit activity</h3><p><Activity /> Latest institution-scoped events</p></div></header>
          {report.recentEvents.length ? <div className="rp-report-events">{report.recentEvents.map((event, index) => <article key={`${event.createdAt}-${index}`}><strong>{event.action.replaceAll(".", " · ")}</strong><span>{event.outcome}</span><time>{new Date(event.createdAt).toLocaleString("en-NG")}</time></article>)}</div> : <Empty title="No audit activity" detail="Audit events for this period will appear here." />}
        </section>
      </div>
    </>
  );
}
