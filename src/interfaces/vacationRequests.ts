// En tu archivo de interfaces existente
export interface VacationRequest {
  id: number;
  position: string;
  username?: string;         // Añadido para compatibilidad
  employeeName?: string;     // Añadido para compatibilidad
  user?: any;               // Añadido para compatibilidad
  requestDate: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'AUTHORIZED' | 'SUSPENDED' | 'POSTPONED'; // Expandido
  postponedDate: string | null;
  postponedReason: string | null;
  returnDate: string | null;
  approvedByHR: boolean;
  approvedBySupervisor: boolean;
  managementPeriodStart: string;
  managementPeriodEnd: string;
  reviewDate: string;
}