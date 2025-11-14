import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firesbase/config';
import ActivateUserModal from './ActivateUserModal';

const DeactivatedUsersTable = () => {
  const [deactivatedUsers, setDeactivatedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isActivateModalOpen, setIsActivateModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'users'), where('estado', '==', 'Desactivado'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDeactivatedUsers(usersData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleActivateClick = (user) => {
    setSelectedUser(user);
    setIsActivateModalOpen(true);
  };

  if (loading) return null; // No mostrar nada mientras carga
  if (deactivatedUsers.length === 0) return null; // No mostrar la tabla si no hay usuarios desactivados

  return (
    <>
      <ActivateUserModal user={selectedUser} isOpen={isActivateModalOpen} onClose={() => setIsActivateModalOpen(false)} />
      <div className="config-section">
        <h3>Usuarios Desactivados</h3>
        <div className="user-table-container">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Rol</th>
                <th>Correo Electrónico</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {deactivatedUsers.map(user => (
                <tr key={user.id}>
                  <td>{user.nombre} {user.apellido}</td>
                  <td>{user.rol}</td>
                  <td>{user.email}</td>
                  <td>
                    <button onClick={() => handleActivateClick(user)} className="action-button" style={{color: '#28a745'}}>Reactivar</button>
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

export default DeactivatedUsersTable;