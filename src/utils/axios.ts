import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL
});

// Log automático de errores
api.interceptors.response.use(undefined, (error) => {
    const errorData = {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.message,
      errors: error.response?.data?.errors,
    };
    console.error('API Error:', errorData);
    return Promise.reject(error);
  });
  
export default api;