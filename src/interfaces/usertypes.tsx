// src/types/userTypes.ts
export interface User {
    id: number;
    ci: string;
    fecha_ingreso: string;
    username: string;
    createdAt: string;
    updatedAt: string;
    fullName: string;
    celular: string | null;
    profesion: string | null;
    position: string;
    role: string;
  }
  