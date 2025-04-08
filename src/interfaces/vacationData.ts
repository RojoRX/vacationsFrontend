import { NonHoliday } from "./nonHoliday";
import { Receso } from "./receso";

export interface SolicitudesDeVacacionAutorizadas {
  requests: any;
  totalAuthorizedVacationDays: number;
}

export interface LicenciasAutorizadas {
  totalAuthorizedDays: number;
}

export interface VacationData {
  name:string;
  position:string;
  fechaIngreso:string;
  antiguedadEnAnios: number;
  antiguedadEnDias: number;
  diasDeVacacion: number;
  solicitudesDeVacacionAutorizadas: SolicitudesDeVacacionAutorizadas;
  licenciasAutorizadas: LicenciasAutorizadas;
  startDate: string;
  endDate: string;
  recesos: Receso[];
  nonHolidayDaysDetails: NonHoliday[];
}
