import React, { useState, useEffect } from 'react';
import {
  Grid,
  Typography,
  Button,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Box,
  Alert,
  Divider
} from '@mui/material';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import axios, { AxiosError } from 'axios';
import useUser from 'src/hooks/useUser';
import Icon from 'src/@core/components/icon';
import { registerLocale } from 'react-datepicker';
import ApexChartWrapper from 'src/@core/styles/libs/react-apexcharts';
import { es } from 'date-fns/locale';
import { calculateEndDate } from 'src/utils/calculateEndDate';

registerLocale('es', es);

const VacationRequestSubmissionForm = () => {
  const user = useUser();
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [vacationDays, setVacationDays] = useState<number>(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');
  const [dialogSuccess, setDialogSuccess] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false); // Nuevo estado para el diálogo de confirmación
  const [calculatedEndDate, setCalculatedEndDate] = useState<Date | null>(null); // Estado para la fecha de fin calculada
  const [managementPeriodStart, setManagementPeriodStart] = useState('');
  const [managementPeriodEnd, setManagementPeriodEnd] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const start = params.get('startDate');
    const end = params.get('endDate');

    if (start) setManagementPeriodStart(start.split('T')[0]);
    if (end) setManagementPeriodEnd(end.split('T')[0]);
  }, []);

  useEffect(() => {
    const fetchAvailableDays = async () => {
      if (user?.ci && managementPeriodEnd) {
        try {
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/vacations/accumulated-debt?carnetIdentidad=${user.ci}&endDate=${managementPeriodEnd}`
          );
          const detalles = response.data?.detalles;
          if (detalles && detalles.length > 0) {
            const lastGestion = detalles[detalles.length - 1];
            setVacationDays(lastGestion.diasDisponibles);
          } else {
            setVacationDays(0);
          }
        } catch (error) {
          console.error('Error fetching accumulated vacation data:', error);
          setDialogMessage('Error al cargar la información de vacaciones disponibles.');
          setDialogSuccess(false);
          setDialogOpen(true);
        }
      }
    };

    fetchAvailableDays();
  }, [user?.ci, managementPeriodEnd]);

  const handleOpenConfirmationDialog = () => {
    if (startDate && vacationDays > 0) {
      const endDateCalculated = calculateEndDate(startDate, vacationDays);
      setCalculatedEndDate(endDateCalculated);
      setConfirmDialogOpen(true);
    } else if (!startDate) {
      setDialogMessage('Por favor, selecciona una fecha de inicio.');
      setDialogSuccess(false);
      setDialogOpen(true);
    } else if (vacationDays <= 0) {
      setDialogMessage('No tienes días de vacaciones disponibles.');
      setDialogSuccess(false);
      setDialogOpen(true);
    }
  };

  const handleCloseConfirmationDialog = () => {
    setConfirmDialogOpen(false);
    setCalculatedEndDate(null);
  };

  const handleVacationRequest = async () => {
    if (!user || !startDate || !managementPeriodStart || !managementPeriodEnd) {
      setDialogMessage('Faltan datos para enviar la solicitud.');
      setDialogSuccess(false);
      setDialogOpen(true);
      return;
    }

    const data = {
      ci: user.ci,
      startDate: startDate.toISOString().split('T')[0],
      position: 'Docente',
      managementPeriod: {
        startPeriod: managementPeriodStart,
        endPeriod: managementPeriodEnd,
      },
    };

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/vacation-requests`, data);
      setDialogMessage(`¡Solicitud de vacaciones enviada con éxito. Con ${response.data.totalWorkingDays} días hábiles de vacaciones!`);
      setDialogSuccess(true);
      setDialogOpen(true);
      setConfirmDialogOpen(false); // Cerrar el diálogo de confirmación después del éxito
    } catch (error) {
      if (error instanceof AxiosError && error.response) {
        setDialogMessage(error.response.data.message || 'Hubo un error al enviar la solicitud.');
      } else {
        setDialogMessage('Hubo un error al enviar la solicitud.');
      }
      setDialogSuccess(false);
      setDialogOpen(true);
    }
  };

  const handleCloseDialog = () => setDialogOpen(false);

  return (
    <ApexChartWrapper>
      <Grid container spacing={6}>
        {/* Encabezado */}
        <Grid item xs={12}>
          <Card elevation={3}>
            <CardHeader
              title="Solicitud de Vacaciones"
              titleTypographyProps={{ variant: 'h4', fontWeight: 600 }}
              subheader={`Tienes ${vacationDays} días de vacaciones disponibles para la gestion seleccionada`}
            />
            <Divider />
            <CardContent>
              <Alert severity="info" icon={<Icon icon="mdi:information" />}>
                Selecciona la fecha de inicio para tu período de vacaciones. La fecha de fin se calculará automáticamente.
              </Alert>
            </CardContent>
          </Card>
        </Grid>

        {/* Selector de fecha de inicio */}
        <Grid item xs={12} md={12}>
          <Card elevation={2}>
            <CardHeader
              title="Fecha de inicio"
              titleTypographyProps={{ variant: 'h6' }}
              avatar={<Icon icon="mdi:calendar-start" />}
            />
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <DatePicker
                  selected={startDate}
                  onChange={setStartDate}
                  dateFormat="dd/MM/yyyy"
                  locale="es"
                  placeholderText="Selecciona fecha"
                  minDate={new Date()}
                  className="form-control"
                  withPortal
                  customInput={
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<Icon icon="mdi:calendar" />}
                    >
                      {startDate ? startDate.toLocaleDateString('es-ES') : 'Seleccionar fecha'}
                    </Button>
                  }
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Botón de envío (modificado para abrir el diálogo de confirmación) */}
        <Grid item xs={12}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<Icon icon="mdi:send" />}
            fullWidth
            onClick={handleOpenConfirmationDialog} // Ahora abre el diálogo de confirmación
            disabled={!startDate || !managementPeriodStart || !managementPeriodEnd || vacationDays <= 0}
            sx={{ py: 2, fontSize: '1.1rem' }}
          >
            Solicitar Vacaciones
          </Button>
        </Grid>
      </Grid>

      {/* Diálogo de confirmación */}
      {/* Diálogo de confirmación */}
      <Dialog
        open={confirmDialogOpen}
        onClose={handleCloseConfirmationDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirmar Solicitud de Vacaciones</DialogTitle>
        <DialogContent>
          {startDate && calculatedEndDate && (
            <Typography variant="body1">
              ¿Desea programar sus vacaciones desde el{' '}
              <strong>{startDate.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>{' '}
              hasta el{' '}
              <strong>{calculatedEndDate.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>{' '}
              (<strong>{vacationDays} días hábiles</strong>)?
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmationDialog}>Cancelar</Button>
          <Button onClick={handleVacationRequest} variant="contained" color="primary">
            Confirmar y Enviar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de resultado (éxito/error) */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
          <Icon
            icon={dialogSuccess ? "mdi:check-circle" : "mdi:alert-circle"}
            color={dialogSuccess ? "success" : "error"}
          />
          {dialogSuccess ? 'Solicitud exitosa' : 'Error en la solicitud'}
          <IconButton
            aria-label="close"
            onClick={handleCloseDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Icon icon="mdi:close" />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mt: 2 }}>
            {dialogMessage}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseDialog}
            variant="contained"
            color={dialogSuccess ? "success" : "error"}
            startIcon={<Icon icon="mdi:check" />}
          >
            Entendido
          </Button>
        </DialogActions>
      </Dialog>
    </ApexChartWrapper>
  );
};

VacationRequestSubmissionForm.acl = {
  action: 'create',
  subject: 'vacation-request-form',
};

export default VacationRequestSubmissionForm;