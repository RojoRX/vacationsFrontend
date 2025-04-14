// src/types/licenseTypes.ts
export interface License {
    id: number;
    licenseType: string;
    timeRequested: string;
    startDate: string;
    endDate: string;
    issuedDate: string;
    immediateSupervisorApproval: boolean;
    personalDepartmentApproval: boolean;
    totalDays: string;
    // Puedes agregar más campos según sea necesario
}
