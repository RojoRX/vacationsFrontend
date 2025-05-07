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
  Divider,
  useTheme,
  Alert,
  Snackbar
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
  licenseType: string;
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
      licenseType: 'VACACION',
      timeRequested: 'Día Completo',
      startDate: null,
      endDate: null
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleAddLicense = () => {
    setLicenses([
      ...licenses,
      {
        licenseType: 'VACACION',
        timeRequested: 'Día Completo',
        startDate: null,
        endDate: null
      }
    ]);
  };

  const handleRemoveLicense = (index: number) => {
    const newLicenses = [...licenses];
    newLicenses.splice(index, 1);
    setLicenses(newLicenses);
  };

  const handleLicenseChange = (index: number, field: keyof LicenseFormData, value: any) => {
    const newLicenses = [...licenses];
    newLicenses[index][field] = value;
    
    if (field === 'timeRequested' && value === 'Día Completo') {
      newLicenses[index].endDate = newLicenses[index].startDate;
    }
    
    setLicenses(newLicenses);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      const invalidLicenses = licenses.some(license => 
        !license.startDate || 
        !license.endDate || 
        (license.timeRequested === 'Varios Días' && license.startDate > license.endDate)
      );

      if (invalidLicenses) {
        throw new Error('Por favor verifique las fechas de las licencias');
      }

      const licensesData = licenses.map(license => ({
        licenseType: license.licenseType,
        timeRequested: license.timeRequested,
        startDate: license.startDate?.toISOString().split('T')[0],
        endDate: license.endDate?.toISOString().split('T')[0]
      }));

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/${userId}/multiple`,
        licensesData
      );

      setSuccess(true);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error al registrar licencias:', err);
      setError(err instanceof Error ? err.message : 'Ocurrió un error al registrar las licencias');
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
            <Typography variant="h6">Registrar licencias</Typography>
          </Box>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent dividers>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Complete los datos para cada licencia que desea registrar:
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
                    label="Tipo de licencia"
                    value={license.licenseType}
                    onChange={(e) => handleLicenseChange(index, 'licenseType', e.target.value)}
                    sx={{ mb: 2 }}
                  >
                    <option value="VACACION">Vacaciones</option>
                    <option value="ENFERMEDAD">Enfermedad</option>
                    <option value="PERSONAL">Personal</option>
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    label="Tiempo solicitado"
                    value={license.timeRequested}
                    onChange={(e) => handleLicenseChange(index, 'timeRequested', e.target.value)}
                    sx={{ mb: 2 }}
                  >
                    <option value="Día Completo">Día completo</option>
                    <option value="Varios Días">Varios días</option>
                    <option value="Medio Día">Medio día</option>
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
                          fullWidth: true
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
                      onChange={(date) => handleLicenseChange(index, 'endDate', date)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          disabled: license.timeRequested === 'Día Completo'
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

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} color="secondary">
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

      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          Licencias registradas exitosamente!
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
};

export default BulkLicenseForm;