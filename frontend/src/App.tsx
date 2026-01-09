import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Empleados from './pages/Empleados/Empleados';
import Turnos from './pages/Turnos/Turnos';
import Programacion from './pages/Programacion/Programacion';
import Recargos from './pages/Recargos/Recargos';
import Novedades from './pages/Novedades/Novedades';
import Configuracion from './pages/Configuracion/Configuracion';
import ConfiguracionProgramacion from './pages/ConfiguracionProgramacion/ConfiguracionProgramacion';
import ProgramacionAreas from './pages/ProgramacionAreas/ProgramacionAreas';
import GestionMensual from './pages/ProgramacionAreas/GestionMensual';

import Layout from './components/layout/Layout';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="empleados" element={<Empleados />} />
          <Route path="turnos" element={<Turnos />} />
          <Route path="programacion" element={<Programacion />} />
          <Route path="recargos" element={<Recargos />} />
          <Route path="novedades" element={<Novedades />} />
          <Route path="configuracion" element={<Configuracion />} />
          <Route path="configuracion-programacion" element={<ConfiguracionProgramacion />} />
          <Route path="programacion-areas" element={<ProgramacionAreas />} />
          <Route path="gestion-mensual" element={<GestionMensual />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;