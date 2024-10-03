import React, { useState } from 'react'
import axios from 'axios'
import GestionSelect from 'src/pages/gestion/gestion-selector'
import { GestionPeriod } from 'src/interfaces'

const VacationSummary = () => {
    const [selectedGestion, setSelectedGestion] = useState<GestionPeriod | null>(null)
    const [data, setData] = useState<any>(null)

    const handleGestionChange = (gestion: GestionPeriod) => {
        setSelectedGestion(gestion)
        fetchVacationData(gestion.startDate, gestion.endDate)
    }

    const fetchVacationData = async (startDate: string, endDate: string) => {
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/vacations`, {
                params: {
                    carnetIdentidad: '1112233',
                    startDate,
                    endDate
                }
            })
            setData(response.data)
        } catch (error) {
            console.error('Error fetching vacation data:', error)
            setData(null)
        }
    }

    return (
        <div>
            {/* Aquí pasamos la función handleGestionChange al selector */}
            <GestionSelect onChange={handleGestionChange} selectedGestion={selectedGestion} />

            {/* Mostrar el resumen de vacaciones */}
            {data ? (
                <div>
                    <h2>Resumen de Vacaciones para {data.name || 'Usuario Desconocido'}</h2>
                    <p>Fecha de Ingreso: {new Date(data.fechaIngreso).toLocaleDateString()}</p>
                    <p>Antigüedad: {data.antiguedadEnAnios} años, {data.antiguedadEnMeses} meses ({data.antiguedadEnDias} días)</p>
                    <p>Días Totales de Vacaciones: {data.diasDeVacacion}</p>
                    <p>Días Restantes: {data.diasDeVacacionRestantes}</p>

                    {/* Recesos Aplicados */}
                    <h3>Recesos Aplicados</h3>
                    {data.recesos.length > 0 ? (
                        data.recesos.map((receso: any, index: number) => (
                            <p key={index}>{receso.name}: del {new Date(receso.startDate).toLocaleDateString()} al {new Date(receso.endDate).toLocaleDateString()} ({receso.daysCount} días)</p>
                        ))
                    ) : (
                        <p>No hay recesos aplicados.</p>
                    )}

                    {/* Días No Hábiles */}
                    <h3>Días No Hábiles</h3>
                    {data.nonHolidayDaysDetails.length > 0 ? (
                        data.nonHolidayDaysDetails.map((day: any, index: number) => (
                            <p key={index}>{day.date}: {day.reason}</p>
                        ))
                    ) : (
                        <p>No hay días no hábiles registrados.</p>
                    )}
                </div>
            ) : (
                <p>No se encontraron datos de vacaciones.</p>
            )}
        </div>
    )
}

export default VacationSummary
