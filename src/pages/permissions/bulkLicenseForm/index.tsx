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
import axios from 'axios';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import esLocale from 'date-fns/locale/es';

interface LicenseFormData {
  timeRequested: string;
  startDate: Date | null;
  endDate: Date | null;
}

interface BulkLicenseFormProps {
  open: boolean;
  onClose: () => void;
  userId: number;
  onSuccess: () => void;
}

const BulkLicenseForm: React.FC<BulkLicenseFormProps> = ({ open, onClose, userId, onSuccess }) => {
  const theme = useTheme();
  const [licenses, setLicenses] = useState<LicenseFormData[]>([
    {
      timeRequested: 'Día Completo',
      startDate: null,
      endDate: null
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleAddLicense = () => {
    setLicenses([...licenses, {
      timeRequested: 'Día Completo',
      startDate: null,
      endDate: null
    }]);
  };

  const handleRemoveLicense = (index: number) => {
    const newLicenses = [...licenses];
    newLicenses.splice(index, 1);
    setLicenses(newLicenses);
  };

  const handleLicenseChange = (index: number, field: keyof LicenseFormData, value: any) => {
    const newLicenses = [...licenses];
    newLicenses[index][field] = value;

    // Si es Día Completo o Medio Día, solo se usa startDate
    if ((field === 'timeRequested') && (value === 'Día Completo' || value === 'Medio Día')) {
      newLicenses[index].endDate = newLicenses[index].startDate;
    }

    // Si se cambia startDate y es Día Completo o Medio Día, también igualamos endDate
    if ((field === 'startDate') &&
      (newLicenses[index].timeRequested === 'Día Completo' || newLicenses[index].timeRequested === 'Medio Día')) {
      newLicenses[index].endDate = value;
    }

    setLicenses(newLicenses);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      const invalid = licenses.some(l =>
        !l.startDate ||
        (!l.endDate && l.timeRequested === 'Varios Días') ||
        (l.timeRequested === 'Varios Días' && l.startDate! > l.endDate!)
      );

      if (invalid) {
        throw new Error('Verifique las fechas: algunas son inválidas o incompletas.');
      }

      const licensesData = licenses.map(l => ({
        licenseType: 'VACACION',
        timeRequested: l.timeRequested,
        startDate: l.startDate?.toISOString().split('T')[0],
        endDate: l.endDate?.toISOString().split('T')[0]
      }));

      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/licenses/user/${userId}/multiple`, licensesData);
      console.log(` a la verga`)
      console.log(response.data)
      
      setSuccess(true);
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Error al registrar las licencias');
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
              position: 'relative'
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

              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Licencia #{index + 1}
              </Typography>

              <Grid container spacing={2}>
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
                        textField: { fullWidth: true }
                      }}
                    />
                  </LocalizationProvider>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={esLocale}>
                    <DatePicker
                      label="Fecha de fin"
                      value={license.endDate}
                      onChange={(date) => handleLicenseChange(index, 'endDate', date)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          disabled: license.timeRequested !== 'Varios Días'
                        }
                      }}
                      minDate={license.startDate || undefined}
                    />
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
          <Button onClick={onClose} color="secondary">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {loading ? 'Registrando...' : 'Registrar Licencias'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={success} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          Licencias registradas exitosamente!
        </Alert>
      </Snackbar>

      <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
};

export default BulkLicenseForm;
