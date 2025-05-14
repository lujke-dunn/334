import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getToastStyles = () => {
    const baseStyles = {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '16px 24px',
      borderRadius: '8px',
      color: 'white',
      fontWeight: '500',
      fontSize: '14px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
      zIndex: 9999,
      animation: 'slideIn 0.3s ease-out',
      minWidth: '300px',
      maxWidth: '500px'
    };

    switch (type) {
      case 'success':
        return { ...baseStyles, backgroundColor: '#10b981' };
      case 'error':
        return { ...baseStyles, backgroundColor: '#ef4444' };
      case 'info':
        return { ...baseStyles, backgroundColor: '#3b82f6' };
      case 'warning':
        return { ...baseStyles, backgroundColor: '#f59e0b' };
      default:
        return { ...baseStyles, backgroundColor: '#6b7280' };
    }
  };

  return createPortal(
    <div style={getToastStyles()}>
      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>{message}</span>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '18px',
            cursor: 'pointer',
            marginLeft: '16px',
            padding: '4px',
            borderRadius: '4px',
          }}
        >
          ×
        </button>
      </div>
    </div>,
    document.body
  );
};

export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const ToastContainer = () => (
    <>
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </>
  );

  return { showToast, ToastContainer };
};