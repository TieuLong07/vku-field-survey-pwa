import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-16 inset-x-4 sm:bottom-6 sm:right-6 sm:inset-x-auto z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const getStyle = () => {
    switch (toast.type) {
      case 'success':
        return {
          bg: 'bg-emerald-500 text-white',
          icon: <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
        };
      case 'warning':
        return {
          bg: 'bg-amber-500 text-white',
          icon: <AlertTriangle className="w-5 h-5 flex-shrink-0" />
        };
      case 'error':
        return {
          bg: 'bg-rose-500 text-white',
          icon: <XCircle className="w-5 h-5 flex-shrink-0" />
        };
      default:
        return {
          bg: 'bg-[#0054A6] text-white',
          icon: <Info className="w-5 h-5 flex-shrink-0" />
        };
    }
  };

  const { bg, icon } = getStyle();

  return (
    <div
      className={`pointer-events-auto flex items-start gap-2.5 p-3.5 rounded-2xl shadow-xl ${bg} animate-in slide-in-from-bottom-5 duration-300`}
    >
      <div className="pt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-bold leading-tight">{toast.title}</h4>
        {toast.description && (
          <p className="text-[11px] opacity-90 mt-0.5 leading-snug">{toast.description}</p>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="opacity-70 hover:opacity-100 p-0.5 -mr-1 -mt-1 transition"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
