import React, { useEffect, useState } from 'react';
import {
    Typography,
    CircularProgress,
    Box,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    Grid,
    Table,
    TableRow,
    TableCell,
    TableBody,
    Stack,
    useMediaQuery,
    useTheme,
    Card,
    CardContent,
    Avatar,
    Chip,
    Divider,
    List,
    ListItem,
    ListItemAvatar,
    ListItemIcon,
    ListItemText,
    Paper
} from '@mui/material';
import {
    EventNote as EventNoteIcon,
    CalendarToday as CalendarTodayIcon,
    EventAvailable as EventAvailableIcon,
    Today as TodayIcon,
    Block as BlockIcon,
    EventBusy as EventBusyIcon,
    BeachAccess as BeachAccessIcon,
    CheckCircleOutline as CheckCircleOutlineIcon,
    AccessTime as AccessTimeIcon,
    MonetizationOn as MonetizationOnIcon,
    Timeline as TimelineIcon,
    Equalizer as EqualizerIcon
} from '@mui/icons-material';
import WorkHistoryIcon from '@mui/icons-material/WorkHistory';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import axios from 'axios';
import useUser from 'src/hooks/useUser';
import { useRouter } from 'next/router';
import { Gestion } from 'src/interfaces/gestion';
import { VacationDebt } from 'src/interfaces/vacationDebt';
import { VacationData } from 'src/interfaces/vacationData';
import { VacationRequest } from 'src/interfaces/vacationRequests';
import AcUnitIcon from '@mui/icons-material/AcUnit'; // Icono de invierno
import HolidayVillageIcon from '@mui/icons-material/HolidayVillage'; // Icono de fin de gestión
interface ResumenGeneral {
    deudaTotal: number;
    diasDisponiblesActuales: number;
    gestionesConDeuda: number;
    gestionesSinDeuda: number;
    promedioDeudaPorGestion: number;
    primeraGestion: Date | null;
    ultimaGestion: Date | null;
    totalDiasLicencia: number;
    totalDiasVacacionUsados: number;
}

const formatedDate = (dateString: string) => {
    if (!dateString) return 'Fecha no disponible';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
};

const VacationDashboard = () => {
    const [gestiones, setGestiones] = useState<Gestion[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [gestionesData, setGestionesData] = useState<Record<string, { data: VacationData; debt: VacationDebt }>>({});
    const [resumenGeneral, setResumenGeneral] = useState<ResumenGeneral | null>(null);
    const [dialogOpen, setDialogOpen] = useState<boolean>(false);
    const [selectedGestion, setSelectedGestion] = useState<string>('');

    const user = useUser();
    const router = useRouter();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    useEffect(() => {
        if (!user?.ci) return;

        const fetchAllData = async () => {
            try {
                console.log(`🔍 Obteniendo gestiones para: ${user.ci}`);
                const gestionesRes = await axios.get<Gestion[]>(
                    `${process.env.NEXT_PUBLIC_API_BASE_URL}/gestion-periods/gestions/${user.ci}`
                );

                const gestionesList = gestionesRes.data || [];
                console.log('📅 Gestiones obtenidas:', gestionesList);
                setGestiones(gestionesList);

                if (gestionesList.length === 0) {
                    setGestionesData({});
                    setLoading(false);
                    return;
                }

                const ultimaGestion = gestionesList.reduce((a, b) =>
                    new Date(a.endDate) > new Date(b.endDate) ? a : b
                );

                try {
                    const endDateFormatted = ultimaGestion.endDate.split('T')[0];
                    const debtRes = await axios.get<{
                        resumenGeneral: any; detalles: VacationDebt[]
                    }>(
                        `${process.env.NEXT_PUBLIC_API_BASE_URL}/vacations/accumulated-debt`,
                        { params: { carnetIdentidad: user.ci, endDate: endDateFormatted } }
                    );

                    console.log('💰 Deuda acumulada recibida:', debtRes.data);

                    const promises = gestionesList.map(async (gestion: Gestion) => {
                        try {
                            const normalizeDate = (dateStr: string) => dateStr.split('T')[0];
                            const gestionStart = normalizeDate(gestion.startDate);
                            const gestionEnd = normalizeDate(gestion.endDate);

                            let deudaCorrespondiente = debtRes.data.detalles.find(d => {
                                const debtStart = normalizeDate(d.startDate);
                                const debtEnd = normalizeDate(d.endDate);
                                return debtStart === gestionStart && debtEnd === gestionEnd;
                            });

                            if (!deudaCorrespondiente) {
                                deudaCorrespondiente = {
                                    startDate: gestion.startDate,
                                    endDate: gestion.endDate,
                                    deuda: 0,
                                    deudaAcumulativaAnterior: 0,
                                    diasDisponibles: 0,
                                    deudaAcumulativaHastaEstaGestion: 0,
                                };
                            }

                            const vacRes = await axios.get<VacationData>(
                                `${process.env.NEXT_PUBLIC_API_BASE_URL}/vacations`,
                                {
                                    params: {
                                        carnetIdentidad: user.ci,
                                        startDate: gestionStart,
                                        endDate: gestionEnd,
                                    },
                                }
                            );
                            return {
                                key: `${gestion.startDate}-${gestion.endDate}`,
                                data: vacRes.data,
                                debt: deudaCorrespondiente,
                            };
                        } catch (vacError) {
                            console.error(`❌ Error en vacaciones ${gestion.startDate} - ${gestion.endDate}:`, vacError);
                            return {
                                key: `${gestion.startDate}-${gestion.endDate}`,
                                data: {} as VacationData,
                                debt: {
                                    startDate: gestion.startDate,
                                    endDate: gestion.endDate,
                                    deuda: 0,
                                    deudaAcumulativaAnterior: 0,
                                    diasDisponibles: 0,
                                } as VacationDebt,
                            };
                        }
                    });

                    const results = await Promise.all(promises);
                    const gestionMap: Record<string, { data: VacationData; debt: VacationDebt }> = {};
                    results.forEach((result) => {
                        gestionMap[result.key] = result;
                    });
                    console.log('📊 Mapa final de gestiones con deuda:', gestionMap);
                    setGestionesData(gestionMap);

                    // Calcular resumen general
                    // Usamos directamente el resumen general del endpoint
                    const resumenBackend = debtRes.data.resumenGeneral;

                    // Solo calculamos lo que no viene del backend
                    const totalDiasLicencia = Object.values(gestionMap)
                        .reduce((sum, item) => sum + (item.data?.licenciasAutorizadas?.totalAuthorizedDays || 0), 0);

                    const totalDiasVacacionUsados = Object.values(gestionMap)
                        .reduce((sum, item) => sum + (item.data?.solicitudesDeVacacionAutorizadas?.totalAuthorizedVacationDays || 0), 0);

                    // Combinamos el resumen del backend con los cálculos adicionales
                    setResumenGeneral({
                        ...resumenBackend,
                        totalDiasLicencia,
                        totalDiasVacacionUsados,
                        // Aseguramos que las fechas sean Date objects si es necesario
                        primeraGestion: resumenBackend.primeraGestion ? new Date(resumenBackend.primeraGestion) : null,
                        ultimaGestion: resumenBackend.ultimaGestion ? new Date(resumenBackend.ultimaGestion) : null
                    });

                } catch (debtErr) {
                    console.error('❌ Error al obtener deuda acumulada:', debtErr);
                }
            } catch (err) {
                console.error('❗ Error general al obtener datos del dashboard:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, [user?.ci]);

    const handleDialogOpen = (key: string) => {
        setSelectedGestion(key);
        setDialogOpen(true);
    };

    const handleDialogClose = () => setDialogOpen(false);

    const formatFecha = (fechaISO: string) => {
        if (!fechaISO) return 'No disponible';
        const fecha = new Date(fechaISO);
        return fecha.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getVisibleSlides = () => {
        if (isMobile) return 1;
        if (theme.breakpoints.down('lg')) return 3;
        return 4;
    };

    const visibleSlides = getVisibleSlides();
    const cardWidth = `calc(${100 / visibleSlides}% - ${theme.spacing(4)})`;

    if (loading) return <CircularProgress />;

    const empleadoData = gestiones.length > 0 ? gestionesData[`${gestiones[0].startDate}-${gestiones[0].endDate}`]?.data : null;

    return (
        <Box sx={{ px: isMobile ? 2 : 4, py: 3 }}>
            <Typography variant="h4" gutterBottom>
                Información General de Vacaciones
            </Typography>

            {/* Sección de Información del Empleado */}
            <Grid container spacing={2} mb={4}>
                <Grid item xs={12} sm={4}>
                    <Typography variant="h6">Nombre: {empleadoData?.name || 'No disponible'}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Typography variant="h6">Cargo: {empleadoData?.position || 'No disponible'}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Typography variant="h6">Fecha de Ingreso: {empleadoData?.fechaIngreso ? formatFecha(empleadoData.fechaIngreso) : 'No disponible'}</Typography>
                </Grid>
            </Grid>

            {/* Dashboard de Resumen General */}
            {resumenGeneral && (
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EqualizerIcon /> Resumen General
                    </Typography>

                    <Grid container spacing={3}>
                        {/* Tarjeta de Deuda Total */}
                        <Grid item xs={12} sm={6} md={3}>
                            <Card sx={{ height: '100%' }}>
                                <CardContent>
                                    <Box display="flex" alignItems="center" mb={2}>
                                        <Avatar sx={{ bgcolor: theme.palette.error.light, mr: 2 }}>
                                            <MonetizationOnIcon />
                                        </Avatar>
                                        <Typography variant="h6">Deuda Total</Typography>
                                    </Box>
                                    <Typography variant="h4" color="error">
                                        {resumenGeneral.deudaTotal} días
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {resumenGeneral.gestionesConDeuda} gestiones con deuda
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Tarjeta de Días Disponibles */}
                        <Grid item xs={12} sm={6} md={3}>
                            <Card sx={{ height: '100%' }}>
                                <CardContent>
                                    <Box display="flex" alignItems="center" mb={2}>
                                        <Avatar sx={{ bgcolor: theme.palette.success.light, mr: 2 }}>
                                            <BeachAccessIcon />
                                        </Avatar>
                                        <Typography variant="h6">Días Disponibles</Typography>
                                    </Box>
                                    <Typography variant="h4" color="success.main">
                                        {resumenGeneral.diasDisponiblesActuales} días
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {resumenGeneral.gestionesConDeuda} gestiones con deuda
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {resumenGeneral.gestionesSinDeuda} gestiones sin deuda
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Tarjeta de Historial de Vacaciones */}
                        <Grid item xs={12} sm={6} md={3}>
                            <Card sx={{ height: '100%' }}>
                                <CardContent>
                                    <Box display="flex" alignItems="center" mb={2}>
                                        <Avatar sx={{ bgcolor: theme.palette.info.light, mr: 2 }}>
                                            <TimelineIcon />
                                        </Avatar>
                                        <Typography variant="h6">Historial</Typography>
                                    </Box>
                                    <Typography variant="body1">
                                        <strong>Días licencia usados:</strong> {resumenGeneral.totalDiasLicencia}
                                    </Typography>
                                    <Typography variant="body1">
                                        <strong>Días de Vacacion usados:</strong> {resumenGeneral.totalDiasVacacionUsados}
                                    </Typography>
                                    <Typography variant="body1">
                                        <strong>Promedio deuda:</strong> {resumenGeneral.promedioDeudaPorGestion.toFixed(1)} días/gestión
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Tarjeta de Período Cubierto */}
                        <Grid item xs={12} sm={6} md={3}>
                            <Card sx={{ height: '100%' }}>
                                <CardContent>
                                    <Box display="flex" alignItems="center" mb={2}>
                                        <Avatar sx={{ bgcolor: theme.palette.warning.light, mr: 2 }}>
                                            <AccessTimeIcon />
                                        </Avatar>
                                        <Typography variant="h6">Período Cubierto</Typography>
                                    </Box>
                                    <Typography variant="body1">
                                        <strong>Primera gestión:</strong> {resumenGeneral.primeraGestion ? formatFecha(resumenGeneral.primeraGestion.toISOString()) : 'N/A'}
                                    </Typography>
                                    <Typography variant="body1">
                                        <strong>Última gestión:</strong> {resumenGeneral.ultimaGestion ? formatFecha(resumenGeneral.ultimaGestion.toISOString()) : 'N/A'}
                                    </Typography>
                                    <Typography variant="body1">
                                        <strong>Total gestiones:</strong> {gestiones.length}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Box>
            )}

            {/* Sección de Gestiones (mantenida igual) */}
            <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
                Historial por Gestión
            </Typography>

            <Box sx={{
                width: '100%',
                overflow: 'hidden',
                position: 'relative',
            }}>
                <Box sx={{
                    display: 'flex',
                    gap: 3,
                    padding: '16px 8px',
                    overflowX: 'auto',
                    scrollSnapType: 'x mandatory',
                    '&::-webkit-scrollbar': {
                        height: '6px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        backgroundColor: theme.palette.grey[500],
                        borderRadius: '4px',
                    },
                }}>
                    {gestiones.length > 0 ? (
                        [...gestiones]
                            .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())
                            .map((gestion) => {
                                const key = `${gestion.startDate}-${gestion.endDate}`;
                                const detalle = gestionesData[key];
                                if (!detalle) return null;

                                return (
                                    <Box
                                        key={key}
                                        sx={{
                                            minWidth: cardWidth,
                                            scrollSnapAlign: 'start',
                                            flexShrink: 0,
                                        }}
                                    >
                                        <Card sx={{
                                            height: '100%',
                                            boxShadow: 3,
                                            transition: 'transform 0.3s, box-shadow 0.3s',
                                            '&:hover': {
                                                transform: 'translateY(-4px)',
                                                boxShadow: 6,
                                            },
                                        }}>
                                            <CardContent>
                                                <Typography variant="h6" color="primary" gutterBottom textAlign='center'>
                                                    Gestión {new Date(gestion.startDate).getFullYear()} - {new Date(gestion.endDate).getFullYear()}
                                                </Typography>

                                                {detalle.debt.diasDisponibles > 0 ? (
                                                    <Typography variant="body2" sx={{ color: 'green', textAlign: 'center', fontWeight: 'bold', mb: 1 }}>
                                                        Vacaciones disponibles
                                                    </Typography>
                                                ) : (
                                                    <Typography variant="body2" sx={{ color: 'red', textAlign: 'center', fontWeight: 'bold', mb: 1 }}>
                                                        No tiene vacaciones disponibles
                                                    </Typography>
                                                )}

                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                    <Typography variant="body2">Días disponibles:</Typography>
                                                    <Typography variant="body1" fontWeight="bold" color={detalle.debt.diasDisponibles > 0 ? 'green' : 'secondary'}>
                                                        {detalle.debt.diasDisponibles}
                                                    </Typography>
                                                </Box>

                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                    <Typography variant="body2">Deuda Acumulada:</Typography>
                                                    <Typography
                                                        variant="body1"
                                                        color={(detalle.debt.deuda + detalle.debt.deudaAcumulativaAnterior) > 0 ? 'error' : 'text.primary'}
                                                        fontWeight="bold"
                                                    >
                                                        {detalle.debt.deuda + detalle.debt.deudaAcumulativaAnterior}
                                                    </Typography>
                                                </Box>

                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                                    <Typography variant="body2">Antigüedad:</Typography>
                                                    <Typography variant="body1" fontWeight="bold">
                                                        {detalle.data.antiguedadEnAnios} años
                                                    </Typography>
                                                </Box>

                                                <Button
                                                    variant="contained"
                                                    fullWidth
                                                    onClick={() => handleDialogOpen(key)}
                                                    sx={{ mt: 1 }}
                                                >
                                                    Ver detalles
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    </Box>
                                );
                            })
                    ) : (
                        <Typography variant="body1" color="text.secondary" sx={{ py: 4, textAlign: 'center', width: '100%' }}>
                            No hay gestiones disponibles
                        </Typography>
                    )}
                </Box>
            </Box>


            {/* Diálogo de Detalles (mantenido igual) */}
            <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="md" fullWidth>
                <DialogTitle sx={{
                    backgroundColor: theme.palette.primary.main,
                    color: '#ffff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    py: 2,
                    marginBottom: 5,
                }}>
                    <WorkHistoryIcon fontSize="large" />
                    <Box>
                        <Typography sx={{color: '#ffff'}} variant="h6">Resumen de Gestión</Typography>
                        <Typography  variant="subtitle2" sx={{ opacity: 0.9, color: '#ffff' }}>
                            Detalles de tus vacaciones y permisos
                        </Typography>
                    </Box>
                </DialogTitle>

                <DialogContent sx={{ py: 3 }}>
                    {selectedGestion && gestionesData[selectedGestion] && (
                        <Box>
                            {/* Resumen Principal */}
                            <Grid container spacing={3} sx={{ mb: 3 }}>
                                <Grid item xs={12} md={6}>
                                    <Paper elevation={0} sx={{
                                        p: 2,
                                        borderLeft: '4px solid',
                                        borderColor: theme.palette.primary.main,
                                        bgcolor: theme.palette.primary.light + '20'
                                    }}>
                                        <Box display="flex" alignItems="center" mb={1}>
                                            <AccessTimeIcon color="primary" sx={{ mr: 1 }} />
                                            <Typography variant="subtitle1" fontWeight={600}>
                                                Antigüedad
                                            </Typography>
                                        </Box>
                                        <Typography>
                                            {gestionesData[selectedGestion].data?.antiguedadEnAnios || 0} años y {gestionesData[selectedGestion].data?.antiguedadEnDias || 0} días de servicio
                                        </Typography>
                                    </Paper>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <Paper elevation={0} sx={{
                                        p: 2,
                                        borderLeft: '4px solid',
                                        borderColor: theme.palette.success.main,
                                        bgcolor: theme.palette.success.light + '20'
                                    }}>
                                        <Box display="flex" alignItems="center" mb={1}>
                                            <BeachAccessIcon color="success" sx={{ mr: 1 }} />
                                            <Typography variant="subtitle1" fontWeight={600}>
                                                Días de Vacación según Antigüedad
                                            </Typography>
                                        </Box>
                                        <Typography>
                                            {gestionesData[selectedGestion].data?.diasDeVacacion || 0} días correspondientes
                                        </Typography>
                                    </Paper>
                                </Grid>
                            </Grid>

                            {/* Estadísticas de Uso */}
                            <Grid container spacing={3} sx={{ mb: 4 }}>
                                <Grid item xs={12} md={4}>
                                    <Paper elevation={0} sx={{
                                        p: 2,
                                        borderLeft: '4px solid',
                                        borderColor: theme.palette.warning.main,
                                        bgcolor: theme.palette.warning.light + '20'
                                    }}>
                                        <Box display="flex" alignItems="center" mb={1}>
                                            <CheckCircleOutlineIcon color="warning" sx={{ mr: 1 }} />
                                            <Typography variant="subtitle1" fontWeight={600}>
                                                Vacaciones Usadas
                                            </Typography>
                                        </Box>
                                        <Typography>
                                            {gestionesData[selectedGestion].data?.solicitudesDeVacacionAutorizadas?.totalAuthorizedVacationDays || 0} días
                                        </Typography>
                                    </Paper>
                                </Grid>

                                <Grid item xs={12} md={4}>
                                    <Paper elevation={0} sx={{
                                        p: 2,
                                        borderLeft: '4px solid',
                                        borderColor: theme.palette.info.main,
                                        bgcolor: theme.palette.info.light + '20'
                                    }}>
                                        <Box display="flex" alignItems="center" mb={1}>
                                            <AssignmentTurnedInIcon color="info" sx={{ mr: 1 }} />
                                            <Typography variant="subtitle1" fontWeight={600}>
                                                Permisos Usados
                                            </Typography>
                                        </Box>
                                        <Typography>
                                            {gestionesData[selectedGestion].data?.licenciasAutorizadas?.totalAuthorizedDays || 0} días
                                        </Typography>
                                    </Paper>
                                </Grid>

                                <Grid item xs={12} md={4}>
                                    <Paper elevation={0} sx={{
                                        p: 2,
                                        borderLeft: '4px solid',
                                        borderColor: gestionesData[selectedGestion].debt?.diasDisponibles < 1
                                            ? theme.palette.error.main
                                            : theme.palette.success.main,
                                        bgcolor: gestionesData[selectedGestion].debt?.diasDisponibles < 1
                                            ? theme.palette.error.light + '20'
                                            : theme.palette.success.light + '20'
                                    }}>
                                        <Box display="flex" alignItems="center" mb={1}>
                                            <EventAvailableIcon
                                                color={gestionesData[selectedGestion].debt?.diasDisponibles < 1 ? 'error' : 'success'}
                                                sx={{ mr: 1 }}
                                            />
                                            <Typography variant="subtitle1" fontWeight={600}>
                                                Días Disponibles (Saldo)
                                            </Typography>
                                        </Box>
                                        <Typography color={gestionesData[selectedGestion].debt?.diasDisponibles < 1 ? 'error' : 'textPrimary'}>
                                            {gestionesData[selectedGestion].debt?.diasDisponibles || 0} días restantes
                                        </Typography>
                                    </Paper>
                                </Grid>
                                <Grid item xs={12}>
  <Paper elevation={0} sx={{
    p: 2,
    borderLeft: '4px solid',
    borderColor: (gestionesData[selectedGestion].debt?.deudaAcumulativaHastaEstaGestion || 0) > 0
      ? theme.palette.error.main
      : theme.palette.divider,
    bgcolor: (gestionesData[selectedGestion].debt?.deudaAcumulativaHastaEstaGestion || 0) > 0
      ? theme.palette.error.light + '20'
      : theme.palette.background.default
  }}>
    <Box display="flex" alignItems="center" mb={1}>
      <EventAvailableIcon
        color={(gestionesData[selectedGestion].debt?.deudaAcumulativaHastaEstaGestion || 0) > 0 ? 'error' : 'disabled'}
        sx={{ mr: 1 }}
      />
      <Typography variant="subtitle1" fontWeight={600}>
        Deuda Acumulada
      </Typography>
    </Box>
    <Typography 
      color={(gestionesData[selectedGestion].debt?.deudaAcumulativaHastaEstaGestion || 0) > 0 ? 'error' : 'textSecondary'}
      sx={{ fontWeight: (gestionesData[selectedGestion].debt?.deudaAcumulativaHastaEstaGestion || 0) > 0 ? 600 : 'normal' }}
    >
      {gestionesData[selectedGestion].debt?.deudaAcumulativaHastaEstaGestion || 0} días de deuda acumulada
    </Typography>
  </Paper>
</Grid>
                            </Grid>
                            <Grid container spacing={3} sx={{ mb: 4 }}>
                                {/* Receso de Invierno */}
                                <Grid item xs={12} md={6}>
                                    <Paper elevation={0} sx={{
                                        p: 2,
                                        borderLeft: '4px solid',
                                        borderColor: '#0288d1',
                                        bgcolor: ''
                                    }}>
                                        <Box display="flex" alignItems="center" mb={1}>
                                            <AcUnitIcon sx={{ color: '#0288d1', mr: 1 }} />
                                            <Typography variant="subtitle1" fontWeight={600}>
                                                Receso de Invierno
                                            </Typography>
                                        </Box>
                                        {gestionesData[selectedGestion].data.recesos?.filter(r => r.name === 'INVIERNO').length > 0 ? (
                                            <Box>
                                                {gestionesData[selectedGestion].data.recesos
                                                    .filter(r => r.name === 'INVIERNO')
                                                    .map((r, i) => (
                                                        <Box key={i} mb={2}>
                                                        </Box>
                                                    ))}
                                                <Typography variant="body2" sx={{ mt: 1, fontWeight: 500 }}>
                                                    Días totales: {gestionesData[selectedGestion].data.recesos
                                                        .filter(r => r.name === 'INVIERNO')
                                                        .reduce((sum, r) => sum + r.daysCount, 0)} días hábiles
                                                </Typography>
                                            </Box>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                No hay receso de invierno registrado
                                            </Typography>
                                        )}
                                    </Paper>
                                </Grid>

                                {/* Receso de Fin de Gestión */}
                                <Grid item xs={12} md={6}>
                                    <Paper elevation={0} sx={{
                                        p: 2,
                                        borderLeft: '4px solid',
                                        borderColor: '#ffff66',
                                        bgcolor: ''
                                    }}>
                                        <Box display="flex" alignItems="center" mb={1}>
                                            <HolidayVillageIcon sx={{ color: '#666600', mr: 1 }} />
                                            <Typography variant="subtitle1" fontWeight={600}>
                                                Receso de Fin de Gestión
                                            </Typography>
                                        </Box>
                                        {gestionesData[selectedGestion].data.recesos?.filter(r => r.name === 'FINDEGESTION').length > 0 ? (
                                            <Box>
                                                {gestionesData[selectedGestion].data.recesos
                                                    .filter(r => r.name === 'FINDEGESTION')
                                                    .map((r, i) => (
                                                        <Box key={i} mb={2}>
                                                            <Stack spacing={0.5}>
                                                                <Box display="flex">
                                                                </Box>
                                                            </Stack>
                                                        </Box>
                                                    ))}
                                                <Typography variant="body2" sx={{ mt: 1, fontWeight: 500 }}>
                                                    Días totales: {gestionesData[selectedGestion].data.recesos
                                                        .filter(r => r.name === 'FINDEGESTION')
                                                        .reduce((sum, r) => sum + r.daysCount, 0)} días hábiles
                                                </Typography>
                                            </Box>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                No hay receso de fin de gestión registrado
                                            </Typography>
                                        )}
                                    </Paper>
                                </Grid>
                            </Grid>

                            <Box mt={4}>
                                {/* Sección de Recesos Registrados */}
                                <Typography variant="h6" gutterBottom sx={{
                                    fontWeight: 600,
                                    color: theme.palette.primary.main,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1
                                }}>
                                    <EventNoteIcon /> Detalles Recesos Registrados
                                </Typography>

                                {gestionesData[selectedGestion].data.recesos?.length > 0 ? (
                                    <Grid container spacing={2}>
                                        {gestionesData[selectedGestion].data.recesos.map((r, i) => (
                                            <Grid item xs={12} sm={6} key={i}>
                                                <Card variant="outlined" sx={{ height: '100%' }}>
                                                    <CardContent>
                                                        <Box display="flex" alignItems="center" mb={1}>
                                                            <Typography variant="subtitle1" fontWeight={600}>
                                                                {r.name}
                                                            </Typography>
                                                            <Chip
                                                                label={r.type}
                                                                size="small"
                                                                sx={{ ml: 1 }}
                                                                color={r.type === 'personalizado' ? 'primary' : 'secondary'}
                                                            />
                                                        </Box>

                                                        <Stack spacing={0.5}>
                                                            <Box display="flex">
                                                                <CalendarTodayIcon fontSize="small" sx={{ mr: 1, color: theme.palette.text.secondary }} />
                                                                <Typography variant="body2">
                                                                    <strong>Inicio:</strong> {formatedDate(r.startDate)}
                                                                </Typography>
                                                            </Box>
                                                            <Box display="flex">
                                                                <EventAvailableIcon fontSize="small" sx={{ mr: 1, color: theme.palette.text.secondary }} />
                                                                <Typography variant="body2">
                                                                    <strong>Fin:</strong> {formatedDate(r.endDate)}
                                                                </Typography>
                                                            </Box>
                                                            <Box display="flex">
                                                                <TodayIcon fontSize="small" sx={{ mr: 1, color: theme.palette.text.secondary }} />
                                                                <Typography variant="body2">
                                                                    <strong>Días:</strong> {r.daysCount} días hábiles
                                                                </Typography>
                                                            </Box>
                                                        </Stack>
                                                    </CardContent>
                                                </Card>
                                            </Grid>
                                        ))}
                                    </Grid>
                                ) : (
                                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                        No hay recesos registrados para esta gestión.
                                    </Typography>
                                )}

                                <Divider sx={{ my: 3 }} />

                                {/* Sección de Días No Hábiles */}
                                <Typography variant="h6" gutterBottom sx={{
                                    fontWeight: 600,
                                    color: theme.palette.primary.main,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1
                                }}>
                                    <BlockIcon /> Días No Hábiles o Feriados
                                </Typography>

                                {gestionesData[selectedGestion].data.nonHolidayDaysDetails?.length > 0 ? (
                                    <List dense>
                                        {gestionesData[selectedGestion].data.nonHolidayDaysDetails.map((day, index) => (
                                            <ListItem key={index} sx={{ px: 0 }}>
                                                <ListItemIcon>
                                                    <EventBusyIcon color="secondary" />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={
                                                        <Typography variant="body2">
                                                            <strong>{formatedDate(day.date)}:</strong> {day.description}
                                                        </Typography>
                                                    }
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                ) : (
                                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                        No hay días no hábiles registrados.
                                    </Typography>
                                )}

                                <Divider sx={{ my: 3 }} />

                                {/* Sección de Solicitudes de Vacación */}
                                <Typography variant="h6" gutterBottom sx={{
                                    fontWeight: 600,
                                    color: theme.palette.primary.main,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1
                                }}>
                                    <BeachAccessIcon /> Solicitudes de Vacación Autorizadas
                                </Typography>

                                <Typography variant="body1" mb={2}>
                                    <strong>Total de Días Autorizados:</strong> {gestionesData[selectedGestion].data.solicitudesDeVacacionAutorizadas?.totalAuthorizedVacationDays ?? 0}
                                </Typography>

                                {gestionesData[selectedGestion].data.solicitudesDeVacacionAutorizadas?.requests?.length > 0 ? (
                                    <List>
                                        {gestionesData[selectedGestion].data.solicitudesDeVacacionAutorizadas.requests.map((request: VacationRequest, index: number) => (
                                            <ListItem key={index} sx={{ px: 0 }}>
                                                <ListItemAvatar>
                                                    <Avatar sx={{ bgcolor: theme.palette.success.light }}>
                                                        <CheckCircleOutlineIcon />
                                                    </Avatar>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={`Solicitud #${request.id} - ${request.position}`}
                                                    secondary={
                                                        <>
                                                            <Typography variant="body2" component="span">
                                                                Del {formatedDate(request.startDate)} al {formatedDate(request.endDate)}
                                                            </Typography>
                                                            <br />
                                                            <Typography variant="body2" component="span">
                                                                <strong>Estado:</strong> {request.status === 'AUTHORIZED' ? 'Aprobada' : request.status}
                                                            </Typography>
                                                            {request.returnDate && (
                                                                <>
                                                                    <br />
                                                                    <Typography variant="body2" component="span">
                                                                        <strong>Retorno:</strong> {formatedDate(request.returnDate)}
                                                                    </Typography>
                                                                </>
                                                            )}
                                                        </>
                                                    }
                                                />
                                                <Chip
                                                    label={`${request.totalDays} días`}
                                                    color="primary"
                                                    size="small"
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                ) : (
                                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                        No hay solicitudes de vacaciones autorizadas.
                                    </Typography>
                                )}
                            </Box>

                            <Stack direction="row" spacing={2} mt={3}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={() => {
                                        router.push({
                                            pathname: '/vacations-form',
                                            query: {
                                                startDate: gestionesData[selectedGestion].debt.startDate,
                                                endDate: gestionesData[selectedGestion].debt.endDate,
                                            },
                                        });
                                    }}
                                    disabled={gestionesData[selectedGestion]?.debt?.diasDisponibles <= 0}
                                >
                                    Solicitar Vacación
                                </Button>
                            </Stack>
                        </Box>
                    )}
                </DialogContent>
            </Dialog>
        </Box>
    );
};

VacationDashboard.acl = {
    action: 'read',
    subject: 'vacation-dashboard',
};

export default VacationDashboard;