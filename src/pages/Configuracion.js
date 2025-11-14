import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import EditProfileModal from '../components/EditProfileModal';
import UserManagementTable from '../components/UserManagementTable';
import DeactivatedUsersTable from '../components/DeactivatedUsersTable';
import './Configuracion.css';

const Configuracion = () => {
  const { userProfile } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Solo los roles autorizados pueden ver la administración de usuarios
  const canManageUsers = userProfile && ['Jefe de Barra', 'Administradora'].includes(userProfile.rol);

  return (
    <>
      <EditProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} />

      <div className="config-section">
        <h3>Editar Perfil</h3>
        <p>Actualiza tu información personal.</p>
        <button className="config-button" onClick={() => setIsEditModalOpen(true)}>Editar Perfil</button>
      </div>

      {canManageUsers && <UserManagementTable />}
      {canManageUsers && <DeactivatedUsersTable />}
    </>
  );
};

export default Configuracion;