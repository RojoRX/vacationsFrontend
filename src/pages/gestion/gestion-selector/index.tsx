import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { FormControl, InputLabel, MenuItem, Select, CircularProgress, Typography, SelectChangeEvent } from '@mui/material'

// Asegúrate de que esta interfaz esté declarada
interface GestionPeriod {
    startDate: string
    endDate: string
    label: string
}

interface GestionSelectProps {
    onChange: (selectedGestion: GestionPeriod) => void
    selectedGestion: GestionPeriod | null
}

const GestionSelect: React.FC<GestionSelectProps> = ({ onChange, selectedGestion }) => {
    const [gestionPeriods, setGestionPeriods] = useState<GestionPeriod[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchGestions = async () => {
            try {
                const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/gestion-periods/gestions/1112233`)
                setGestionPeriods(response.data)
                setLoading(false)
            } catch (err) {
                setError('Error al cargar las gestiones.')
                setLoading(false)
            }
        }
        fetchGestions()
    }, [])

    const handleChange = (event: SelectChangeEvent<string>) => {
        const selectedLabel = event.target.value
        const selectedGestion = gestionPeriods.find((gestion) => gestion.label === selectedLabel) || null
        if (selectedGestion) {
            onChange(selectedGestion)
        }
    }

    if (loading) {
        return <CircularProgress />
    }

    if (error) {
        return <Typography color="error">{error}</Typography>
    }

    return (
        <FormControl fullWidth variant="outlined">
            <InputLabel id="gestion-select-label">Seleccionar Gestión</InputLabel>
            <Select
                labelId="gestion-select-label"
                id="gestion-select"
                value={selectedGestion?.label || ''}
                onChange={handleChange}
                label="Seleccionar Gestión"
            >
                {gestionPeriods.map((gestion) => (
                    <MenuItem key={gestion.label} value={gestion.label}>
                        {gestion.label}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    )
}

export default GestionSelect
