import React, { useState, useEffect } from 'react';
import './Toast.css';
import ToastService from './ToastService';

export const toastContext = React.createContext();

const Toast = ({ message, type, duration = 3000, onClose }) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (!message) return;
    
    const timer = setTimeout(() => {
      setIsClosing(true);
      setTimeout(() => onClose(), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div className={`toast toast-${type} ${isClosing ? 'toast-closing' : ''}`}>
      <div className="toast-content">
        <span className="toast-icon">
          {type === 'success' && '✓'}
          {type === 'error' && '✕'}
          {type === 'warning' && '⚠'}
          {type === 'info' && 'ℹ'}
        </span>
        <span className="toast-message">{message}</span>
      </div>
      <div className="toast-progress"></div>
    </div>
  );
};

export const useToast = () => {
  const context = React.useContext(toastContext);
  if (!context) {
    throw new Error('useToast phải được sử dụng trong ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'info', duration = 3000) => {
    const id = Date.now();
    const newToast = { id, message, type, duration };
    setToasts((prev) => [...prev, newToast]);
    return id;
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const value = {
    success: (msg, duration) => showToast(msg, 'success', duration),
    error: (msg, duration) => showToast(msg, 'error', duration),
    warning: (msg, duration) => showToast(msg, 'warning', duration),
    info: (msg, duration) => showToast(msg, 'info', duration),
  };

  // Subscribe to external ToastService (for non-React callers)
  useEffect(() => {
    const unsub = ToastService.on(({ type, message, duration }) => {
      const id = Date.now();
      const newToast = { id, message, type, duration };
      setToasts((prev) => [...prev, newToast]);
    });
    return unsub;
  }, []);

  return (
    <toastContext.Provider value={value}>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </toastContext.Provider>
  );
};

export default Toast;
