import React, { useEffect, useState } from 'react';
import {
    Typography, Button, FormControl, InputLabel,
    Select, MenuItem, Grid, Paper, Dialog, DialogTitle,
    DialogContent, DialogContentText, DialogActions
} from '@mui/material';
import axios from 'src/lib/axios';

const CURRENT_YEAR = new Date().getFullYear();
const START_YEAR = 1990;

const YEARS = Array.from({ length: CURRENT_YEAR - START_YEAR + 1 }, (_, i) => START_YEAR + i);

const SystemConfigEditor = () => {
    const [startYear, setStartYear] = useState<number | null>(null);
    const [selectedYear, setSelectedYear] = useState<number | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const fetchConfig = async () => {
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/system-config/start-counting-year`);
            const year = parseInt(response.data.value, 10);
            if (!isNaN(year)) {
                setStartYear(year);
                setSelectedYear(year);
            } else {
                setStartYear(null);
                setSelectedYear(null);
            }
        } catch (err) {
            console.warn('No se encontró configuración guardada.');
            setStartYear(null);
            setSelectedYear(null);
        }
    };

    const handleSave = async () => {
        try {
            await axios.put(`${process.env.NEXT_PUBLIC_API_BASE_URL}/system-config/start-counting-year`, {
                value: String(selectedYear),
            });
            setStartYear(selectedYear);
            setIsConfirmOpen(false);
        } catch (err) {
            console.error('Error al guardar configuración del sistema', err);
        }
    };

    useEffect(() => {
        fetchConfig();
    }, []);

    return (
        <Paper sx={{ padding: 3, marginTop: 3 }}>
            <Typography variant="h6" gutterBottom>
                Configuración del Sistema - Año de Inicio de Cálculo
            </Typography>

            <Typography variant="body2" color="textSecondary" gutterBottom>
                Esta configuración determina desde qué año el sistema comenzará a contar las vacaciones,
                licencias y recesos para el cálculo de deuda o días disponibles.
            </Typography>

            <Typography sx={{ mt: 2 }} variant="body1">
                Año configurado actualmente:{' '}
                <strong>{startYear !== null ? startYear : 'No definido'}</strong>
            </Typography>

            <Grid container spacing={2} alignItems="center" sx={{ mt: 2 }}>
                <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                        <InputLabel>Año de inicio</InputLabel>
                        <Select
                            value={selectedYear ?? ''}
                            label="Año de inicio"
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                        >
                            {YEARS.map((year) => (
                                <MenuItem key={year} value={year}>
                                    {year}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                    <Button
                        variant="contained"
                        color="primary"
                        disabled={selectedYear === startYear || selectedYear === null}
                        onClick={() => setIsConfirmOpen(true)}
                    >
                        Guardar Cambios
                    </Button>
                </Grid>
            </Grid>
            {startYear !== null && (
                <Button
                    variant="outlined"
                    color="error"
                    sx={{ mt: 2 }}
                    onClick={async () => {
                        try {
                            await axios.delete(`${process.env.NEXT_PUBLIC_API_BASE_URL}/system-config/start-counting-year`);
                            setStartYear(null);
                            setSelectedYear(null);
                        } catch (err) {
                            console.error('Error al eliminar la configuración', err);
                        }
                    }}
                >
                    Quitar configuración
                </Button>
            )}


            {/* Diálogo de confirmación */}
            <Dialog open={isConfirmOpen} onClose={() => setIsConfirmOpen(false)}>
                <DialogTitle>Confirmar cambio</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        ¿Estás seguro de que deseas cambiar el año de inicio del conteo a {selectedYear}?
                        Esta acción puede afectar el cálculo de días disponibles y deuda en el sistema.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsConfirmOpen(false)} color="inherit">
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} color="primary" variant="contained">
                        Confirmar
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
};

export default SystemConfigEditor;
