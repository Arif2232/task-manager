import React, { useState } from 'react';
import { Plus } from 'lucide-react';

interface TodoInputProps {
  onAdd: (title: string) => Promise<boolean>;
  disabled?: boolean;
}

export const TodoInput: React.FC<TodoInputProps> = ({ onAdd, disabled = false }) => {
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();

    if (!trimmed) {
      setValidationError('Please enter a task description.');
      return;
    }

    setValidationError(null);
    setIsSubmitting(true);
    const success = await onAdd(trimmed);
    setIsSubmitting(false);

    if (success) {
      setTitle('');
    }
  };

  return (
    <div className="space-y-1">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <input
          type="text"
          aria-label="New task"
          value={title}
          disabled={disabled || isSubmitting}
          onChange={(e) => {
            setTitle(e.target.value);
            if (validationError) setValidationError(null);
          }}
          placeholder="What needs to be done? Press Enter to add..."
          className={`w-full pl-4 pr-24 py-3.5 bg-white dark:bg-slate-800/90 border ${
            validationError
              ? 'border-rose-400 dark:border-rose-500 focus:ring-rose-400'
              : 'border-slate-200 dark:border-slate-700/80 focus:border-indigo-500 focus:ring-indigo-500/20'
          } rounded-2xl shadow-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-4 transition-all`}
        />
        <button
          type="submit"
          disabled={disabled || isSubmitting || !title.trim()}
          className="absolute right-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center space-x-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <Plus className="w-4 h-4" />
          <span>Add</span>
        </button>
      </form>
      {validationError && (
        <p className="text-xs text-rose-500 dark:text-rose-400 pl-2">{validationError}</p>
      )}
    </div>
  );
};
