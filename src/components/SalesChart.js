import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { db } from '../firesbase/config';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const SalesChart = ({ dateRange }) => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!dateRange || !dateRange.start || !dateRange.end) {
      setChartData({ labels: [], datasets: [] });
      return;
    }

    setLoading(true);
    setChartData({ labels: [], datasets: [] }); // Clear previous chart data
    const startTimestamp = Timestamp.fromDate(dateRange.start);
    const endTimestamp = Timestamp.fromDate(dateRange.end);

    // La consulta ahora es a la colección de reportes diarios
    const q = query(
      collection(db, 'daily_sales'),
      where('date', '>=', startTimestamp),
      where('date', '<=', endTimestamp)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const salesByProduct = {};
      snapshot.docs.forEach(doc => {
        const dailyReport = doc.data();
        for (const productId in dailyReport.products) {
          const product = dailyReport.products[productId];
          salesByProduct[product.name] = (salesByProduct[product.name] || 0) + product.quantity;
        }
      });

      const labels = Object.keys(salesByProduct);
      const data = Object.values(salesByProduct);

      setChartData({
        labels,
        datasets: [
          {
            label: 'Total de Salidas en el Periodo',
            data,
            backgroundColor: 'rgba(0, 122, 255, 0.6)',
            borderColor: 'rgba(0, 122, 255, 1)',
            borderWidth: 1,
          },
        ],
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [dateRange]);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `Reporte de Salidas de Productos`,
      },
    },
  };

  if (loading) {
    return <p>Generando gráfica...</p>;
  }

  if (!dateRange) {
    return <p>Selecciona un tipo de reporte (Diario, Semanal, Mensual) para generar la gráfica.</p>;
  }

  return <Bar options={options} data={chartData} />;
};

export default SalesChart;