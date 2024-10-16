// models/NonHoliday.ts
export interface NonHoliday {
    id: number; // This should be required for your logic
    year: number;
    date: string; // You might want to use Date type here
    description: string;
  }
  