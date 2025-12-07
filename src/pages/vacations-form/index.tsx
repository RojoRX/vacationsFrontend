import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Grid,
  useTheme,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip
} from '@mui/material';
import {
  BeachAccess as VacationIcon,
  Send as SendIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import axios from 'src/lib/axios';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import useUser from 'src/hooks/useUser';
import { DatePicker, LocalizationProvider, PickersDay } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { calculateEndDate, getNextWorkDay } from 'src/utils/calculateEndDate';
import router from 'next/router';

interface VacationDebtDetail {
  startDate: string;
  endDate: string;
  deuda: number;
  diasDeVacacion: number;
  diasDeVacacionRestantes: number;
  deudaAcumulativaHastaEstaGestion: number;
  deudaAcumulativaAnterior: number;
  diasDisponibles: number;
  valido: boolean;
}

interface VacationDebtResponse {
  deudaAcumulativa: number;
  detalles: VacationDebtDetail[];
  resumenGeneral: {
    deudaTotal: number;
    diasDisponiblesActuales: number;
    gestionesConDeuda: number;
    gestionesSinDeuda: number;
    promedioDeudaPorGestion: number;
    primeraGestion: string;
    ultimaGestion: string;
  };
}

const VacationRequestSubmissionForm = () => {
  const user = useUser();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<VacationDebtResponse | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<VacationDebtDetail | null>(null);
  const [daysRequested, setDaysRequested] = useState<number>(1);
  const [openDialog, setOpenDialog] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [requestId, setRequestId] = useState<number | null>(null);
  const [nonHolidays, setNonHolidays] = useState<{ date: string; description: string }[]>([]);

  function getMostRecentAnniversary(ingresoDateStr: string, today: Date = new Date()): string {
    const [ingresoYear, ingresoMonth, ingresoDay] = ingresoDateStr.split('-').map(Number);
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();

    let anniversaryYear = currentYear;
    const hasAnniversaryPassed = ingresoMonth < currentMonth || (ingresoMonth === currentMonth && ingresoDay <= currentDay);
    if (!hasAnniversaryPassed) anniversaryYear = currentYear - 1;

    const formattedMonth = String(ingresoMonth).padStart(2, '0');
    const formattedDay = String(ingresoDay).padStart(2, '0');

    return `${anniversaryYear}-${formattedMonth}-${formattedDay}`;
  }

  // ---------------------------
  // Fetch vacaciones y seleccionar gestión más antigua válida con días
  // ---------------------------
  useEffect(() => {
    const today = new Date();
    const ingresoDate = user?.fecha_ingreso || '';
    const endDate = getMostRecentAnniversary(ingresoDate, today);

    const fetchVacationDebt = async () => {
      try {
        setLoading(true);
        const response = await axios.get<VacationDebtResponse>(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/vacations/accumulated-debt`,
          { params: { carnetIdentidad: user?.ci, endDate } }
        );
        setData(response.data);

        // Filtrar solo gestiones válidas con días > 0
        const validPeriods = response.data.detalles
          .filter(d => d.diasDisponibles > 0 && d.valido)
          .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()); // más antigua primero

        if (validPeriods.length > 0) {
          setSelectedPeriod(validPeriods[0]);
          setDaysRequested(Math.min(validPeriods[0].diasDisponibles, 30));
        } else {
          setSelectedPeriod(null);
        }
      } catch (err) {
        setError('Error al obtener la información de vacaciones');
        console.error('Error fetching vacation debt:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.ci) fetchVacationDebt();
  }, [user?.ci]);

  // ---------------------------
  // Fetch feriados / días no laborables
  // ---------------------------
  useEffect(() => {
    const fetchNonHolidays = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/non-holidays/all`);
        setNonHolidays(res.data.map((d: any) => ({ date: d.date, description: d.description })));
      } catch (e) {
        console.error('Error cargando feriados:', e);
      }
    };
    fetchNonHolidays();
  }, []);

  const handleRequestVacation = async () => {
    if (!selectedPeriod || daysRequested <= 0 || !selectedStartDate) return;

    try {
      setRequestError(null);
      setRequestSuccess(false);

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/vacation-requests`,
        {
          ci: user?.ci,
          startDate: selectedStartDate.toISOString().split('T')[0],
          managementPeriod: {
            startPeriod: selectedPeriod.startDate.split('T')[0],
            endPeriod: selectedPeriod.endDate.split('T')[0]
          }
        }
      );

      setRequestSuccess(true);
      setRequestId(response.data.id || null);
    } catch (err: unknown) {
      const error = err as any;
      setRequestError(error?.response?.data?.message || `Error inesperado: ${String(err)}`);
    }
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    if (requestSuccess && requestId) {
      router.push(`/vacations/vacations-requests/${requestId}/`);
    }
  };

  const createHolidayDayComponent = (nonHolidays: { date: string; description: string }[]) => {
    return function HolidayDay(props: any) {
      const { day, outsideCurrentMonth, ...other } = props;
      const dayStr = format(day, 'yyyy-MM-dd');
      const holiday = nonHolidays.find(h => h.date === dayStr);

      if (!holiday) return <PickersDay day={day} outsideCurrentMonth={outsideCurrentMonth} {...other} />;

      return (
        <Tooltip title={holiday.description} arrow>
          <PickersDay
            day={day}
            outsideCurrentMonth={outsideCurrentMonth}
            {...other}
            sx={{
              backgroundColor: 'rgba(255, 0, 0, 0.25)',
              borderRadius: '50%',
              '&:hover': { backgroundColor: 'rgba(255, 0, 0, 0.45)' }
            }}
          />
        </Tooltip>
      );
    };
  };

  if (loading) return <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>;
  if (error) return <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>;
  if (!data || !selectedPeriod) return <Alert severity="info" sx={{ my: 2 }}>No hay períodos válidos con días disponibles para vacaciones.</Alert>;

  const periodStart = new Date(selectedPeriod.startDate).getFullYear();
  const periodEnd = new Date(selectedPeriod.endDate).getFullYear();
  const today = new Date();
  const endDate = calculateEndDate(selectedStartDate, selectedPeriod?.diasDisponibles || 0);
  const endDatePlusOne = endDate ? getNextWorkDay(endDate) : null;

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <VacationIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
        <Typography variant="h6">Solicitud de Vacaciones</Typography>
      </Box>

      {/* Resumen */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, bgcolor: theme.palette.grey[100] }}>
            <Typography variant="subtitle2" color="textSecondary">Días Disponibles Totales</Typography>
            <Typography variant="h4" color="primary">{data.resumenGeneral.diasDisponiblesActuales} días</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, bgcolor: theme.palette.grey[100] }}>
            <Typography variant="subtitle2" color="textSecondary">
              Días Disponibles en Gestión {periodStart} - {periodEnd}
            </Typography>
            <Typography variant="h4" color="secondary">{selectedPeriod.diasDisponibles} días</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Detalles */}
      <Paper sx={{ p: 3, mb: 3, borderLeft: `4px solid ${theme.palette.primary.main}` }}>
        <Box display="flex" alignItems="center" mb={2}>
          <InfoIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6">Período de Vacaciones Disponible</Typography>
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography><strong>Rango del Período:</strong> {periodStart} - {periodEnd}</Typography>
            <Typography><strong>Días de vacación por Antiguedad:</strong> {selectedPeriod.diasDeVacacion}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography><strong>Días disponibles para solicitar:</strong> {selectedPeriod.diasDisponibles}</Typography>
          </Grid>
        </Grid>

        <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={() => setOpenDialog(true)}
            disabled={selectedPeriod.diasDisponibles <= 0 || !selectedPeriod.valido}
            color="primary"
          >
            Solicitar Vacaciones
          </Button>
          <Button
            variant="outlined"
            startIcon={<InfoIcon />}
            onClick={() => router.push('/vacations/vacations-dashboard/')}
            disabled={selectedPeriod.diasDisponibles <= 0 || !selectedPeriod.valido}
            color="secondary"
          >
            Ver Detalles Gestión
          </Button>
        </Box>
      </Paper>

      {/* Diálogo de Solicitud */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Solicitar Vacaciones</DialogTitle>
        <DialogContent>
          <Typography gutterBottom><strong>Período de gestión:</strong> {periodStart} - {periodEnd}</Typography>
          <Typography gutterBottom><strong>Días disponibles:</strong> {selectedPeriod.diasDisponibles}</Typography>

          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            <DatePicker
              label="Fecha de inicio"
              value={selectedStartDate}
              onChange={(newDate) => setSelectedStartDate(newDate)}
              disablePast
              slots={{ day: createHolidayDayComponent(nonHolidays) }}
              slotProps={{ textField: { fullWidth: true, margin: "normal" } }}
            />
          </LocalizationProvider>

          {selectedStartDate && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <div>
                <p>Ha seleccionado la fecha <strong>{format(selectedStartDate, "EEEE dd 'de' MMMM 'de' yyyy", { locale: es })}</strong>.</p>
                {endDate && <p>Su vacación concluirá el <strong>{format(endDate, "EEEE dd 'de' MMMM 'de' yyyy", { locale: es })}</strong>.</p>}
                {endDatePlusOne && <p>Debe reincorporarse el día <strong>{format(endDatePlusOne, "EEEE dd 'de' MMMM 'de' yyyy", { locale: es })}</strong>.</p>}
              </div>
            </Alert>
          )}

          {requestSuccess && <Alert severity="success" sx={{ mt: 2 }}><strong>Solicitud enviada exitosamente</strong></Alert>}
          {requestError && <Alert severity="error" sx={{ mt: 2 }}>{requestError}</Alert>}
        </DialogContent>

        <DialogActions>
          {!requestSuccess && (
            <>
              <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
              <Button onClick={handleRequestVacation} variant="contained" disabled={!selectedStartDate}>Confirmar Solicitud</Button>
            </>
          )}
          {requestSuccess && (
            <Button onClick={handleDialogClose} variant="contained">Cerrar</Button>
          )}
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

VacationRequestSubmissionForm.acl = {
  action: 'create',
  subject: 'vacation-request-form',
};

export default VacationRequestSubmissionForm;
