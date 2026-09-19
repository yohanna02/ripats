import type { ReactNode } from "react";
import { CheckCircle2, CircleAlert, Info, X, XCircle } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: CircleAlert,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const toasts = useAppStore((state) => state.toasts);
  const dismiss = useAppStore((state) => state.dismissToast);

  return (
    <>
      {children}
      <div className="rp-toast-region" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => {
          const Icon = icons[toast.kind];
          return (
            <article className={`rp-toast ${toast.kind}`} key={toast.id} role="status">
              <Icon aria-hidden="true" />
              <div>
                <strong>{toast.title}</strong>
                {toast.detail && <p>{toast.detail}</p>}
              </div>
              <button
                aria-label="Dismiss notification"
                onClick={() => dismiss(toast.id)}
                title="Dismiss notification"
              >
                <X />
              </button>
            </article>
          );
        })}
      </div>
    </>
  );
}
