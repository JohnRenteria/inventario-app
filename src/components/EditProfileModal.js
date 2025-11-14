import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firesbase/config';
import { useAuth } from '../context/AuthContext';
import Modal from './Modal'; // Reutilizaremos el componente Modal

import { useModal } from '../context/ModalContext';

const EditProfileModal = ({ isOpen, onClose }) => {
  const { userProfile } = useAuth();
  const { showModal } = useModal();
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    celular: '',
    email: '',
    rol: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setFormData({
        nombre: userProfile.nombre || '',
        apellido: userProfile.apellido || '',
        celular: userProfile.celular || '',
        email: userProfile.email || '',
        rol: userProfile.rol || '',
      });
    }
  }, [userProfile, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSave = async () => {
    if (!userProfile) return;

    setIsSaving(true);
    const userRef = doc(db, 'users', userProfile.uid);

    try {
      await updateDoc(userRef, {
        nombre: formData.nombre,
        apellido: formData.apellido,
        celular: formData.celular,
      });
      showModal({ title: 'Éxito', message: 'Perfil actualizado con éxito.' });
      onClose();
    } catch (error) {
      console.error("Error al actualizar el perfil:", error);
      showModal({ title: 'Error', message: 'Ocurrió un error al guardar los cambios.' });
    } finally {
      setIsSaving(false);
    }
  };

  const modalFooter = (
    <div className="edit-modal-footer">
      <button onClick={onClose} className="cancel-button">Cancelar</button>
      <button onClick={handleSave} className="save-button" disabled={isSaving}>
        {isSaving ? 'Guardando...' : 'Guardar Cambios'}
      </button>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Perfil" footer={modalFooter}>
      <form className="register-fields-grid" style={{padding: '0 1rem'}}>
        <div className="input-group">
          <label>Nombre</label>
          <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required />
        </div>
        <div className="input-group">
          <label>Apellido</label>
          <input type="text" name="apellido" value={formData.apellido} onChange={handleChange} required />
        </div>
        <div className="input-group" style={{gridColumn: '1 / -1'}}>
          <label>Celular</label>
          <input type="tel" name="celular" value={formData.celular} onChange={handleChange} />
        </div>
        <div className="input-group">
          <label>Correo Electrónico</label>
          <input type="email" name="email" value={formData.email} disabled />
        </div>
        <div className="input-group">
          <label>Rol</label>
          <input type="text" name="rol" value={formData.rol} disabled />
        </div>
      </form>
    </Modal>
  );
};

export default EditProfileModal;