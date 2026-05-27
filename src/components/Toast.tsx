import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

export function showToast(message: string, type: ToastMessage['type'] = 'info') {
  const event = new CustomEvent('show-toast', { detail: { message, type } });
  window.dispatchEvent(event);
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleToast = (e: Event) => {
      const { message, type } = (e as CustomEvent).detail;
      const id = Math.random().toString(36).substring(2, 9);
      
      setToasts((prev) => [...prev, { id, message, type }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3500);
    };

    window.addEventListener('show-toast', handleToast);
    return () => window.removeEventListener('show-toast', handleToast);
  }, []);

  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => {
        let bgColor = 'bg-[#0d0e11] border-blue-500/30 text-blue-400';
        let Icon = Info;
        if (toast.type === 'success') {
          bgColor = 'bg-[#0d0e11] border-emerald-500/30 text-emerald-400';
          Icon = CheckCircle2;
        } else if (toast.type === 'error') {
          bgColor = 'bg-[#0d0e11] border-rose-500/30 text-rose-400';
          Icon = AlertCircle;
        } else if (toast.type === 'warning') {
          bgColor = 'bg-[#0d0e11] border-amber-500/30 text-amber-400';
          Icon = AlertTriangle;
        }

        return (
          <div
            key={toast.id}
            className={`${bgColor} px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 text-sm font-medium animate-slide-in pointer-events-auto border backdrop-blur-md`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="text-gray-100">{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
}
