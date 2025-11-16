import React from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firesbase/config';
import { doc, updateDoc } from 'firebase/firestore';
import './Configuracion.css';

const Configuracion = () => {
  const { userProfile } = useAuth();

  // Función para convertir la clave pública VAPID
  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const handleEnableNotifications = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Las notificaciones push no son soportadas por tu navegador.');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      const permission = await Notification.requestPermission();

      if (permission !== 'granted') {
        alert('Permiso para notificaciones denegado.');
        return;
      }

      // Reemplaza esta clave con tu CLAVE PÚBLICA VAPID
      const vapidPublicKey = 'YOUR_PUBLIC_KEY';
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });

      // Guardar la suscripción en el documento del usuario
      const userDocRef = doc(db, 'users', userProfile.uid);
      await updateDoc(userDocRef, {
        pushSubscription: JSON.parse(JSON.stringify(subscription)),
      });

      alert('¡Notificaciones activadas con éxito!');
    } catch (error) {
      console.error('Error al activar las notificaciones:', error);
      alert('Hubo un error al activar las notificaciones.');
    }
  };

  return (
    <div className="configuracion-container">
      <h2>Página de Configuración</h2>
      <p>Aquí se podrán ajustar las configuraciones de la aplicación.</p>
      <button onClick={handleEnableNotifications} className="save-button">
        Activar Notificaciones de Stock
      </button>
    </div>
  );
};

export default Configuracion;
