import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    TextField,
    Typography,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    MenuItem,
} from '@mui/material';
import axios from 'src/lib/axios';
import getBusinessDays from 'src/utils/businessDays';

interface CustomHolidayFormProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    userId: number;
}

const CustomHolidayForm: React.FC<CustomHolidayFormProps> = ({ open, onClose, onSuccess, userId }) => {
    const [name, setName] = useState<string>('');
    const [startDate, setStartDate] = useState<string>(new Date().toISOString().slice(0, 10));
    const [endDate, setEndDate] = useState<string>(new Date().toISOString().slice(0, 10));
    const [businessDays, setBusinessDays] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Calcular días hábiles cuando cambian las fechas
    useEffect(() => {
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const days = getBusinessDays(start, end);
            setBusinessDays(days);
        }
    }, [startDate, endDate]);

    const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const payload = {
                name,
                startDate: `${startDate}T00:00:00.000Z`,
                endDate: `${endDate}T23:59:59.999Z`,
                userId,
            };

            await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user-holiday-periods`, payload);
            setSuccess('Receso personalizado creado exitosamente');
            onClose();
            onSuccess();
        } catch (err: any) {
            console.error('Error al crear el receso personalizado:', err);
            const message =
                err?.response?.data?.message ||
                err?.message ||
                'Hubo un problema al crear el receso.';
            setError(Array.isArray(message) ? message.join(' ') : message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Crear Receso Personalizado</DialogTitle>
            <DialogContent>
                <form onSubmit={handleFormSubmit}>
                    <TextField
                        select
                        label="Nombre del Receso"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        fullWidth
                        margin="normal"
                        required
                        sx={{ mt: 2 }}
                    >
                        <MenuItem value="INVIERNO">Invierno</MenuItem>
                        <MenuItem value="FINDEGESTION">Fin de Gestión</MenuItem>
                    </TextField>

                    <TextField
                        label="Fecha de Inicio"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        fullWidth
                        margin="normal"
                        required
                        InputLabelProps={{ shrink: true }}
                    />

                    <TextField
                        label="Fecha de Fin"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        fullWidth
                        margin="normal"
                        required
                        InputLabelProps={{ shrink: true }}
                    />

                    {/* Leyenda con días hábiles */}
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                        Período seleccionado: {businessDays} día{businessDays !== 1 ? 's' : ''} hábil{businessDays !== 1 ? 'es' : ''}
                    </Typography>

                    {error && (
                        <Typography variant="body2" color="error" sx={{ mt: 1, mb: 1 }}>
                            {error}
                        </Typography>
                    )}
                    {success && (
                        <Typography variant="body2" color="success.main" sx={{ mt: 1, mb: 1 }}>
                            {success}
                        </Typography>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                        <Button onClick={onClose} color="secondary" sx={{ mr: 1 }}>
                            Cancelar
                        </Button>
                        <Button type="submit" variant="contained" color="primary" disabled={loading}>
                            {loading ? 'Guardando...' : 'Guardar Receso'}
                        </Button>
                    </Box>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default CustomHolidayForm;