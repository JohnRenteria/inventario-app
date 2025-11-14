import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firesbase/config'; // Asegúrate que la ruta sea correcta
import { doc, getDoc, collection, onSnapshot } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [isInventoryLocked, setIsInventoryLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [inventoryLoading, setInventoryLoading] = useState(true);

  useEffect(() => {
    // Listener para el estado de autenticación
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Si el usuario está autenticado, buscamos su perfil en Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUserProfile({ uid: user.uid, ...userDoc.data() });
        } else {
          console.error("No se encontró el documento del usuario en Firestore.");
          setUserProfile(null);
        }
      } else {
        // Si el usuario cierra sesión, limpiamos el perfil
        setUserProfile(null);
      }
      setAuthLoading(false);
    });

    // Listener para el inventario
    const unsubscribeInventory = onSnapshot(collection(db, 'inventory'), (snapshot) => {
      const inventoryData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setInventory(inventoryData);
      setInventoryLoading(false); // Marcamos que el inventario ha cargado
    });

    // Listener para el estado de bloqueo del inventario
    const statusRef = doc(db, 'app_status', 'inventoryLock');
    const unsubscribeStatus = onSnapshot(statusRef, (docSnap) => {
      if (docSnap.exists()) {
        setIsInventoryLocked(docSnap.data().isLocked);
      }
    });

    // Limpiar todos los listeners al desmontar
    return () => {
      unsubscribeAuth();
      unsubscribeInventory();
      unsubscribeStatus();
    };
  }, []);

  useEffect(() => {
    // El loading general termina solo cuando la autenticación y el inventario han cargado
    if (!authLoading && !inventoryLoading) {
      setLoading(false);
    }
  }, [authLoading, inventoryLoading]);

  const value = { currentUser, userProfile, inventory, loading, isInventoryLocked };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};