import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    CircularProgress,
    IconButton,
    MenuItem,
    Alert,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import axios from 'src/lib/axios';
import CloseIcon from '@mui/icons-material/Close';

interface UserConfigDialogProps {
    open: boolean;
    onClose: () => void;
    userId: number;
    fechaIngreso: string; // ejemplo: "2020-03-15"
}

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface UserConfig {
    customStartYear?: number;
    initialVacationBalance?: number;
}

export default function UserConfigDialog({
    open,
    onClose,
    userId,
    fechaIngreso,
}: UserConfigDialogProps) {
    const [config, setConfig] = useState<UserConfig | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isNewConfig, setIsNewConfig] = useState(false);

    const currentYear = new Date().getFullYear();
    const startYear = new Date(fechaIngreso).getFullYear();

    const yearOptions = useMemo(() => {
        const years = [];
        for (let y = startYear; y <= currentYear; y++) {
            years.push(y);
        }
        return years;
    }, [startYear, currentYear]);

    const isConfigValid =
        config?.customStartYear !== undefined ||
        config?.initialVacationBalance !== undefined;

    const fetchConfig = async () => {
        setLoading(true);
        setError(null);
        setMessage(null);
        try {
            const res = await axios.get(`${API_URL}/user-config/${userId}`);
            //console.log('✅ Configuración obtenida:', res.data);
            setConfig(res.data);
            setIsNewConfig(false);
        } catch (err: any) {
            if (err.response?.status === 404) {
                //console.log('ℹ️ No se encontró configuración previa, se preparará para crear.');
                setConfig({});
                setIsNewConfig(true);
            } else {
                console.error('❌ Error al obtener la configuración:', err);
                setError('Error al cargar la configuración');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: keyof UserConfig, value: string) => {
        let parsed = parseInt(value, 10);
        if (field === 'initialVacationBalance') {
            parsed = Math.max(0, Math.min(100, parsed
                
            ));
        }
        setConfig((prev) => ({
            ...prev,
            [field]: isNaN(parsed) ? undefined : parsed,
        }));
    };

    const handleSave = async () => {
        if (!config) return;

        if (
            config.customStartYear === undefined &&
            config.initialVacationBalance === undefined
        ) {
            setError('Debe ingresar al menos un valor para guardar la configuración.');
            return;
        }

        setSaving(true);
        setError(null);
        setMessage(null);

        try {
            if (isNewConfig) {
                //console.log('📤 Creando nueva configuración:', config);
                await axios.post(`${API_URL}/user-config`, {
                    ...config,
                    userId,
                });
            } else {
                //console.log('🔧 Actualizando configuración existente:', config);
                await axios.patch(`${API_URL}/user-config/${userId}`, config);
            }

            setMessage('¡Configuración guardada correctamente!');
            setIsNewConfig(false);
        } catch (err) {
            console.error('❌ Error al guardar configuración:', err);
            setError('Error al guardar la configuración');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            await axios.delete(`${API_URL}/user-config/${userId}`);
            setConfig(null);
            setMessage('Configuración eliminada correctamente.');
        } catch {
            setError('Error al eliminar configuración');
        }
    };

    useEffect(() => {
        if (open) {
            fetchConfig();
        }
    }, [open]);

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>
                Configuración de Vacaciones del Usuario
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{ position: 'absolute', right: 8, top: 8 }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers>
                {loading ? (
                    <Box display="flex" justifyContent="center" my={3}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Box display="flex" flexDirection="column" gap={2}>
                        {config && Object.keys(config).length === 0 && (
                            <Alert severity="info">
                                Este usuario no tiene configuración previa. Se creará una nueva.
                            </Alert>
                        )}

                        {error && <Alert severity="error">{error}</Alert>}
                        {message && <Alert severity="success">{message}</Alert>}

                        <TextField
                            select
                            label="Año de inicio de conteo personalizado"
                            value={config?.customStartYear ?? ''}
                            onChange={(e) => handleChange('customStartYear', e.target.value)}
                            fullWidth
                        >
                            {yearOptions.map((year) => (
                                <MenuItem key={year} value={year}>
                                    {year}
                                </MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            label="Saldo inicial de vacaciones"
                            type="number"
                            inputProps={{ min: -100, max: 100 }}
                            value={config?.initialVacationBalance ?? ''}
                            onChange={(e) => handleChange('initialVacationBalance', e.target.value)}
                            fullWidth
                        />
                    </Box>
                )}
            </DialogContent>

            <DialogActions>
                {config && (
                    <Button color="error" onClick={handleDelete}>
                        Eliminar Configuración
                    </Button>
                )}
                <Button onClick={onClose} disabled={saving}>
                    Cancelar
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={saving || !isConfigValid}
                >
                    {saving ? <CircularProgress size={20} /> : 'Guardar'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
