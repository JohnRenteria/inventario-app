// c:\Users\user\OneDrive - Corporacion Universitaria Remington\Desktop\Visual Code\Inventario Al Aire Rooftop\inventario-app\src\App.js

import './App.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './firesbase/Login';
import Register from './firesbase/Register';
import Homepage from './pages/Homepage';
import ProtectedRoute from './components/ProtectedRoute';
import InventoryTable from './components/InventoryTable';
import Reportes from './pages/Reportes';
import Configuracion from './pages/Configuracion';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route 
          path="/homepage" 
          element={<ProtectedRoute><Homepage /></ProtectedRoute>}
        >
          {/* Rutas anidadas que se renderizarán dentro del <Outlet /> de Homepage */}
          <Route index element={<InventoryTable />} />
          <Route path="reportes" element={<Reportes />} />
          <Route path="configuracion" element={<Configuracion />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
