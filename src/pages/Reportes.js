import React, { useState, useEffect } from 'react';
import StockAlerts from '../components/StockAlerts';
import SalesChart from '../components/SalesChart';
import DateRangeModal from '../components/DateRangeModal';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firesbase/config'; // Asegúrate que la ruta sea correcta
import { useAuth } from '../context/AuthContext';

const Reportes = () => {
  const { userProfile } = useAuth();
  const [dateRange, setDateRange] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('daily');
  const [highlightedDates, setHighlightedDates] = useState([]);

  useEffect(() => {
    const fetchReportDates = async () => {
      const reportsCollection = collection(db, 'inventory_reports');
      const reportsSnapshot = await getDocs(reportsCollection);
      const dates = reportsSnapshot.docs.map(doc => doc.data().reportDate.toDate());
      setHighlightedDates(dates);
    };

    fetchReportDates();
  }, []);

  const openModal = (mode) => {
    setModalMode(mode);
    setIsModalOpen(true);
  };

  // Verificamos si el usuario tiene permiso para ver esta página
  const canViewReports = userProfile && ['Jefe Administrativo', 'Administradora', 'Jefe de Barra'].includes(userProfile.rol);

  if (!canViewReports) {
    return (
      <div className="config-section">
        <h3>Acceso Denegado</h3>
        <p>No tienes permiso para ver esta sección.</p>
      </div>
    );
  }

  return (
    <div>
      <DateRangeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onGenerateReport={setDateRange}
        mode={modalMode}
        highlightedDates={highlightedDates}
      />
      <StockAlerts />

      <div className="report-container" style={{ marginTop: '2rem' }}>
        <h4>Reportes de Salidas</h4>
        <div className="report-options">
          <button onClick={() => openModal('daily')} className="report-button">Diario</button>
          <button onClick={() => openModal('weekly')} className="report-button">Semanal</button>
          <button onClick={() => openModal('monthly')} className="report-button">Mensual</button>
        </div>
        <div className="chart-container">
          <SalesChart dateRange={dateRange} />
        </div>
      </div>
    </div>
  );
};

export default Reportes;