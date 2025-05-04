import { format } from 'date-fns';

/**
 * Formatea una fecha string a formato dd/MM/yyyy, manejando zonas horarias
 * @param dateString - La fecha en formato string (puede ser null)
 * @param fallback - Valor alternativo cuando la fecha es inválida (default: 'No definida')
 * @returns Fecha formateada o el valor fallback
 */
export const formatDate = (dateString: string | null, fallback = 'No definida'): string => {
  if (!dateString) return fallback;
  
  try {
    // Normaliza la fecha agregando tiempo si no lo tiene
    const normalizedDate = dateString.includes('T') ? dateString : `${dateString}T00:00:00`;
    const date = new Date(normalizedDate);
    
    // Ajusta por zona horaria si es necesario (ejemplo para UTC-5)
    const offset = date.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(date.getTime() + offset);
    
    return format(adjustedDate, 'dd/MM/yyyy');
  } catch (error) {
    console.error('Error formateando fecha:', dateString, error);
    return fallback;
  }
};

/**
 * Obtiene la fecha actual en formato ISO (YYYY-MM-DD)
 * @returns Fecha actual en formato string
 */
export const getCurrentISODate = (): string => {
  return format(new Date(), 'yyyy-MM-dd');
};

/**
 * Valida si una fecha es válida
 * @param dateString - La fecha a validar
 * @returns true si la fecha es válida
 */
export const isValidDate = (dateString: string | null): boolean => {
  if (!dateString) return false;
  return !isNaN(new Date(dateString).getTime());
};