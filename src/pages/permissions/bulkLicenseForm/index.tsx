import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  IconButton,
  Typography,
  useTheme,
  Alert,
  Snackbar,
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Event as EventIcon
} from '@mui/icons-material';
import axios from 'src/lib/axios';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import esLocale from 'date-fns/locale/es';
import getBusinessDays from 'src/utils/businessDays';

interface LicenseFormData {
  timeRequested: string;
  startDate: Date | null;
  endDate: Date | null;
  startHalfDay: 'Completo' | 'Media Mañana' | 'Media Tarde';
  endHalfDay: 'Completo' | 'Media Mañana' | 'Media Tarde';
}
interface BulkLicenseFormProps {
  open: boolean;
  onClose: () => void;
  userId: number;
  onSuccess: () => void;
}

const BulkLicenseForm: React.FC<BulkLicenseFormProps> = ({ open, onClose, userId, onSuccess }) => {
  const theme = useTheme();
  // Estado inicial
  const [licenses, setLicenses] = useState<LicenseFormData[]>([{
    timeRequested: 'Día Completo',
    startDate: null,
    endDate: null,
    startHalfDay: 'Completo',
    endHalfDay: 'Completo'
  }]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<number, string>>({});

  const handleAddLicense = () => {
    setLicenses([...licenses, {
      timeRequested: 'Día Completo',
      startDate: null,
      endDate: null,
      startHalfDay: 'Completo',
      endHalfDay: 'Completo'
    }]);
  };

  const handleRemoveLicense = (index: number) => {
    const newLicenses = [...licenses];
    newLicenses.splice(index, 1);
    setLicenses(newLicenses);

    // Limpiar error asociado si existe
    const newErrors = { ...validationErrors };
    delete newErrors[index];
    setValidationErrors(newErrors);
  };

  const handleLicenseChange = (index: number, field: keyof LicenseFormData, value: any) => {
    const newLicenses = [...licenses];
    newLicenses[index][field] = value;

    // Si es Día Completo o Medio Día, sincronizar endDate con startDate
    // En handleLicenseChange
    if (field === 'timeRequested' || field === 'startDate') {
      if (newLicenses[index].timeRequested !== 'Varios Días') {
        newLicenses[index].endDate = newLicenses[index].startDate;
        newLicenses[index].startHalfDay = 'Completo';
        newLicenses[index].endHalfDay = 'Completo';
      }
    }

    setLicenses(newLicenses);

    // Limpiar error al modificar
    if (validationErrors[index]) {
      const newErrors = { ...validationErrors };
      delete newErrors[index];
      setValidationErrors(newErrors);
    }
  };

  const validateLicenses = (): boolean => {
    const errors: Record<number, string> = {};
    let isValid = true;

    licenses.forEach((license, index) => {
      if (!license.startDate) {
        errors[index] = 'Fecha de inicio requerida';
        isValid = false;
      } else if (license.timeRequested === 'Varios Días' && !license.endDate) {
        errors[index] = 'Fecha de fin requerida para varios días';
        isValid = false;
      } else if (license.timeRequested === 'Varios Días' && license.startDate && license.endDate && license.startDate > license.endDate) {
        errors[index] = 'La fecha de fin no puede ser anterior a la de inicio';
        isValid = false;
      }
    });

    setValidationErrors(errors);
    console.log('Estado validationErrors:', errors);
    return isValid;
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!validateLicenses()) {
        return;
      }

      // Al enviar al backend
      const licensesData = licenses.map(l => ({
        licenseType: 'VACACION',
        timeRequested: l.timeRequested,
        startDate: l.startDate?.toISOString().split('T')[0],
        endDate: l.endDate?.toISOString().split('T')[0],
        startHalfDay: l.startHalfDay,
        endHalfDay: l.endHalfDay
      }));

      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/licenses/user/${userId}/multiple`, licensesData);

      if (response.data?.details?.errors) {
        const backendErrors = response.data.details.errors.reduce((acc: Record<number, string>, err: any) => {
          const match = err.message.match(/Licencia (\d+):/);
          if (match) {
            const index = parseInt(match[1]) - 1;
            acc[index] = err.message.replace(`Licencia ${match[1]}: `, '');
          } else {
            // Manejar errores que no están asociados a una licencia específica (opcional)
            setError(err.message);
          }
          return acc;
        }, {});
        setValidationErrors(backendErrors);
        return;
      }




      setSuccess(true);
      onSuccess();
      onClose();
      setLicenses([{ timeRequested: 'Día Completo', startDate: null, endDate: null, startHalfDay:'Completo', endHalfDay:'Completo' }]); // Reset form
    } catch (err: any) {
      console.error('Error al registrar licencias:', err);

      if (err.response?.data?.details && Array.isArray(err.response.data.details)) {
        const backendErrors: Record<number, string> = {};
        err.response.data.details.forEach((detail: any) => {
          // El backend proporciona el índice comenzando desde 1,
          // mientras que el array 'licenses' está indexado desde 0.
          // Ajustamos el índice restando 1.
          backendErrors[detail.index - 1] = detail.message;
        });
        setValidationErrors(backendErrors);
        setError(null); // Limpiar el error general si hay errores específicos
        return; // Importante salir para evitar mostrar el error general
      } else {
        // Si la respuesta del backend no tiene la estructura esperada de 'details',
        // mostramos un mensaje de error general.
        setError(err.response?.data?.message || 'Error al registrar las licencias');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSuccess(false);
    setError(null);
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <EventIcon sx={{ mr: 1 }} />
            <Typography variant="h6">Registrar licencias de vacaciones</Typography>
          </Box>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Complete las fechas para cada licencia de vacaciones:
          </Typography>

          {licenses.map((license, index) => (
            <Box key={index} sx={{
              mb: 3,
              p: 2,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 1,
              position: 'relative',
              // Puedes mantener el cambio de color de fondo si lo deseas
              // backgroundColor: validationErrors[index] ? theme.palette.error.light + '20' : 'inherit'
            }}>
              {licenses.length > 1 && (
                <IconButton
                  sx={{ position: 'absolute', top: 8, right: 8 }}
                  onClick={() => handleRemoveLicense(index)}
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              )}

              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Licencia #{index + 1}
              </Typography>

              {validationErrors[index] && (
                <Alert severity="error" sx={{ mb: 1 }}>
                  {validationErrors[index]}
                </Alert>
              )}

              <Grid container spacing={2}>
                {/* ... tus campos del formulario (TextField, DatePicker, etc.) */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    label="Tiempo solicitado"
                    value={license.timeRequested}
                    onChange={(e) => handleLicenseChange(index, 'timeRequested', e.target.value)}
                  >
                    <MenuItem value="Día Completo">Día completo</MenuItem>
                    <MenuItem value="Medio Día">Medio día</MenuItem>
                    <MenuItem value="Varios Días">Varios días</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={esLocale}>
                    <DatePicker
                      label="Fecha de inicio"
                      value={license.startDate}
                      onChange={(date) => handleLicenseChange(index, 'startDate', date)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!validationErrors[index],
                          helperText: '' // Ya mostramos el error con Alert
                        }
                      }}
                    />
                  </LocalizationProvider>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={esLocale}>
                    <DatePicker
                      label="Fecha de fin"
                      value={license.endDate}
                      onChange={(date) => {
                        if (license.timeRequested === 'Varios Días') {
                          handleLicenseChange(index, 'endDate', date);
                        }
                      }}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          disabled: license.timeRequested !== 'Varios Días',
                          error: !!validationErrors[index],
                          helperText: license.timeRequested !== 'Varios Días' ?
                            'Automáticamente igual a fecha de inicio' : '' // Ya mostramos el error con Alert
                        }
                      }}
                      minDate={license.startDate || undefined}
                      disabled={license.timeRequested !== 'Varios Días'}
                    />
                    {license.timeRequested === 'Varios Días' && (
                      <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            select
                            fullWidth
                            label="Inicio del día"
                            value={license.startHalfDay}
                            onChange={(e) => handleLicenseChange(index, 'startHalfDay', e.target.value)}
                          >
                            <MenuItem value="Completo">Día completo</MenuItem>
                            {/**<MenuItem value="Media Mañana">Media mañana</MenuItem> */}
                            <MenuItem value="Media Tarde">Media tarde</MenuItem>
                          </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            select
                            fullWidth
                            label="Fin del día"
                            value={license.endHalfDay}
                            onChange={(e) => handleLicenseChange(index, 'endHalfDay', e.target.value)}
                          >
                            <MenuItem value="Completo">Día completo</MenuItem>
                            <MenuItem value="Media Mañana">Media mañana</MenuItem>
                          </TextField>
                          <Typography variant="caption" color="text.secondary">
                            El último día solo permite Media Mañana o Día Completo para mantener la continuidad de la licencia
                          </Typography>
                        </Grid>
                      </Grid>
                    )}

                    {license.startDate && license.endDate && (
                      <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                        Días hábiles: {getBusinessDays(license.startDate, license.endDate)}
                      </Typography>
                    )}

                  </LocalizationProvider>
                </Grid>
              </Grid>
            </Box>
          ))}

          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddLicense}
            sx={{ mt: 1 }}
          >
            Agregar otra licencia
          </Button>

        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} color="secondary" disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Registrando...' : 'Registrar Licencias'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={success} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          Licencias registradas exitosamente!
        </Alert>
      </Snackbar>

      <Snackbar open={!!error && Object.keys(validationErrors).length === 0} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

    </>
  );
};

export default BulkLicenseForm;