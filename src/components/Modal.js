import React from 'react';
import './Modal.css';

const Modal = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h4>{title}</h4>
          <button onClick={onClose} className="modal-close-button">&times;</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
        {footer ? (
          <div className="modal-footer">{footer}</div>
        ) : (
          <div className="modal-footer"><button onClick={onClose} className="modal-ok-button">Aceptar</button></div>
        )}
      </div>
    </div>
  );
};

export default Modal;