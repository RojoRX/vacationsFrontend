import { useState, useEffect } from 'react';

/**
 * Hook para manejar debounce en valores (ej: inputs de búsqueda).
 * @param value Valor que quieres debouncificar
 * @param delay Tiempo en milisegundos para esperar antes de actualizar el valor
 */
export function useDebounce<T>(value: T, delay = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // limpiar timeout si el valor cambia antes de cumplirse el delay
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
