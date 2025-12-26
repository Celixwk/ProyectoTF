import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';

// Pages
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

// Layout
import Layout from './components/layout/Layout';

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  // BYPASS LOGIN - TEMPORAL
  // if (!isAuthenticated) {
  //   return <Navigate to="/login" replace />;
  // }

  return <>{children}</>;
}

function App() {
  const { login, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Si no hay sesión, iniciar sesión falsa automáticamente
    if (!isAuthenticated) {
      login('mock_token', {
        id_usuario: 999,
        usuario: 'admin',
        nombre_completo: 'Admin Temporal',
        tipo_usuario: 'admin',
        empleado: null
      });
    }
  }, []);

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Ruta pública */}
        <Route path="/login" element={<Login />} />

        {/* Rutas protegidas */}
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
        </Route>

        {/* Ruta por defecto */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

