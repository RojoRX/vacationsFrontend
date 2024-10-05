import React, { useState } from 'react';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import axios from 'axios';
import useUser from 'src/hooks/useUser';
// ** Icon Imports
import Icon from 'src/@core/components/icon';

// ** Styled Component Import
import ApexChartWrapper from 'src/@core/styles/libs/react-apexcharts';

// Formulario de solicitud de vacaciones
const VacationRequestSubmissionForm = () => {
  const user = useUser();
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [vacationDays, setVacationDays] = useState(15); // Suponiendo días disponibles
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');
  const [dialogSuccess, setDialogSuccess] = useState(false);

  // Simular el CI y posición del usuario
  const position = 'Docente';

  // Fechas de inicio y fin del periodo de gestión
  const managementPeriodStart = '2015-08-02';
  const managementPeriodEnd = '2016-07-30';

  const handleVacationRequest = async () => {
    if (!user) {
      setDialogMessage('Usuario no encontrado.')
      setDialogSuccess(false)
      setDialogOpen(true)
      return
    }
    const data = {
      ci: user.ci,
      startDate: startDate?.toISOString().split('T')[0], // Formatear a YYYY-MM-DD
      endDate: endDate?.toISOString().split('T')[0],
      position: position,
      managementPeriodStart: managementPeriodStart, // Añadir periodo de gestión
      managementPeriodEnd: managementPeriodEnd,     // Añadir periodo de gestión
    };

    // Mostrar en consola los datos antes de enviarlos
    console.log('Datos a enviar:', data);

    try {
      // Enviar los datos a la API usando axios
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/vacation-requests`, data);

      // Abrir el diálogo de éxito
      setDialogMessage('¡Solicitud de vacaciones enviada con éxito!');
      setDialogSuccess(true);
      setDialogOpen(true);
      console.log('Respuesta de la API:', response.data);
    } catch (error) {
      // Abrir el diálogo de error
      setDialogMessage('Hubo un error al enviar la solicitud.');
      setDialogSuccess(false);
      setDialogOpen(true);
      console.error('Error al enviar la solicitud:', error);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  return (
    <ApexChartWrapper>
      <Grid container spacing={6} className="match-height">
        {/* Título del formulario */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="div" gutterBottom>
                Solicitud de Vacaciones
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Aquí puedes solicitar tus vacaciones seleccionando las fechas deseadas. Tienes {vacationDays} días disponibles.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Selección de fechas */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="div" gutterBottom>
                Selecciona el inicio de tus vacaciones
              </Typography>
              <DatePicker
                selected={startDate}
                onChange={date => setStartDate(date)}
                dateFormat="dd/MM/yyyy"
                placeholderText="Selecciona una fecha"
                minDate={new Date()}
                className="form-control"
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="div" gutterBottom>
                Selecciona el fin de tus vacaciones
              </Typography>
              <DatePicker
                selected={endDate}
                onChange={date => setEndDate(date)}
                dateFormat="dd/MM/yyyy"
                placeholderText="Selecciona una fecha"
                minDate={startDate}
                className="form-control"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Botón de solicitud */}
        <Grid item xs={12}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Icon icon="mdi:beach" />}
            fullWidth
            onClick={handleVacationRequest}
            disabled={!startDate || !endDate} // Deshabilitar el botón si no hay fechas seleccionadas
          >
            Enviar Solicitud de Vacaciones
          </Button>
        </Grid>
      </Grid>

      {/* Diálogo de éxito o error */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>
          {dialogSuccess ? 'Éxito' : 'Error'}
          <IconButton
            aria-label="close"
            onClick={handleCloseDialog}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <Icon icon="mdi:close" />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography>{dialogMessage}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </ApexChartWrapper>
  );
};

// Configurar ACL para dar acceso según el rol
VacationRequestSubmissionForm.acl = {
  action: 'create',
  subject: 'vacation-request-form',
};

export default VacationRequestSubmissionForm;
