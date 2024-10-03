export type ErrCallbackType = (err: { [key: string]: string }) => void

export type LoginParams = {
  email?: string
  username:string
  password: string
  rememberMe?: boolean
}

export type RegisterParams = {
  email: string
  username: string
  password: string
}

export type UserDataType = {
  id: number
  ci: string // Cédula de identidad
  fecha_ingreso: string // Fecha de ingreso
  role: string // Rol del usuario
  fullName: string // Nombre completo
  username: string // Nombre de usuario
  password: string // Contraseña
  avatar?: string | null // Avatar opcional
  celular?: string // Número de celular opcional
  profesion?: string // Profesión opcional
  departmentId: number // ID del departamento
}


export type AuthValuesType = {
  loading: boolean
  logout: () => void
  user: UserDataType | null
  setLoading: (value: boolean) => void
  setUser: (value: UserDataType | null) => void
  login: (params: LoginParams, errorCallback?: ErrCallbackType) => void
  register: (params: RegisterParams, errorCallback?: ErrCallbackType) => void
}
