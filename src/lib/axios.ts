// src/lib/axios.ts
import axios from 'axios'
import authConfig from 'src/configs/auth'

const axiosInstance = axios.create()

// Interceptor para agregar el token
axiosInstance.interceptors.request.use(config => {
    const token = window.localStorage.getItem(authConfig.storageTokenKeyName)

    // Asegura que headers exista
    if (!config.headers) {
        config.headers = {}
    }

    if (token) {
        config.headers.Authorization = token
    }

    return config
})


export default axiosInstance
