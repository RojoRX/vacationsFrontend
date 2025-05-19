import React, { useState } from 'react';
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
import axios from 'axios';

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

            // Si el mensaje es un array (como suele pasar en NestJS con validaciones)
            if (Array.isArray(message)) {
                setError(message.join(' '));
            } else {
                setError(message);
            }
        }

        setLoading(false);
    };

    return (
        <Dialog open={open} onClose={onClose}>
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

                    {error && (
                        <Typography variant="body2" color="error" mt={2}>
                            {error}
                        </Typography>
                    )}
                    {success && (
                        <Typography variant="body2" color="success.main" mt={2}>
                            {success}
                        </Typography>
                    )}

                    <Button type="submit" variant="contained" color="primary" disabled={loading} fullWidth>
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

export default CustomHolidayForm;
