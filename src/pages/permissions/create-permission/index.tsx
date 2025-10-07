import React, { useEffect, useState } from 'react';
import axios from 'src/lib/axios';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Select, MenuItem, FormControl,
  InputLabel, Typography, Box, Chip, Divider,
  CircularProgress, Alert,
  InputAdornment
} from '@mui/material';
import {
  Event as EventIcon,
  EventAvailable as EventAvailableIcon,
  Close as CloseIcon,
  Check as CheckIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { SelectChangeEvent } from '@mui/material';
import useUser from 'src/hooks/useUser';
import { VacationData } from 'src/interfaces/vacationData';
import getBusinessDays from 'src/utils/businessDays';

interface FormData {
  licenseType: string;
  timeRequested: string;
  startDate: string;
  endDate: string;
  startHalfDay: 'Completo' | 'Media Mañana' | 'Media Tarde';
  endHalfDay: 'Completo' | 'Media Mañana' | 'Media Tarde';

}

interface RequestPermissionDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface AclComponent extends React.FC<RequestPermissionDialogProps> {
  acl?: {
    action: string;
    subject: string;
  };
}

const RequestPermissionDialog: AclComponent = ({ open, onClose, onSuccess }) => {
  const user = useUser();
  const [formData, setFormData] = useState<FormData>({
    licenseType: 'VACACION',
    timeRequested: '',
    startDate: '',
    endDate: '',
    startHalfDay: 'Completo',
    endHalfDay: 'Completo'
  });

  const [vacationData, setVacationData] = useState<VacationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [daysCount, setDaysCount] = useState<number>(0);
  const [licenseInfo, setLicenseInfo] = useState<{
    startDate: string;
    endDate: string;
    totalDays: number;
    holidays: { year: number; date: string; description: string }[];
    ignoredWeekendHolidays?: { date: string; description: string }[];
  } | null>(null);
  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      startDate: prev.startDate || todayStr,
      endDate: prev.endDate || todayStr
    }));
  }, [open]);

  useEffect(() => {
    const fetchVacationData = async () => {
      if (user && user.ci && open) {
        try {
          const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/vacations/automatic-period`, {
            params: { carnetIdentidad: user.ci }
          });
          setVacationData(response.data);
        } catch (error) {
          console.error('Error fetching vacation data:', error);
        }
      }
    };

    fetchVacationData();
  }, [user, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (event: SelectChangeEvent<string>) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name as string]: value,
      ...(name === 'timeRequested' && { startDate: '', endDate: '' })
    }));
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      startDate: value,
      ...(prev.timeRequested !== 'Varios Días' && { endDate: value })
    }));
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    if (new Date(value) < new Date(formData.startDate)) {
      setError('La fecha de fin no puede ser anterior a la fecha de inicio');
      return;
    }
    setFormData(prev => ({ ...prev, endDate: value }));
  };

  const calculateTotalDays = (): number => {
    if (!formData.startDate || !formData.endDate) return 0;
    let totalDays = getBusinessDays(new Date(formData.startDate), new Date(formData.endDate));

    // Ajuste por medios días
    if (formData.startHalfDay !== 'Completo') totalDays -= 0.5;
    if (formData.endHalfDay !== 'Completo') totalDays -= 0.5;

    if (totalDays < 0.5) totalDays = 0.5;
    return totalDays;
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!formData.startDate || !formData.timeRequested) {
      setError('Complete todos los campos requeridos');
      setLoading(false);
      return;
    }

    const totalDays = calculateTotalDays();
    setDaysCount(totalDays);

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/licenses/${user?.id}`, {
        licenseType: formData.licenseType,
        timeRequested: formData.timeRequested,
        startDate: formData.startDate,
        endDate: formData.endDate || formData.startDate,
        startHalfDay: formData.startHalfDay,
        endHalfDay: formData.endHalfDay
      });


      setLicenseInfo({
        startDate: response.data.startDate,
        endDate: response.data.endDate,
        totalDays: response.data.totalDays,
        holidays: response.data.holidaysApplied || [],
        ignoredWeekendHolidays: response.data.ignoredWeekendHolidays || [],
      });


      setSuccess(true);
      onSuccess?.();
    } catch (err) {
      setError(axios.isAxiosError(err)
        ? err.response?.data?.message || 'Error al enviar la solicitud'
        : 'Error inesperado');
    } finally {
      setLoading(false);
    }

  };

  const resetForm = () => {
    setFormData({
      licenseType: 'VACACION',
      timeRequested: '',
      startDate: '',
      endDate: '',
      startHalfDay: 'Completo',
      endHalfDay: 'Completo'
    });
    setError(null);
    setSuccess(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        Solicitud de Permiso
      </DialogTitle>

      <DialogContent dividers>
        {vacationData && (
          <Box mb={2}>
            <Chip
              label={`Días disponibles: ${vacationData.diasDeVacacionRestantes}`}
              color="info"
              variant="outlined"
              size="medium"
            />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success ? (
          <Box textAlign="center" py={4}>
            <CheckIcon color="success" sx={{ fontSize: 60 }} />
            <Typography variant="h6" mt={2}>
              Solicitud enviada con éxito
            </Typography>

            {licenseInfo && (
              <>
                <Typography variant="body2" mt={1}>
                  Del <strong>{licenseInfo.startDate}</strong> al <strong>{licenseInfo.endDate}</strong>
                </Typography>
                <Typography variant="body2" mt={1}>
                  Total de días hábiles contados: <strong>{licenseInfo.totalDays}</strong>
                </Typography>

                {licenseInfo.holidays.length > 0 && (
                  <Box mt={2} textAlign="left">
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2">Feriados incluidos en el conteo:</Typography>
                    {licenseInfo.holidays.map((h, idx) => (
                      <Typography key={idx} variant="body2">
                        • {h.date} ({h.year}) - {h.description}
                      </Typography>
                    ))}
                  </Box>
                )}
                {licenseInfo.ignoredWeekendHolidays && licenseInfo.ignoredWeekendHolidays.length > 0 && (
                  <Box mt={2} textAlign="left">
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2">Feriados caídos en fin de semana (omitidos):</Typography>
                    {licenseInfo.ignoredWeekendHolidays.map((h, idx) => (
                      <Typography key={idx} variant="body2">
                        • {h.date} - {h.description}
                      </Typography>
                    ))}
                  </Box>
                )}


              </>
            )}
          </Box>
        ) : (
          <form onSubmit={handleSubmit}>
            <FormControl fullWidth margin="normal">
              <InputLabel id="startHalfDay-label">Inicio del Día</InputLabel>
              <Select
                labelId="startHalfDay-label"
                name="startHalfDay"
                value={formData.startHalfDay}
                onChange={(e) => setFormData(prev => ({ ...prev, startHalfDay: e.target.value as any }))}
                disabled={loading}
              >
                <MenuItem value="Completo">Día Completo</MenuItem>
                <MenuItem value="Media Mañana">Media Mañana</MenuItem>
                <MenuItem value="Media Tarde">Media Tarde</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel id="timeRequested-label">Tiempo Solicitado *</InputLabel>
              <Select
                labelId="timeRequested-label"
                name="timeRequested"
                value={formData.timeRequested}
                onChange={handleSelectChange}
                required
                disabled={loading}
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
              required
              disabled={loading || !formData.timeRequested}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EventIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel id="startHalfDay-label">Inicio del Día</InputLabel>
              <Select
                labelId="startHalfDay-label"
                name="startHalfDay"
                value={formData.startHalfDay}
                onChange={(e) => setFormData(prev => ({ ...prev, startHalfDay: e.target.value as any }))}
                disabled={loading}
              >
                <MenuItem value="Completo">Día Completo</MenuItem>
                <MenuItem value="Media Mañana">Media Mañana</MenuItem>
                <MenuItem value="Media Tarde">Media Tarde</MenuItem>
              </Select>
            </FormControl>

            {formData.timeRequested === 'Varios Días' && (
              <>
                <TextField
                  label="Fecha de Fin *"
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleEndDateChange}
                  fullWidth
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                  required
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EventAvailableIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
                <FormControl fullWidth margin="normal">
                  <InputLabel id="endHalfDay-label">Fin del Día</InputLabel>
                  <Select
                    labelId="endHalfDay-label"
                    name="endHalfDay"
                    value={formData.endHalfDay}
                    onChange={(e) => setFormData(prev => ({ ...prev, endHalfDay: e.target.value as any }))}
                    disabled={loading}
                  >
                    <MenuItem value="Completo">Día Completo</MenuItem>
                    <MenuItem value="Media Mañana">Media Mañana</MenuItem>
                    {/* Eliminamos Media Tarde para mantener coherencia */}
                  </Select>
                </FormControl>
              </>
            )}
            <Typography variant="caption" color="text.secondary" mt={1} display="block">
              Nota: En licencias de varios días, el último día solo puede seleccionarse Día Completo o Media Mañana.
              El primer día puede ser Día Completo, Media Mañana o Media Tarde.
              Esto asegura que la licencia sea continua y coherente.
            </Typography>
            {/**            {formData.startDate && formData.endDate && formData.timeRequested === 'Varios Días' && (
              <Typography variant="body2" color="text.secondary" mt={1}>
                Total de días hábiles: {getBusinessDays(new Date(formData.startDate), new Date(formData.endDate))}
              </Typography>
            )} */}


          </form>
        )}
      </DialogContent>

      <DialogActions>
        {success ? (
          <Button
            onClick={handleClose}
            color="primary"
            variant="contained"
            startIcon={<CloseIcon />}
          >
            Cerrar
          </Button>
        ) : (
          <>
            <Button
              onClick={handleClose}
              color="inherit"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
            >
              {loading ? 'Enviando...' : 'Enviar Solicitud'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};
// Configurar ACL para dar acceso a empleados
RequestPermissionDialog.acl = {
  action: 'read',
  subject: 'request-permission'
};
export default RequestPermissionDialog;