// Enum para tipo de empleado
export enum TipoEmpleadoEnum {
  DOCENTE = 'DOCENTE',
  ADMINISTRATIVO = 'ADMINISTRATIVO'
}

// Interface de Unidad Académica
export interface AcademicUnit {
  id: number;
  name: string;
}

// Interface de Profesión
export interface Profession {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

// Interface de Departamento
export interface Department {
  id: number;
  name: string;
  isCareer: boolean;
  createdAt: string;
  updatedAt: string;
}

// Interface principal del Usuario
export interface User {
  id: number;
  ci: string;
  username: string;
  fullName: string;
  celular: string;
  email: string | null;
  profession?: Profession;
  fecha_ingreso: string;
  position: string;
  tipoEmpleado: TipoEmpleadoEnum;
  department: Department;
  departmentId?: number;
  role: string;
  academicUnit?: AcademicUnit;
  createdAt?: string;
  updatedAt?: string;
}
