import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Stepper, Step, StepLabel,
    Button, Card, CardContent, CardHeader, Avatar,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Tabs, Tab, Chip, Grid, IconButton,
    List, ListItem, ListItemIcon, ListItemText,
    Divider, Alert, useTheme, useMediaQuery
} from '@mui/material';
import {
    Help as HelpIcon,
    Close as CloseIcon,
    CheckCircle as CheckCircleIcon,
    Person as PersonIcon,
    SupervisorAccount as SupervisorIcon,
    AdminPanelSettings as AdminIcon,
    NavigateNext as NavigateNextIcon,
    NavigateBefore as NavigateBeforeIcon,
    Link as LinkIcon,
    Image as ImageIcon
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import Link from 'next/link';

// Interfaces para tipado
interface TutorialStep {
    title: string;
    description: string;
    imageUrl?: string;
    altText?: string;
    targetUsers: ('user' | 'supervisor' | 'admin')[];
}

interface UserGuide {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    steps: TutorialStep[];
    targetPath: string;
    userType: ('user' | 'supervisor' | 'admin')[];
}

interface Props {
    open: boolean;
    onClose: () => void;
    initialGuideId?: string;
    userType?: 'user' | 'supervisor' | 'admin';
}

const UserGuideTutorial: React.FC<Props> = ({
    open,
    onClose,
    initialGuideId,
    userType = 'user'
}) => {
    const router = useRouter();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [activeStep, setActiveStep] = useState(0);
    const [selectedGuideId, setSelectedGuideId] = useState<string>(initialGuideId || 'vacations-user');
    const [activeTab, setActiveTab] = useState(0);
    const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);
    const [zoomAltText, setZoomAltText] = useState<string>('');

    const ImageZoomDialog = ({
        open,
        imageUrl,
        altText,
        onClose
    }: {
        open: boolean;
        imageUrl: string | null;
        altText: string;
        onClose: () => void;
    }) => (
        <Dialog open={open} onClose={onClose} maxWidth="xl">
            <DialogContent sx={{ p: 0, bgcolor: 'black' }}>
                <Box
                    component="img"
                    src={imageUrl || ''}
                    alt={altText}
                    sx={{
                        width: '100%',
                        height: 'auto',
                        maxHeight: '90vh',
                        objectFit: 'contain',
                    }}
                />
            </DialogContent>
        </Dialog>
    );

    // Definición de las guías disponibles
    const userGuides: UserGuide[] = [
        {
            id: 'vacations-user',
            title: 'Vacaciones',
            description: 'Guía para solicitar y gestionar tus vacaciones dentro del sistema',
            icon: <PersonIcon />,
            targetPath: '/welcome',
            userType: ['user'],
            steps: [
                {
                    title: 'Solicitar Vacaciones',
                    description:
                        'Accede al formulario de solicitud desde el menú lateral en “Vacaciones > Solicitar Vacaciones”. El botón estará habilitado únicamente si cuentas con un saldo positivo de días.',
                    imageUrl: '/tutorial/vacations/solicitar.png',
                    altText: 'Solicitud de vacaciones',
                    targetUsers: ['user'],
                },
                {
                    title: 'Llenar la Solicitud',
                    description:
                        'Al ingresar verás la gestión actual y tus días disponibles. Haz clic en “Solicitar Vacaciones” y selecciona la fecha de inicio. La fecha de fin se calculará automáticamente según la cantidad de días disponibles, de acuerdo con las políticas del Departamento de Personal.',
                    imageUrl: '/tutorial/vacations/solicitud.png',
                    altText: 'Formulario de solicitud de vacaciones',
                    targetUsers: ['user'],
                },
                {
                    title: 'Confirmar la Solicitud',
                    description:
                        'Una vez seleccionada la fecha de inicio, se mostrará un resumen con la fecha de inicio, fin y retorno. Revisa la información y confirma para enviar tu solicitud.',
                    imageUrl: '/tutorial/vacations/confirmar.png',
                    altText: 'Confirmación de solicitud de vacaciones',
                    targetUsers: ['user'],
                },
                {
                    title: 'Revisar la Solicitud Enviada',
                    description:
                        'Después de confirmar, serás redirigido automáticamente a una vista con todos los detalles de tu solicitud enviada.',
                    imageUrl: '/tutorial/vacations/informacionSolicitud.png',
                    altText: 'Información de la solicitud de vacaciones',
                    targetUsers: ['user'],
                },
                {
                    title: 'Mis Solicitudes',
                    description:
                        'En “Vacaciones > Mis Solicitudes” podrás consultar todas tus solicitudes registradas. Allí verás cuáles están aprobadas, rechazadas o aún pendientes de revisión.',
                    imageUrl: '/tutorial/vacations/mis-solicitudes.png',
                    altText: 'Listado de solicitudes de vacaciones',
                    targetUsers: ['user'],
                },
                {
                    title: 'Detalles de una Solicitud',
                    description:
                        'Desde la lista de solicitudes puedes acceder a la información básica de cada una. Si la solicitud aún no fue revisada por ningún responsable, podrás eliminarla. Además, puedes hacer clic en “Ver informe” para acceder al detalle completo.',
                    imageUrl: '/tutorial/vacations/detallesSolicitud.png',
                    altText: 'Detalles de solicitud de vacaciones',
                    targetUsers: ['user'],
                },
                {
                    title: 'Ver Resumen',
                    description:
                        'Si deseas consultar tu saldo total de vacaciones o revisar cuántos días tienes disponibles por gestión, ingresa a “Vacaciones > Resumen”.',
                    imageUrl: '/tutorial/vacations/resumen.png',
                    altText: 'Resumen de vacaciones',
                    targetUsers: ['user'],
                },
                {
                    title: 'Detalles por Gestión',
                    description:
                        'Selecciona una gestión para ver información detallada, como licencias que descontaron días, vacaciones tomadas, antigüedad acumulada, recesos y feriados que influyen en tu saldo de vacaciones.',
                    imageUrl: '/tutorial/vacations/detalleGestiones.png',
                    altText: 'Detalle por gestión',
                    targetUsers: ['user'],
                },
                {
                    title: 'Solicitud Revisada',
                    description:
                        'Cuando el supervisor de tu unidad y el responsable del Departamento de Personal revisen tu solicitud, recibirás una notificación en la parte superior de la pantalla (icono de campana). Haz clic en la notificación y luego en “Ver detalles” para acceder a toda la información actualizada de la solicitud.',
                    imageUrl: '/tutorial/vacations/solicitudRevisada.png',
                    altText: 'Notificación de solicitud revisada',
                    targetUsers: ['user'],
                },
            ],
        },
        {
            id: 'vacations-supervisor',
            title: 'Vacaciones - Supervisor',
            description: 'Cómo aprobar/rechazar solicitudes de tu personal',
            icon: <SupervisorIcon />,
            targetPath: '/vacations/vacations-supervisor',
            userType: ['supervisor', 'admin'],
            steps: [
                {
                    title: 'Acceder al Panel',
                    description: 'En el menú lateral, ve a "Vacaciones > Solicitudes del Personal" para ver todas las solicitudes pendientes.',
                    imageUrl: '/tutorial/vacations/panel-supervisor.png',
                    altText: 'Panel de supervisor',
                    targetUsers: ['supervisor', 'admin']
                },
                {
                    title: 'Notificacion De Solicitudes',
                    description: 'Recibiras notificaciones en la parte superior derecha icono de la campana de las solicitudes que te envien los empleados a tu cargo.',
                    imageUrl: '/tutorial/vacations/supervisorVacacionSolicitud.png',
                    altText: 'Todas las solicitudes',
                    targetUsers: ['admin']
                },
                {
                    title: 'Revisar Solicitudes',
                    description: 'Cada solicitud muestra detalles del empleado, fechas y días solicitados. Revisa cuidadosamente antes de tomar una decisión.',
                    imageUrl: '/tutorial/vacations/revisar-solicitud.png',
                    altText: 'Detalle de solicitud',
                    targetUsers: ['supervisor', 'admin']
                },
                {
                    title: 'Aprobar o Rechazar',
                    description: 'Usa los botones "Aprobar" o "Rechazar" en cada solicitud. Al rechazar, puedes agregar comentarios explicativos.',
                    imageUrl: '/tutorial/vacations/aprobar-rechazar.png',
                    altText: 'Botones de aprobación',
                    targetUsers: ['supervisor', 'admin']
                },
            ]
        },
        {
            id: 'permissions-user',
            title: 'Permisos',
            description: 'Guía para solicitar licencias que descuentan días de vacación',
            icon: <PersonIcon />,
            targetPath: '/welcome',
            userType: ['user'],
            steps: [
                {
                    title: 'Solicitar Permiso',
                    description:
                        'Accede a “Permisos > Solicitar Permiso” desde el menú lateral. Haz clic en “Solicitar Permiso”. La opción estará disponible solo si tienes un saldo positivo en la cuenta de vacaciones y no tienes otra solicitud pendiente de aprobación.',
                    imageUrl: '/tutorial/permissions/solicitar-permiso.png',
                    altText: 'Solicitud de permiso',
                    targetUsers: ['user'],
                },
                {
                    title: 'Formulario de Solicitud',
                    description:
                        'En el formulario podrás visualizar tus datos básicos y el saldo disponible. Completa los campos requeridos según el tipo de permiso que deseas solicitar.',
                    imageUrl: '/tutorial/permissions/formulario.png',
                    altText: 'Formulario de solicitud de permisos',
                    targetUsers: ['user'],
                },
                {
                    title: 'Tiempo Solicitado',
                    description:
                        'Selecciona el tiempo que deseas solicitar: medio día, día completo o varios días (hasta un máximo de 5 días por solicitud).',
                    imageUrl: '/tutorial/permissions/tiempoSolicitado.png',
                    altText: 'Selección de tiempo solicitado',
                    targetUsers: ['user'],
                },
                {
                    title: 'Fecha de Inicio y Fin',
                    description:
                        'Selecciona la fecha de inicio y fin de tu permiso. Si solicitaste varios días, los campos se completarán automáticamente según el tipo seleccionado (medio día o día completo).',
                    imageUrl: '/tutorial/permissions/tiempoSolicitud.png',
                    altText: 'Selección de fechas',
                    targetUsers: ['user'],
                },
                {
                    title: 'Inicio y Fin del Día',
                    description:
                        'Si solicitaste varios días y deseas que el permiso comience solo desde la tarde, selecciona “Media tarde” en el campo “Inicio del día”. Si quieres que el último día solo cuente hasta la mañana, selecciona “Media mañana”. De lo contrario, puedes dejar ambos valores en “Día completo”.',
                    imageUrl: '/tutorial/permissions/inicioDia.png',
                    altText: 'Configuración de inicio y fin del día',
                    targetUsers: ['user'],
                },
                {
                    title: 'Mis Permisos',
                    description:
                        'En “Permisos > Mis Permisos” puedes revisar el historial de tus solicitudes, así como el estado actual de cada una (pendiente, aprobada o rechazada).',
                    imageUrl: '/tutorial/permissions/mis-permisos.png',
                    altText: 'Listado de permisos',
                    targetUsers: ['user'],
                },
                {
                    title: 'Detalles de un Permiso',
                    description:
                        'Desde esta sección puedes ver toda la información de cada permiso solicitado y, si lo necesitas, generar el PDF correspondiente.',
                    imageUrl: '/tutorial/permissions/detalles.png',
                    altText: 'Detalles de un permiso',
                    targetUsers: ['user'],
                },
            ],
        },
        {
            id: 'permissions-supervisor',
            title: 'Permisos - Supervisor',
            description: 'Cómo gestionar permisos del personal',
            icon: <SupervisorIcon />,
            targetPath: '/permissions/department-permission',
            userType: ['supervisor', 'admin'],
            steps: [
                {
                    title: 'Solicitudes Pendientes',
                    description: 'Accede a "Permisos > Solicitudes Pendientes del Personal" para ver todas las solicitudes de tu departamento.',
                    imageUrl: '/tutorial/permissions/pendientes-supervisor.png',
                    altText: 'Panel de permisos pendientes',
                    targetUsers: ['supervisor', 'admin']
                },
                {
                    title: 'Detalles del Permiso',
                    description: 'Revisa la informacion de la solicitud y apruebala.',
                    imageUrl: '/tutorial/permissions/revisar.png',
                    altText: 'Revisión detalles',
                    targetUsers: ['supervisor', 'admin']
                }
            ]
        }
    ];

    // Filtrar guías según tipo de usuario
    const filteredGuides = userGuides.filter(guide =>
        guide.userType.includes(userType)
    );

    const selectedGuide = filteredGuides.find(g => g.id === selectedGuideId) || filteredGuides[0];
    const steps = selectedGuide?.steps || [];
    const isSupervisorGuide = selectedGuide?.userType.includes('supervisor') || selectedGuide?.userType.includes('admin');

    const handleNext = () => {
        setActiveStep((prevStep) => prevStep + 1);
    };

    const handleBack = () => {
        setActiveStep((prevStep) => prevStep - 1);
    };

    const handleReset = () => {
        setActiveStep(0);
    };

    const handleGuideSelect = (guideId: string) => {
        setSelectedGuideId(guideId);
        setActiveStep(0);
    };

    const handleNavigateToFeature = () => {
        router.push(selectedGuide.targetPath);
        onClose();
    };

    // Componente para mostrar imagen con placeholder
    const ImageDisplay = ({ step }: { step: TutorialStep }) => {
        if (!step.imageUrl) {
            return (
                <Box
                    sx={{
                        height: 300,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'grey.100',
                        borderRadius: 1,
                        p: 3
                    }}
                >
                    <ImageIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                    <Typography variant="body2" color="text.secondary">
                        Imagen ilustrativa: {step.altText || step.title}
                    </Typography>
                </Box>
            );
        }

        return (
            <Box
                sx={{
                    height: 300,
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    borderRadius: 1,
                    bgcolor: 'grey.50',
                    border: '1px solid',
                    borderColor: 'divider',
                    cursor: 'zoom-in'
                }}
                onClick={() => {
                    setZoomImageUrl(step.imageUrl!);
                    setZoomAltText(step.altText || step.title);
                }}
            >
                <Box
                    component="img"
                    src={step.imageUrl}
                    alt={step.altText || step.title}
                    sx={{
                        maxHeight: '100%',
                        maxWidth: '100%',
                        objectFit: 'contain'
                    }}
                />
            </Box>
        );
    };


    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            fullScreen={isMobile}
            PaperProps={{
                sx: {
                    minHeight: isMobile ? '100vh' : 600,
                    maxHeight: isMobile ? '100vh' : '90vh'
                }
            }}
        >
            <DialogTitle sx={{
                borderBottom: 1,
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <HelpIcon />
                    </Avatar>
                    <Box>
                        <Typography variant="h5" component="div">
                            Guía de Usuario
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Tutorial paso a paso para usar la aplicación
                        </Typography>
                    </Box>
                </Box>
                <IconButton onClick={onClose}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ p: 0 }}>
                <Grid container sx={{ height: '100%' }}>
                    {/* Panel lateral de selección */}
                    <Grid item xs={12} md={3} sx={{
                        borderRight: { md: 1 },
                        borderColor: 'divider',
                        bgcolor: 'grey.50'
                    }}>
                        <Box sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                Guías Disponibles
                            </Typography>
                            <List disablePadding>
                                {filteredGuides.map((guide) => (
                                    <React.Fragment key={guide.id}>
                                        <ListItem
                                            button
                                            selected={selectedGuideId === guide.id}
                                            onClick={() => handleGuideSelect(guide.id)}
                                            sx={{
                                                borderRadius: 1,
                                                mb: 1,
                                                '&.Mui-selected': {
                                                    bgcolor: 'primary.light',
                                                    '&:hover': {
                                                        bgcolor: 'primary.light'
                                                    }
                                                }
                                            }}
                                        >
                                            <ListItemIcon sx={{ minWidth: 40 }}>
                                                {guide.icon}
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={guide.title}
                                                secondary={guide.description}
                                                primaryTypographyProps={{
                                                    variant: 'body2',
                                                    fontWeight: selectedGuideId === guide.id ? 600 : 400
                                                }}
                                                secondaryTypographyProps={{
                                                    variant: 'caption',
                                                    noWrap: true
                                                }}
                                            />
                                        </ListItem>
                                        <Divider component="li" />
                                    </React.Fragment>
                                ))}
                            </List>

                            {/* Información de rutas disponibles */}
                            <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                                <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <LinkIcon fontSize="small" />
                                    Accesos Rápidos
                                </Typography>
                                <List dense disablePadding>
                                    <ListItem>
                                        <ListItemText
                                            primary={
                                                <Link href="/welcome" passHref>
                                                    <Typography component="a" variant="body2" sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                                                        Solicitar Vacaciones/Permisos
                                                    </Typography>
                                                </Link>
                                            }
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText
                                            primary={
                                                <Link href="/vacations/vacations-supervisor" passHref>
                                                    <Typography component="a" variant="body2" sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                                                        Panel de Supervisor (Vacaciones)
                                                    </Typography>
                                                </Link>
                                            }
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText
                                            primary={
                                                <Link href="/permissions/department-permission" passHref>
                                                    <Typography component="a" variant="body2" sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                                                        Panel de Supervisor (Permisos)
                                                    </Typography>
                                                </Link>
                                            }
                                        />
                                    </ListItem>
                                </List>
                            </Box>
                        </Box>
                    </Grid>

                    {/* Contenido principal */}
                    <Grid item xs={12} md={9}>
                        <Box sx={{ p: 3 }}>
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="h4" gutterBottom>
                                    {selectedGuide.title}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                    <Chip
                                        label={userType === 'user' ? 'Usuario Normal' : userType === 'supervisor' ? 'Supervisor' : 'Administrador'}
                                        size="small"
                                        color={userType === 'user' ? 'default' : userType === 'supervisor' ? 'primary' : 'secondary'}
                                    />
                                    {isSupervisorGuide && (
                                        <Chip
                                            label="Funciones Especiales"
                                            size="small"
                                            color="warning"
                                            variant="outlined"
                                        />
                                    )}
                                </Box>
                                <Typography variant="body1" color="text.secondary" paragraph>
                                    {selectedGuide.description}
                                </Typography>
                            </Box>

                            {/* Stepper */}
                            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                                {steps.map((step, index) => (
                                    <Step key={index}>
                                        <StepLabel>
                                            <Typography variant="body2">
                                                {step.title}
                                            </Typography>
                                        </StepLabel>
                                    </Step>
                                ))}
                            </Stepper>

                            {/* Contenido del paso actual */}
                            {steps.length > 0 && activeStep < steps.length && (
                                <Card variant="outlined">
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            Paso {activeStep + 1}: {steps[activeStep].title}
                                        </Typography>

                                        <Typography variant="body1" paragraph>
                                            {steps[activeStep].description}
                                        </Typography>

                                        {/* Mostrar imagen */}
                                        <Box sx={{ mt: 3, mb: 3 }}>
                                            <ImageDisplay step={steps[activeStep]} />
                                        </Box>

                                        {/* Consejos específicos */}
                                        {steps[activeStep].targetUsers.includes('supervisor') && (
                                            <Alert severity="info" sx={{ mb: 2 }}>
                                                <Typography variant="subtitle2" fontWeight="bold">
                                                    💡 Consejo para Supervisores:
                                                </Typography>
                                                <Typography variant="body2">
                                                    Revisa cuidadosamente la disponibilidad del equipo antes de aprobar vacaciones.
                                                    Considera períodos de alta demanda en tu departamento.
                                                </Typography>
                                            </Alert>
                                        )}

                                        {steps[activeStep].targetUsers.includes('admin') && (
                                            <Alert severity="warning" sx={{ mb: 2 }}>
                                                <Typography variant="subtitle2" fontWeight="bold">
                                                    ⚠️ Nota para Administradores:
                                                </Typography>
                                                <Typography variant="body2">
                                                    Tienes acceso completo a todas las solicitudes.
                                                    Puedes modificar decisiones de otros supervisores si es necesario.
                                                </Typography>
                                            </Alert>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Mensaje de finalización */}
                            {activeStep === steps.length && (
                                <Card sx={{ textAlign: 'center', py: 4 }}>
                                    <CardContent>
                                        <CheckCircleIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
                                        <Typography variant="h5" gutterBottom>
                                            ¡Guía Completada!
                                        </Typography>
                                        <Typography variant="body1" color="text.secondary" paragraph>
                                            Has completado todos los pasos de esta guía.
                                            Ahora estás listo para usar esta funcionalidad.
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            onClick={handleNavigateToFeature}
                                            startIcon={<LinkIcon />}
                                        >
                                            Ir a {selectedGuide.title}
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}
                        </Box>
                    </Grid>
                    <ImageZoomDialog
                        open={Boolean(zoomImageUrl)}
                        imageUrl={zoomImageUrl}
                        altText={zoomAltText}
                        onClose={() => setZoomImageUrl(null)}
                    />

                </Grid>
            </DialogContent>

            <DialogActions sx={{
                borderTop: 1,
                borderColor: 'divider',
                justifyContent: 'space-between',
                p: 2
            }}>
                <Box>
                    {activeStep > 0 && activeStep < steps.length && (
                        <Button onClick={handleBack} startIcon={<NavigateBeforeIcon />}>
                            Anterior
                        </Button>
                    )}
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button onClick={onClose} color="inherit">
                        Cerrar
                    </Button>

                    {activeStep < steps.length ? (
                        <Button
                            variant="contained"
                            onClick={handleNext}
                            endIcon={<NavigateNextIcon />}
                        >
                            {activeStep === steps.length - 1 ? 'Finalizar' : 'Siguiente'}
                        </Button>
                    ) : (
                        <Button
                            variant="outlined"
                            onClick={handleReset}
                        >
                            Repetir Guía
                        </Button>
                    )}
                </Box>
            </DialogActions>
        </Dialog>

    );
};

// Componente auxiliar: Botón para abrir la guía
export const TutorialButton: React.FC<{
    guideId?: string;
    userType?: 'user' | 'supervisor' | 'admin';
    variant?: 'text' | 'outlined' | 'contained';
}> = ({ guideId, userType = 'user', variant = 'outlined' }) => {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button
                variant={variant}
                startIcon={<HelpIcon />}
                onClick={() => setOpen(true)}
                size="small"
                sx={{
                    minWidth: 100,
                    ...(variant === 'text' ? { color: 'text.secondary' } : {})
                }}
            >
                Ayuda
            </Button>

            <UserGuideTutorial
                open={open}
                onClose={() => setOpen(false)}
                initialGuideId={guideId}
                userType={userType}
            />
        </>
    );
};

export default UserGuideTutorial;