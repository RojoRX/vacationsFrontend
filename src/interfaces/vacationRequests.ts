export interface VacationRequest {
    id: number;
    position: string;
    requestDate: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'AUTHORIZED';
    postponedDate: string | null;
    postponedReason: string | null;
    returnDate: string | null;
    approvedByHR: boolean;
    approvedBySupervisor: boolean;
    managementPeriodStart: string;
    managementPeriodEnd: string;
    reviewDate: string;
  }