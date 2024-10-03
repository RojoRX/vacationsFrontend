export default {
  // Este es el endpoint utilizado para obtener la información del usuario autenticado
  meEndpoint: '/auth/me', // Endpoint para obtener los datos del usuario actual
  
  // Este es el endpoint que se usa para iniciar sesión y obtener el token JWT
  loginEndpoint: '/jwt/login', // Endpoint para iniciar sesión (login) y recibir un JWT
  
  // Este es el endpoint que se usa para registrar un nuevo usuario y posiblemente recibir un token JWT
  registerEndpoint: '/jwt/register', // Endpoint para registrar un nuevo usuario y recibir un JWT
  
  // Este es el nombre clave utilizado para almacenar el token en el localStorage (o sessionStorage)
  storageTokenKeyName: 'accessToken', // Nombre de la clave para almacenar el token JWT en el almacenamiento local
  
  // Esta opción define qué acción se debe tomar cuando el token expira
  // Puede ser 'logout' para cerrar la sesión del usuario automáticamente
  // o 'refreshToken' para intentar renovar el token antes de que expire
  onTokenExpiration: 'refreshToken' // Acción a tomar cuando el token expira: 'logout' o 'refreshToken'
}
