// components/Toast.jsx
// Global toast notification system for WAF events
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { cn } from "../lib/utils";

const ToastContext = createContext(null);

const ICONS = {
  critical: "🔴",
  high: "🟠",
  medium: "🟡",
  low: "🟢",
  success: "✓",
  info: "ℹ",
  error: "✕",
};

const STYLES = {
  critical: "border-accent-red/40 bg-[#1a0a0a]",
  high: "border-accent-orange/40 bg-[#1a110a]",
  medium: "border-accent-yellow/40 bg-[#1a180a]",
  low: "border-accent-green/40 bg-[#0a1a10]",
  success: "border-accent-green/40 bg-[#0a1a10]",
  info: "border-accent-blue/40 bg-[#0a0f1a]",
  error: "border-accent-red/40 bg-[#1a0a0a]",
};

const BAR_COLOR = {
  critical: "bg-accent-red",
  high: "bg-accent-orange",
  medium: "bg-accent-yellow",
  low: "bg-accent-green",
  success: "bg-accent-green",
  info: "bg-accent-blue",
  error: "bg-accent-red",
};

const TEXT_COLOR = {
  critical: "text-red-400",
  high: "text-orange-400",
  medium: "text-yellow-400",
  low: "text-green-400",
  success: "text-green-400",
  info: "text-blue-400",
  error: "text-red-400",
};

let _uid = 0;

function ToastItem({ toast, onRemove }) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    // Slide in
    requestAnimationFrame(() => setVisible(true));
    // Auto-dismiss
    timerRef.current = setTimeout(() => dismiss(), toast.duration || 5000);
    return () => clearTimeout(timerRef.current);
  }, []);

  function dismiss() {
    setLeaving(true);
    setTimeout(() => onRemove(toast.id), 350);
  }

  const type = toast.type || "info";

  return (
    <div
      onClick={dismiss}
      className={cn(
        "relative flex items-start gap-3 w-80 rounded-xl border p-4 cursor-pointer select-none overflow-hidden",
        "transition-all duration-350 ease-out",
        STYLES[type] || STYLES.info,
        visible && !leaving
          ? "opacity-100 translate-x-0"
          : "opacity-0 translate-x-8",
      )}
      style={{ transition: "opacity 0.35s ease, transform 0.35s ease" }}
    >
      {/* Left accent bar */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl",
          BAR_COLOR[type],
        )}
      />

      {/* Progress bar at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/5 overflow-hidden rounded-b-xl">
        <div
          className={cn("h-full", BAR_COLOR[type])}
          style={{
            animation: `toastProgress ${toast.duration || 5000}ms linear forwards`,
            opacity: 0.5,
          }}
        />
      </div>

      {/* Icon */}
      <div className={cn("text-base flex-shrink-0 mt-0.5", TEXT_COLOR[type])}>
        {ICONS[type] || "ℹ"}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {toast.title && (
          <div
            className={cn(
              "text-xs font-mono font-bold uppercase tracking-wider mb-0.5",
              TEXT_COLOR[type],
            )}
          >
            {toast.title}
          </div>
        )}
        <div className="text-xs text-gray-300 leading-relaxed break-all">
          {toast.message}
        </div>
        {toast.sub && (
          <div className="text-[10px] font-mono text-gray-600 mt-1 truncate">
            {toast.sub}
          </div>
        )}
      </div>

      {/* Close */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          dismiss();
        }}
        className="flex-shrink-0 text-gray-600 hover:text-gray-400 text-sm leading-none mt-0.5"
      >
        ×
      </button>

      <style>{`
        @keyframes toastProgress {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback(
    ({ type = "info", title, message, sub, duration = 5000 }) => {
      const id = ++_uid;
      setToasts((t) => [...t, { id, type, title, message, sub, duration }]);
      // Keep max 5
      setToasts((t) => (t.length > 5 ? t.slice(-5) : t));
      return id;
    },
    [],
  );

  const remove = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ push, remove }}>
      {children}
      {/* Toast container — bottom-right */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 items-end pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onRemove={remove} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be inside ToastProvider");
  return ctx;
}
