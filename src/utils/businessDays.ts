export default function getBusinessDays(startDate: Date, endDate: Date): number {
  let count = 0;
  const currentDate = new Date(startDate);

  // Nos aseguramos de no modificar el objeto original
  currentDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);

  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    // 1 a 5 son de lunes a viernes
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      count++;
    }
    // Avanza al siguiente día
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return count;
}
