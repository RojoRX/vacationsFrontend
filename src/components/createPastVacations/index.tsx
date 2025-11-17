import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    MenuItem,
    Typography,
    Alert,
} from '@mui/material';
import getBusinessDays from 'src/utils/businessDays';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import axios from 'src/lib/axios';

import es from 'date-fns/locale/es';
import { vacationStatusLabels } from 'src/utils/vacationStatusLabels';
import CreatePastVacationDto from 'src/interfaces/createPastVacation.dto';

interface ManagementPeriod {
    startDate: string;
    endDate: string;
    label: string;
}

interface PastVacationDialogProps {
    open: boolean;
    onClose: () => void;
    userId: number;
    userCi: string;
    onSuccess?: () => void; // <-- AGREGAR ESTO
}

export const PastVacationDialog = ({
    open,
    onClose,
    onSuccess,
    userId,
    userCi,
}: PastVacationDialogProps) => {
    const [managementPeriods, setManagementPeriods] = useState<ManagementPeriod[]>([]);
    const [selectedPeriod, setSelectedPeriod] = useState<ManagementPeriod | null>(null);
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [businessDays, setBusinessDays] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    type AllowedPastVacationStatus = 'AUTHORIZED' | 'POSTPONED' | 'DENIED' | 'SUSPENDED';
    const [status, setStatus] = useState<AllowedPastVacationStatus>('AUTHORIZED');
    useEffect(() => {
        if (open && userCi) {
            setLoading(true);
            axios
                .get<ManagementPeriod[]>(`${process.env.NEXT_PUBLIC_API_BASE_URL}/gestion-periods/gestions/${userCi}`)
                .then((res) => setManagementPeriods(res.data))
                .catch(() => setError('Error al cargar períodos de gestión'))
                .finally(() => setLoading(false));
        }
    }, [open, userCi]);

    useEffect(() => {
        if (startDate && endDate) {
            const days = getBusinessDays(startDate, endDate);
            setBusinessDays(days);
        } else {
            setBusinessDays(0);
        }
    }, [startDate, endDate]);

const handleSave = async () => {
  if (!selectedPeriod || !startDate || !endDate || businessDays > 30) return;

  const dto: CreatePastVacationDto = {
    userId,
    requestDate: new Date().toISOString(),
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    status,
    managementPeriodStart: selectedPeriod.startDate,
    managementPeriodEnd: selectedPeriod.endDate,
  };

  setError(null);
  setLoading(true);
  try {
    await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/vacation-requests/pastVacations`, dto);
     if (onSuccess) onSuccess(); 
    onClose(); // Éxito: cerrar diálogo
  } catch (err: any) {
    const backendMessage =
      err?.response?.data?.message ??
      err?.response?.data?.error ??
      err?.message ??
      'Error desconocido al guardar la vacación';

    setError(Array.isArray(backendMessage) ? backendMessage.join(', ') : backendMessage);
  } finally {
    setLoading(false);
  }
};


    const isDateDisabled = (date: Date | null) => {
        if (!selectedPeriod || !date) return true;
        const d = new Date(date);
        const start = new Date(selectedPeriod.startDate);
        const end = new Date(selectedPeriod.endDate);
        
return d < start || d > end;
    };

    const isFormValid =
        !!selectedPeriod &&
        !!startDate &&
        !!endDate &&
        businessDays > 0 &&
        businessDays <= 30;

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
                <DialogTitle>Registrar Vacación Pasada</DialogTitle>
                <DialogContent>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    {loading && <Alert severity="info">Cargando períodos de gestión...</Alert>}

                    <TextField
                        select
                        fullWidth
                        label="Período de Gestión"
                        value={selectedPeriod?.label || ''}
                        onChange={(e) => {
                            const found = managementPeriods.find((p) => p.label === e.target.value);
                            setSelectedPeriod(found || null);
                            if (found) {
                                const start = new Date(found.startDate);
                                setStartDate(start);
                                setEndDate(start);
                            } else {
                                setStartDate(null);
                                setEndDate(null);
                            }
                        }}
                        sx={{ mt: 2 }}
                    >
                        {managementPeriods.map((period) => (
                            <MenuItem key={period.label} value={period.label}>
                                {period.label}
                            </MenuItem>
                        ))}
                    </TextField>

                    <DatePicker
                        label="Fecha de Inicio"
                        value={startDate}
                        onChange={(date) => setStartDate(date ?? null)}
                        shouldDisableDate={(date) => isDateDisabled(date ?? null)}
                        disabled={!selectedPeriod}
                        sx={{ mt: 2, width: '100%' }}
                    />

                    <DatePicker
                        label="Fecha de Fin"
                        value={endDate}
                        onChange={(date) => setEndDate(date ?? null)}
                        shouldDisableDate={(date) => isDateDisabled(date ?? null)}
                        disabled={!selectedPeriod}
                        sx={{ mt: 2, width: '100%' }}
                    />

                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                        Período seleccionado: {businessDays} día{businessDays !== 1 ? 's' : ''} hábil
                        {businessDays !== 1 ? 'es' : ''}
                    </Typography>

                    {businessDays > 30 && (
                        <Typography color="error" variant="body2" sx={{ mb: 1 }}>
                            No se puede registrar más de 30 días hábiles.
                        </Typography>
                    )}
                    <TextField
                        select
                        fullWidth
                        label="Estado"
                        value={status}
                        onChange={(e) => setStatus(e.target.value as AllowedPastVacationStatus)}
                        sx={{ mt: 2 }}
                    >
                        {(['AUTHORIZED', 'POSTPONED', 'DENIED', 'SUSPENDED'] as AllowedPastVacationStatus[]).map((key) => (
                            <MenuItem key={key} value={key}>
                                {vacationStatusLabels[key]}
                            </MenuItem>
                        ))}
                    </TextField>


                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={!isFormValid} variant="contained">
                        Guardar
                    </Button>
                </DialogActions>
            </Dialog>
        </LocalizationProvider>
    );
};
