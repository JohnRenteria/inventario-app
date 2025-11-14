import React, { createContext, useState, useContext, useCallback } from 'react';
import Modal from '../components/Modal';

const ModalContext = createContext();

export const useModal = () => {
  return useContext(ModalContext);
};

export const ModalProvider = ({ children }) => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    type: 'alert', // 'alert' o 'confirm'
  });

  const showModal = useCallback(({ title, message, onConfirm, type = 'alert' }) => {
    setModalState({ isOpen: true, title, message, onConfirm, type });
  }, []);

  const hideModal = useCallback(() => {
    setModalState({ isOpen: false, title: '', message: '', onConfirm: null, type: 'alert' });
  }, []);

  const handleConfirm = () => {
    if (modalState.onConfirm) {
      modalState.onConfirm();
    }
    hideModal();
  };

  const modalFooter = (
    <div className="edit-modal-footer">
      {modalState.type === 'confirm' && (
        <button onClick={hideModal} className="cancel-button">
          Cancelar
        </button>
      )}
      <button onClick={handleConfirm} className="save-button">
        Aceptar
      </button>
    </div>
  );

  return (
    <ModalContext.Provider value={{ showModal }}>
      {children}
      <Modal
        isOpen={modalState.isOpen}
        onClose={hideModal}
        title={modalState.title}
        footer={modalFooter}
      >
        <p style={{padding: '0 1rem'}}>{modalState.message}</p>
      </Modal>
    </ModalContext.Provider>
  );
};