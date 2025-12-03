import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/api.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Lock, User as UserIcon } from 'lucide-react';

export default function Login() {
  const [usuario, setUsuario] = useState('admin');
  const [contrasenia, setContrasenia] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authService.login(usuario, contrasenia);
      login(response.token, response.usuario);
      toast.success('¡Bienvenido!');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error en login:', error);
      toast.error(error.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white dark:bg-gray-950 rounded-lg shadow-xl p-8">
          {/* Logo/Title */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Sistema de Nómina
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Inicia sesión para continuar
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="usuario">Usuario</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="usuario"
                  type="text"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  className="pl-10"
                  placeholder="Ingresa tu usuario"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contrasenia">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="contrasenia"
                  type="password"
                  value={contrasenia}
                  onChange={(e) => setContrasenia(e.target.value)}
                  className="pl-10"
                  placeholder="Ingresa tu contraseña"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </form>

          {/* Info */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Usuario por defecto: <span className="font-mono font-semibold">admin</span>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Contraseña: <span className="font-mono font-semibold">admin123</span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center mt-8 text-sm text-gray-600 dark:text-gray-400">
          Sistema de Nómina v2.0 &copy; 2024
        </p>
      </div>
    </div>
  );
}

