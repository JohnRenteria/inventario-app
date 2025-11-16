import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firesbase/config';
import { doc, updateDoc, writeBatch } from 'firebase/firestore';
import './Notifications.css';

const Notifications = () => {
  const { notifications } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const count = notifications.filter(n => !n.read).length;
    setUnreadCount(count);
  }, [notifications]);

  const formatTimestamp = (timestamp) => {
    if (!timestamp || !timestamp.toDate) return '';
    const date = timestamp.toDate();
    return date.toLocaleString('es-CO', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  // Nueva función para marcar una notificación como leída
  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      const notifRef = doc(db, 'notifications', notification.id);
      try {
        await updateDoc(notifRef, { read: true });
      } catch (error) {
        console.error("Error al marcar la notificación como leída:", error);
      }
    }
    // Aquí podrías añadir lógica para navegar a una página relacionada si la notificación tuviera un link.
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;

    const batch = writeBatch(db);
    notifications.forEach(n => {
      if (!n.read) {
        const notifRef = doc(db, 'notifications', n.id);
        batch.update(notifRef, { read: true });
      }
    });

    try {
      await batch.commit();
    } catch (error) {
      console.error("Error al marcar todas las notificaciones como leídas:", error);
    }
  };

  // Ordenamos las notificaciones para mostrar las más nuevas primero.
  const sortedNotifications = [...notifications].sort((a, b) => {
    const dateA = a.timestamp?.toDate() || 0;
    const dateB = b.timestamp?.toDate() || 0;
    return dateB - dateA; // Orden descendente
  });

  // Función para obtener el título del grupo ("Hoy", "Ayer", etc.)
  const getGroupTitle = (dateString) => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const todayString = today.toISOString().split('T')[0];
    const yesterdayString = yesterday.toISOString().split('T')[0];

    if (dateString === todayString) return 'Hoy';
    if (dateString === yesterdayString) return 'Ayer';

    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('es-CO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  // Agrupamos las notificaciones por día
  const groupedNotifications = sortedNotifications.reduce((acc, notification) => {
    const date = notification.timestamp?.toDate();
    if (!date) return acc;

    const dateKey = date.toISOString().split('T')[0]; // "YYYY-MM-DD"

    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(notification);
    return acc;
  }, {});

  return (
    <div className="notifications-container">
      <button onClick={handleToggle} className="notification-bell">
        <span>&#128276;</span> {/* Bell icon */}
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notifications-dropdown">
          <div className="notifications-header">
            <h4>Notificaciones</h4>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllAsRead} className="mark-all-read-button">
                Marcar todas como leídas
              </button>
            )}
          </div>
          {Object.keys(groupedNotifications).length > 0 ? (
            <ul className="notifications-list">
              {Object.keys(groupedNotifications).map(dateKey => (
                <React.Fragment key={dateKey}>
                  <li className="notification-group-header">
                    {getGroupTitle(dateKey)}
                  </li>
                  {groupedNotifications[dateKey].map(n => (
                    <li key={n.id} className={!n.read ? 'unread' : ''} onClick={() => handleNotificationClick(n)}>
                      <p>{n.message}</p>
                      <small>{formatTimestamp(n.timestamp)}</small>
                    </li>
                  ))}
                </React.Fragment>
              ))}
            </ul>
          ) : (
            <p className="no-notifications">No tienes notificaciones</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Notifications;