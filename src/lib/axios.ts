// src/lib/axios.ts
import axios, { AxiosInstance, AxiosStatic } from 'axios';
import authConfig from 'src/configs/auth';

// 1. Creamos la instancia base
const axiosInstance = axios.create() as AxiosInstance & {
  isAxiosError: AxiosStatic['isAxiosError'];
};

// 2. Añadimos el método estático
axiosInstance.isAxiosError = axios.isAxiosError;

// 3. Configuramos los interceptores (igual que antes)
axiosInstance.interceptors.request.use(config => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem(authConfig.storageTokenKeyName);
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Interceptor funcionando. Token agregado:', token);
    }
  }
  return config;
});

export default axiosInstance;