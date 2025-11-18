import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './StockAlerts.css';

const StockAlerts = () => {
  const { inventory, loading } = useAuth(); // Obtenemos los datos del contexto
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const allAlerts = [];
    inventory.forEach(p => {
      // Solo procesar si el stock mínimo está definido
      if (typeof p.stockMin === 'number') {
        const stockBodegaBajo = p.bodega <= p.stockMin;
        const stockBarraBajo = p.barra <= p.stockMin;

        // Solo mostrar una alerta si AMBAS ubicaciones tienen stock bajo.
        if (stockBodegaBajo && stockBarraBajo) {
          allAlerts.push({ 
            id: p.id, // Usamos el ID original del producto, ya que es una sola alerta por producto
            nombre: p.nombre, 
            ubicacion: 'Ambas', // Indicamos que el problema está en ambas ubicaciones
            stockActual: p.total, // Mostramos el stock total que es el más relevante
            stockMin: p.stockMin, 
          });
        }
      }
    });
    setAlerts(allAlerts);
  }, [inventory]);

  // Solo muestra "Cargando..." si el loading principal está activo y aún no hay inventario.
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