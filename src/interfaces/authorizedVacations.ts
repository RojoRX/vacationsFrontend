import { VacationRequest } from "./vacationRequests";

export interface AuthorizedVacations {
    totalAuthorizedVacationDays: number;
    requests: VacationRequest[];
  }