import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    TextField,
    IconButton,
    Snackbar,
    Alert,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Paper,
    Typography
} from '@mui/material';
import { Download, Close } from '@mui/icons-material';
import reportService from 'src/services/report.service';


interface UserReportModalProps {
    open: boolean;
    onClose: () => void;
    defaultCi?: string;
    fechaIngreso?: string;
}

const UserReportModal: React.FC<UserReportModalProps> = ({ open, onClose, defaultCi = '', fechaIngreso }) => {
    const [ci, setCi] = useState(defaultCi); // Carnet de identidad ahora es solo lectura
    const [year, setYear] = useState<number | ''>('');
    const [month, setMonth] = useState<number | ''>('');
    const [isLoading, setIsLoading] = useState(false);
    const minYear = fechaIngreso ? new Date(fechaIngreso).getFullYear() : 1970;
    const [error, setError] = useState<string | null>(null);
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: currentYear - minYear + 1 }, (_, i) => minYear + i);
    const months = [
        { value: 1, label: 'Enero' },
        { value: 2, label: 'Febrero' },
        { value: 3, label: 'Marzo' },
        { value: 4, label: 'Abril' },
        { value: 5, label: 'Mayo' },
        { value: 6, label: 'Junio' },
        { value: 7, label: 'Julio' },
        { value: 8, label: 'Agosto' },
        { value: 9, label: 'Septiembre' },
        { value: 10, label: 'Octubre' },
        { value: 11, label: 'Noviembre' },
        { value: 12, label: 'Diciembre' },
    ];

    useEffect(() => {
        setCi(defaultCi); // Asegurar que el defaultCi se aplique al montar o cambiar
    }, [defaultCi]);

    const handleDownload = async () => {
        if (!ci) {
            setError('El carnet de identidad es requerido');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await reportService.downloadUserReport({
                ci,
                year: year ? Number(year) : undefined,
                month: month ? Number(month) : undefined
            });
            onClose();
        } catch (err) {
            console.error('Error al descargar:', err);
            setError('Error al descargar el reporte. Por favor intente nuevamente.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCloseError = () => {
        setError(null);
    };

    return (
        <>
            <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box display="flex" alignItems="center">
                            <Download sx={{ mr: 1 }} />
                            Reporte de Usuario
                        </Box>
                        <IconButton onClick={onClose} disabled={isLoading}>
                            <Close />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent dividers sx={{ pt: 2 }}>
                    <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <TextField
                            label="Carnet de Identidad"
                            value={ci}
                            InputProps={{
                                readOnly: true,
                            }}
                            fullWidth
                        />

                        <Box display="flex" gap={2}>
                            <FormControl fullWidth>
                                <InputLabel id="year-label">Año (Opcional)</InputLabel>
                                <Select
                                    labelId="year-label"
                                    id="year"
                                    value={year}
                                    onChange={(e) => setYear(e.target.value ? Number(e.target.value) : '')}
                                    MenuProps={{ PaperProps: { style: { maxHeight: 200 } } }}
                                >
                                    <MenuItem value="">Todos los años</MenuItem>
                                    {years.map((y) => (
                                        <MenuItem key={y} value={y}>{y}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl fullWidth>
                                <InputLabel id="month-label">Mes (Opcional)</InputLabel>
                                <Select
                                    labelId="month-label"
                                    id="month"
                                    value={month}
                                    onChange={(e) => setMonth(e.target.value ? Number(e.target.value) : '')}
                                >
                                    <MenuItem value="">Todos los meses</MenuItem>
                                    {months.map((m) => (
                                        <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                        {/* Leyenda informativa */}
                        <Paper elevation={0} sx={{
                            p: 2,
                            bgcolor: 'background.default', // Usa el color de fondo predeterminado
                            borderLeft: '4px solid primary.main'
                        }}>
                            <Typography variant="body2" color="text.secondary">
                                <strong>Opciones de reporte:</strong>
                                <ul style={{ marginTop: 4, marginBottom: 0, paddingLeft: 20 }}>
                                    <li>Dejar ambos campos en blanco para generar un reporte completo de todos los años</li>
                                    <li>Seleccionar solo el año para obtener un reporte anual completo</li>
                                    <li>Seleccionar año y mes para un reporte mensual específico</li>
                                </ul>
                            </Typography>
                        </Paper>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose} color="inherit" disabled={isLoading}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleDownload}
                        color="primary"
                        variant="contained"
                        disabled={isLoading || !ci}
                        startIcon={isLoading ? <CircularProgress size={20} /> : <Download />}
                    >
                        Descargar Reporte
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={!!error}
                autoHideDuration={6000}
                onClose={handleCloseError}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
                    {error}
                </Alert>
            </Snackbar>
        </>
    );
};

export default UserReportModal;