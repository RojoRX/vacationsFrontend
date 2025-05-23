export default function getBusinessDays(startDate: Date, endDate: Date): number {
  const normalizeUTC = (date: Date): Date => {
    const normalized = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    console.log("Normalizando fecha:", date.toString(), "→", normalized.toUTCString());
    return normalized;
  };

  const start = normalizeUTC(startDate);
  const end = normalizeUTC(endDate);

  if (start > end) {
    console.log("Fecha de inicio mayor a la final. Retornando 0.");
    return 0;
  }

  let count = 0;
  const current = new Date(start);

  while (current <= end) {
    const day = current.getUTCDay(); // getUTCDay para día de la semana sin zona local
    const isBusinessDay = day !== 0 && day !== 6;
    console.log(`Revisando: ${current.toUTCString()} (día ${day}) → ${isBusinessDay ? "Día hábil" : "Fin de semana"}`);
    if (isBusinessDay) count++;
    current.setUTCDate(current.getUTCDate() + 1); // avanzar un día en UTC
  }

  console.log("Total de días hábiles:", count);
  return count;
}
