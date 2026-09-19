import { useAppStore } from "../../store/useAppStore";

export type { ToastInput, ToastKind } from "../../store/useAppStore";

export function useToast() {
  const showToast = useAppStore((state) => state.showToast);
  return { showToast };
}
