
import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  onClose: () => void;
  type?: 'success' | 'info';
}

const Toast: React.FC<ToastProps> = ({ message, onClose, type = 'success' }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-emerald-600' : 'bg-indigo-600';

  return (
    <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:right-4 ${bgColor} text-white px-6 py-3 rounded-full shadow-2xl flex items-center space-x-3 z-[100] animate-bounce-in min-w-[220px] justify-center`}>
      {type === 'success' ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
        </svg>
      )}
      <span className="text-[11px] font-black uppercase tracking-wider">{message}</span>
    </div>
  );
};

export default Toast;
