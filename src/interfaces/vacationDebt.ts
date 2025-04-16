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
  