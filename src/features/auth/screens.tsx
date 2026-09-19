import { useState, type FormEvent } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { ArrowLeft, ArrowRight, LockKeyhole } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Brand, PrimaryButton, TextField } from "../../components/ui/product";
import { errorText } from "../core/constants";
import { useToast } from "../../components/ui/toast";
export function AuthPage({ mode }: { mode: "sign-in" | "sign-up" }) {
  const { signIn } = useAuthActions();
  const { showToast } = useToast();
  const nav = useNavigate();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verification, setVerification] = useState(false);
  const [code, setCode] = useState("");
  const [resetMode, setResetMode] = useState<"request" | "verify" | null>(null);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    const normalizedEmail = email.trim().toLowerCase();
    try {
      if (resetMode === "request") {
        await signIn("password", { flow: "reset", email: normalizedEmail });
        setResetMode("verify");
        setCode("");
        return;
      }
      if (resetMode === "verify") {
        await signIn("password", {
          flow: "reset-verification",
          email: normalizedEmail,
          code,
          newPassword: password,
        });
        setResetMode(null);
        setCode("");
        setPassword("");
        setError("Password updated. Sign in with your new password.");
        showToast({
          kind: "success",
          title: "Password updated",
          detail: "Sign in with your new password.",
        });
        return;
      }
      const result = verification
        ? await signIn("password", {
            flow: "email-verification",
            email: normalizedEmail,
            code,
          })
        : await signIn(
            "password",
            mode === "sign-up"
              ? { flow: "signUp", name, email: normalizedEmail, password }
              : { flow: "signIn", email: normalizedEmail, password },
          );
      if (result.signingIn) {
        if (mode === "sign-up") nav("/setup-account");
      } else if (mode === "sign-up" && !verification) {
        setVerification(true);
        showToast({
          kind: "info",
          title: "Verification code sent",
          detail: "Check your email to complete account creation.",
        });
      }
    } catch (err) {
      const message = errorText(err);
      setError(message);
      showToast({ kind: "error", title: "Authentication failed", detail: message });
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="rp-auth">
      <aside>
        <Brand inverse />
        <div>
          <span className="rp-eyebrow">ATBU Research Protection</span>
          <h1>
            {mode === "sign-up"
              ? "Give your research a trusted record."
              : "Your research workspace, securely."}
          </h1>
          <p>
            RIPATS protects research provenance and creates an accountable path
            to responsible collaboration.
          </p>
        </div>
        <small>Research Innovation, Patent and Tracking System</small>
      </aside>
      <section>
        <Link to="/" className="rp-back">
          <ArrowLeft /> Back to RIPATS
        </Link>
        <form onSubmit={submit}>
          <span className="rp-eyebrow">
            {mode === "sign-up" ? "Create account" : "Secure workspace"}
          </span>
          <h2>
            {verification
              ? "Verify your email"
              : mode === "sign-up"
                ? "Join RIPATS"
                : "Sign in"}
          </h2>
          <p>
            {resetMode === "request"
              ? "Enter the email address associated with your RIPATS account."
              : resetMode === "verify"
                ? "Enter the reset code and choose a new password."
                : verification
                  ? "Enter the one-time code sent to your email address."
                  : mode === "sign-up"
                    ? "Use an email address you can verify to create your account."
                    : "Enter your account credentials to continue."}
          </p>
          {mode === "sign-up" && !verification && !resetMode && (
            <TextField
              label="Full name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}
          <TextField
            label="Email address"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={verification}
          />
          {verification || resetMode === "verify" ? (
            <TextField
              label={resetMode === "verify" ? "Password reset code" : "Email verification code"}
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          ) : resetMode ? null : (
            <TextField
              label="Password"
              type="password"
              autoComplete={
                mode === "sign-up" ? "new-password" : "current-password"
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          )}
          {resetMode === "verify" && (
            <TextField
              label="New password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          )}
          {error && <div className="rp-error">{error}</div>}
          <PrimaryButton disabled={busy}>
            {busy
              ? "Please wait…"
              : resetMode
                ? resetMode === "request"
                  ? "Send reset code"
                  : "Update password"
                : verification
                ? "Verify email"
                : mode === "sign-up"
                  ? "Create account"
                  : "Sign in"}{" "}
            <ArrowRight />
          </PrimaryButton>
          {verification && (
            <button
              type="button"
              className="rp-text-link "
              onClick={() => {
                setVerification(false);
                setCode("");
              }}
            >
              Use a different address
            </button>
          )}
          {!verification && mode === "sign-in" && !resetMode && (
            <button
              type="button"
              className="rp-text-link"
              onClick={() => {
                setError("");
                setResetMode("request");
              }}
            >
              Forgot password?
            </button>
          )}
          {resetMode && (
            <button
              type="button"
              className="rp-text-link"
              onClick={() => {
                setResetMode(null);
                setCode("");
                setError("");
              }}
            >
              Return to sign in
            </button>
          )}
          <div className="rp-auth-switch">
            {mode === "sign-up" ? (
              <>
                Already registered? <Link to="/sign-in">Sign in</Link>
              </>
            ) : (
              <>
                New to RIPATS? <Link to="/sign-up">Create an account</Link>
              </>
            )}
          </div>
          <small className="rp-auth-note">
            <LockKeyhole /> Your password is protected by Convex Auth. RIPATS
            administrators cannot view it.
          </small>
        </form>
      </section>
    </main>
  );
}
