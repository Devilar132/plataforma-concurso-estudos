import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import './ConfirmDialog.css';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirmar', cancelText = 'Cancelar', variant = 'danger' }) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="confirm-dialog-overlay" onClick={handleBackdropClick}>
      <div className="confirm-dialog">
        <div className="confirm-dialog-header">
          <div className="confirm-dialog-icon-wrapper">
            <AlertCircle className={`confirm-dialog-icon ${variant}`} size={24} />
          </div>
          <h3 className="confirm-dialog-title">{title}</h3>
          <button onClick={onClose} className="confirm-dialog-close">
            <X size={20} />
          </button>
        </div>
        <div className="confirm-dialog-body">
          <p>{message}</p>
        </div>
        <div className="confirm-dialog-footer">
          <button onClick={onClose} className="btn btn-secondary">
            {cancelText}
          </button>
          <button onClick={onConfirm} className={`btn btn-${variant}`}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
