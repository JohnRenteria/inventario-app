import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Usaremos esto para la redirección
import { auth, db } from './config'; // Asegúrate que este archivo exporte auth y db
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, getDocs, setDoc, doc } from 'firebase/firestore';
import './Login.css'; // Reutilizaremos los estilos de Login
import { useModal } from '../context/ModalContext';

const roleLimits = {
  'Jefe Administrativo': 4,
  'Administradora': 1,
  'Jefe de Barra': 1,
  'Bartender': 1,
};

const Register = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    rol: '',
    celular: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [isLoadingRoles, setIsLoadingRoles] = useState(true); // Carga inicial de roles
  const [isSubmitting, setIsSubmitting] = useState(false); // Carga durante el envío
  const [availableRoles, setAvailableRoles] = useState({});
  const { showModal } = useModal();
  const navigate = useNavigate();

  // useEffect para cargar los roles disponibles al montar el componente
  useEffect(() => {
    const fetchUsersAndSetRoles = async () => {
      setIsLoadingRoles(true);
      setError('');
      try {
        const usersCollection = collection(db, 'users');
        const userSnapshot = await getDocs(usersCollection);
        const usersList = userSnapshot.docs.map(doc => doc.data());
  
        const roleCounts = {};
        for (const roleName in roleLimits) {
          // Contamos solo los roles de usuarios que están activos
          roleCounts[roleName] = usersList.filter(user => user.rol === roleName && user.estado === 'Activo').length;
        }
  
        const availability = {};
        for (const roleName in roleLimits) {
          availability[roleName] = roleCounts[roleName] < roleLimits[roleName];
        }
        setAvailableRoles(availability);
      } catch (err) {
        console.error("Error al cargar los roles:", err);
        setError("No se pudieron cargar los roles. Revisa la conexión.");
      } finally {
        setIsLoadingRoles(false); // Finalizamos la carga, con o sin errores.
      }
    };

    fetchUsersAndSetRoles();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Limpiar errores previos

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (!formData.rol) {
      setError('Debes seleccionar un rol.');
      return;
    }

    // Nueva validación: Comprobar si el rol seleccionado está disponible
    // Usamos el estado 'availableRoles' que ya tenemos calculado.
    if (availableRoles[formData.rol] === false) {
      setError('El rol ya está seleccionado, por favor elige otro.');
      return;
    }

    try {
      setIsSubmitting(true); // Inicia el estado de envío
      // 1. Crear el usuario en Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // 2. Guardar la información adicional en Firestore
      // Usamos el UID del usuario como ID del documento para una fácil vinculación
      await setDoc(doc(db, 'users', user.uid), {
        nombre: formData.nombre,
        apellido: formData.apellido,
        email: formData.email,
        rol: formData.rol,
        celular: formData.celular,
        estado: 'Activo', // Asignamos el estado por defecto
      });

      // 3. Redirigir al Login
      showModal({ title: 'Éxito', message: '¡Usuario registrado con éxito!' });
      navigate('/login');

    } catch (error) {
      console.error("Error al registrar el usuario:", error);
      if (error.code === 'auth/email-already-in-use') {
        setError('Este correo electrónico ya está en uso.');
      } else if (error.code === 'auth/invalid-email') {
        setError('El formato del correo electrónico no es válido.');
      } else if (error.code === 'auth/weak-password') {
        setError('La contraseña debe tener al menos 6 caracteres.');
      } else {
        setError('Ocurrió un error al registrar el usuario.');
      }
    } finally {
      setIsSubmitting(false); // Finaliza el estado de envío, con o sin error
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>Crear Cuenta</h2>
        <p className="form-subtitle">Completa tus datos para registrarte</p>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <div className="register-fields-grid">
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
            <input type="email" name="email" value={formData.email} onChange={handleChange} required />
          </div>
          <div className="input-group">
            <label>Rol</label>
            <select name="rol" value={formData.rol} onChange={handleChange} required>
              <option value="" disabled>Selecciona un rol</option>
              {Object.keys(availableRoles).map(role => (
                availableRoles[role] && (
                  <option key={role} value={role}>{role}</option>
                )
              ))}
            </select>
          </div>
          <div className="input-group">
            <label>Celular</label>
            <input type="tel" name="celular" value={formData.celular} onChange={handleChange} />
          </div>
          <div className="input-group">
            <label>Contraseña</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required />
          </div>
          <div className="input-group">
            <label>Confirmar Contraseña</label>
            <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required />
          </div>
        </div>

        <div className="form-buttons-container">
          <button type="button" className="back-button" onClick={() => navigate(-1)} disabled={isSubmitting}>Volver</button>
          <button type="submit" className="login-button" disabled={isLoadingRoles || isSubmitting}>{isSubmitting ? 'Registrando...' : 'Registrarse'}</button>
        </div>
      </form>
    </div>
  );
};

export default Register;
