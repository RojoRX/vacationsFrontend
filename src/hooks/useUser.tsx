import { useEffect, useState } from 'react';
import { User } from 'src/interfaces/user.interface';

const useUser = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const userData = window.localStorage.getItem('userData');

    if (userData) {
      const parsed: User = JSON.parse(userData);

      // Corrección de la fecha
      if (parsed.fecha_ingreso) {
        // Forzamos a tratar la fecha como UTC para evitar desfasajes de zona horaria
        const date = new Date(parsed.fecha_ingreso + 'T00:00:00');
        parsed.fecha_ingreso = date.toISOString().split('T')[0]; // yyyy-MM-dd
      }

      setUser(parsed);
    }
  }, []);

  return user;
};

export default useUser;
