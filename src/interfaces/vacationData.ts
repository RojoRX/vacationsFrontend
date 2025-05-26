import { NonHoliday } from "./nonHoliday";
import { Receso } from "./receso";

export interface SolicitudesDeVacacionAutorizadas {
  requests: any;
  totalAuthorizedVacationDays: number;
}

export interface Licencia {
  id: number;
  licenseType: string;
  startDate: string;
  endDate: string;
  timeRequested: string;
  totalDays: number;
}

export interface LicenciasAutorizadas {
  totalAuthorizedDays: number;
  requests: Licencia[];  // ✅ Agregás esto
}


export interface VacationData {
  name:string;
  position:string;
  fechaIngreso:string;
  antiguedadEnAnios: number;
  antiguedadEnDias: number;
  diasDeVacacion: number;
  solicitudesDeVacacionAutorizadas: SolicitudesDeVacacionAutorizadas;
  diasDeVacacionRestantes:number;
  licenciasAutorizadas: LicenciasAutorizadas;
  startDate: string;
  endDate: string;
  recesos: Receso[];
  nonHolidayDaysDetails: NonHoliday[];
}
