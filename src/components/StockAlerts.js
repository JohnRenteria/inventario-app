import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './StockAlerts.css';

const StockAlerts = () => {
  const { inventory, loading } = useAuth(); // Obtenemos los datos del contexto
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const generatedAlerts = inventory.map(p => {
      let stockToCheck = p.bodega || 0;
      let location = 'Bodega';
      let showAlert = false;

      // Si la bodega tiene stock, se evalúa la bodega.
      if (stockToCheck > 0) {
        showAlert = p.stockMin > 0 && stockToCheck <= p.stockMin;
      } 
      // Si la bodega está en 0, pero la barra tiene stock, se evalúa la barra.
      else if (p.barra > 0) {
        stockToCheck = p.barra;
        location = 'Barra';
        showAlert = p.stockMin > 0 && stockToCheck <= p.stockMin;
      }

      return showAlert ? { ...p, stockActual: stockToCheck, ubicacion: location } : null;
    }).filter(Boolean); // Filtramos los nulos para quedarnos solo con las alertas reales.
    setAlerts(generatedAlerts);
  }, [inventory]);

  // Solo muestra "Cargando..." si el loading principal está activo y aún no hay inventario.
  if (loading && inventory.length === 0) {
    return <p>Cargando alertas de stock...</p>;
  }

  return (
    <div className="stock-alerts-container">
      <h4>Alertas de Stock</h4>
      {alerts.length === 0 ? (
        <p>No hay alertas de stock en este momento.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Ubicación</th>
              <th>Stock Actual</th>
              <th>Stock Mínimo</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map(item => {
              return (
                <tr key={item.id} className="status-low">
                  <td>{item.nombre}</td>
                  <td>{item.ubicacion}</td>
                  <td>{item.stockActual}</td>
                  <td>{item.stockMin}</td>
                  <td>Bajo Stock</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default StockAlerts;