import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Typography,
    Box,
    CircularProgress,
    InputAdornment,
    Alert,
    Divider,
    Chip,
    FormControlLabel,
    Checkbox,
} from '@mui/material';
import {
    Event as EventIcon,
    EventAvailable as EventAvailableIcon,
    Close as CloseIcon,
    Save as SaveIcon,
} from '@mui/icons-material';
import { SelectChangeEvent } from '@mui/material';
import axios from 'src/lib/axios';
import { License } from 'src/interfaces/licenseTypes';
import getBusinessDays from 'src/utils/businessDays';
import { ReactI18NextChild } from 'react-i18next';

interface EditLicenseDialogProps {
    open: boolean;
    onClose: () => void;
    license: License;
    onUpdate?: (updated: License) => void; // nuevo patrón, opcional
    refreshList?: () => void;             // para compatibilidad con componentes antiguos
}



type ApprovalOption = 'null' | 'true' | 'false';

const EditLicenseDialog: React.FC<EditLicenseDialogProps> = ({
    open,
    onClose,
    license,
    refreshList,
    onUpdate
}) => {
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        licenseType: license.licenseType || 'VACACION',
        timeRequested: license.timeRequested || 'Día Completo',
        startDate: license.startDate || '',
        endDate: license.endDate || '',
        startHalfDay: license.startHalfDay || 'Completo',
        endHalfDay: license.endHalfDay || 'Completo',
        immediateSupervisorApproval: (license.immediateSupervisorApproval === null
            ? 'null'
            : license.immediateSupervisorApproval === true
                ? 'true'
                : 'false') as ApprovalOption,
        personalDepartmentApproval: (license.personalDepartmentApproval === null
            ? 'null'
            : license.personalDepartmentApproval === true
                ? 'true'
                : 'false') as ApprovalOption,
        deleted: !!license.deleted,
        reason: license.reason || '',
    });

    useEffect(() => {
        if (open && license) {
            setFormData({
                licenseType: license.licenseType || 'VACACION',
                timeRequested: license.timeRequested || 'Día Completo',
                startDate: license.startDate || '',
                endDate: license.endDate || '',
                startHalfDay: license.startHalfDay || 'Completo',
                endHalfDay: license.endHalfDay || 'Completo',
                immediateSupervisorApproval: (license.immediateSupervisorApproval === null
                    ? 'null'
                    : license.immediateSupervisorApproval === true
                        ? 'true'
                        : 'false') as ApprovalOption,
                personalDepartmentApproval: (license.personalDepartmentApproval === null
                    ? 'null'
                    : license.personalDepartmentApproval === true
                        ? 'true'
                        : 'false') as ApprovalOption,
                deleted: !!license.deleted,
                reason: license.reason || '',
            });
            setError(null);
            setSuccessMsg(null);
        }
    }, [open, license]);

    const handleSelectChange = (event: SelectChangeEvent<string>) => {
        const { name, value } = event.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
            ...(name === 'timeRequested' && { endDate: prev.startDate }), // reset endDate for single-day types
        }));
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target as HTMLInputElement;
        if (type === 'checkbox') {
            setFormData((prev) => ({ ...prev, [name]: checked }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        setFormData((prev) => ({
            ...prev,
            startDate: value,
            ...(prev.timeRequested !== 'Varios Días' && { endDate: value }),
        }));
    };

    const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (new Date(e.target.value) < new Date(formData.startDate)) {
            setError('La fecha de fin no puede ser menor que la fecha de inicio.');
            
return;
        }
        setFormData((prev) => ({ ...prev, endDate: e.target.value }));
    };

    const calculateDays = () => {
        if (!formData.startDate || !formData.endDate) return 0;
        let total = getBusinessDays(new Date(formData.startDate), new Date(formData.endDate));
        if (formData.startHalfDay !== 'Completo') total -= 0.5;
        if (formData.endHalfDay !== 'Completo') total -= 0.5;
        
return total <= 0 ? 0.5 : total;
    };

    const validate = (): boolean => {
        if (!formData.startDate || !formData.endDate) {
            setError('Las fechas de inicio y fin son obligatorias.');
            
return false;
        }
        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            setError('Formato de fecha invalido.');
            
return false;
        }
        if (start > end) {
            setError('La fecha de inicio no puede ser posterior a la fecha de fin.');
            
return false;
        }
        if (formData.timeRequested === 'Medio Día' && formData.startDate !== formData.endDate) {
            setError('La licencia de medio día debe tener la misma fecha de inicio y fin.');
            
return false;
        }
        
return true;
    };

    const convertApproval = (value: string | null): boolean | undefined => {
        if (value === null) return undefined;
        
return value === 'true';
    };


const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
        if (!validate()) {
            setLoading(false);
            
return;
        }

        const payload: Partial<License> = {
            licenseType: formData.licenseType,
            timeRequested: formData.timeRequested,
            startDate: formData.startDate,
            endDate: formData.timeRequested === 'Medio Día' ? formData.startDate : formData.endDate,
            startHalfDay: formData.startHalfDay,
            endHalfDay: formData.timeRequested === 'Medio Día' ? formData.startHalfDay : formData.endHalfDay,
            immediateSupervisorApproval: convertApproval(formData.immediateSupervisorApproval),
            personalDepartmentApproval: convertApproval(formData.personalDepartmentApproval),
            deleted: !!formData.deleted,
            reason: formData.reason?.trim() || undefined,
        };

        const response = await axios.put<License>(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/licenses/${license.id}`,
            payload
        );

        // 🔹 Ejecuta los callbacks si existen
        if (onUpdate) {
            onUpdate(response.data);
        }

        if (refreshList) {
            refreshList();
        }

        setSuccessMsg('Licencia actualizada correctamente.');
        onClose();

    } catch (err: any) {
        console.error('Error actualizando licencia:', err);
        setError(
            axios.isAxiosError(err)
                ? err.response?.data?.message || 'Error al actualizar la licencia.'
                : 'Error desconocido'
        );
    } finally {
        setLoading(false);
    }
};


    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Editar Licencia</DialogTitle>

            <DialogContent dividers>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {successMsg && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        {successMsg}
                    </Alert>
                )}

                <FormControl fullWidth margin="normal">
                    <InputLabel id="timeRequested-label">Tiempo Solicitado *</InputLabel>
                    <Select
                        labelId="timeRequested-label"
                        name="timeRequested"
                        value={formData.timeRequested}
                        onChange={handleSelectChange}
                        disabled={loading}
                        required
                    >
                        <MenuItem value="Medio Día">Medio Día</MenuItem>
                        <MenuItem value="Día Completo">Día Completo</MenuItem>
                        <MenuItem value="Varios Días">Varios Días</MenuItem>
                    </Select>
                </FormControl>

                <TextField
                    label="Fecha de Inicio *"
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleStartDateChange}
                    fullWidth
                    margin="normal"
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <EventIcon color="action" />
                            </InputAdornment>
                        ),
                    }}
                    disabled={loading}
                />

                {formData.timeRequested === 'Medio Día' && (
                    <FormControl fullWidth margin="normal">
                        <InputLabel id="halfday-start">Turno *</InputLabel>
                        <Select
                            labelId="halfday-start"
                            name="startHalfDay"
                            value={formData.startHalfDay}
                            onChange={(e) => setFormData((prev) => ({ ...prev, startHalfDay: e.target.value as any }))}
                            disabled={loading}
                        >
                            <MenuItem value="Media Mañana">Media Mañana</MenuItem>
                            <MenuItem value="Media Tarde">Media Tarde</MenuItem>
                        </Select>
                    </FormControl>
                )}

                {formData.timeRequested === 'Varios Días' && (
                    <>
                        <FormControl fullWidth margin="normal">
                            <InputLabel>Inicio del Día</InputLabel>
                            <Select
                                name="startHalfDay"
                                value={formData.startHalfDay}
                                onChange={(e) => setFormData((prev) => ({ ...prev, startHalfDay: e.target.value as any }))}
                                disabled={loading}
                            >
                                <MenuItem value="Completo">Día Completo</MenuItem>
                                <MenuItem value="Media Tarde">Media Tarde</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            label="Fecha de Fin *"
                            type="date"
                            name="endDate"
                            value={formData.endDate}
                            onChange={handleEndDateChange}
                            fullWidth
                            margin="normal"
                            InputLabelProps={{ shrink: true }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <EventAvailableIcon color="action" />
                                    </InputAdornment>
                                ),
                            }}
                            disabled={loading}
                        />

                        <FormControl fullWidth margin="normal">
                            <InputLabel>Fin del Día</InputLabel>
                            <Select
                                name="endHalfDay"
                                value={formData.endHalfDay}
                                onChange={(e) => setFormData((prev) => ({ ...prev, endHalfDay: e.target.value as any }))}
                                disabled={loading}
                            >
                                <MenuItem value="Completo">Día Completo</MenuItem>
                                <MenuItem value="Media Mañana">Media Mañana</MenuItem>
                            </Select>
                        </FormControl>

                        <Typography variant="caption" color="text.secondary">
                            Nota: Para varios días, el inicio puede ser “Media Tarde” y el fin “Media Mañana”.
                        </Typography>
                    </>
                )}

                <Divider sx={{ my: 2 }} />

                <Chip color="info" label={`Total estimado: ${calculateDays()} días hábiles`} variant="outlined" />

                <Divider sx={{ my: 2 }} />

                {/* Aprobaciones (tri-estado) */}
                <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
                    <FormControl sx={{ minWidth: 180 }}>
                        <InputLabel id="sup-approval-label">Aprobación Supervisor</InputLabel>
                        <Select
                            labelId="sup-approval-label"
                            name="immediateSupervisorApproval"
                            value={formData.immediateSupervisorApproval}
                            onChange={handleSelectChange}
                            disabled={loading}
                        >
                            <MenuItem value="null">Pendiente</MenuItem>
                            <MenuItem value="true">Aprobado</MenuItem>
                            <MenuItem value="false">Rechazado</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl sx={{ minWidth: 220 }}>
                        <InputLabel id="personal-approval-label">Aprobación Depto. Personal</InputLabel>
                        <Select
                            labelId="personal-approval-label"
                            name="personalDepartmentApproval"
                            value={formData.personalDepartmentApproval}
                            onChange={handleSelectChange}
                            disabled={loading}
                        >
                            <MenuItem value="null">Pendiente</MenuItem>
                            <MenuItem value="true">Aprobado</MenuItem>
                            <MenuItem value="false">Rechazado</MenuItem>
                        </Select>
                    </FormControl>
                </Box>


                {/* Eliminar */}
                <Box sx={{ mt: 1 }}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                name="deleted"
                                checked={!!formData.deleted}
                                onChange={handleInputChange}
                                color="error"
                                disabled={loading}
                            />
                        }
                        label="Marcar como eliminada"
                    />
                    {formData.deleted && (
                        <Alert severity="warning" sx={{ mt: 1 }}>
                            Esta licencia será marcada como eliminada.
                        </Alert>
                    )}
                </Box>

                {/* Mostrar feriados detectados (si vienen) */}
                {license.detectedHolidays && license.detectedHolidays.length > 0 && (
                    <Box mt={2}>
                        <Typography variant="subtitle2">Feriados detectados en el rango:</Typography>
                        <ul style={{ marginTop: 8 }}>
                            {license.detectedHolidays.map((h: { date: boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | React.ReactFragment | React.Key | null | undefined; description: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | React.ReactFragment | React.ReactPortal | Iterable<ReactI18NextChild> | null | undefined; }) => (
                                <li key={String(h.date)}>
                                    {h.date} — {h.description}
                                </li>

                            ))}
                        </ul>
                    </Box>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} startIcon={<CloseIcon />} disabled={loading}>
                    Cancelar
                </Button>

                <Button
                    variant="contained"
                    color="primary"
                    startIcon={loading ? <CircularProgress size={18} /> : <SaveIcon />}
                    disabled={loading}
                    onClick={handleSubmit}
                >
                    Guardar Cambios
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditLicenseDialog;
