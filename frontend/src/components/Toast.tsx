import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ToastProps {
  message: string | null;
  onDismiss: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onDismiss }) => {
  if (!message) return null;

  return (
    <div role="alert" className="flex items-center justify-between p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-xs shadow-sm transition-all animate-in fade-in">
      <div className="flex items-center space-x-2 mr-2">
        <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 dark:text-rose-400" />
        <span className="font-medium">{message}</span>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss error"
        className="p-1 rounded-md text-rose-500 hover:text-rose-800 dark:hover:text-rose-100 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
