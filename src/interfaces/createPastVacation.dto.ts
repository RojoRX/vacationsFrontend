export default interface CreatePastVacationDto {
  userId: number;
  requestDate?: string;
  startDate: string;
  endDate: string;
  position?: string;
  status: string;
  managementPeriodStart?: string;
  managementPeriodEnd?: string;
}
