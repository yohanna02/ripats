const sessionStorageKey = "ripats.access-request-session";

function sessionId() {
  const existing = window.sessionStorage.getItem(sessionStorageKey);
  if (existing) return existing;
  const value = crypto.randomUUID();
  window.sessionStorage.setItem(sessionStorageKey, value);
  return value;
}

export function accessRequestContext() {
  return {
    sessionId: sessionId(),
    sourcePath: window.location.pathname,
    referrer: document.referrer || undefined,
    userAgent: navigator.userAgent,
    platform: navigator.platform || "unknown",
    locale: navigator.language || "unknown",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "unknown",
    channel: "web" as const,
  };
}
