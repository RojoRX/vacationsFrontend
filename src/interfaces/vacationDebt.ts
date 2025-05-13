export interface VacationDebt {
  startDate: string;
  endDate: string;
  deuda: number;
  deudaAcumulativaAnterior: number;
  diasDisponibles: number;
  deudaAcumulativaHastaEstaGestion: number;
}

export interface GestionData {
  key: string;
  data: import('./vacationData').VacationData;
  debt: VacationDebt;
}
export interface VacationDebtDetail {
  startDate: string;
  endDate: string;
  deuda: number;
  diasDeVacacion: number;
  diasDeVacacionRestantes: number;
  deudaAcumulativaHastaEstaGestion: number;
  deudaAcumulativaAnterior: number;
  diasDisponibles: number;
}
export interface VacationDebtSummary {
  deudaTotal: number;
  diasDisponiblesActuales: number;
  gestionesConDeuda: number;
  gestionesSinDeuda: number;
  promedioDeudaPorGestion: number;
  primeraGestion: string;
  ultimaGestion: string;
}

export interface VacationDebtResponse {
  deudaAcumulativa: number;
  detalles: VacationDebtDetail[];
  resumenGeneral: VacationDebtSummary;
}
export interface GestionDeuda {
  diasDisponibles: number;
  deudaAcumulativaAnterior: number;
  deuda: number;
  startDate: string;
  endDate: string;
  deudaAcumulativaHastaEstaGestion: number;
  diasDisponiblesActuales?: number; // opcional si a veces no llega
}
