// src/lib/axios.ts
import axios from 'axios'
import authConfig from 'src/configs/auth'

const axiosInstance = axios.create()

// Interceptor para agregar el token
axiosInstance.interceptors.request.use(config => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
      console.log('✅ Interceptor funcionando. Token agregado:', token)
    }
  }
  return config
})




export default axiosInstance
