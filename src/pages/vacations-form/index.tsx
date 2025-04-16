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

registerLocale('es', es);

const VacationRequestSubmissionForm = () => {
  const user = useUser();
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [vacationDays, setVacationDays] = useState(15);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');
  const [dialogSuccess, setDialogSuccess] = useState(false);
  const [managementPeriodStart, setManagementPeriodStart] = useState('');
  const [managementPeriodEnd, setManagementPeriodEnd] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const start = params.get('startDate');
    const end = params.get('endDate');

    if (start) setManagementPeriodStart(start.split('T')[0]);
    if (end) setManagementPeriodEnd(end.split('T')[0]);
  }, []);

  const handleVacationRequest = async () => {
    if (!user) {
      setDialogMessage('Usuario no encontrado.');
      setDialogSuccess(false);
      setDialogOpen(true);
      return;
    }
  
    const data = {
      ci: user.ci,
      startDate: startDate?.toISOString().split('T')[0],
      endDate: endDate?.toISOString().split('T')[0],
      position: 'Docente',
      managementPeriodStart,
      managementPeriodEnd,
    };
  
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/vacation-requests`, data);
      setDialogMessage('¡Solicitud de vacaciones enviada con éxito!');
      setDialogSuccess(true);
      setDialogOpen(true);
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
              subheader={`Tienes ${vacationDays} días de vacaciones disponibles`}
            />
            <Divider />
            <CardContent>
              <Alert severity="info" icon={<Icon icon="mdi:information" />}>
                Selecciona las fechas de inicio y fin para tu período de vacaciones
              </Alert>
            </CardContent>
          </Card>
        </Grid>

        {/* Selectores de fecha */}
        <Grid item xs={12} md={6}>
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

        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardHeader 
              title="Fecha de fin" 
              titleTypographyProps={{ variant: 'h6' }}
              avatar={<Icon icon="mdi:calendar-end" />}
            />
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <DatePicker
                  selected={endDate}
                  onChange={setEndDate}
                  dateFormat="dd/MM/yyyy"
                  locale="es"
                  placeholderText="Selecciona fecha"
                  minDate={startDate}
                  className="form-control"
                  withPortal
                  customInput={
                    <Button 
                      variant="outlined" 
                      fullWidth 
                      startIcon={<Icon icon="mdi:calendar" />}
                      disabled={!startDate}
                    >
                      {endDate ? endDate.toLocaleDateString('es-ES') : 'Seleccionar fecha'}
                    </Button>
                  }
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Botón de envío */}
        <Grid item xs={12}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<Icon icon="mdi:beach" />}
            fullWidth
            onClick={handleVacationRequest}
            disabled={!startDate || !endDate}
            sx={{ py: 2, fontSize: '1.1rem' }}
          >
            Enviar Solicitud
          </Button>
        </Grid>
      </Grid>

      {/* Diálogo de resultado */}
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