// ** React Imports
import { createContext, useEffect, useState, ReactNode } from 'react'

// ** Next Import
import { useRouter } from 'next/router'

// ** Axios
import axios from 'axios'


// ** Config
import authConfig from 'src/configs/auth'

// ** Types
import { AuthValuesType, RegisterParams, LoginParams, ErrCallbackType, UserDataType } from './types'

// ** Defaults
const defaultProvider: AuthValuesType = {
  user: null,
  loading: true,
  setUser: () => null,
  setLoading: () => Boolean,
  login: () => Promise.resolve(),
  logout: () => Promise.resolve(),
  register: () => Promise.resolve()
}

const AuthContext = createContext(defaultProvider)

type Props = {
  children: ReactNode
}

const AuthProvider = ({ children }: Props) => {
  // ** States
  const [user, setUser] = useState<UserDataType | null>(defaultProvider.user)
  const [loading, setLoading] = useState<boolean>(defaultProvider.loading)

  // ** Hooks
  const router = useRouter()

  useEffect(() => {
    const initAuth = async (): Promise<void> => {
      const storedToken =
        window.localStorage.getItem(authConfig.storageTokenKeyName) ||
        sessionStorage.getItem(authConfig.storageTokenKeyName);


      //console.log('📦 Token en almacenamiento:', storedToken);

      // Validar token antes de usarlo
      if (storedToken && storedToken !== 'null' && storedToken !== 'undefined') {
        setLoading(true);
        try {
          const response = await axios.get(authConfig.meEndpoint, {
            headers: { Authorization: `Bearer ${storedToken}` }
          });

          //console.log('👤 Usuario autenticado:', response.data.userData);
          setUser({ ...response.data.userData });
          setLoading(false);
        } catch (error: any) {
          console.error('⚠️ Error durante initAuth:', error?.response || error);
          localStorage.removeItem('userData');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('accessToken');
          localStorage.removeItem(authConfig.storageTokenKeyName); // Limpiar token inválido
          setUser(null);
          setLoading(false);

          if (!router.pathname.includes('/login')) {
            router.replace('/login');
          }
        }
      } else {
        //console.log('ℹ️ No hay token válido almacenado');
        localStorage.removeItem(authConfig.storageTokenKeyName); // Limpiar cualquier token corrupto
        setUser(null);
        setLoading(false);

        // Solo redirigir si no estamos ya en login o páginas de auth
        const path = router.pathname;
        const isAuthPage =
          path.includes('/login') ||
          path.includes('/register') ||
          path.includes('/forgot-password');

        if (!isAuthPage) router.replace('/login');
      }
    }


    initAuth()
  }, [])


  const handleLogin = async (params: LoginParams): Promise<any> => {
    try {
      const response = await axios.post(authConfig.loginEndpoint, params);

      if (response.data.accessToken) {
        // Guardar token según rememberMe
        if (params.rememberMe) {
          window.localStorage.setItem(authConfig.storageTokenKeyName, response.data.accessToken);
          window.localStorage.setItem('userData', JSON.stringify(response.data.userData));
        } else {
          sessionStorage.setItem(authConfig.storageTokenKeyName, response.data.accessToken);
          sessionStorage.setItem('userData', JSON.stringify(response.data.userData));
        }

        setUser({ ...response.data.userData });

        const returnUrl = router.query.returnUrl;
        const redirectURL = returnUrl && returnUrl !== '/' ? returnUrl : '/';
        router.replace(redirectURL as string);

        return response.data;
      } else {
        throw new Error('No se recibió token de acceso');
      }
    } catch (err: any) {
      console.error('Error en handleLogin:', err);

      // Propaga el error completo para que el componente lo maneje
      if (err.response?.data) {
        throw err.response.data; // Propaga el error completo del backend
      } else if (err.request) {
        throw new Error('Error de conexión con el servidor');
      } else {
        throw new Error('Error inesperado durante el login');
      }
    }
  };


  const handleLogout = () => {
    setUser(null)
    window.localStorage.removeItem('userData')
    window.localStorage.removeItem(authConfig.storageTokenKeyName)
    router.push('/login')
  }

  const handleRegister = (params: RegisterParams, errorCallback?: ErrCallbackType) => {
    axios
      .post(authConfig.registerEndpoint, params)
      .then(res => {
        if (res.data.error) {
          if (errorCallback) errorCallback(res.data.error)
        } else {
          handleLogin({
            email: params.email, password: params.password,
            username: ''
          })
        }
      })
      .catch((err: { [key: string]: string }) => (errorCallback ? errorCallback(err) : null))
  }

  const values = {
    user,
    loading,
    setUser,
    setLoading,
    login: handleLogin,
    logout: handleLogout,
    register: handleRegister
  }

  return <AuthContext.Provider value={values}>{children}</AuthContext.Provider>
}

export { AuthContext, AuthProvider }