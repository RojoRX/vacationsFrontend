// src/types/licenseTypes.ts
export interface License {
    id: number;                            // ID de la licencia
    userId: number;                        // ID del usuario que solicitó la licencia
    licenseType: string;                   // Tipo de licencia (por ejemplo, "vacaciones", "enfermedad", etc.)
    startDate: string;                     // Fecha de inicio de la licencia (en formato ISO)
    endDate: string;                       // Fecha de finalización de la licencia (en formato ISO)
    issuedDate: string;                    // Fecha en que se emitió la licencia (en formato ISO)
    immediateSupervisorApproval: boolean;  // Estado de aprobación por parte del supervisor
    personalDepartmentApproval: boolean;   // Estado de aprobación por parte del departamento de RRHH
    // Puedes agregar más campos según sea necesario
}
