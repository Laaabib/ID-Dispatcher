import React from 'react';
import { Button } from './button';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  confirmVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

export function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, confirmText = "Confirm", confirmVariant = "destructive" }: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-sm overflow-hidden p-6 animate-in fade-in zoom-in-95 duration-200">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button variant={confirmVariant} onClick={onConfirm}>{confirmText}</Button>
        </div>
      </div>
    </div>
  );
}
