import { useEffect, useRef } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import { Bell, BookOpen, Check, CircleHelp, Download, KeyRound, LayoutDashboard, LibraryBig, LogIn, Menu, Search, Settings, ShieldCheck, Users, X } from "lucide-react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { roleNames } from "../core/constants";
import type { Profile } from "../core/types";
import { Brand, Loading } from "../../components/ui/product";
import { useAppStore } from "../../store/useAppStore";
import { useToast } from "../../components/ui/toast";

export function WorkspaceFrame({ area }: { area: "app" | "admin" }) {
  const authStatus = useAppStore((state) => state.authStatus);
  const authProfile = useAppStore((state) => state.authProfile) as Profile | null;
  const notifications = useQuery(api.research.myNotifications, {}) as Array<{
    _id: string;
    researchId?: string;
    title: string;
    detail: string;
    kind: string;
    relatedAccessRequestId?: string;
    actionRoute?: string;
    actionRequired?: boolean;
    createdAt: number;
    readAt?: number;
  }> | undefined;
  const markNotificationsRead = useMutation(api.research.markNotificationsRead);
  const decideAccess = useMutation(api.research.decideAccess);
  const { signOut } = useAuthActions();
  const location = useLocation();
  const navigate = useNavigate();
  const mobile = useAppStore((state) => state.isMobileNavigationOpen);
  const setMobile = useAppStore((state) => state.setMobileNavigationOpen);
  const search = useAppStore((state) => state.workspaceSearch);
  const setSearch = useAppStore((state) => state.setWorkspaceSearch);
  const notificationsOpen = useAppStore((state) => state.isNotificationsOpen);
  const toggleNotifications = useAppStore((state) => state.toggleNotifications);
  const setNotificationsOpen = useAppStore((state) => state.setNotificationsOpen);
  const notificationRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();
  const handleSignOut = async () => {
    await signOut();
    navigate("/", { replace: true });
  };
  useEffect(() => { setMobile(false); }, [location.pathname, setMobile]);
  useEffect(() => {
    if (!notificationsOpen) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!notificationRef.current?.contains(event.target as Node))
        setNotificationsOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [notificationsOpen, setNotificationsOpen]);
  if (authStatus === "loading") return <Loading full />;
  if (!authProfile) return null;
  const me = authProfile;
  const admin = area === "admin";
  const items = admin
    ? [["/admin", "Overview", LayoutDashboard], ...(me.role === "administrator" || me.role === "ip_officer" ? [["/admin/research", "Research registry", LibraryBig], ["/admin/access", "Access reviews", KeyRound]] : []), ["/admin/security", "Security centre", ShieldCheck], ...(me.role === "administrator" ? [["/admin/users", "Users & roles", Users]] : []), ...(me.role === "administrator" || me.role === "ip_officer" ? [["/admin/reports", "Reports & exports", Download]] : []), ["/admin/profile", "Profile & settings", Settings], ["/admin/documentation", "Documentation", BookOpen]]
    : [["/app", "My workspace", LayoutDashboard], ["/app/research", "My research", LibraryBig], ["/app/reviews", "Review requests", KeyRound], ["/app/access", "Access requests", KeyRound], ["/app/profile", "Profile & settings", Settings], ["/app/documentation", "Documentation", BookOpen]];
  const unreadCount = notifications?.filter((item) => !item.readAt).length ?? 0;
  const markOneRead = (id: string) => void markNotificationsRead({ ids: [id as Id<"notifications">] });
  const decideNotification = async (id: string, decision: "approved" | "declined") => {
    try {
      await decideAccess({ id: id as Id<"accessRequests">, decision });
      showToast({ kind: decision === "approved" ? "success" : "warning", title: decision === "approved" ? "Access approved" : "Access declined" });
      const notification = notifications?.find((item) => item.relatedAccessRequestId === id);
      if (notification) markOneRead(notification._id);
    } catch (error) {
      showToast({ kind: "error", title: "Decision was not saved", detail: error instanceof Error ? error.message : "Try again." });
    }
  };
  return <div className={`rp-product ${mobile ? "nav-open" : ""}`}>
    <aside className="rp-sidebar"><Brand /><div className="rp-institution"><span>AT</span><div><strong>ATBU</strong><small>{admin ? "Institution administration" : "Research workspace"}</small></div></div>
      <nav>{items.map(([path, label, Icon]) => { const NavigationIcon = Icon as typeof LayoutDashboard; return <Link key={path as string} className={location.pathname === path ? "active" : ""} to={path as string} onClick={() => setMobile(false)}><NavigationIcon />{label as string}</Link>; })}</nav>
      <div className="rp-side-bottom"><Link to={admin ? "/admin/documentation" : "/app/documentation"}><CircleHelp /> Help & guidance</Link><div><span className="rp-avatar">{me.displayName.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</span><div><strong>{me.displayName}</strong><small>{roleNames[me.role]}</small></div><button aria-label="Sign out" title="Sign out" onClick={() => void handleSignOut()}><LogIn /></button></div></div>
    </aside>
    {mobile && <button className="rp-scrim" onClick={() => setMobile(false)} />}
    <div className="rp-main"><header className="rp-topbar"><button className="rp-menu" onClick={() => setMobile(true)} aria-label="Open navigation"><Menu /></button><div><small>{admin ? "INSTITUTIONAL WORKSPACE" : "RESEARCHER WORKSPACE"}</small><h1>{routeTitle(location.pathname)}</h1></div><div className="rp-top-actions"><label><Search /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search records" /><kbd>/</kbd></label><div className="rp-notification-wrap" ref={notificationRef}><button title="Notifications" aria-expanded={notificationsOpen} onClick={() => toggleNotifications()}><Bell />{unreadCount > 0 && <i />}{unreadCount > 0 && <span className="rp-notification-count">{unreadCount > 9 ? "9+" : unreadCount}</span>}</button>{notificationsOpen && <div className="rp-notification-popover"><strong>Notifications {unreadCount > 0 ? `· ${unreadCount} new` : ""}</strong>{notifications?.length ? notifications.slice(0, 8).map((item) => <article className={!item.readAt ? "unread" : ""} key={item._id}><Link to={item.actionRoute ?? (item.researchId ? `/app/research/${item.researchId}` : "/app")} onClick={() => { markOneRead(item._id); setNotificationsOpen(false); }}><b>{item.title}</b><p>{item.detail}</p></Link>{item.actionRequired && item.relatedAccessRequestId && <div className="rp-notification-actions"><button title="Approve request" onClick={() => void decideNotification(item.relatedAccessRequestId!, "approved")}><Check /></button><button title="Decline request" onClick={() => void decideNotification(item.relatedAccessRequestId!, "declined")}><X /></button></div>}</article>) : <p>No notifications yet.</p>}</div>}</div></div></header><main className="rp-content"><Outlet context={{ me, search }} /></main></div>
  </div>;
}

function routeTitle(path: string) {
  if (path.endsWith("/new")) return "Register research";
  if (/\/research\/[^/]+/.test(path)) return "Research record";
  if (path.endsWith("/access")) return "Access requests";
  if (path.endsWith("/security")) return "Security centre";
  if (path.endsWith("/users")) return "Users & roles";
  if (path.endsWith("/reports")) return "Reports & exports";
  if (path.endsWith("/profile")) return "Profile & settings";
  if (path.endsWith("/documentation")) return "Documentation";
  return path.startsWith("/admin") ? "Institution overview" : "My workspace";
}
