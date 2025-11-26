import React, { useEffect, useState, useCallback } from 'react';
import axios from 'src/lib/axios';
import { useRouter } from 'next/router';
import CelebrationIcon from '@mui/icons-material/Celebration';
import {
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Box,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Paper,
  Divider,
  Stack,
  Alert,
  IconButton,
  Container,
  Avatar,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  styled,
  TextField
} from '@mui/material';
import {
  People as PeopleIcon,
  Info as InfoIcon,
  Approval as ApprovalIcon,
  Assignment as AssignmentIcon,
  Close as CloseIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Cancel as CancelIcon,
  DateRange as DateRangeIcon,
  Work as WorkIcon,
  Event as EventIcon,
  EventAvailable as EventAvailableIcon,
  EventBusy as EventBusyIcon,
  Today as TodayIcon,
  AccessTime as AccessTimeIcon,
  Timeline as TimelineIcon,
  HowToReg as HowToRegIcon,
  VerifiedUser as VerifiedUserIcon,
  PendingActions as PendingActionsIcon,
  School as SchoolIcon,
  Star as StarIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import useUser from 'src/hooks/useUser';
import { SelectChangeEvent } from '@mui/material/Select';
import PostponeVacationRequestForm from '../vacations-postponed';
import { generateVacationAuthorizationPDF } from 'src/utils/pdfGenerator';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { GestionDeuda, VacationDebt } from 'src/interfaces/vacationDebt';
import { VacationRequest } from 'src/interfaces/vacationRequests';
import { formatDate } from 'src/utils/dateUtils';

const ColorCard = styled(Card)(({ theme }) => ({
  borderLeft: `4px solid ${theme.palette.primary.main}`,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4]
  }
}));

interface StatusOption {
  value: string;
  label: string;
  color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  icon: React.ReactNode;
}

const STATUS_OPTIONS: StatusOption[] = [
  {
    value: 'PENDING',
    label: 'Pendiente',
    color: 'default',
    icon: <PendingActionsIcon />
  },
  {
    value: 'AUTHORIZED',
    label: 'Autorizado',
    color: 'success',
    icon: <CheckIcon />
  },
  {
    value: 'POSTPONED',
    label: 'Postergado',
    color: 'warning',
    icon: <EventBusyIcon />
  },
  {
    value: 'DENIED',
    label: 'Rechazado',
    color: 'error',
    icon: <CancelIcon />
  },
  {
    value: 'SUSPENDED',
    label: 'Suspendido',
    color: 'info',
    icon: <AccessTimeIcon />
  },
];

const VacationRequestDetails = () => {
  const router = useRouter();
  const { id } = router.query;
  const user = useUser();
  const [request, setRequest] = useState<VacationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState('PENDING');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');
  const [debtData, setDebtData] = useState<VacationDebt | null>(null);
  const [deudaData, setDeudaData] = useState<GestionDeuda | null>(null);
  let requestId: number | undefined = undefined;
  // Estado para la observación editable
  const [observation, setObservation] = useState('');
  const [savingObservation, setSavingObservation] = useState(false);

  // Función para guardar observación
  const handleObservationSave = async () => {
    if (!request || !user?.id) return;

    try {
      setSavingObservation(true);
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/vacation-requests/${request.requestId}/observation`,
        { observation }
      );

      setRequest(prev => ({ ...prev!, postponedReason: observation }));
    } catch (err) {
      console.error('Error guardando la observación:', err);
      setError('Error al guardar la observación');
    } finally {
      setSavingObservation(false);
    }
  };

const fetchRequestDetails = useCallback(async () => {
  if (!id) return;

  try {
    setLoading(true);
    setError(null);

    const response = await axios.get<VacationRequest>(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/vacation-requests/${id}/details`
    );
    setRequest(response.data);
    requestId = response.data.id;
    setSelectedStatus(response.data.status);

    // ⚠️ Usar response.data en lugar de request
    if (response.data.postponedReason) {
      setObservation(response.data.postponedReason);
    }

    if (response.data.managementPeriodStart && response.data.managementPeriodEnd) {
      await fetchDebtData(
        response.data.managementPeriodStart,
        response.data.managementPeriodEnd,
        response.data.ci || ""
      );
    }
  } catch (err) {
    handleFetchError(err);
  } finally {
    setLoading(false);
  }
}, [id]);


  const fetchDebtData = async (startDate: string, endDate: string, ci: string) => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/vacations/accumulated-debt`, {
        params: { carnetIdentidad: ci, endDate },
        timeout: 5000,
      });

      //console.log('Respuesta completa del servidor:', response.data);
      setDeudaData(response.data);

      //console.log(`datos de deuda data ${deudaData?.diasDisponiblesActuales}`)
      // Verificar si hay detalles en la respuesta
      if (!response.data.detalles || !Array.isArray(response.data.detalles)) {
        console.error('Formato de datos inesperado: detalles no es un array');
        throw new Error('Formato de datos inesperado');
      }

      // Formatear fechas de búsqueda
      const gestionStart = new Date(startDate);
      const gestionEnd = new Date(endDate);

      // Buscar la gestión que coincida con el rango de fechas
      const gestionDebt = response.data.detalles.find((detalle: any) => {
        try {
          const detalleStart = new Date(detalle.startDate);
          const detalleEnd = new Date(detalle.endDate);

          // Comparar las fechas como objetos Date directamente
          return (
            detalleStart.getTime() === gestionStart.getTime() &&
            detalleEnd.getTime() === gestionEnd.getTime()
          );
        } catch (e) {
          console.error('Error al parsear fechas del detalle:', detalle, e);

          return false;
        }
      });

      if (!gestionDebt) {
        console.warn('No se encontró deuda para la gestión específica, usando el último registro');

        // Usar el último registro si no se encuentra la gestión específica
        const lastRecord = response.data.detalles[response.data.detalles.length - 1];
        setDebtData({
          diasDisponibles: lastRecord?.diasDisponibles ?? 0,
          deudaAcumulativaAnterior: lastRecord?.deudaAcumulativaAnterior ?? 0,
          deuda: lastRecord?.deuda ?? 0,
          startDate: lastRecord?.startDate ?? '',
          endDate: lastRecord?.endDate ?? '',
          deudaAcumulativaHastaEstaGestion: lastRecord?.deudaAcumulativaHastaEstaGestion ?? 0,
        });

        return;
      }

      //console.log('Datos encontrados para la gestión:', gestionDebt);
      setDebtData(gestionDebt);

    } catch (err) {
      console.error('Error fetching debt data:', err);
      setDebtData({
        diasDisponibles: 0,
        deudaAcumulativaAnterior: 0,
        deuda: 0,
        startDate: '',
        endDate: '',
        deudaAcumulativaHastaEstaGestion: 0,
      });
    }
  };

  const handleFetchError = (error: unknown) => {
    let errorMessage = 'Error al obtener los detalles de la solicitud';

    if (
      typeof error === 'object' &&
      error !== null &&
      'response' in error &&
      typeof (error as any).response?.data?.message === 'string'
    ) {
      errorMessage = (error as any).response.data.message;
    } else if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as any).message === 'string'
    ) {
      errorMessage = (error as any).message;
    }

    console.error('Error:', error);
    setError(errorMessage);
  };


  useEffect(() => {
    fetchRequestDetails();
  }, [fetchRequestDetails]);

  const handleStatusChange = async (event: SelectChangeEvent<string>) => {
    const newStatus = event.target.value;

    if (newStatus === 'POSTPONED') {
      setInfoMessage('Para postergar la solicitud, utilice el formulario de postergación.');
      setDialogOpen(true);

      return;
    }

    if (!request || newStatus === request.status || !user?.id) return;

    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/vacation-requests/${request.requestId}/status`,
        { status: newStatus, supervisorId: user.id }
      );

      setRequest(prev => ({ ...prev!, status: newStatus }));
      setSelectedStatus(newStatus);
    } catch (err) {
      handleStatusUpdateError(err);
    }
  };

  const handleStatusUpdateError = (error: unknown) => {
    let errorMessage = 'Error al actualizar el estado';

    if (
      typeof error === 'object' &&
      error !== null &&
      'response' in error &&
      typeof (error as any).response?.data?.message === 'string'
    ) {
      errorMessage = (error as any).response.data.message;
    } else if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as any).message === 'string'
    ) {
      errorMessage = (error as any).message;
    }

    console.error('Error updating status:', error);
    setError(errorMessage);
  };

  const handleHRDecision = async (action: 'APPROVE' | 'REJECT') => {
    if (!request) return;

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/vacation-requests/${request.requestId}/hr-decision`,
        { action }
      );

      setRequest(prev => ({ ...prev!, approvedByHR: action === 'APPROVE' ? true : false }));
    } catch (err) {
      handleStatusUpdateError(err);
    }
  };


  const getRecessByName = (name: string) => {
    if (!request || !request.recesos) return undefined;

    return request.recesos.find(receso => receso.name === name);
  };

  const formatDateLong = (dateString: string): string => {
    if (!dateString) return '';

    // Usa parseISO para preservar la fecha sin alterar zona horaria
    const date = parseISO(dateString);

    return format(date, "EEEE d 'de' MMMM 'del' yyyy", { locale: es });
  };


  const renderHeader = () => (
    <Box textAlign="center" mb={4}>
      <Typography variant="h4" fontWeight="bold" gutterBottom color="primary">
        Detalles de Solicitud de Vacaciones
      </Typography>
      <Box display="flex" justifyContent="center" alignItems="center" mt={2} >
        <Chip
          label={STATUS_OPTIONS.find(s => s.value === request?.status)?.label || request?.status}
          color={STATUS_OPTIONS.find(s => s.value === request?.status)?.color as any}
          size="medium"
          sx={{ fontSize: '1rem', padding: '8px 16px' }}
        />
        {(request?.status === "AUTHORIZED" || request?.status === "SUSPENDED") && (
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={() => generateVacationAuthorizationPDF(request)}
            sx={{ ml: 2 }}
          >
            Descargar Autorizacion
          </Button>
        )}
      </Box>
    </Box>
  );

  const renderInfoItem = (icon: React.ReactNode, label: string, value: React.ReactNode, color?: string) => (
    <ListItem>
      <ListItemIcon sx={{ minWidth: 36, color }}>
        {icon}
      </ListItemIcon>
      <ListItemText
        primary={label}
        secondary={value}
        primaryTypographyProps={{ variant: 'subtitle2' }}
        secondaryTypographyProps={{ variant: 'body1' }}
      />
    </ListItem>
  );

  const renderDateRange = (start: string, end: string) => (
    <Box display="flex" alignItems="center" gap={1}>
      <EventAvailableIcon fontSize="small" color="action" />
      <Typography>{formatDate(start)}</Typography>
      <Typography>→</Typography>
      <EventBusyIcon fontSize="small" color="action" />
      <Typography>{formatDate(end)}</Typography>
    </Box>
  );

  const renderApplicantSection = () => {
    const organizationalUnit =
      request?.department || request?.academicUnit || 'No especificado';

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
              <PeopleIcon />
            </Avatar>
            <Typography variant="h6" fontWeight="bold">
              Información del Solicitante
            </Typography>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => router.push(`/vacations/vacations-inform/${request?.requestId}`)}
              sx={{ ml: 2 }}
            >
              Ver Informe
            </Button>
          </Box>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <List dense>
                {renderInfoItem(<WorkIcon color="primary" />, "Nombre", request?.userName)}
                {renderInfoItem(<TodayIcon color="primary" />, "Fecha de Ingreso", formatDate(request?.fechaIngreso || ''))}
                {renderInfoItem(<EventIcon color="primary" />, "Fecha de Solicitud", formatDate(request?.requestDate || ''))}
              </List>
            </Grid>
            <Grid item xs={12} md={6}>
              <List dense>
                {renderInfoItem(<AssignmentIcon color="primary" />, "Unidad Organizacional", organizationalUnit)}
                {renderInfoItem(<VerifiedUserIcon color="primary" />, "Cargo", request?.position || 'No especificado')}
              </List>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };


  const renderVacationDetailsSection = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
            <DateRangeIcon />
          </Avatar>
          <Typography variant="h6" fontWeight="bold">
            Detalles de la Vacación
          </Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <List dense>
              {renderInfoItem(<EventAvailableIcon color="secondary" />, "Fecha de Inicio Solicitud", formatDateLong(request?.startDate || ''))}
              {renderInfoItem(<EventBusyIcon color="secondary" />, "Fecha de Fin", formatDateLong(request?.endDate || ''))}
              {renderInfoItem(<TodayIcon color="secondary" />, "Fecha de Regreso", formatDateLong(request?.returnDate || ''))}

              {renderInfoItem(<AccessTimeIcon color="secondary" />, "Total de días solicitados", request?.totalDays)}
              {renderInfoItem(<TodayIcon color="secondary" />, "Días Disponibles (Sin Autorizar)", debtData?.diasDisponibles ?? '')}

            </List>
          </Grid>
          <Grid item xs={12} md={6}>
            <List dense>
              {renderInfoItem(<TimelineIcon color="secondary" />, "Gestión Correspondiente",
                `${new Date(request?.managementPeriodStart || '').getFullYear()} - ${new Date(request?.managementPeriodEnd || '').getFullYear()}`)}
              {renderInfoItem(<StarIcon color="secondary" />, "Años de Antigüedad", request?.antiguedadEnAnios)}
              {renderInfoItem(<DateRangeIcon color="secondary" />, "Días de Vacación por Antiguedad", request?.diasDeVacacion)}
              {renderInfoItem(<SchoolIcon color="secondary" />, "Descanso Invierno (dias hàbiles)", getRecessByName('INVIERNO')?.daysCount || '0 días')}
              {renderInfoItem(<CelebrationIcon color="secondary" />, "Descanso Fin de Año (dias hàbiles)", getRecessByName('FINDEGESTION')?.daysCount || '0 días')}
            </List>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderManagementDetailsSection = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
            <HowToRegIcon />
          </Avatar>
          <Typography variant="h6" fontWeight="bold">Estado y Autorizaciones</Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <List dense>
              {renderInfoItem(
                STATUS_OPTIONS.find(s => s.value === request?.status)?.icon || <PendingActionsIcon />,
                "Estado",
                <Chip
                  label={STATUS_OPTIONS.find(s => s.value === request?.status)?.label || request?.status}
                  color={STATUS_OPTIONS.find(s => s.value === request?.status)?.color as any}
                  size="small"
                />
              )}

              {renderInfoItem(<TodayIcon color="info" />, "Revisión por Jefe", request?.reviewDate ? formatDate(request.reviewDate) : 'No disponible')}

              {request?.supervisor && request.supervisor.id && renderInfoItem(
                <PeopleIcon color="info" />,
                "Revisado por Supervisor",
                request.supervisor.username || 'No disponible'
              )}

              {request?.approvedBy && renderInfoItem(
                <CheckIcon color="success" />,
                "Revisado Dpto. Personal",
                request.approvedBy.username || 'No disponible'
              )}

              {request?.postponedDate && renderInfoItem(<EventBusyIcon color="warning" />, "Postergado hasta", formatDate(request.postponedDate))}
            </List>

          </Grid>
          <Grid item xs={12} md={6}>
            <List dense>
              {renderInfoItem(
                request?.approvedByHR === null
                  ? <PendingActionsIcon color="warning" />
                  : request?.approvedByHR
                    ? <CheckIcon color="success" />
                    : <CancelIcon color="error" />,
                "Aprobación Dpto. Personal",
                <Chip
                  label={
                    request?.approvedByHR === null
                      ? 'Pendiente'
                      : request?.approvedByHR
                        ? 'Aprobado'
                        : 'Rechazado'
                  }
                  color={
                    request?.approvedByHR === null
                      ? 'warning'
                      : request?.approvedByHR
                        ? 'success'
                        : 'error'
                  }
                  size="small"
                />
              )}


              {renderInfoItem(<WarningIcon color="info" />, "Días de Deuda", debtData?.deudaAcumulativaHastaEstaGestion ?? 0)}
            </List>

          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );



  const renderActionSections = () => (
    <>
      {(user?.role === 'supervisor') && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Actualizar Estado
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <FormControl fullWidth>
              <InputLabel id="status-select-label">Estado</InputLabel>
              <Select
                labelId="status-select-label"
                value={selectedStatus}
                onChange={handleStatusChange}
                label="Estado"
                disabled={request?.status !== 'PENDING'}
              >
                {STATUS_OPTIONS.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    <Box display="flex" alignItems="center">
                      <Box ml={1}>{status.label}</Box>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
              {request?.status !== 'PENDING' && (
                <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                  No se puede modificar el estado porque la solicitud ya fue procesada.
                </Typography>
              )}
            </FormControl>

          </CardContent>
        </Card>
      )}
      {/** 
      {(user?.role === 'admin' || user?.role === 'supervisor') && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Postergar Solicitud
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <PostponeVacationRequestForm
              requestId={request?.requestId || 0}
              onRequestUpdate={fetchRequestDetails}
            />
          </CardContent>
        </Card>
      )}
*/}
      {user?.role === 'admin' && !request?.deleted && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Aprobación de Departamento de Personal
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {request?.status === 'PENDING' ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                La solicitud debe ser revisada primero por el supervisor o jefe superior antes de aprobarla.
              </Alert>
            ) : request?.approvedByHR === null ? (
              <Box display="flex" gap={2}>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<CheckIcon />}
                  onClick={() => handleHRDecision('APPROVE')}
                  fullWidth
                >
                  Aprobar
                </Button>

                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<CancelIcon />}
                  onClick={() => handleHRDecision('REJECT')}
                  fullWidth
                >
                  Rechazar
                </Button>
              </Box>
            ) : (
              <Alert
                severity={request?.approvedByHR ? "success" : "error"}
                sx={{ mt: 2 }}
              >
                La solicitud ha sido {request?.approvedByHR ? "Aprobada" : "Rechazada"} por el Dpto. Personal.
              </Alert>
            )}

          </CardContent>
        </Card>
      )}




    </>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ my: 4 }}>
        {error}
      </Alert>
    );
  }

  if (!request) {
    return (
      <Alert severity="info" sx={{ my: 4 }}>
        No se encontró la solicitud.
      </Alert>
    );
  }

  return (
    <Container maxWidth="lg">
      {renderHeader()}
      {renderApplicantSection()}
      {renderVacationDetailsSection()}
      {renderManagementDetailsSection()}
      {
        (user?.role === 'admin' || user?.role === 'supervisor') && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Observaciones
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <TextField
                fullWidth
                multiline
                minRows={3}
                placeholder="Ingrese observaciones para el supervisor o administrador"
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                variant="outlined"
                disabled={savingObservation}
              />

              <Button
                variant="contained"
                sx={{ mt: 2 }}
                startIcon={<EditIcon />}
                onClick={handleObservationSave}
                /*disabled={savingObservation || observation === request?.postponedReason} */
              >
                {savingObservation ? 'Guardando...' : 'Guardar Observación'}
              </Button>
            </CardContent>
          </Card>
        )
      }
      {renderActionSections()}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>
          Información Importante
          <IconButton
            aria-label="close"
            onClick={() => setDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>{infoMessage}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} color="primary" autoFocus>
            Entendido
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

VacationRequestDetails.acl = {
  action: 'read',
  subject: 'vacation-request-details',
};

export default VacationRequestDetails;
