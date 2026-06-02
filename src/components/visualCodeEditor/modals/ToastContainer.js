import React from 'react';

const ToastContainer = ({ toasts }) =>
  toasts.length > 0 ? (
    <div id="toast-container" className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-visible toast-${toast.type}`}>
          {toast.message}
        </div>
      ))}
    </div>
  ) : null;

export default ToastContainer;
