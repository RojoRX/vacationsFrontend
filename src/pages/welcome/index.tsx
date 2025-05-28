// src/views/pages/dashboard/WelcomeDashboard.tsx
import { useEffect, useState } from 'react';
import axios from 'axios';
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

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.ci) {
        setRequestStatus(prev => ({ ...prev, loading: false })); // Stop loading if user.ci is not available
        return;
      }

      try {
        // Obtener días disponibles
        const endDate = getTodayIsoDate();
        const debtResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/vacations/accumulated-debt`, {
          params: {
            carnetIdentidad: user.ci,
            endDate
          }
        });
        setVacationDebt(debtResponse.data.resumenGeneral.diasDisponiblesActuales);

        // Verificar estado de última solicitud
        const statusResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/vacation-requests/check-status/${user.ci}`
        );

        setRequestStatus({
          canRequest: statusResponse.data.canRequest,
          reason: statusResponse.data.reason || '',
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
      }
    };

    fetchData();
  }, [user?.ci]); // Dependency array: re-run effect if user.ci changes

  // Determinar si el botón debe estar deshabilitado
  const isVacationButtonDisabled =
    requestStatus.loading ||
    !requestStatus.canRequest ||
    (vacationDebt !== null && vacationDebt <= 0);

  // Mensaje para el tooltip
  const getTooltipMessage = () => {
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

      <Grid item xs={12} md={6}>
        <CardStatisticsVertical
          stats="Solicitar Licencia"
          color="secondary"
          icon={<Icon icon="mdi:briefcase" />}
          title="Licencia"
          chipText="Disponible"
          trendNumber="+1 Solicitud"
        />
      </Grid>

      {/* Botones */}
      <Grid item xs={12} md={6}>
        <Tooltip title={getTooltipMessage()} arrow>
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

      <Grid item xs={12} md={6}>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<Icon icon="mdi:briefcase" />}
          fullWidth
          onClick={() => setOpenDialog(true)}
        >
          Solicitar Licencia
        </Button>
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