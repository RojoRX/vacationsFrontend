// src/types/userTypes.ts

export interface Department {
  id: number;
  name: string;
  isCareer: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AcademicUnit {
  id: number;
  name: string;
}

export interface Profession {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: number;
  ci: string;
  fecha_ingreso: string;
  email: string | null;
  username: string;
  createdAt: string;
  updatedAt: string;
  fullName: string;
  celular: string | null;
  position: string;
  tipoEmpleado: string; // Ej: "DOCENTE"
  role: string; // Ej: "USER" | "ADMIN"
  department: Department;
  academicUnit: AcademicUnit;
  profession: Profession | null;
}
