import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './StockAlerts.css';

const StockAlerts = () => {
  const { inventory, loading } = useAuth();
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const processed = new Set();
    const result = [];

    inventory.forEach(p => {
      if (typeof p.stockMin !== 'number') return;

      const bodega = p.bodega ?? 0;
      const barra = p.barra ?? 0;
      const min = p.stockMin;

      const addAlert = (ubicacion, stockActual) => {
        if (!processed.has(p.id)) {
          result.push({
            id: p.id,
            nombre: p.nombre,
            ubicacion,
            stockActual,
            stockMin: min
          });
          processed.add(p.id);
        }
      };

      // 👉 REGLA 3: Si bodega = 0 y barra = 0 → ubicación "Ambas"
      if (bodega === 0 && barra === 0) {
        addAlert('Ambas', 0);
        return;
      }

      // 👉 REGLA 2: Si bodega = 0 y barra ≤ stockMin → ubicación "Barra"
      if (bodega === 0 && barra <= min) {
        addAlert('Barra', barra);
        return;
      }

      // 👉 REGLA 1: Si bodega ≤ stockMin Y barra también está por debajo/igual del stockMin
      // SOLO en ese caso se alerta por bodega.
      if (bodega <= min && barra <= min) {
        addAlert('Bodega', bodega);
        return;
      }

      // ⚠ Si bodega está baja pero barra está arriba del mínimo → NO se genera alerta
    });

    setAlerts(result);
  }, [inventory]);

  if (loading && inventory.length === 0) {
    return <p>Cargando alertas de stock...</p>;
  }

  return (
    <div className="stock-alerts-container">
      <header className="stock-alerts-header">
        <h4>Alertas de Stock</h4>
      </header>

      {alerts.length === 0 ? (
        <p style={{ padding: '1rem 1.5rem' }}>No hay alertas de stock en este momento.</p>
      ) : (
        <div className="tabla-scroll-container">
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
              {alerts.map(item => (
                <tr key={item.id} className="status-low">
                  <td>{item.nombre}</td>
                  <td>{item.ubicacion}</td>
                  <td>{item.stockActual}</td>
                  <td>{item.stockMin}</td>
                  <td>Bajo Stock</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StockAlerts;
