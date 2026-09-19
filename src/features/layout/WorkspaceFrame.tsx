import { useEffect } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { Bell, BookOpen, CircleHelp, ClipboardCheck, Download, FolderArchive, KeyRound, LayoutDashboard, LibraryBig, LogIn, Menu, Search, ShieldCheck, Users } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { api } from "../../../convex/_generated/api";
import { roleNames } from "../core/constants";
import type { Profile } from "../core/types";
import { Brand, Loading } from "../../components/ui/product";
import { useAppStore } from "../../store/useAppStore";

export function WorkspaceFrame({ area }: { area: "app" | "admin" }) {
  const me = useQuery(api.account.me, {}) as Profile | null | undefined;
  const { signOut } = useAuthActions();
  const location = useLocation();
  const mobile = useAppStore((state) => state.isMobileNavigationOpen);
  const setMobile = useAppStore((state) => state.setMobileNavigationOpen);
  const search = useAppStore((state) => state.workspaceSearch);
  const setSearch = useAppStore((state) => state.setWorkspaceSearch);
  const notificationsOpen = useAppStore((state) => state.isNotificationsOpen);
  const toggleNotifications = useAppStore((state) => state.toggleNotifications);
  useEffect(() => { setMobile(false); }, [location.pathname, setMobile]);
  if (!me) return <Loading full />;
  const admin = area === "admin";
  const items = admin
    ? [["/admin", "Overview", LayoutDashboard], ...(me.role === "administrator" || me.role === "ip_officer" ? [["/admin/research", "Research registry", LibraryBig], ["/admin/archive", "Archive", FolderArchive], ["/admin/access", "Access reviews", KeyRound]] : []), ["/admin/security", "Security centre", ShieldCheck], ...(me.role === "administrator" ? [["/admin/users", "Users & roles", Users]] : []), ...(me.role === "administrator" || me.role === "ip_officer" ? [["/admin/reports", "Reports & exports", Download]] : []), ["/admin/documentation", "Documentation", BookOpen]]
    : [["/app", "My workspace", LayoutDashboard], ["/app/research", "My research", LibraryBig], ["/app/archive", "My archive", FolderArchive], ...(me.role === "researcher" ? [["/app/reviews", "Review requests", ClipboardCheck]] : []), ["/app/access", "Access requests", KeyRound], ["/app/documentation", "Documentation", BookOpen]];
  return <div className={`rp-product ${mobile ? "nav-open" : ""}`}>
    <aside className="rp-sidebar"><Brand /><div className="rp-institution"><span>AT</span><div><strong>ATBU</strong><small>{admin ? "Institution administration" : "Research workspace"}</small></div></div>
      <nav>{items.map(([path, label, Icon]) => { const NavigationIcon = Icon as typeof LayoutDashboard; return <Link key={path as string} className={location.pathname === path ? "active" : ""} to={path as string} onClick={() => setMobile(false)}><NavigationIcon />{label as string}</Link>; })}</nav>
      <div className="rp-side-bottom"><Link to={admin ? "/admin/documentation" : "/app/documentation"}><CircleHelp /> Help & guidance</Link><div><span className="rp-avatar">{me.displayName.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</span><div><strong>{me.displayName}</strong><small>{roleNames[me.role]}</small></div><button aria-label="Sign out" title="Sign out" onClick={() => void signOut()}><LogIn /></button></div></div>
    </aside>
    {mobile && <button className="rp-scrim" onClick={() => setMobile(false)} />}
    <div className="rp-main"><header className="rp-topbar"><button className="rp-menu" onClick={() => setMobile(true)} aria-label="Open navigation"><Menu /></button><div><small>{admin ? "INSTITUTIONAL WORKSPACE" : "RESEARCHER WORKSPACE"}</small><h1>{routeTitle(location.pathname)}</h1></div><div className="rp-top-actions"><label><Search /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search records" /><kbd>/</kbd></label><button title="Notifications" aria-expanded={notificationsOpen} onClick={toggleNotifications}><Bell /></button></div></header><main className="rp-content"><Outlet context={{ me, search }} /></main></div>
  </div>;
}

function routeTitle(path: string) {
  if (path.endsWith("/new")) return "Register research";
  if (/\/(research|archive)\/[^/]+/.test(path)) return "Research record";
  if (path.endsWith("/access")) return "Access requests";
  if (path.endsWith("/reviews")) return "Review requests";
  if (path.endsWith("/security")) return "Security centre";
  if (path.endsWith("/users")) return "Users & roles";
  if (path.endsWith("/reports")) return "Reports & exports";
  if (path.endsWith("/archive")) return "Research archive";
  if (path.endsWith("/documentation")) return "Documentation";
  return path.startsWith("/admin") ? "Institution overview" : "My workspace";
}
