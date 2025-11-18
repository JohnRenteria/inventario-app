import React from 'react';
import './DownloadModal.css'; // Crearemos este archivo a continuación

const DownloadModal = ({ isOpen, onClose, onDownloadAsPdf, onDownloadAsImage }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content download-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h4>Descargar Inventario</h4>
          <button onClick={onClose} className="modal-close-button">&times;</button>
        </div>
        <div className="modal-body">
          <p>Selecciona el formato en el que deseas descargar el inventario completo.</p>
          <div className="download-options">
            <button onClick={onDownloadAsPdf} className="download-pdf-button">
              📄 Descargar como PDF
            </button>
            <button onClick={onDownloadAsImage} className="download-image-button">
              🖼️ Descargar como Imagen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DownloadModal;
