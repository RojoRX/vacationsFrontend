import React, { useEffect, useState } from 'react';
import {
    Typography, Button, FormControl, InputLabel,
    Select, MenuItem, Grid, Paper, Dialog, DialogTitle,
    DialogContent, DialogContentText, DialogActions, Switch, FormControlLabel,
    Alert, CircularProgress, Box
} from '@mui/material';
import axios from 'src/lib/axios';

const CURRENT_YEAR = new Date().getFullYear();
const START_YEAR = 1990;
const YEARS = Array.from({ length: CURRENT_YEAR - START_YEAR + 1 }, (_, i) => START_YEAR + i);

interface VacationRule {
    id: number;
    validarGestionesAnterioresConDias: boolean | null;
}

interface SystemConfig {
    value: string;
}

const SystemConfigEditor = () => {
    const [startYear, setStartYear] = useState<number | null>(null);
    const [selectedYear, setSelectedYear] = useState<number | null>(null);
    const [validarGestiones, setValidarGestiones] = useState<boolean | null>(null); // Cambiar a null inicial
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const fetchConfig = async () => {
        setLoading(true);
        setError(null);

        try {
            // Obtener configuración del año
            const yearResponse = await axios.get<SystemConfig>(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/system-config/start-counting-year`
            );

            if (yearResponse.data?.value) {
                const year = parseInt(yearResponse.data.value, 10);
                if (!isNaN(year)) {
                    setStartYear(year);
                    setSelectedYear(year);
                }
            } else {
                setStartYear(null);
                setSelectedYear(null);
            }

            // Obtener reglas de vacaciones - CORREGIDO
            const rulesResponse = await axios.get<VacationRule[]>(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/vacation-rules`
            );

            console.log('Respuesta de vacation-rules:', rulesResponse.data); // Para debug

            // Manejar la respuesta como array
            if (Array.isArray(rulesResponse.data) && rulesResponse.data.length > 0) {
                const rule = rulesResponse.data[0];
                // Usar el valor exacto del backend, sin valor por defecto
                setValidarGestiones(rule.validarGestionesAnterioresConDias);
            } else {
                // Si no hay reglas, usar null para indicar que no hay configuración
                setValidarGestiones(null);
            }

        } catch (err: any) {
            console.error('Error fetching configuration:', err);
            //setError('No se pudo cargar la configuración del sistema');

            // En caso de error, establecer como null
            setValidarGestiones(null);
            setStartYear(null);
            setSelectedYear(null);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveYear = async () => {
        setLoading(true);
        setError(null);

        try {
            await axios.put(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/system-config/start-counting-year`,
                {
                    value: String(selectedYear),
                }
            );

            setStartYear(selectedYear);
            setIsConfirmOpen(false);
            setSuccess('Año de inicio actualizado correctamente');

            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            console.error('Error al guardar configuración del sistema', err);
            setError('Error al guardar la configuración del año');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleValidarGestiones = async () => {
        // El nuevo valor debe ser el opuesto del actual
        const newValue = validarGestiones === null ? true : !validarGestiones;
        setValidarGestiones(newValue);

        try {
            await axios.patch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/vacation-rules`,
                {
                    validarGestionesAnterioresConDias: newValue
                }
            );

            setSuccess(`Validación de gestiones ${newValue ? 'activada' : 'desactivada'}`);

            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            console.error('Error al actualizar la validación de gestiones', err);
            setError('Error al actualizar la validación de gestiones');

            // Revertir el cambio en caso de error
            setValidarGestiones(validarGestiones);
        }
    };

    const handleDeleteYear = async () => {
        setLoading(true);
        setError(null);

        try {
            await axios.delete(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/system-config/start-counting-year`
            );

            setStartYear(null);
            setSelectedYear(null);
            setSuccess('Configuración del año eliminada correctamente');

            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            console.error('Error al eliminar la configuración', err);
            setError('Error al eliminar la configuración');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConfig();
    }, []);

    if (loading && validarGestiones === null && !startYear && !selectedYear) {
        return (
            <Paper sx={{ padding: 3, marginTop: 3, textAlign: 'center' }}>
                <CircularProgress />
                <Typography sx={{ mt: 2 }}>Cargando configuración...</Typography>
            </Paper>
        );
    }

    return (
        <Paper sx={{ padding: 3, marginTop: 3 }}>
            <Typography variant="h6" gutterBottom>
                Configuración del Sistema
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
                    {success}
                </Alert>
            )}

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <FormControlLabel
                    control={
                        <Switch
                            checked={Boolean(validarGestiones)} // Convierte a booleano (null/undefined se convierten a false)
                            onChange={handleToggleValidarGestiones}
                            color="primary"
                            disabled={loading}
                        />
                    }
                    label={
                        <Box>
                            <Typography variant="body1" fontWeight="medium">
                                Validar gestiones anteriores con días disponibles
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {validarGestiones === true
                                    ? 'Activado: El sistema verificará los días disponibles de gestiones anteriores'
                                    : 'Desactivado: El sistema no verificará gestiones anteriores'
                                }
                            </Typography>
                        </Box>
                    }
                />
            </Box>

            <Typography sx={{ mt: 2, mb: 2 }} variant="body1">
                Año configurado actualmente:{' '}
                <strong>{startYear !== null ? startYear : 'No definido'}</strong>
                {startYear !== null && (
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                        (A partir de este año se calcularán los días de vacaciones)
                    </Typography>
                )}
            </Typography>

            <Grid container spacing={2} alignItems="center" sx={{ mt: 2 }}>
                <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                        <InputLabel>Año de inicio</InputLabel>
                        <Select
                            value={selectedYear ?? ''}
                            label="Año de inicio"
                            onChange={(e) => setSelectedYear(e.target.value ? Number(e.target.value) : null)}
                            disabled={loading}
                        >
                            <MenuItem value="">
                                <em>Seleccionar año</em>
                            </MenuItem>
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
                        disabled={selectedYear === startYear || selectedYear === null || loading}
                        onClick={() => setIsConfirmOpen(true)}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Guardar Cambios'}
                    </Button>
                </Grid>
            </Grid>

            {startYear !== null && (
                <Button
                    variant="outlined"
                    color="error"
                    sx={{ mt: 2 }}
                    onClick={handleDeleteYear}
                    disabled={loading}
                >
                    Quitar configuración del año
                </Button>
            )}

            {/* Diálogo de confirmación */}
            <Dialog open={isConfirmOpen} onClose={() => !loading && setIsConfirmOpen(false)}>
                <DialogTitle>Confirmar cambio</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        ¿Estás seguro de que deseas cambiar el año de inicio del conteo a {selectedYear}?
                        Esta acción puede afectar el cálculo de días disponibles y deuda en el sistema.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setIsConfirmOpen(false)}
                        color="inherit"
                        disabled={loading}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSaveYear}
                        color="primary"
                        variant="contained"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} /> : null}
                    >
                        {loading ? 'Guardando...' : 'Confirmar'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
};

export default SystemConfigEditor;