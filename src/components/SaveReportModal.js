import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../firesbase/config';
import Modal from './Modal';
import { useModal } from '../context/ModalContext';

const SaveReportModal = ({ isOpen, onClose, inventory, user }) => {
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const { showModal } = useModal();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!reportDate) {
      setError('Por favor, selecciona una fecha para el reporte.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      // Corregimos el manejo de la fecha para evitar problemas de zona horaria
      const [year, month, day] = reportDate.split('-').map(num => parseInt(num, 10));
      // Creamos la fecha en UTC al mediodía para evitar el desfase por la zona horaria del cliente.
      // Esto asegura que la fecha siempre caiga en el día correcto, sin importar la zona horaria.
      const selectedDateUTC = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

      // 1. Check if a report for this date already exists
      const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
      const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

      const reportsRef = collection(db, 'inventory_reports');
      const q = query(reportsRef, where('reportDate', '>=', startOfDay), where('reportDate', '<=', endOfDay));
      const existingReports = await getDocs(q);

      if (!existingReports.empty) {
        setError('Ya existe un reporte para esta fecha. Por favor, elige otra.');
        setIsSaving(false);
        return;
      }

      // 2. Save the new report
      await addDoc(collection(db, 'inventory_reports'), {
        reportDate: selectedDateUTC,
        createdAt: serverTimestamp(),
        user: `${user.nombre} ${user.apellido}`,
        inventorySnapshot: inventory,
      });

      // 3. Lock the inventory movements
      const statusRef = doc(db, 'app_status', 'inventoryLock');
      await setDoc(statusRef, { isLocked: true }, { merge: true });

      showModal({ title: 'Éxito', message: 'Inventario guardado y reporte generado con éxito.' });
      onClose();
    } catch (err) {
      console.error("Error al guardar el reporte:", err);
      setError('Ocurrió un error al guardar el reporte.');
    } finally {
      setIsSaving(false);
    }
  };

  const modalFooter = (
    <div className="edit-modal-footer">
      <button onClick={onClose} className="cancel-button">Cancelar</button>
      <button onClick={handleSave} className="save-button" disabled={isSaving}>
        {isSaving ? 'Guardando...' : 'Guardar Reporte'}
      </button>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Guardar Reporte de Inventario" footer={modalFooter}>
      <div className="save-report-body">
        <label htmlFor="reportDate">Selecciona la fecha del reporte:</label>
        <input
          type="date"
          id="reportDate"
          value={reportDate}
          onChange={(e) => setReportDate(e.target.value)}
        />
        {error && <p className="error-message" style={{textAlign: 'left', marginTop: '0.5rem'}}>{error}</p>}
      </div>
    </Modal>
  );
};

export default SaveReportModal;