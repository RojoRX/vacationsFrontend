// src/types/licenseTypes.ts
export interface  License {
  id: number;
  licenseType: string;
  timeRequested: string;
  startDate: string;
  endDate: string;
  issuedDate: string;
  immediateSupervisorApproval: boolean;
  personalDepartmentApproval: boolean;
  totalDays: string | number;
  userId: number;
  deleted: boolean;
  reason?: string;
  user?: {
    id: number;
    fullName: string;
  };
  department?: { name: string };

  // 🔹 NUEVOS CAMPOS
  startHalfDay?: string;
  endHalfDay?: string;
  detectedHolidays?: {
    date: string;
    year: number;
    description: string;
  }[];
}