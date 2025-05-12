// src/utils/date-helpers.js (o .ts)
import { isWeekend, format } from 'date-fns';

// Función para verificar si una fecha es un día hábil (lunes a viernes)
const isWorkDay = (date) => !isWeekend(date);

// Función para obtener el siguiente día hábil
export const getNextWorkDay = (date) => {
    let nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1); // Avanzar un día

    // Verificar si es fin de semana, y si lo es, avanzar hasta el lunes
    while (isWeekend(nextDay)) {
        nextDay.setDate(nextDay.getDate() + 1); // Avanzar al siguiente día
    }

    return nextDay;
};
export const calculateEndDate = (startDate, vacationDays) => {
    try {
        let currentDate = new Date(startDate);
        let workingDaysCounted = 0;
        let endDate = new Date(startDate);

        // Avanzar la fecha de inicio hasta el primer día hábil
       
        while (!isWorkDay(currentDate)) {
            currentDate.setDate(currentDate.getDate() + 1);
            endDate = new Date(currentDate);
        }


        endDate = new Date(currentDate); // Reiniciar endDate al primer día hábil

        while (workingDaysCounted < vacationDays) {
            if (isWorkDay(endDate)) {
                workingDaysCounted++;
                if (workingDaysCounted < vacationDays) {
                    endDate.setDate(endDate.getDate() + 1);
                } else {
                }
            } else {
                endDate.setDate(endDate.getDate() + 1);
            }
        }


        return endDate;
    } catch (error) {
        return null;
    }
};
