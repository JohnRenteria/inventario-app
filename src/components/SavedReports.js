import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firesbase/config';

const SavedReports = ({ onSelectReport }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'inventory_reports'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reportsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReports(reportsData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const formatTimestamp = (timestamp) => {
    if (!timestamp || !timestamp.toDate) return 'Fecha no disponible';
    return timestamp.toDate().toLocaleString('es-CO');
  };

  if (loading) return <p>Cargando reportes...</p>;

  return (
    <div className="report-container">
      <h4>Reportes de Inventario Guardados</h4>
      <div className="report-list">
        <button onClick={() => onSelectReport(null)} className="report-button">Limpiar Selección</button>
        {reports.map(report => (
          <button key={report.id} onClick={() => onSelectReport(report)} className="report-button">
            Reporte del {formatTimestamp(report.createdAt)} (por {report.user})
          </button>
        ))}
      </div>
    </div>
  );
};

export default SavedReports;