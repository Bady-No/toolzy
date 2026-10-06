import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const TOAST_DURATION_MS = 4500;

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 end-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none p-4"
      role="status"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        let icon = <Info className="w-5 h-5 text-indigo-500 shrink-0" />;
        let borderColor = 'border-indigo-500/25';
        let barColor = 'bg-indigo-500';

        if (toast.type === 'success') {
          icon = <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
          borderColor = 'border-emerald-500/35';
          barColor = 'bg-emerald-500';
        } else if (toast.type === 'error') {
          icon = <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />;
          borderColor = 'border-rose-500/35';
          barColor = 'bg-rose-500';
        } else if (toast.type === 'warning') {
          icon = <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />;
          borderColor = 'border-amber-500/35';
          barColor = 'bg-amber-500';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto relative overflow-hidden flex items-start gap-3 p-4 pe-3 rounded-2xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border ${borderColor} shadow-pop animate-in fade-in-up`}
          >
            {icon}
            <div className="flex-1 min-w-0">
              <h5 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                {toast.title}
              </h5>
              {toast.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                  {toast.description}
                </p>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Auto-dismiss countdown */}
            <span
              className={`toast-progress ${barColor} opacity-60`}
              style={{ animationDuration: `${TOAST_DURATION_MS}ms` }}
              aria-hidden="true"
            />
          </div>
        );
      })}
    </div>
  );
};
