import React, { useState } from 'react';
import Modal from './Modal';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const DateRangeModal = ({ isOpen, onClose, onGenerateReport, mode, highlightedDates }) => {
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(null);
  const [error, setError] = useState('');

  const handleDateChange = (dates) => {
    if (mode === 'weekly') {
      const [start, end] = dates;
      setStartDate(start);
      setEndDate(end);
    } else {
      setStartDate(dates);
    }
  };

  const handleGenerate = () => {
    setError('');
    let start, end;

    switch (mode) {
      case 'daily':
        const year = startDate.getFullYear();
        const month = startDate.getMonth();
        const day = startDate.getDate();
        start = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
        end = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
        break;
      case 'weekly':
        if (!startDate || !endDate) {
          setError('Debes seleccionar un rango de fechas.');
          return;
        }
        // Validar el rango de días para el reporte semanal
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 para incluir el día de inicio

        if (diffDays < 2) {
          setError('El rango debe ser de al menos 2 días.');
          return;
        }
        if (diffDays > 8) {
          setError('El rango no puede ser mayor a 8 días.');
          return;
        }
        const startYear = startDate.getFullYear();
        const startMonth = startDate.getMonth();
        const startDay = startDate.getDate();
        start = new Date(Date.UTC(startYear, startMonth, startDay, 0, 0, 0, 0));
        end = new Date(endDate.setHours(23, 59, 59, 999)); // end date is fine as is
        break;
      case 'monthly':
        start = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
        end = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      default:
        return;
    }
    onGenerateReport({ start, end });
    onClose();
  };

  const modalFooter = (
    <div className="edit-modal-footer">
      <button onClick={onClose} className="cancel-button">Cancelar</button>
      <button onClick={handleGenerate} className="save-button">Generar Reporte</button>
    </div>
  );

  const getTitle = () => {
    if (mode === 'daily') return 'Seleccionar Día';
    if (mode === 'weekly') return 'Seleccionar Rango Semanal';
    if (mode === 'monthly') return 'Seleccionar Mes';
    return 'Seleccionar Fecha';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getTitle()} footer={modalFooter}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <DatePicker
          selected={startDate}
          onChange={handleDateChange}
          startDate={startDate}
          endDate={endDate}
          selectsRange={mode === 'weekly'}
          showMonthYearPicker={mode === 'monthly'}
          dateFormat={mode === 'monthly' ? 'MM/yyyy' : 'dd/MM/yyyy'}
          inline
          maxDate={new Date()} // No permite seleccionar días futuros
          highlightDates={highlightedDates}
        />
        {error && <p className="error-message">{error}</p>}
      </div>
    </Modal>
  );
};

export default DateRangeModal;