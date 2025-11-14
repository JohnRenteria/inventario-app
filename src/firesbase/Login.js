import React, { useState } from 'react';
import './Login.css';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, db } from './config';
import { useModal } from '../context/ModalContext';
import { doc, getDoc } from 'firebase/firestore';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { showModal } = useModal();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault(); // Evita que la página se recargue

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Verificar el estado del usuario en Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists() && userDoc.data().estado === 'Desactivado') {
        // Si el usuario está desactivado, cerramos su sesión y mostramos un error.
        await signOut(auth);
        showModal({ title: 'Acceso Denegado', message: 'Tu cuenta ha sido desactivada. Contacta al administrador.' });
        
        // Simulación de la notificación al Jefe de Barra
        console.log(`NOTIFICACIÓN: El usuario desactivado ${email} intentó iniciar sesión.`);
        // Aquí iría la lógica para enviar una notificación real (ej. a una colección 'notifications' en Firestore).

      } else {
        // Si está activo o no se encuentra el estado, permite el ingreso.
        navigate('/homepage');
      }
    } catch (err) {
      console.error("Error al iniciar sesión:", err.code);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        showModal({ title: 'Error de Autenticación', message: 'Correo o contraseña incorrectos.' });
      } else {
        showModal({ title: 'Error', message: 'Ocurrió un error al iniciar sesión.' });
      }
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>Iniciar Sesión</h2>
        <p className="form-subtitle">Bienvenido al sistema de inventario</p>
        
        <div className="input-group">
          <label htmlFor="email">Correo Electrónico</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="input-group">
          <label htmlFor="password">Contraseña</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="login-button">Ingresar</button>
        <p className="form-subtitle" style={{ marginTop: '15px' }}>
          ¿No tienes una cuenta? <Link to="/register">Regístrate aquí</Link>
        </p>
      </form>
    </div>
  );
};

export default Login;