export default function getBusinessDays(startDate: Date, endDate: Date): number {
  const normalizeUTC = (date: Date): Date => {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  };

  const start = normalizeUTC(startDate);
  const end = normalizeUTC(endDate);

  if (start > end) return 0;

  // Calcular la diferencia total en días
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 para incluir ambos extremos

  // Calcular semanas completas y días restantes
  const weeks = Math.floor(diffDays / 7);
  const remainingDays = diffDays % 7;

  // Días hábiles base (5 días por semana)
  let businessDays = weeks * 5;

  // Calcular días hábiles en los días restantes
  const startDay = start.getUTCDay();
  for (let i = 0; i < remainingDays; i++) {
    const currentDay = (startDay + i) % 7;
    if (currentDay !== 0 && currentDay !== 6) { // 0 es domingo, 6 es sábado
      businessDays++;
    }
  }

  return businessDays;
}