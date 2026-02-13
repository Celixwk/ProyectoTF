import axios from 'axios';

export const API_URL = '/api';

// Configuración de Axios
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token a todas las peticiones
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si es un error 401, PERO la URL solicitada fue el login, NO redirigir.
    // Esto permite que el componente Login maneje el error y muestre "Credenciales inválidas".
    if (error.response?.status === 401 && !error.config.url?.includes('/auth/login')) {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('usuario');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

