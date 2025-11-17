import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  MenuItem,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  CircularProgress,
  IconButton,
  InputAdornment,
  Alert
} from '@mui/material';
import { Event as EventIcon } from '@mui/icons-material';
import axios from 'src/lib/axios';
import getBusinessDays from 'src/utils/businessDays';

interface AdministrativeHolidayFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface AdministrativeHolidayPeriod {
  name: 'INVIERNO_ADMIN' | 'FINDEGESTION_ADMIN';
  startDate: string;
  endDate: string;
}

// Mapeo de claves internas a valores que espera el backend (enum)
const HOLIDAY_VALUES: Record<AdministrativeHolidayPeriod['name'], string> = {
  INVIERNO_ADMIN: 'INVIERNO',
  FINDEGESTION_ADMIN: 'FINDEGESTION',
};

const AdministrativeHolidayForm: React.FC<AdministrativeHolidayFormProps> = ({
  open,
  onClose,
  onSuccess
}) => {
  const [newHoliday, setNewHoliday] = useState<Partial<AdministrativeHolidayPeriod>>({
    name: 'INVIERNO_ADMIN',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const [errors, setErrors] = useState({
    name: '',
    startDate: '',
    endDate: '',
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const validateForm = (): boolean => {
    const newErrors = { name: '', startDate: '', endDate: '' };
    let isValid = true;

    if (!newHoliday.name) {
      newErrors.name = 'El tipo de receso es requerido';
      isValid = false;
    }

    if (!newHoliday.startDate) {
      newErrors.startDate = 'La fecha de inicio es requerida';
      isValid = false;
    }

    if (!newHoliday.endDate) {
      newErrors.endDate = 'La fecha de fin es requerida';
      isValid = false;
    } else if (newHoliday.startDate && new Date(newHoliday.endDate) < new Date(newHoliday.startDate)) {
      newErrors.endDate = 'La fecha de fin no puede ser anterior a la de inicio';
      isValid = false;
    }

    setErrors(newErrors);
    
return isValid;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setErrorMessage('');

    try {
      const payload = {
        name: HOLIDAY_VALUES[newHoliday.name as keyof typeof HOLIDAY_VALUES],
        startDate: `${newHoliday.startDate}T00:00:00.000Z`,
        endDate: `${newHoliday.endDate}T23:59:59.999Z`,
      };

      await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/administrative-holiday-periods`, payload);

      // Reset form
      setNewHoliday({
        name: 'INVIERNO_ADMIN',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating administrative holiday:', error);
      setErrorMessage(
        axios.isAxiosError(error)
          ? error.response?.data?.message || 'Error al crear el receso administrativo'
          : 'Error al crear el receso administrativo'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const startDate = e.target.value;
    setNewHoliday(prev => ({ ...prev, startDate }));

    if (newHoliday.endDate && new Date(newHoliday.endDate) < new Date(startDate)) {
      setNewHoliday(prev => ({ ...prev, endDate: '' }));
      setErrors(prev => ({ ...prev, endDate: 'Seleccione una fecha posterior a la de inicio' }));
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const endDate = e.target.value;
    setNewHoliday(prev => ({ ...prev, endDate }));

    if (newHoliday.startDate && new Date(endDate) < new Date(newHoliday.startDate)) {
      setErrors(prev => ({ ...prev, endDate: 'La fecha de fin no puede ser anterior a la de inicio' }));
    } else {
      setErrors(prev => ({ ...prev, endDate: '' }));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Crear Nuevo Receso Administrativo</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          {errorMessage && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorMessage}
            </Alert>
          )}

          <TextField
            label="Tipo de Receso"
            select
            fullWidth
            margin="normal"
            value={newHoliday.name || ''}
            onChange={(e) => setNewHoliday(prev => ({ ...prev, name: e.target.value as AdministrativeHolidayPeriod['name'] }))}
            error={!!errors.name}
            helperText={errors.name}
            required
          >
            <MenuItem value="INVIERNO_ADMIN">Invierno</MenuItem>
            <MenuItem value="FINDEGESTION_ADMIN">Fin de Gestión</MenuItem>
          </TextField>

          <TextField
            label="Fecha de Inicio"
            type="date"
            fullWidth
            margin="normal"
            value={newHoliday.startDate || ''}
            onChange={handleStartDateChange}
            InputLabelProps={{ shrink: true }}
            error={!!errors.startDate}
            helperText={errors.startDate}
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton edge="end">
                    <EventIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          <TextField
            label="Fecha de Fin"
            type="date"
            fullWidth
            margin="normal"
            value={newHoliday.endDate || ''}
            onChange={handleEndDateChange}
            InputLabelProps={{ shrink: true }}
            error={!!errors.endDate}
            helperText={errors.endDate}
            disabled={!newHoliday.startDate}
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton edge="end">
                    <EventIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          {newHoliday.startDate && newHoliday.endDate && (
            <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
              Días hábiles: {getBusinessDays(new Date(newHoliday.startDate), new Date(newHoliday.endDate))}
            </Typography>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} color="inherit" disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            color="primary"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Creando...' : 'Crear Receso'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AdministrativeHolidayForm;
