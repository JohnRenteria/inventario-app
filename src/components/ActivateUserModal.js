import React, { useState, useEffect } from 'react';
import { doc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firesbase/config';
import Modal from './Modal';

const roleLimits = {
  'Jefe Administrativo': 4,
  'Administradora': 1,
  'Jefe de Barra': 1,
  'Bartender': 1,
};

const ActivateUserModal = ({ user, isOpen, onClose }) => {
  const [newRol, setNewRol] = useState('');
  const [availableRoles, setAvailableRoles] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAvailableRoles = async () => {
      if (!isOpen) return;

      const usersCollection = collection(db, 'users');
      const userSnapshot = await getDocs(usersCollection);
      const usersList = userSnapshot.docs.map(doc => doc.data());

      const roleCounts = {};
      for (const roleName in roleLimits) {
        roleCounts[roleName] = usersList.filter(u => u.rol === roleName && u.estado === 'Activo').length;
      }

      const availability = {};
      for (const roleName in roleLimits) {
        availability[roleName] = roleCounts[roleName] < roleLimits[roleName];
      }
      setAvailableRoles(availability);
      setNewRol(user?.rol || ''); // Preseleccionar el rol actual
    };

    fetchAvailableRoles();
  }, [isOpen, user]);

  const handleActivate = async () => {
    if (!user || !newRol) {
      setError('Debes seleccionar un rol para el usuario.');
      return;
    }

    if (!availableRoles[newRol] && newRol !== user.rol) {
        setError('El rol seleccionado ya no está disponible.');
        return;
    }

    setIsSaving(true);
    setError('');
    const userRef = doc(db, 'users', user.id);

    try {
      await updateDoc(userRef, {
        estado: 'Activo',
        rol: newRol,
      });
      alert('Usuario reactivado y rol actualizado con éxito.');
      onClose();
    } catch (err) {
      console.error("Error al reactivar el usuario:", err);
      alert('Ocurrió un error al reactivar el usuario.');
    } finally {
      setIsSaving(false);
    }
  };

  const modalFooter = (
    <div className="edit-modal-footer">
      <button onClick={onClose} className="cancel-button">Cancelar</button>
      <button onClick={handleActivate} className="save-button" disabled={isSaving}>
        {isSaving ? 'Reactivando...' : 'Reactivar Usuario'}
      </button>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Reactivar a ${user?.nombre}`} footer={modalFooter}>
      <div className="input-group" style={{ padding: '0 1rem' }}>
        <label>Asignar nuevo rol:</label>
        <select value={newRol} onChange={(e) => setNewRol(e.target.value)}>
          <option value="" disabled>Selecciona un rol</option>
          {/* Mostrar el rol actual del usuario aunque no esté disponible */}
          {user && !availableRoles[user.rol] && <option key={user.rol} value={user.rol}>{user.rol} (Actual)</option>}
          {Object.keys(availableRoles).map(role => (
            availableRoles[role] && <option key={role} value={role}>{role}</option>
          ))}
        </select>
        {error && <p style={{ color: 'red', marginTop: '0.5rem' }}>{error}</p>}
      </div>
    </Modal>
  );
};

export default ActivateUserModal;