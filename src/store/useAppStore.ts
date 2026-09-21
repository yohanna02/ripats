import { create } from "zustand";

export type ToastKind = "success" | "error" | "info" | "warning";

export type ToastInput = {
  title: string;
  detail?: string;
  kind?: ToastKind;
  duration?: number;
};

export type Toast = ToastInput & {
  id: number;
  kind: ToastKind;
};

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export type AuthRole =
  | "researcher"
  | "partner"
  | "supervisor"
  | "ip_officer"
  | "security_officer"
  | "administrator";

export type AuthProfile = {
  profileId: string;
  userId: string;
  email: string;
  displayName: string;
  role: AuthRole;
  department: string | null;
  institutionName: string;
  active: boolean;
};

type AppState = {
  authStatus: AuthStatus;
  authProfile: AuthProfile | null;
  isMobileNavigationOpen: boolean;
  workspaceSearch: string;
  isNotificationsOpen: boolean;
  toasts: Toast[];
  setMobileNavigationOpen: (open: boolean) => void;
  setWorkspaceSearch: (search: string) => void;
  setAuthState: (status: AuthStatus, profile?: AuthProfile | null) => void;
  toggleNotifications: () => void;
  setNotificationsOpen: (open: boolean) => void;
  showToast: (toast: ToastInput) => void;
  dismissToast: (id: number) => void;
};

export const useAppStore = create<AppState>((set, get) => ({
  authStatus: "loading",
  authProfile: null,
  isMobileNavigationOpen: false,
  workspaceSearch: "",
  isNotificationsOpen: false,
  toasts: [],
  setMobileNavigationOpen: (open) => set({ isMobileNavigationOpen: open }),
  setWorkspaceSearch: (search) => set({ workspaceSearch: search }),
  setAuthState: (authStatus, authProfile = null) =>
    set({ authStatus, authProfile }),
  toggleNotifications: () =>
    set((state) => ({ isNotificationsOpen: !state.isNotificationsOpen })),
  setNotificationsOpen: (isNotificationsOpen) => set({ isNotificationsOpen }),
  showToast: ({ kind = "info", duration = 5000, ...toast }) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    set((state) => ({
      toasts: [...state.toasts.slice(-3), { ...toast, kind, duration, id }],
    }));
    window.setTimeout(() => get().dismissToast(id), duration);
  },
  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
}));
