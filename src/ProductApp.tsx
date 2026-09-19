import { useEffect, useLayoutEffect } from "react";
import { useConvexAuth } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../convex/_generated/api";
import { AppRoutes } from "./routes/AppRoutes";
import { useAppStore, type AuthProfile } from "./store/useAppStore";

export default function ProductApp() {
  const auth = useConvexAuth();
  const me = useQuery(api.account.me, auth.isAuthenticated ? {} : "skip") as
    | AuthProfile
    | null
    | undefined;
  const location = useLocation();
  const navigate = useNavigate();
  const setAuthState = useAppStore((state) => state.setAuthState);

  useLayoutEffect(() => {
    if (auth.isLoading || (auth.isAuthenticated && me === undefined)) {
      setAuthState("loading");
      return;
    }
    if (!auth.isAuthenticated) {
      setAuthState("unauthenticated");
      return;
    }
    setAuthState("authenticated", me);
  }, [auth.isLoading, auth.isAuthenticated, me, setAuthState]);

  useEffect(() => {
    if (
      auth.isLoading ||
      !auth.isAuthenticated ||
      me === undefined ||
      !["/sign-in", "/sign-up"].includes(location.pathname)
    )
      return;
    if (!me) {
      navigate("/setup-account", { replace: true });
      return;
    }
    navigate(
      ["administrator", "ip_officer", "security_officer"].includes(me.role)
        ? "/admin"
        : "/app",
      { replace: true },
    );
  }, [auth.isLoading, auth.isAuthenticated, me, location.pathname, navigate]);

  return <AppRoutes />;
}
