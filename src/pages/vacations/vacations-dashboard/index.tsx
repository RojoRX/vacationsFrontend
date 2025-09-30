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
import axios from 'src/lib/axios';
import useUser from 'src/hooks/useUser';
import { useRouter } from 'next/router';
import { Gestion } from 'src/interfaces/gestion';
import { VacationDebt } from 'src/interfaces/vacationDebt';
import { VacationData } from 'src/interfaces/vacationData';
import { VacationRequest } from 'src/interfaces/vacationRequests';
import AcUnitIcon from '@mui/icons-material/AcUnit'; // Icono de invierno
import HolidayVillageIcon from '@mui/icons-material/HolidayVillage'; // Icono de fin de gestión
import GestionDetailDialog from '../gestionDetailDialog';
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
                    // Opción 1: Codificar manualmente el parámetro
                    const params = new URLSearchParams();
                    params.append('carnetIdentidad', user.ci);
                    params.append('endDate', endDateFormatted);

                    const debtRes = await axios.get<{
                        resumenGeneral: any;
                        detalles: VacationDebt[];
                    }>(
                        `${process.env.NEXT_PUBLIC_API_BASE_URL}/vacations/accumulated-debt`,
                        { params }
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
                            console.log("Enviando a /vacations" + " " + gestionStart, gestionEnd)
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
        const fecha = new Date(fechaISO).toISOString();
        return fecha.split('T')[0];
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
                                                    <Typography variant="body2">Deudas Acumulada:</Typography>
                                                    <Typography
                                                        variant="body1"
                                                        color={(detalle.debt.deudaAcumulativaHastaEstaGestion) > 0 ? 'error' : 'text.primary'}
                                                        fontWeight="bold"
                                                    >
                                                        {detalle.debt.deudaAcumulativaHastaEstaGestion}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                    <Typography variant="body2">Deuda gestión anterior:</Typography>
                                                    <Typography
                                                        variant="body1"
                                                        fontWeight="bold"
                                                        color={detalle.debt.deudaAcumulativaAnterior > 0 ? 'red' : 'secondary'}
                                                    >
                                                        {detalle.debt.deudaAcumulativaAnterior}
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
            <GestionDetailDialog
                open={dialogOpen}
                onClose={handleDialogClose}
                gestionData={selectedGestion ? gestionesData[selectedGestion] : undefined}
            />
        </Box>
    );
};
VacationDashboard.acl = {
    action: 'read',
    subject: 'vacation-dashboard',
};

export default VacationDashboard;