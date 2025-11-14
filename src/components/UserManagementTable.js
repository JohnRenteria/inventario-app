import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../firesbase/config';

import { useModal } from '../context/ModalContext';
import EditUserModal from './EditUserModal';

const UserManagementTable = () => {
  const [users, setUsers] = useState([]);
  const { showModal } = useModal();
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    // Filtramos para mostrar solo los usuarios activos
    const q = query(collection(db, 'users'), where('estado', '==', 'Activo'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setUsers(usersData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleEditUser = (user) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const handleDeleteUser = async (userId, userName) => {
    showModal({
      title: 'Confirmar Desactivación',
      message: `¿Estás seguro de que quieres desactivar al usuario ${userName}? El usuario no podrá iniciar sesión.`,
      type: 'confirm',
      onConfirm: async () => {
        try {
          const userRef = doc(db, 'users', userId);
          await updateDoc(userRef, { estado: 'Desactivado' });
          showModal({ title: 'Éxito', message: 'Usuario desactivado correctamente.' });
        } catch (error) {
          console.error("Error al desactivar el usuario:", error);
          showModal({ title: 'Error', message: 'Ocurrió un error al desactivar el usuario.' });
        }
      },
    });
  };

  if (loading) return <p>Cargando usuarios...</p>;

  return (
    <>
      <EditUserModal user={editingUser} isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} />
      <div className="config-section">
        <h3>Administración de Usuarios</h3>
        <div className="user-table-container">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Correo Electrónico</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.nombre} {user.apellido}</td>
                  <td>{user.rol}</td>
                <td>{user.estado || 'Activo'}</td>
                  <td>{user.email}</td>
                  <td className="actions-cell">
                    <button onClick={() => handleEditUser(user)} className="action-button edit-button">✏️</button>
                    <button onClick={() => handleDeleteUser(user.id, user.nombre)} className="action-button delete-button">🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default UserManagementTable;