import { useEffect, useState } from 'react';
import { User } from 'src/interfaces/user.interface';

const useUser = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const userData = window.localStorage.getItem('userData');

    if (userData) {
      const parsed = JSON.parse(userData);

      // Transformar clave si es necesario
      const fecha = parsed.fechaIngreso || parsed.fecha_ingreso;

      if (fecha) {
        // Forzar formato UTC
        const date = new Date(fecha + 'T00:00:00');
        parsed.fecha_ingreso = date.toISOString().split('T')[0]; // yyyy-MM-dd
      }

      setUser(parsed);
    }
  }, []);

  return user;
};

export default useUser;
