import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firesbase/config';

import EditUserModal from '../components/EditUserModal';

const UserManagementTable = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
    if (window.confirm(`¿Estás seguro de que quieres eliminar al usuario ${userName}? Esta acción es irreversible.`)) {
      try {
        // Elimina el documento del usuario en Firestore
        await deleteDoc(doc(db, 'users', userId));
        alert('Usuario eliminado de la base de datos. La eliminación de la autenticación requiere una función de backend.');
        // NOTA DE SEGURIDAD: Eliminar un usuario de Firebase Auth desde el cliente
        // es inseguro y requiere privilegios de administrador.
        // La forma correcta es llamar a una Firebase Cloud Function que se encargue de esta operación.
      } catch (error) {
        console.error("Error al eliminar el usuario:", error);
        alert("Ocurrió un error al eliminar el usuario.");
      }
    }
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
                <th>Correo Electrónico</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.nombre} {user.apellido}</td>
                  <td>{user.rol}</td>
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