import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../../../convex/_generated/api";
import { errorText, isInstitutionalRole } from "../core/constants";
import type { Profile } from "../core/types";
import { Brand, PrimaryButton, TextField } from "../../components/ui/product";
import { useToast } from "../../components/ui/toast";
export function SetupAccount() {
  const me = useQuery(api.account.me, {}) as Profile | null | undefined;
  const ensure = useMutation(api.account.ensureProfile);
  const nav = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [department, setDepartment] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { showToast } = useToast();
  useEffect(() => {
    if (me)
      nav(isInstitutionalRole(me.role) ? "/admin" : "/app", { replace: true });
  }, [me, nav]);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await ensure({ displayName, department: department || undefined });
      showToast({
        kind: "success",
        title: "Profile created",
        detail: "Your RIPATS workspace is ready.",
      });
      nav("/app");
    } catch (err) {
      const message = errorText(err);
      setError(message);
      showToast({ kind: "error", title: "Profile setup failed", detail: message });
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="rp-setup">
      <Brand />
      <form onSubmit={submit}>
        <span className="rp-eyebrow">ATBU workspace setup</span>
        <h1>Set up your RIPATS profile.</h1>
        <p>
          Choose your display name and academic unit. Your role will be assigned
          according to your account and institutional permissions.
        </p>
        <TextField
          label="Display name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
        />
        <TextField
          label="Department or unit"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
        />
        {error && <div className="rp-error">{error}</div>}
        <PrimaryButton disabled={busy}>
          Complete setup <ArrowRight />
        </PrimaryButton>
      </form>
    </main>
  );
}

export function SetupAdminPage() {
  const bootstrap = useMutation(api.account.bootstrapAdministrator);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const nav = useNavigate();
  const { showToast } = useToast();
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await bootstrap({ code, displayName: name });
      showToast({ kind: "success", title: "Administrator configured" });
      nav("/admin");
    } catch (err) {
      const message = errorText(err);
      setError(message);
      showToast({ kind: "error", title: "Administrator setup failed", detail: message });
    }
  };
  return (
    <main className="rp-setup">
      <Brand />
      <form onSubmit={submit}>
        <span className="rp-eyebrow">INITIAL INSTITUTION SETUP</span>
        <h1>Configure ATBU administration.</h1>
        <p>
          This setup is limited to the email and one-time code configured for
          the first ATBU administrator.
        </p>
        <TextField
          label="Administrator display name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <TextField
          label="One-time setup code"
          type="password"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
        />
        {error && <div className="rp-error">{error}</div>}
        <PrimaryButton>
          Configure administrator <ArrowRight />
        </PrimaryButton>
      </form>
    </main>
  );
}
