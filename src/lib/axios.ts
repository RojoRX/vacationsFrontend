import axios, { AxiosInstance, AxiosStatic } from 'axios';
import authConfig from 'src/configs/auth';

// 1. Crear la instancia base
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
}) as AxiosInstance & {
  isAxiosError: AxiosStatic['isAxiosError'];
};

// 2. Añadir el método estático
axiosInstance.isAxiosError = axios.isAxiosError;

// 3. Interceptor de request (agrega el token)
axiosInstance.interceptors.request.use(config => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem(authConfig.storageTokenKeyName);
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Token agregado al header:', token);
      }
    }
  }
  return config;
});

// 4. Interceptor de response (maneja errores globales)
axiosInstance.interceptors.response.use(
  response => response,
  error => {
    // Si hay respuesta del servidor
    if (error.response) {
      const { status } = error.response;

      // Si el token expiró o es inválido
      if (status === 401 || status === 403) {
        console.warn('⚠️ Token expirado o inválido. Redirigiendo al login...');

        // Eliminar token guardado
        localStorage.removeItem(authConfig.storageTokenKeyName);

        // Redirigir al login
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }

    // Rechazar el error para que pueda manejarse localmente si se desea
    return Promise.reject(error);
  }
);

export default axiosInstance;