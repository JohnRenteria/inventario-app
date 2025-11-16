import React from 'react';
import { useNavigate, NavLink, Outlet } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firesbase/config';
import { useAuth } from '../context/AuthContext';
import './Homepage.css'; // Crearemos este archivo para los estilos

const Homepage = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  // Definimos los permisos para ver el enlace de reportes
  const canViewReports = userProfile && ['Jefe Administrativo', 'Administradora', 'Jefe de Barra'].includes(userProfile.rol);

  return (
    <div className="homepage-container">
      <header className="homepage-header">
        <div className="header-welcome">
          <h1>Inventario Al Aire Rooftop</h1>
        </div>
        <div className="header-user-actions">
          {userProfile && <p>Bienvenido, {userProfile.nombre} {userProfile.apellido}</p>}
          <button onClick={handleLogout} className="logout-button">Cerrar Sesión</button>
        </div>
      </header>
      <nav className="homepage-nav">
        <NavLink to="/homepage" end className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>Inicio</NavLink>
        {canViewReports && <NavLink to="reportes" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>Reporte</NavLink>}
        <NavLink to="configuracion" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>Configuración</NavLink>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default Homepage;