import React, { useState, useEffect } from 'react';
import axios from 'src/lib/axios';
import { FormControl, InputLabel, MenuItem, Select, CircularProgress, Typography, SelectChangeEvent } from '@mui/material';
import useUser from 'src/hooks/useUser';

interface GestionPeriod {
    startDate: string;
    endDate: string;
    label: string;
}

interface GestionSelectProps {
    onChange: (selectedGestion: GestionPeriod) => void;
    selectedGestion: GestionPeriod | null;
}

const GestionSelect: React.FC<GestionSelectProps> = ({ onChange, selectedGestion }) => {
    const user = useUser();
    const [gestionPeriods, setGestionPeriods] = useState<GestionPeriod[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isUserLoaded, setIsUserLoaded] = useState<boolean>(false);

    useEffect(() => {
        if (user) {
            setIsUserLoaded(true);
        }
    }, [user]);

    useEffect(() => {
        const fetchGestions = async () => {
            if (isUserLoaded && user && user.ci) {
                try {
                    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/gestion-periods/gestions/${user.ci}`);
                    setGestionPeriods(response.data);
                } catch (err) {
                    setError('Error al cargar las gestiones.');
                } finally {
                    setLoading(false);
                }
            } else if (isUserLoaded) {
                setError('Carnet de identidad no disponible.');
                setLoading(false);
            }
        };

        fetchGestions();
    }, [isUserLoaded, user]);

    const handleChange = (event: SelectChangeEvent<string>) => {
        const selectedLabel = event.target.value;
        const selectedGestion = gestionPeriods.find((gestion) => gestion.label === selectedLabel) || null;
        if (selectedGestion) {
            onChange(selectedGestion);
        }
    };

    if (loading) {
        return <CircularProgress />;
    }

    if (error) {
        return <Typography color="error">{error}</Typography>;
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
    );
};

export default GestionSelect;
