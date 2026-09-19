import { useAuthActions, useConvexAuth } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { api } from "../../../convex/_generated/api";
import { isInstitutionalRole } from "../core/constants";
import type { Profile, Role } from "../core/types";
import { Loading } from "../../components/ui/product";

export function RouteGuard({ roles, needsProfile = true }: { roles?: Role[]; needsProfile?: boolean }) {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const me = useQuery(api.account.me, isAuthenticated ? {} : "skip") as Profile | null | undefined;
  const location = useLocation();
  if (isLoading || me === undefined) return <Loading full />;
  if (!isAuthenticated) return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />;
  if (me && !me.active) return <SuspendedAccount />;
  if (needsProfile && !me) return <Navigate to={location.pathname === "/setup-administrator" ? "/setup-administrator" : "/setup-account"} replace />;
  if (!needsProfile && me) return <Navigate to={isInstitutionalRole(me.role) ? "/admin" : "/app"} replace />;
  if (roles && me && !roles.includes(me.role)) return <Navigate to={isInstitutionalRole(me.role) ? "/admin" : "/app"} replace />;
  return <Outlet />;
}

function SuspendedAccount() {
  const { signOut } = useAuthActions();
  return <main className="rp-config-screen"><div><span className="rp-eyebrow">ACCOUNT ACCESS</span><h1>This account has been suspended.</h1><p>Contact your university RIPATS administrator to restore access.</p><button className="rp-secondary" onClick={() => void signOut()}>Sign out</button></div></main>;
}
