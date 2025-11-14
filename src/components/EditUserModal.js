import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firesbase/config';
import { useAuth } from '../context/AuthContext';
import Modal from './Modal';
import { useModal } from '../context/ModalContext';

const roleLimits = {
  'Jefe Administrativo': 4,
  'Administradora': 1,
  'Jefe de Barra': 1,
  'Bartender': 1,
};

const EditUserModal = ({ user, isOpen, onClose }) => {
  const { userProfile } = useAuth(); // Para verificar el rol del admin
  const { showModal } = useModal();
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    celular: '',
    email: '',
    rol: '',
  });
  const [newPassword, setNewPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        nombre: user.nombre || '',
        apellido: user.apellido || '',
        celular: user.celular || '',
        email: user.email || '',
        rol: user.rol || '',
      });
      setNewPassword(''); // Limpiar el campo de contraseña cada vez que se abre
    }
  }, [user, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    const userRef = doc(db, 'users', user.id);

    try {
      await updateDoc(userRef, {
        nombre: formData.nombre,
        apellido: formData.apellido,
        celular: formData.celular,
        rol: formData.rol,
      });

      if (newPassword) {
        // NOTA DE SEGURIDAD: La actualización de la contraseña de otro usuario
        // debe realizarse a través de una Cloud Function con privilegios de administrador.
        showModal({ title: 'Aviso', message: `Contraseña para ${formData.nombre} actualizada (simulación). Se requiere una Cloud Function para la implementación real.` });
      }

      showModal({ title: 'Éxito', message: 'Usuario actualizado con éxito.' });
      onClose();
    } catch (error) {
      console.error("Error al actualizar el usuario:", error);
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

  const canChangePassword = userProfile && userProfile.rol === 'Jefe de Barra';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Editar Usuario: ${user?.nombre}`} footer={modalFooter}>
      <form className="register-fields-grid" style={{ padding: '0 1rem' }}>
        <div className="input-group">
          <label>Nombre</label>
          <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required />
        </div>
        <div className="input-group">
          <label>Apellido</label>
          <input type="text" name="apellido" value={formData.apellido} onChange={handleChange} required />
        </div>
        <div className="input-group">
          <label>Correo Electrónico</label>
          <input type="email" name="email" value={formData.email} disabled />
        </div>
        <div className="input-group">
          <label>Rol</label>
          <select name="rol" value={formData.rol} onChange={handleChange}>
            {Object.keys(roleLimits).map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>
        {canChangePassword && (
          <div className="input-group" style={{ gridColumn: '1 / -1' }}>
            <label>Nueva Contraseña (opcional)</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Dejar en blanco para no cambiar" />
          </div>
        )}
      </form>
    </Modal>
  );
};

export default EditUserModal;