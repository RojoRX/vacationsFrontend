export const translateRole = (role?: string): string => {
  switch (role) {
    case 'USER':
      return 'Usuario';
    case 'ADMIN':
      return 'Administrador';
    case 'SUPERVISOR':
      return 'Jefe Superior';
    default:
      return role || 'Desconocido';
  }
};
