import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { useEffect, useState } from 'react';
import { SelectChangeEvent } from '@mui/material';
import axios from 'axios';
import useUser from 'src/hooks/useUser';

interface VacationData {
  name: string;
  email: string;
  fechaIngreso: string;
  antiguedadEnAnios: number;
  diasDeVacacion: number;
  diasDeVacacionRestantes: number;
}

// Tipado para el estado del formulario
interface FormData {
  licenseType: string;
  timeRequested: string;
  startDate: string;
  endDate: string;
}

const RequestPermission = () => {
  const user = useUser();
  const [formData, setFormData] = useState<FormData>({
    licenseType: 'VACACION',
    timeRequested: '',
    startDate: '',
    endDate: ''
  });
  const [vacationData, setVacationData] = useState<VacationData | null>(null);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [confirmationOpen, setConfirmationOpen] = useState<boolean>(false);
  const [dialogMessage, setDialogMessage] = useState<string>('');
  const [dialogTitle, setDialogTitle] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [daysCount, setDaysCount] = useState<number>(0);

  useEffect(() => {
    const fetchVacationData = async () => {
      if (user && user.ci) {
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
  }, [user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name as keyof FormData]: value });
  };

  const handleSelectChange = (event: SelectChangeEvent<string>) => {
    const { name, value } = event.target;
    if (name === 'timeRequested') {
      setFormData({
        ...formData,
        [name as keyof FormData]: value,
        startDate: '',
        endDate: ''
      });
    } else {
      setFormData({ ...formData, [name as keyof FormData]: value });
    }
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData({ ...formData, startDate: value });
    if (formData.timeRequested === 'Día Completo' || formData.timeRequested === 'Medio Día') {
      setFormData((prev) => ({
        ...prev,
        endDate: value
      }));
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    if (new Date(value) < new Date(formData.startDate)) {
      setDialogTitle('Error');
      setDialogMessage('La fecha de fin no puede ser anterior a la fecha de inicio.');
      setDialogOpen(true);
      return;
    }
    setFormData({ ...formData, endDate: value });
  };

  const calculateTotalDays = (): number => {
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    const timeDiff = endDate.getTime() - startDate.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const totalDays = calculateTotalDays();
    setDaysCount(totalDays);
    const displayTotalDays = formData.timeRequested === 'Medio Día' ? 'medio día' : `${totalDays} día${totalDays > 1 ? 's' : ''}`;
    setDialogMessage(`
        ¿Estás seguro de que deseas enviar la solicitud?
        \nTipo de Licencia: ${formData.licenseType}
        \nTiempo Solicitado: ${formData.timeRequested}
        \nFecha de Inicio: ${formData.startDate}
        \nFecha de Fin: ${formData.endDate}
        \nTotal de Días: ${displayTotalDays}
      `);
    setConfirmationOpen(true);
  };

  const confirmSubmit = async () => {
    if (!user) {
      setDialogTitle('Error');
      setDialogMessage('Usuario no autenticado.');
      setDialogOpen(true);
      return;
    }
  
    const { startDate, endDate } = formData;
    const formattedStartDate = new Date(startDate).toISOString().split('T')[0];
    const formattedEndDate = new Date(endDate).toISOString().split('T')[0];
  
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/licenses/${user.id}`, {
        licenseType: formData.licenseType,
        timeRequested: formData.timeRequested,
        startDate: formattedStartDate,
        endDate: formattedEndDate
      });
      setDialogTitle('Éxito');
      setDialogMessage('Solicitud de permiso enviada con éxito.');
      setSubmitted(true);
    } catch (error) {
      // Verificación de tipo
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || 'Error al enviar la solicitud.';
        setDialogTitle('Error');
        setDialogMessage(errorMessage);
      } else {
        setDialogTitle('Error');
        setDialogMessage('Error inesperado.');
      }
    } finally {
      setDialogOpen(true);
      setConfirmationOpen(false);
    }
  };
  

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const handleConfirmationClose = () => {
    setConfirmationOpen(false);
  };

  return (
    <Grid container spacing={6} className='match-height'>
      <Grid item xs={12}>
        {vacationData && (
          <Card>
            <CardContent>
              <Typography variant="h6">
                Tienes {vacationData.diasDeVacacionRestantes} días disponibles de vacaciones en la gestión actual.
              </Typography>
            </CardContent>
          </Card>
        )}
      </Grid>

      <Grid item xs={12} md={12}>
        <Card>
          <CardContent>
            <Typography variant="h5" component="div" gutterBottom>
              Solicitud de Permisos
            </Typography>
            <form onSubmit={handleSubmit}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="licenseType-label">Tipo de Licencia</InputLabel>
                <Select
                  labelId="licenseType-label"
                  name="licenseType"
                  value={formData.licenseType}
                  onChange={handleSelectChange}
                >
                  <MenuItem value="VACACION">Vacación</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth margin="normal">
                <InputLabel id="timeRequested-label">Tiempo Solicitado</InputLabel>
                <Select
                  labelId="timeRequested-label"
                  name="timeRequested"
                  value={formData.timeRequested}
                  onChange={handleSelectChange}
                >
                  <MenuItem value="Medio Día">Medio Día</MenuItem>
                  <MenuItem value="Día Completo">Día Completo</MenuItem>
                  <MenuItem value="Varios Días">Varios Días</MenuItem>
                </Select>
              </FormControl>

              {formData.timeRequested !== 'Varios Días' && (
                <TextField
                  label="Fecha de Inicio"
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleStartDateChange}
                  fullWidth
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                />
              )}

              {formData.timeRequested === 'Varios Días' && (
                <>
                  <TextField
                    label="Fecha de Inicio"
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleStartDateChange}
                    fullWidth
                    margin="normal"
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    label="Fecha de Fin"
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleEndDateChange}
                    fullWidth
                    margin="normal"
                    InputLabelProps={{ shrink: true }}
                  />
                </>
              )}

              <Button type="submit" variant="contained" color="primary">
                Enviar Solicitud
              </Button>
            </form>
          </CardContent>
        </Card>
      </Grid>

      <Dialog open={dialogOpen} onClose={handleDialogClose}>
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogContent>{dialogMessage}</DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmationOpen} onClose={handleConfirmationClose}>
        <DialogTitle>Confirmar Solicitud</DialogTitle>
        <DialogContent>{dialogMessage}</DialogContent>
        <DialogActions>
          <Button onClick={confirmSubmit}>Confirmar</Button>
          <Button onClick={handleConfirmationClose}>Cancelar</Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};
// Configurar ACL para dar acceso a empleados
RequestPermission.acl = {
    action: 'read',
    subject: 'request-permission'
};
export default RequestPermission;
