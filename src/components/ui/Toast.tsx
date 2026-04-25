'use client';

import { useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { create } from 'zustand';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (type: ToastType, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

let toastCounter = 0;

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (type, message, duration = 5000) => {
    const id = `toast_${++toastCounter}`;
    set((state) => ({
      toasts: [...state.toasts, { id, type, message, duration }].slice(-5),
    }));
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));

// Helper to use toasts from anywhere
export const toast = {
  success: (message: string) => useToastStore.getState().addToast('success', message),
  error: (message: string) => useToastStore.getState().addToast('error', message),
  warning: (message: string) => useToastStore.getState().addToast('warning', message),
  info: (message: string) => useToastStore.getState().addToast('info', message),
};

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const COLORS = {
  success: 'border-[#39FF14]/30 text-acid-green',
  error: 'border-[#FF003C]/30 text-error',
  warning: 'border-[#FFB800]/30 text-[#FFB800]',
  info: 'border-[#00BFFF]/30 text-[#00BFFF]',
};

function ToastItem({ toast: t }: { toast: Toast }) {
  const { removeToast } = useToastStore();

  useEffect(() => {
    if (t.duration) {
      const timer = setTimeout(() => removeToast(t.id), t.duration);
      return () => clearTimeout(timer);
    }
  }, [t.id, t.duration, removeToast]);

  const Icon = ICONS[t.type];

  return (
    <div
      role={t.type === 'error' ? 'alert' : 'status'}
      className={`flex items-center gap-2 px-3 py-2.5 bg-[#0A0A0A]/95 backdrop-blur-sm border ${COLORS[t.type]} shadow-[0_8px_32px_rgba(0,0,0,0.4)] toast-enter`}
    >
      <Icon size={12} aria-hidden="true" />
      <span className="text-meta font-mono flex-1">{t.message}</span>
      <button
        type="button"
        onClick={() => removeToast(t.id)}
        aria-label="Close notification"
        className="flex items-center justify-center w-6 h-6 -mr-1 text-muted-high hover:text-fg transition-colors duration-100 hover:scale-110 active:scale-90 focus-ring"
      >
        <X size={10} aria-hidden="true" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      style={{ zIndex: 'var(--z-toast)' }}
      className="fixed bottom-4 right-4 flex flex-col gap-2 max-w-sm"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}
