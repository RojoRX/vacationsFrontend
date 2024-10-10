import React, { useState } from 'react';
import { Box, Button, TextField, MenuItem, Typography, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import axios from 'axios';

interface GeneralHolidayFormProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void; // Nueva prop para la función de actualización
}

const GeneralHolidayForm: React.FC<GeneralHolidayFormProps> = ({ open, onClose, onSuccess }) => {
    const [name, setName] = useState<string>('INVIERNO');
    const [startDate, setStartDate] = useState<string>(new Date().toISOString().slice(0, 10)); // Solo la fecha
    const [endDate, setEndDate] = useState<string>(new Date().toISOString().slice(0, 10)); // Solo la fecha 
    const [year, setYear] = useState<number>(new Date().getFullYear());
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const payload = {
                name,
                type: 'general',
                startDate: `${startDate}T00:00:00.000Z`, // Establece la hora por defecto para startDate
                endDate: `${endDate}T23:59:59.999Z`,
                year
            };

            await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/general-holiday-periods`, payload);
            setSuccess('Receso general creado exitosamente');
            setLoading(false);
            onClose(); // Cierra el diálogo después de guardar
            onSuccess(); // Llama a la función de actualización
        } catch (error) {
            console.error('Error al crear el receso general:', error);
            setError('Hubo un problema al crear el receso.');
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Crear Receso</DialogTitle>
            <DialogContent>
                <form onSubmit={handleFormSubmit}>
                    <TextField
                        select
                        label="Nombre del Receso"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        fullWidth
                        margin="normal"
                    >
                        <MenuItem value="INVIERNO">Invierno</MenuItem>
                        <MenuItem value="FINDEGESTION">Fin de Gestión</MenuItem>
                    </TextField>

                    <TextField
                        label="Fecha de Inicio"
                        type="date" // Cambiado a 'date'
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        fullWidth
                        margin="normal"
                        InputLabelProps={{
                            shrink: true,
                        }}
                    />

                    <TextField
                        label="Fecha de Fin"
                        type="date" // Cambiado a 'date'
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        fullWidth
                        margin="normal"
                        InputLabelProps={{
                            shrink: true,
                        }}
                    />

                    <TextField
                        label="Año"
                        type="number"
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        fullWidth
                        margin="normal"
                    />
                    {error && <Typography variant="body2" color="error" mt={2}>{error}</Typography>}
                    {success && <Typography variant="body2" color="success" mt={2}>{success}</Typography>}
                    <Button type="submit" variant="contained" color="primary" disabled={loading}>
                        {loading ? 'Guardando...' : 'Guardar Receso'}
                    </Button>
                </form>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="secondary">Cancelar</Button>
            </DialogActions>
        </Dialog>
    );
};

export default GeneralHolidayForm;
