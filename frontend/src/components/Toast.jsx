import React from 'react';

export default function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`toast ${toast.type === 'success' ? 'success' : toast.type === 'error' ? 'error' : ''}`}>
      {toast.message}
    </div>
  );
}
