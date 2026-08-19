// Lightweight toast system (context + hook). No external deps.
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ToastKind = "info" | "success" | "error";
interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  detail?: string;
}

interface ToastCtx {
  push: (kind: ToastKind, title: string, detail?: string) => void;
}

const MAX_TOASTS = 3;

const Ctx = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);
  const lastKey = useRef<string>("");
  const lastAt = useRef<number>(0);

  const push = useCallback((kind: ToastKind, title: string, detail?: string) => {
    // Dedupe: ignore an identical toast fired within 4s (prevents render loops
    // and repeated wallet errors from stacking).
    const key = `${kind}:${title}:${detail ?? ""}`;
    const now =
      typeof performance !== "undefined" ? performance.now() : seq.current;
    if (key === lastKey.current && now - lastAt.current < 4000) return;
    lastKey.current = key;
    lastAt.current = now;

    const id = ++seq.current;
    setToasts((t) => [...t, { id, kind, title, detail }].slice(-MAX_TOASTS));
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 5000);
  }, []);

  // Stable context value so consumers' effects don't re-fire every render.
  const value = useMemo(() => ({ push }), [push]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="toast-wrap">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.kind}`}>
            <div className="toast-title">{t.title}</div>
            {t.detail && <div className="toast-detail">{t.detail}</div>}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
