import { useEffect, useState } from 'react';

// ** MUI Imports
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';

// ** Icon Imports
import Icon from 'src/@core/components/icon';

// ** Custom Component Imports
import CardStatisticsVertical from 'src/@core/components/card-statistics/card-stats-vertical';
import ApexChartWrapper from 'src/@core/styles/libs/react-apexcharts';
import RequestPermissionDialog from 'src/pages/permissions/create-permission';

// ** Next Router
import { useRouter } from 'next/router';
import Link from 'next/link';

// ** Hooks y Axios
import useUser from 'src/hooks/useUser';
import axios from 'src/lib/axios';

// ** Util
const getTodayIsoDate = () => new Date().toISOString().split('T')[0];

const AdminDashboard = () => {
  const router = useRouter();
  const user = useUser();

  const [pendingVacationRequests, setPendingVacationRequests] = useState(0);
  const [todayVacationRequests, setTodayVacationRequests] = useState(0);
  const [pendingLicenseRequests, setPendingLicenseRequests] = useState(0);
  const [todayLicenseRequests, setTodayLicenseRequests] = useState(0);

  // Estados para solicitudes personales de Vacaciones (existentes)
  const [vacationDebt, setVacationDebt] = useState<number | null>(null);
  const [requestStatus, setRequestStatus] = useState({
    canRequest: true,
    reason: '',
    loading: true,
  });

  // NUEVOS ESTADOS para solicitudes personales de Licencias
  const [licenseRequestStatus, setLicenseRequestStatus] = useState({
    canRequest: true,
    reason: '',
    loading: true,
    availableDays: undefined as number | undefined, // Se añade para mostrar días disponibles
  });

  const [openDialog, setOpenDialog] = useState(false);

  // Determinar si el botón de Vacaciones debe estar deshabilitado (ya existente)
  const isVacationButtonDisabled =
    requestStatus.loading ||
    !requestStatus.canRequest ||
    (vacationDebt !== null && vacationDebt <= 0);

  // Mensaje para el tooltip de Vacaciones (ya existente)
  const getVacationTooltipMessage = () => {
    if (requestStatus.loading) return 'Verificando disponibilidad...';
    if (!requestStatus.canRequest) return requestStatus.reason;
    if (vacationDebt !== null && vacationDebt <= 0) return 'No tienes días de vacaciones disponibles';
    
return 'Solicitar vacaciones';
  };

  // Texto para mostrar en la card de vacaciones (ya existente)
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

  const getLicenseStatusText = () => {
    if (licenseRequestStatus.loading) return 'Verificando estado...';
    if (!licenseRequestStatus.canRequest) return 'No disponible';
    
return 'Disponible';
  };

  useEffect(() => {
    const fetchData = async () => {
      // Reiniciar estados de carga
      setRequestStatus(prev => ({ ...prev, loading: true }));
      setLicenseRequestStatus(prev => ({ ...prev, loading: true }));

      // Si no hay usuario, deshabilitar y salir
      if (!user?.ci) {
        setRequestStatus(prev => ({ ...prev, loading: false }));
        setLicenseRequestStatus(prev => ({ ...prev, loading: false }));
        
return;
      }

      try {
        // --- Lógica para Vacaciones (existente) ---
        const endDate = getTodayIsoDate();
        const debtResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/vacations/accumulated-debt`, {
          params: { carnetIdentidad: user.ci, endDate }
        });
        setVacationDebt(debtResponse.data.resumenGeneral.diasDisponiblesActuales);

        const vacationStatusResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/vacation-requests/check-status/${user.ci}`
        );
        setRequestStatus({
          canRequest: vacationStatusResponse.data.canRequest,
          reason: vacationStatusResponse.data.reason || '',
          loading: false,
        });

        // --- Lógica para Licencias (NUEVA) ---
        const licenseValidationResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/licenses-validation/can-request/${user.ci}`
        );
        setLicenseRequestStatus({
          canRequest: licenseValidationResponse.data.canRequest,
          reason: licenseValidationResponse.data.reason || '',
          availableDays: licenseValidationResponse.data.availableDays, // Asegúrate que el backend envía esto
          loading: false,
        });

      } catch (error) {
        console.error('Error fetching personal data:', error);
        let errorMessage = 'Error al verificar disponibilidad';

        if (axios.isAxiosError(error)) {
          errorMessage = error.response?.data?.reason || error.response?.data?.message || error.message;
        }

        setRequestStatus({ canRequest: false, reason: errorMessage, loading: false });
        setLicenseRequestStatus({
          canRequest: false,
          reason: errorMessage,
          availableDays: 0,
          loading: false,
        });
      }
    };

    // --- Funciones para las solicitudes pendientes de ADMIN (ya existentes) ---
    const fetchVacationRequests = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/vacation-requests/hr-pending`);
        const requests = response.data;
        setPendingVacationRequests(requests.length);

        const today = getTodayIsoDate();
        const todayCount = requests.filter((req: any) => req.requestDate === today).length;
        setTodayVacationRequests(todayCount);
      } catch (error) {
        console.error('Error al obtener solicitudes de vacaciones pendientes:', error);
      }
    };

    const fetchLicenseRequests = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/licenses/hr-pending`);
        const requests = response.data;
        setPendingLicenseRequests(requests.length);

        const today = getTodayIsoDate();
        const todayCount = requests.filter((req: any) => req.issuedDate?.split('T')[0] === today).length;
        setTodayLicenseRequests(todayCount);
      } catch (error) {
        console.error('Error al obtener solicitudes de licencias pendientes:', error);
      }
    };

    // Llamadas a todas las funciones de fetching
    fetchVacationRequests();
    fetchLicenseRequests();
    fetchData(); // Llamada para datos personales de vacaciones y licencias
  }, [user?.ci]);


  return (
    <ApexChartWrapper>
      <Grid container spacing={6} className='match-height'>

        {/* Bienvenida */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="div" gutterBottom>
                Bienvenido, Administrador! {user?.fullName}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Desde este panel puedes gestionar las solicitudes de vacaciones, permisos y usuarios del sistema.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        {/* Estadísticas rápidas */}
        <Grid item xs={12} md={4}>
          <CardStatisticsVertical
            stats={`${pendingVacationRequests} Solicitudes Pendientes`}
            color="primary"
            icon={<Icon icon="mdi:beach" />}
            title="Solicitudes de Vacaciones"
            chipText="Revisar"
            trendNumber={`+${todayVacationRequests} Hoy`}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <CardStatisticsVertical
            stats={`${pendingLicenseRequests} Solicitudes Pendientes`}
            color="secondary"
            icon={<Icon icon="mdi:briefcase" />}
            title="Solicitudes de Licencia"
            chipText="Revisar"
            trendNumber={`+${todayLicenseRequests} Hoy`}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <CardStatisticsVertical
            stats="--- Usuarios Activos" // Considerar hacer dinámico este número
            color="success"
            icon={<Icon icon="mdi:account-group" />}
            title="Usuarios"
            chipText="Gestionar"
            trendNumber="--- Nuevos" // Considerar hacer dinámico este número
          />
        </Grid>

        {/* Botones de acceso rápido */}
        <Grid item xs={12} md={4}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Icon icon="mdi:clipboard-list" />}
            fullWidth
            onClick={() => router.push('/vacations/vacations-admin/')}
          >
            Revisar Solicitudes de Vacaciones
          </Button>
        </Grid>

        <Grid item xs={12} md={4}>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<Icon icon="mdi:briefcase-outline" />}
            fullWidth
            onClick={() => router.push('/permissions/adminlicenses/')}
          >
            Revisar Solicitudes de Permisos
          </Button>
        </Grid>

        <Grid item xs={12} md={4}>
          <Button
            variant="contained"
            color="success"
            startIcon={<Icon icon="mdi:account-multiple" />}
            fullWidth
            onClick={() => router.push('/users/search-users/')}
          >
            Gestionar Usuarios
          </Button>
        </Grid>

        {/* Tarjeta personal de Vacaciones (ya dinámica) */}
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
                sx={{ alignSelf: 'flex-end', color: 'primary.main' }}
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

        {/* NUEVA Tarjeta personal de Licencias (dinamizada) */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <CardStatisticsVertical
              stats="Solicitar Licencia"
              color="secondary"
              icon={<Icon icon="mdi:briefcase" />}
              title="Licencia"
              chipText={
                licenseRequestStatus.availableDays !== undefined
                  ? `${licenseRequestStatus.availableDays} días disponibles de licencia (Gestión ${new Date().getFullYear()})`
                  : licenseRequestStatus.loading ? '...' : 'No disponible'
              }
              trendNumber={getLicenseStatusText()}
            />
            {licenseRequestStatus.loading && (
              <CircularProgress
                size={24}
                sx={{ alignSelf: 'flex-end', color: 'secondary.main' }}
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

        {/* Botones de solicitud personales */}
        <Grid item xs={12} md={6}>
          <Tooltip title={getVacationTooltipMessage()} arrow>
            <span>
              <Button
                variant="contained"
                color="warning"
                startIcon={<Icon icon="mdi:beach" />}
                fullWidth
                component={!isVacationButtonDisabled ? Link : 'button'}
                href="/vacations-form/"
                disabled={isVacationButtonDisabled}
                sx={{
                  opacity: isVacationButtonDisabled ? 0.7 : 1,
                  transition: 'opacity 0.3s ease'
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
          <Tooltip title={getLicenseTooltipMessage()} arrow>
            <span>
              <Button
                variant="contained"
                color="info"
                startIcon={<Icon icon="mdi:briefcase" />}
                fullWidth
                onClick={() => setOpenDialog(true)}
                disabled={isLicenseButtonDisabled}
                sx={{
                  opacity: isLicenseButtonDisabled ? 0.7 : 1,
                  transition: 'opacity 0.3s ease'
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

      </Grid>
    </ApexChartWrapper>
  );
};

export default AdminDashboard;
