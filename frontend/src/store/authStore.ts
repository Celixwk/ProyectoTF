import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
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
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('usuario', JSON.stringify(usuario));
        set({ token, usuario, isAuthenticated: true });
      },

      logout: () => {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('usuario');
        set({ token: null, usuario: null, isAuthenticated: false });
      },

      updateUsuario: (usuario) => {
        sessionStorage.setItem('usuario', JSON.stringify(usuario));
        set({ usuario });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

