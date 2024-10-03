// src/hooks/useUser.js
import { useEffect, useState } from 'react';

type UserType = {
  id: number;
  ci: string;
  fecha_ingreso: string;
  username: string;
  departmentId: number;
  role: string;
  fullName: string;
  celular: string;
  profesion: string;
} | null; // Permitir que sea null

const useUser = () => {
  const [user, setUser] = useState<UserType>(null);

  useEffect(() => {
    const userData = window.localStorage.getItem('userData');

    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  return user;
};

export default useUser;
