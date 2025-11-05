// src/views/pages/dashboard/WelcomeDashboard.tsx
import { useEffect, useState } from 'react';
import axios from 'src/lib/axios';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Tooltip from '@mui/material/Tooltip';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse';

// ** Icon Imports
import Icon from 'src/@core/components/icon';

// ** Custom Component Imports
import CardStatisticsVertical from 'src/@core/components/card-statistics/card-stats-vertical';
import ApexChartWrapper from 'src/@core/styles/libs/react-apexcharts';
import RequestPermissionDialog from '../permissions/create-permission';

// ** NEW: Import the SupervisorPendingRequestsCard component
import SupervisorPendingRequestsCard from './supervisorRequests'; // Adjust the path as needed

// ** Next
import Link from 'next/link';

// ** Custom Hooks
import useUser from 'src/hooks/useUser';
import { current } from '@reduxjs/toolkit';

// Utilidad para obtener la fecha actual en formato ISO (hasta hoy)
const getTodayIsoDate = () => new Date().toISOString().split('T')[0];

const WelcomeDashboard = () => {
  const user = useUser();
  const [vacationDebt, setVacationDebt] = useState<number | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [requestStatus, setRequestStatus] = useState({
    canRequest: true,
    reason: '',
    loading: true
  });
  // NUEVO ESTADO para la validación de licencias
  const [licenseRequestStatus, setLicenseRequestStatus] = useState({
    canRequest: true,
    reason: '',
    loading: true,
    availableDays: undefined as number | undefined
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.ci) {
        setRequestStatus(prev => ({ ...prev, loading: false }));
        setLicenseRequestStatus(prev => ({ ...prev, loading: false }));
        return;
      }

      try {
        // --- Lógica para Vacaciones ---
        // Obtener días disponibles
        const endDate = getTodayIsoDate();
        const debtResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/vacations/accumulated-debt`, {
          params: {
            carnetIdentidad: user.ci,
            endDate
          }
        });
        setVacationDebt(debtResponse.data.resumenGeneral.diasDisponiblesActuales);

        // Verificar estado de última solicitud de vacaciones
        const vacationStatusResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/vacation-requests/check-status/${user.ci}`
        );

        setRequestStatus({
          canRequest: vacationStatusResponse.data.canRequest,
          reason: vacationStatusResponse.data.reason || '',
          loading: false
        });

        // --- Lógica para Licencias (NUEVO) ---
        const licenseValidationResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/licenses-validation/can-request/${user.ci}`
        );
        //console.log('Available days from backend:', licenseValidationResponse.data.availableDays);

        setLicenseRequestStatus({
          canRequest: licenseValidationResponse.data.canRequest,
          reason: licenseValidationResponse.data.reason || '',
          availableDays: licenseValidationResponse.data.availableDays, // ¡Asegúrate de que este valor viene del backend!
          loading: false
        });

      } catch (error) {
        console.error('Error fetching data:', error);
        let errorMessage = 'Error al verificar disponibilidad';

        if (axios.isAxiosError(error)) {
          errorMessage = error.response?.data?.reason ||
            error.response?.data?.message ||
            error.message;
        }

        setRequestStatus({
          canRequest: false,
          reason: errorMessage,
          loading: false
        });
        // Asegurar que el estado de licencia también se actualice en caso de error general
        setLicenseRequestStatus({
          canRequest: false,
          reason: errorMessage,
          availableDays: 0, // En caso de error, puedes establecer 0 días o undefined
          loading: false
        });
      }
    };

    fetchData();
  }, [user?.ci]);

  // Determinar si el botón de Vacaciones debe estar deshabilitado
  const isVacationButtonDisabled =
    requestStatus.loading ||
    !requestStatus.canRequest ||
    (vacationDebt !== null && vacationDebt <= 0);

  // Mensaje para el tooltip de Vacaciones
  const getVacationTooltipMessage = () => {
    if (requestStatus.loading) return 'Verificando disponibilidad...';
    if (!requestStatus.canRequest) return requestStatus.reason;
    if (vacationDebt !== null && vacationDebt <= 0) return 'No tienes días de vacaciones disponibles';
    return 'Solicitar vacaciones';
  };

  // Texto para mostrar en la card de vacaciones
  const getVacationStatusText = () => {
    if (requestStatus.loading) return 'Verificando estado...';
    if (!requestStatus.canRequest) return 'No disponible';
    if (vacationDebt !== null && vacationDebt <= 0) return 'Sin días disponibles';
    return 'Disponible';
  };

  // --- NUEVO: Lógica para el botón de Licencias ---
  const isLicenseButtonDisabled =
    licenseRequestStatus.loading ||
    !licenseRequestStatus.canRequest ||
    (licenseRequestStatus.availableDays !== undefined && licenseRequestStatus.availableDays <= 0);

  const getLicenseTooltipMessage = () => {
    if (licenseRequestStatus.loading) return 'Verificando disponibilidad...';
    if (!licenseRequestStatus.canRequest) return licenseRequestStatus.reason;
    if (licenseRequestStatus.availableDays !== undefined && licenseRequestStatus.availableDays <= 0) return 'No tienes días de licencia disponibles';
    return 'Solicitar licencia';
  };

  // Esta función ahora solo determina si está "Disponible" o "No disponible",
  // el número de días lo manejamos directamente en el `chipText`.
  const getLicenseStatusText = () => {
    if (licenseRequestStatus.loading) return 'Verificando estado...';
    if (!licenseRequestStatus.canRequest) return 'No disponible';
    return 'Disponible';
  };
  return (
    <ApexChartWrapper>
      <Grid container spacing={6}>
        {/* Bienvenida */}
        <Grid item xs={12}>
          <Card
            sx={{
              background: theme => theme.palette.background.default,
              border: theme => `1px solid ${theme.palette.divider}`,
              boxShadow: 'none',
            }}
          >
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                Bienvenido, {user ? user.fullName : 'Usuario'}!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sistema de gestión de vacaciones y permisos. Aquí puedes:
              </Typography>
              <Box component="ul" sx={{ pl: 4, mt: 2, mb: 0 }}>
                <li>Solicitar días de vacaciones</li>
                <li>Solicitar permisos</li>
                <li>Revisar el estado de tus solicitudes</li>
                {user?.role === 'supervisor' && <li>Revisar solicitudes pendientes de tu equipo</li>}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Tarjetas Vacaciones y Licencias */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <CardStatisticsVertical
              stats="Solicitar Vacaciones"
              color="primary"
              icon={<Icon icon="mdi:beach" />}
              title="Vacaciones"
              chipText={
                vacationDebt !== null
                  ? `${vacationDebt} días disponibles de vacaciones`
                  : '...'
              }
              trendNumber={getVacationStatusText()}
            />
            {requestStatus.loading && (
              <CircularProgress
                size={24}
                sx={{
                  alignSelf: 'flex-end',
                  color: 'primary.main',
                }}
              />
            )}
            <Collapse in={!requestStatus.loading && !requestStatus.canRequest}>
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  No puedes solicitar vacaciones porque:
                </Typography>
                <Typography variant="body2">
                  {requestStatus.reason || 'No hay días disponibles'}
                </Typography>
              </Alert>
            </Collapse>
            <Collapse in={!requestStatus.loading && vacationDebt !== null && vacationDebt <= 0}>
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  No puedes solicitar vacaciones porque:
                </Typography>
                <Typography variant="body2">
                  No tienes días disponibles en este período
                </Typography>
              </Alert>
            </Collapse>
          </Box>
        </Grid>

        {/* NUEVA SECCIÓN para Licencias */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <CardStatisticsVertical
              stats="Solicitar Licencia"
              color="secondary"
              icon={<Icon icon="mdi:briefcase" />}
              title="Licencia"
              chipText={
                licenseRequestStatus.availableDays !== undefined
                  ? `${licenseRequestStatus.availableDays} días disponibles`
                  : licenseRequestStatus.loading ? '...' : 'No disponible'
              }

              trendNumber={getLicenseStatusText()}
            />
            {licenseRequestStatus.loading && (
              <CircularProgress
                size={24}
                sx={{
                  alignSelf: 'flex-end',
                  color: 'secondary.main',
                }}
              />
            )}
            <Collapse in={!licenseRequestStatus.loading && licenseRequestStatus.availableDays !== undefined && licenseRequestStatus.availableDays <= 0}>
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  No puedes solicitar licencia porque:
                </Typography>
                <Typography variant="body2">
                  No tienes días disponibles en este período
                </Typography>
              </Alert>
            </Collapse>
            <Collapse in={!licenseRequestStatus.loading && !licenseRequestStatus.canRequest && (licenseRequestStatus.availableDays === undefined || licenseRequestStatus.availableDays > 0)}>
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  No puedes solicitar una licencia porque:
                </Typography>
                <Typography variant="body2">
                  {licenseRequestStatus.reason || 'No hay licencias disponibles en este momento'}
                </Typography>
              </Alert>
            </Collapse>
          </Box>
        </Grid>

        {/* Botones */}
        <Grid item xs={12} md={6}>
          <Tooltip title={getVacationTooltipMessage()} arrow>
            <span>
              <Button
                variant="contained"
                color="primary"
                startIcon={<Icon icon="mdi:beach" />}
                fullWidth
                component={!isVacationButtonDisabled ? Link : 'button'}
                href="/vacations-form/"
                disabled={isVacationButtonDisabled}
                sx={{
                  opacity: isVacationButtonDisabled ? 0.7 : 1,
                  transition: 'opacity 0.3s ease',
                }}
              >
                Solicitar Vacaciones
                {requestStatus.loading && (
                  <CircularProgress
                    size={24}
                    sx={{ position: 'absolute', right: 16, color: 'inherit' }}
                  />
                )}
              </Button>
            </span>
          </Tooltip>
        </Grid>

        {/* NUEVO: Botón de Licencia con lógica de deshabilitación y tooltip */}
        <Grid item xs={12} md={6}>
          <Tooltip title={getLicenseTooltipMessage()} arrow>
            <span>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<Icon icon="mdi:briefcase" />}
                fullWidth
                onClick={() => setOpenDialog(true)}
                disabled={isLicenseButtonDisabled}
                sx={{
                  opacity: isLicenseButtonDisabled ? 0.7 : 1,
                  transition: 'opacity 0.3s ease',
                }}
              >
                Solicitar Licencia
                {licenseRequestStatus.loading && (
                  <CircularProgress
                    size={24}
                    sx={{ position: 'absolute', right: 16, color: 'inherit' }}
                  />
                )}
              </Button>
            </span>
          </Tooltip>
          <RequestPermissionDialog open={openDialog} onClose={() => setOpenDialog(false)} />
        </Grid>

        {/* Tarjeta exclusiva para el supervisor */}
        {user?.role === 'supervisor' && (
          <Grid item xs={12}>
            <SupervisorPendingRequestsCard />
          </Grid>
        )}
      </Grid>
    </ApexChartWrapper>
  );
};

WelcomeDashboard.acl = {
  action: 'read',
  subject: 'welcome-dashboard',
};

export default WelcomeDashboard;