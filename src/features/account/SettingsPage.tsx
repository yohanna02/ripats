import { useState, type FormEvent } from "react";
import { useMutation } from "convex/react";
import { Check, LockKeyhole, Save } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { errorText, roleNames } from "../core/constants";
import { useAppStore } from "../../store/useAppStore";
import { useToast } from "../../components/ui/toast";
import { Badge, PageHeading, PanelHeader, PrimaryButton, TextField } from "../../components/ui/product";

export default function SettingsPage() {
  const profile = useAppStore((state) => state.authProfile);
  const updateProfile = useMutation(api.account.updateProfile);
  const { showToast } = useToast();
  const [displayName, setDisplayName] = useState(() => profile?.displayName ?? "");
  const [department, setDepartment] = useState(() => profile?.department ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!profile) return null;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await updateProfile({
        displayName,
        department: department.trim() || undefined,
      });
      showToast({ kind: "success", title: "Profile settings saved" });
    } catch (cause) {
      const message = errorText(cause);
      setError(message);
      showToast({ kind: "error", title: "Profile settings were not saved", detail: message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeading
        eyebrow="ACCOUNT SETTINGS"
        title="Profile & settings"
        detail="Keep your RIPATS identity and academic unit information current."
      />
      <section className="rp-settings-grid">
        <form className="rp-panel rp-form" onSubmit={submit}>
          <PanelHeader title="Profile details" detail="This information appears in institutional activity." />
          <div className="rp-settings-avatar">
            <span className="rp-avatar large">{profile.displayName.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</span>
            <div><strong>{profile.displayName}</strong><small>{roleNames[profile.role]}</small></div>
          </div>
          <TextField label="Display name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} required />
          <TextField label="Email address" value={profile.email} readOnly />
          <TextField label="Department or unit" value={department} onChange={(event) => setDepartment(event.target.value)} />
          {error && <div className="rp-error">{error}</div>}
          <PrimaryButton disabled={busy}>{busy ? "Saving…" : "Save profile"} <Save /></PrimaryButton>
        </form>
        <aside className="rp-panel">
          <PanelHeader title="Account protection" detail="Authentication and access status" />
          <div className="rp-settings-status"><LockKeyhole /><div><strong>Email verified</strong><p>Your Convex Auth account is active and protected.</p></div><Badge tone="green"><Check /> Active</Badge></div>
          <div className="rp-settings-status"><LockKeyhole /><div><strong>Workspace role</strong><p>Role changes are managed by RIPATS administrators.</p></div><Badge tone="blue">{roleNames[profile.role]}</Badge></div>
        </aside>
      </section>
    </>
  );
}
