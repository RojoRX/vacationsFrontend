export interface AuthorizedVacationRequest {
    id: number;
    position: string;
    requestDate: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    status: string;
    postponedDate: string | null;
    postponedReason: string | null;
    returnDate: string;
    approvedByHR: boolean;
    approvedBySupervisor: boolean;
    managementPeriodStart: string;
    managementPeriodEnd: string;
  }