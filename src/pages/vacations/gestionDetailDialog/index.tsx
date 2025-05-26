import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Typography,
    Box,
    List,
    ListItem,
    ListItemAvatar,
    Avatar,
    ListItemText,
    Chip,
    Divider,
    Card,
    CardContent,
    Grid,
    ListItemIcon,
    Paper,
    Stack,
    Button
} from '@mui/material';
import HolidayVillageIcon from '@mui/icons-material/HolidayVillage';
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
import AcUnitIcon from '@mui/icons-material/AcUnit';
import WorkHistoryIcon from '@mui/icons-material/WorkHistory';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import { useTheme } from '@mui/material/styles';
import { VacationRequest } from 'src/interfaces/vacationRequests';
import { useRouter } from 'next/router';
import { License } from 'src/interfaces/licenseTypes';


interface GestionDetailDialogProps {
    open: boolean;
    onClose: () => void;
    gestionData?: {
        data?: any;
        debt?: any;
    };
}
const GestionDetailDialog: React.FC<GestionDetailDialogProps> = ({
    open,
    onClose,
    gestionData
}) => {
    const theme = useTheme();
    const formatedDate = (dateString: string) => {
        if (!dateString) return 'Fecha no disponible';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES');
    };
    const [selectedVacationId, setSelectedVacationId] = useState<number | null>(null);
    const [selectedLicenseId, setSelectedLicenseId] = useState<number | null>(null);
    const router = useRouter(); // Asegúrate de importar useRouter de 'next/router

    if (!gestionData?.data) {
        return null;
    }
    const selectionStyles = (id: number, selectedId: number | null) => ({
        backgroundColor: id === selectedId ? theme.palette.action.selected : 'inherit',
        transition: 'background-color 0.3s ease',
        '&:hover': {
            backgroundColor: theme.palette.action.hover
        }
    });

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
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
                    <Typography sx={{ color: '#ffff' }} variant="h6">Resumen de Gestión</Typography>
                    <Typography variant="subtitle2" sx={{ opacity: 0.9, color: '#ffff' }}>
                        Detalles de tus vacaciones y permisos
                    </Typography>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ py: 3, p: 8 }}>
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
                                    {gestionData.data?.antiguedadEnAnios || 0} años y {gestionData.data?.antiguedadEnDias || 0} días de servicio
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
                                    {gestionData.data?.diasDeVacacion || 0} días correspondientes
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
                                    {gestionData.data?.solicitudesDeVacacionAutorizadas?.totalAuthorizedVacationDays || 0} días
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
                                    {gestionData.data?.licenciasAutorizadas?.totalAuthorizedDays || 0} días
                                </Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={4}>
                            <Paper elevation={0} sx={{
                                p: 2,
                                borderLeft: '4px solid',
                                borderColor: (gestionData.debt?.deudaAcumulativaHastaEstaGestion || 0) > 0
                                    ? theme.palette.error.main
                                    : theme.palette.divider,
                                bgcolor: (gestionData.debt?.deudaAcumulativaHastaEstaGestion || 0) > 0
                                    ? theme.palette.error.light + '20'
                                    : theme.palette.background.default
                            }}>
                                <Box display="flex" alignItems="center" mb={1}>
                                    <EventAvailableIcon
                                        color={(gestionData.debt?.deudaAcumulativaHastaEstaGestion || 0) > 0 ? 'error' : 'disabled'}
                                        sx={{ mr: 1 }}
                                    />
                                    <Typography variant="subtitle1" fontWeight={600}>
                                        Deuda Acumulada
                                    </Typography>
                                </Box>
                                <Typography
                                    color={(gestionData.debt?.deudaAcumulativaHastaEstaGestion || 0) > 0 ? 'error' : 'textSecondary'}
                                    sx={{ fontWeight: (gestionData.debt?.deudaAcumulativaHastaEstaGestion || 0) > 0 ? 600 : 'normal' }}
                                >
                                    {gestionData.debt?.deudaAcumulativaHastaEstaGestion || 0} días de deuda acumulada
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
                                {gestionData.data.recesos?.filter((r: { name: string; }) => r.name === 'INVIERNO').length > 0 ? (
                                    <Box>
                                        {gestionData.data.recesos
                                            .filter((r: { name: string; }) => r.name === 'INVIERNO')
                                            .map((r: any, i: React.Key | null | undefined) => (
                                                <Box key={i} mb={2}>
                                                </Box>
                                            ))}
                                        <Typography variant="body2" sx={{ mt: 1, fontWeight: 500 }}>
                                            Días totales: {gestionData.data.recesos
                                                .filter((r: { name: string; }) => r.name === 'INVIERNO')
                                                .reduce((sum: any, r: { daysCount: any; }) => sum + r.daysCount, 0)} días hábiles
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
                                {gestionData.data.recesos?.filter((r: { name: string; }) => r.name === 'FINDEGESTION').length > 0 ? (
                                    <Box>
                                        {gestionData.data.recesos
                                            .filter((r: { name: string; }) => r.name === 'FINDEGESTION')
                                            .map((r: any, i: React.Key | null | undefined) => (
                                                <Box key={i} mb={2}>
                                                    <Stack spacing={0.5}>
                                                        <Box display="flex">
                                                        </Box>
                                                    </Stack>
                                                </Box>
                                            ))}
                                        <Typography variant="body2" sx={{ mt: 1, fontWeight: 500 }}>
                                            Días totales: {gestionData.data.recesos
                                                .filter((r: { name: string; }) => r.name === 'FINDEGESTION')
                                                .reduce((sum: any, r: { daysCount: any; }) => sum + r.daysCount, 0)} días hábiles
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
                    <Grid item xs={12} md={12}>
                        <Paper elevation={0} sx={{
                            p: 2,
                            borderLeft: '4px solid',
                            borderColor: gestionData.debt?.diasDisponibles < 1
                                ? theme.palette.error.main
                                : theme.palette.success.main,
                            bgcolor: gestionData.debt?.diasDisponibles < 1
                                ? theme.palette.error.light + '20'
                                : theme.palette.success.light + '20'
                        }}>
                            <Box display="flex" alignItems="center" mb={1}>
                                <EventAvailableIcon
                                    color={gestionData.debt?.diasDisponibles < 1 ? 'error' : 'success'}
                                    sx={{ mr: 1 }}
                                />
                                <Typography variant="subtitle1" fontWeight={600}>
                                    Días Disponibles de Vacaciones (Saldo)
                                </Typography>
                            </Box>
                            <Typography color={gestionData.debt?.diasDisponibles < 1 ? 'error' : 'textPrimary'}>
                                {gestionData.debt?.diasDisponibles || 0} días restantes
                            </Typography>
                        </Paper>
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

                        {gestionData.data.recesos?.length > 0 ? (
                            <Grid container spacing={2}>
                                {gestionData.data.recesos.map((r: { name: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | React.ReactFragment | React.ReactPortal | null | undefined; type: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | React.ReactFragment | null | undefined; startDate: string; endDate: string; daysCount: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | React.ReactFragment | React.ReactPortal | null | undefined; }, i: React.Key | null | undefined) => (
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

                        {gestionData.data.nonHolidayDaysDetails?.length > 0 ? (
                            <List dense>
                                {gestionData.data.nonHolidayDaysDetails.map((day: { date: string; description: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | React.ReactFragment | React.ReactPortal | null | undefined; }, index: React.Key | null | undefined) => (
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
                            <strong>Total de Días Autorizados:</strong> {gestionData.data.solicitudesDeVacacionAutorizadas?.totalAuthorizedVacationDays ?? 0}
                        </Typography>

                        {/* Sección de Solicitudes de Vacación Autorizadas */}
                        {gestionData.data.solicitudesDeVacacionAutorizadas?.requests?.length > 0 ? (
                            <List>
                                {gestionData.data.solicitudesDeVacacionAutorizadas.requests.map((request: VacationRequest) => (
                                    <ListItem
                                        key={request.id}
                                        sx={{
                                            ...selectionStyles(request.id, selectedVacationId),
                                            px: 0,
                                            position: 'relative'
                                        }}
                                        onClick={() => setSelectedVacationId(request.id)}
                                    >
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
                                                </>
                                            }
                                        />
                                        <Chip
                                            label={`${request.totalDays} días`}
                                            color="primary"
                                            size="small"
                                        />
                                        {selectedVacationId === request.id && (
                                            <Button
                                                variant="contained"
                                                size="small"
                                                sx={{ ml: 2 }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(`/vacations/vacations-requests/${request.id}`);
                                                }}
                                            >
                                                Ver Solicitud
                                            </Button>
                                        )}
                                    </ListItem>
                                ))}
                            </List>
                        ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                No hay solicitudes de vacaciones autorizadas.
                            </Typography>
                        )}

                        {/* Sección de Licencias Autorizadas */}
                        <Typography variant="h6" gutterBottom sx={{
                            fontWeight: 600,
                            color: theme.palette.primary.main,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                        }}>
                            <AssignmentTurnedInIcon /> Licencias Autorizadas
                        </Typography>

                        <Typography variant="body1" mb={2}>
                            <strong>Total de Días Autorizados:</strong> {gestionData?.data?.licenciasAutorizadas?.totalAuthorizedDays ?? 0}
                        </Typography>

                        {/* Sección de Licencias Autorizadas */}
                        {gestionData.data.licenciasAutorizadas?.requests?.length > 0 ? (
                            <List>
                                {gestionData.data.licenciasAutorizadas.requests.map((licencia: any) => (
                                    <ListItem
                                        key={licencia.id}
                                        sx={{
                                            ...selectionStyles(licencia.id, selectedLicenseId),
                                            px: 0,
                                            position: 'relative',
                                            alignItems: 'flex-start'
                                        }}
                                        onClick={() => setSelectedLicenseId(licencia.id)}
                                    >
                                        <ListItemAvatar>
                                            <Avatar sx={{ bgcolor: theme.palette.info.light }}>
                                                <EventAvailableIcon />
                                            </Avatar>
                                        </ListItemAvatar>

                                        <ListItemText
                                            primary={
                                                <Typography variant="subtitle1">
                                                    Licencia #{licencia.id} - {licencia.licenseType}
                                                </Typography>
                                            }
                                            secondary={
                                                <>
                                                    <Typography variant="body2" component="div">
                                                        <strong>Fechas:</strong>{' '}
                                                        {licencia.startDate ? `Del ${formatedDate(licencia.startDate)}` : 'N/D'}{' '}
                                                        {licencia.endDate ? `al ${formatedDate(licencia.endDate)}` : ''}
                                                    </Typography>

                                                    <Typography variant="body2">
                                                        <strong>Tipo de tiempo:</strong> {licencia.timeRequested || 'No especificado'}
                                                    </Typography>

                                                    <Typography variant="body2">
                                                        <strong>Fecha de emisión:</strong> {formatedDate(licencia.issuedDate)}
                                                    </Typography>

                                                    <Typography variant="body2">
                                                        <strong>Aprobación Supervisor:</strong>{' '}
                                                        {licencia.immediateSupervisorApproval ? '✅ Aprobado' : '⏳ Pendiente'}
                                                    </Typography>

                                                    <Typography variant="body2">
                                                        <strong>Aprobación RRHH:</strong>{' '}
                                                        {licencia.personalDepartmentApproval ? '✅ Aprobado' : '⏳ Pendiente'}
                                                    </Typography>
                                                </>
                                            }
                                        />

                                        <Chip
                                            label={`${licencia.totalDays || 0} días`}
                                            color="info"
                                            size="small"
                                            sx={{ mt: 1 }}
                                        />
                                    </ListItem>
                                ))}
                            </List>

                        ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                No hay licencias autorizadas en esta gestión.
                            </Typography>
                        )}
                    </Box>
                    {/** 
                            <Stack direction="row" spacing={2} mt={3}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={() => {
                                        router.push({
                                            pathname: '/vacations-form',
                                        });
                                    }}
                                    disabled={gestionData ?.debt?.diasDisponibles <= 0}
                                >
                                    Solicitar Vacación
                                </Button>
                            </Stack>*/}
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default GestionDetailDialog;