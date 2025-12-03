import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Usuario } from '../types/api.types';

interface AuthState {
  token: string | null;
  usuario: Usuario | null;
  isAuthenticated: boolean;
  login: (token: string, usuario: Usuario) => void;
  logout: () => void;
  updateUsuario: (usuario: Usuario) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      usuario: null,
      isAuthenticated: false,

      login: (token, usuario) => {
        localStorage.setItem('token', token);
        localStorage.setItem('usuario', JSON.stringify(usuario));
        set({ token, usuario, isAuthenticated: true });
      },

      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        set({ token: null, usuario: null, isAuthenticated: false });
      },

      updateUsuario: (usuario) => {
        localStorage.setItem('usuario', JSON.stringify(usuario));
        set({ usuario });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);

