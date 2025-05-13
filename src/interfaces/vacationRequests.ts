import { AuthorizedVacationRequest } from "./authorizedVacationRequest";
import { Gestion } from "./gestion";
import { Receso } from "./receso";

// Interface combinada y tipada correctamente
export interface VacationRequest {
  id: number;                                 // ID original
  requestId?: number;                         // Alternativa usada en segunda interfaz
  ci?: string;                                // Carnet de identidad (nuevo)
  position: string;
  department?: string;                        // Nuevo
  username?: string;                          // Para compatibilidad
  employeeName?: string;                      // Para compatibilidad
  user?: any;                                 // Para compatibilidad
  userName?: string;                          // Nombre de usuario (nuevo)
  requestDate: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'AUTHORIZED' | 'SUSPENDED' | 'POSTPONED' | string;
  postponedDate: string | null;
  postponedReason: string | null;
  returnDate: string | null;
  approvedByHR: boolean;
  approvedBySupervisor: boolean;
  managementPeriodStart: string;
  managementPeriodEnd: string;
  reviewDate: string;
  fechaIngreso?: string;                      // Fecha de ingreso (nuevo)
  antiguedadEnAnios?: number;                 // Nuevo
  diasDeVacacion?: number;                    // Nuevo
  diasDeVacacionRestantes?: number;           // Nuevo
  recesos?: Receso[];                         // Nuevo
  gestion?: Gestion;                          // Nuevo

  licenciasAutorizadas?: {
    totalAuthorizedDays: number;
    requests: any[];
  };

  solicitudesDeVacacionAutorizadas?: {
    totalAuthorizedVacationDays: number;
    requests: AuthorizedVacationRequest[];
  };
}
