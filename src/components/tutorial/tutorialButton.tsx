import React, { useState } from 'react';
import {
    Button,
    IconButton,
    Tooltip,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Badge,
    Box,
    Typography,
    Chip,
    Divider
} from '@mui/material';
import {
    Help as HelpIcon,
    School as TutorialIcon,
    PlayCircle as StartIcon,
    Book as GuideIcon,
    Person as UserIcon,
    SupervisorAccount as SupervisorIcon,
    AdminPanelSettings as AdminIcon,
    ExitToApp as ExitIcon,
    Task as TaskIcon,
    CalendarToday as CalendarIcon,
    Assignment as AssignmentIcon
} from '@mui/icons-material';
import UserGuideTutorial from './userGuideTutorial';

// Tipos mejorados
type UserRole = 'user' | 'supervisor' | 'admin';
type UserRoleString = UserRole | string;

interface TutorialButtonProps {
    /** Tipo de usuario para filtrar guías */
    userType?: UserRoleString;
    /** Variante del botón */
    variant?: 'icon' | 'text' | 'outlined' | 'contained';
    /** Tamaño del botón */
    size?: 'small' | 'medium' | 'large';
    /** Mostrar etiqueta */
    showLabel?: boolean;
    /** Color personalizado */
    color?: 'primary' | 'secondary' | 'inherit' | 'success' | 'error' | 'info' | 'warning';
    /** Posición del menú */
    menuAnchor?: 'left' | 'right';
    /** Mostrar contador de guías no vistas */
    showBadge?: boolean;
    /** Guía específica a abrir directamente */
    specificGuide?: 'vacations-user' | 'vacations-supervisor' | 'permissions-user' | 'permissions-supervisor';
    /** Texto personalizado del botón */
    buttonText?: string;
    /** Estilos adicionales */
    sx?: any;
}

/**
 * Función para normalizar el tipo de usuario
 */
const normalizeUserType = (userType?: UserRoleString): UserRole => {
    if (!userType) return 'user';

    const normalized = userType.toLowerCase().trim();

    if (normalized.includes('admin') || normalized.includes('administrador')) {
        return 'admin';
    }

    if (normalized.includes('supervisor') ||
        normalized.includes('supervis') ||
        normalized.includes('manager') ||
        normalized.includes('jefe')) {
        return 'supervisor';
    }

    return 'user';
};

/**
 * Botón reutilizable para abrir tutoriales y guías de usuario
 */
const TutorialButton: React.FC<TutorialButtonProps> = ({
    userType: rawUserType = 'user',
    variant = 'icon',
    size = 'medium',
    showLabel = false,
    color = 'primary',
    menuAnchor = 'right',
    showBadge = false,
    specificGuide,
    buttonText = 'Ayuda',
    sx = {}
}) => {
    // Normalizar el tipo de usuario
    const normalizedUserType = normalizeUserType(rawUserType);

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [openTutorial, setOpenTutorial] = useState(false);
    const [selectedGuideId, setSelectedGuideId] = useState<string | undefined>(specificGuide);
    const [showQuickStart, setShowQuickStart] = useState(false);

    const menuOpen = Boolean(anchorEl);

    // Definición rápida de guías disponibles
    const quickGuides = [
        {
            id: 'vacations-user',
            title: 'Vacaciones Usuario',
            description: 'Cómo solicitar vacaciones',
            icon: <CalendarIcon fontSize="small" />,
            userType: 'user' as const
        },
        {
            id: 'vacations-supervisor',
            title: 'Vacaciones Supervisor',
            description: 'Aprobar/rechazar solicitudes',
            icon: <SupervisorIcon fontSize="small" />,
            userType: 'supervisor' as const
        },
        {
            id: 'permissions-user',
            title: 'Permisos Usuario',
            description: 'Como solicitar licencias',
            icon: <AssignmentIcon fontSize="small" />,
            userType: 'user' as const
        },
        {
            id: 'permissions-supervisor',
            title: 'Permisos Supervisor',
            description: 'Gestionar permisos del personal',
            icon: <AdminIcon fontSize="small" />,
            userType: 'supervisor' as const
        }
    ];

    // Filtrar guías según tipo de usuario normalizado
    const availableGuides = quickGuides.filter(guide => {
        if (normalizedUserType === 'admin') return true; // Admin ve todo
        return guide.userType === normalizedUserType;
    });

    // Contador de guías no vistas
    const unseenGuidesCount = showBadge ? availableGuides.length : 0;

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleTutorialOpen = (guideId?: string) => {
        setSelectedGuideId(guideId);
        setOpenTutorial(true);
        handleMenuClose();
    };

    const handleQuickStart = () => {
        setShowQuickStart(true);
        handleMenuClose();
    };

    const handleTutorialClose = () => {
        setOpenTutorial(false);
        setShowQuickStart(false);
        setSelectedGuideId(undefined);
    };

    // Obtener etiqueta para mostrar
    const getUserTypeLabel = () => {
        switch (normalizedUserType) {
            case 'admin': return 'Administrador';
            case 'supervisor': return 'Supervisor';
            default: return 'Usuario';
        }
    };

    // Obtener color para el chip
    const getUserTypeColor = () => {
        switch (normalizedUserType) {
            case 'admin': return 'secondary';
            case 'supervisor': return 'primary';
            default: return 'default';
        }
    };

    // Renderizar el botón según la variante
    const renderButton = () => {
        const commonProps = {
            color: color !== 'inherit' ? color : undefined,
            size,
            onClick: specificGuide
                ? () => handleTutorialOpen(specificGuide)
                : handleMenuOpen,
            'aria-label': 'Abrir ayuda y tutoriales',
            'aria-controls': menuOpen ? 'tutorial-menu' : undefined,
            'aria-haspopup': 'true',
            'aria-expanded': menuOpen ? 'true' : undefined,
            sx
        };

        switch (variant) {
            case 'icon':
                return (
                    <Tooltip title={buttonText} arrow>
                        <IconButton
                            color={color !== 'inherit' ? color as any : undefined}
                            size={size}
                            onClick={specificGuide ? () => handleTutorialOpen(specificGuide) : handleMenuOpen}
                            aria-label="Abrir ayuda y tutoriales"
                            aria-controls={menuOpen ? 'tutorial-menu' : undefined}
                            aria-haspopup="true"
                            aria-expanded={menuOpen ? 'true' : undefined}
                            sx={sx}
                        >
                            {showBadge && unseenGuidesCount > 0 ? (
                                <Badge
                                    badgeContent={unseenGuidesCount}
                                    color="error"
                                    max={9}
                                >
                                    <HelpIcon />
                                </Badge>
                            ) : (
                                <HelpIcon />
                            )}
                        </IconButton>
                    </Tooltip>
                );

            case 'text':
                return (
                    <Button
                        variant={variant}
                        color={color !== 'inherit' ? color : undefined}
                        size={size}
                        onClick={specificGuide ? () => handleTutorialOpen(specificGuide) : handleMenuOpen}
                        aria-label="Abrir ayuda y tutoriales"
                        aria-controls={menuOpen ? 'tutorial-menu' : undefined}
                        aria-haspopup="true"
                        aria-expanded={menuOpen}  // ← Aquí el cambio
                        startIcon={
                            showBadge && unseenGuidesCount > 0 ? (
                                <Badge
                                    badgeContent={unseenGuidesCount}
                                    color="error"
                                    max={9}
                                >
                                    <HelpIcon />
                                </Badge>
                            ) : (
                                <HelpIcon />
                            )
                        }
                        sx={{
                            textTransform: 'none',
                            ...sx
                        }}
                    >
                        {buttonText}
                    </Button>
                );

            default:
                return (
                    <Button
                        variant={variant}
                        color={color !== 'inherit' ? color : undefined}
                        size={size}
                        onClick={specificGuide ? () => handleTutorialOpen(specificGuide) : handleMenuOpen}
                        aria-label="Abrir ayuda y tutoriales"
                        aria-controls={menuOpen ? 'tutorial-menu' : undefined}
                        aria-haspopup="true"
                        aria-expanded={menuOpen}
                        startIcon={<HelpIcon />}
                        sx={{
                            textTransform: 'none',
                            ...(showBadge && unseenGuidesCount > 0 && {
                                position: 'relative',
                                '&::after': {
                                    content: `"${unseenGuidesCount}"`,
                                    position: 'absolute',
                                    top: -6,
                                    right: -6,
                                    backgroundColor: 'error.main',
                                    color: 'error.contrastText',
                                    borderRadius: '50%',
                                    width: 20,
                                    height: 20,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold'
                                }
                            }),
                            ...sx
                        }}
                    >
                        {buttonText}
                        {showLabel && normalizedUserType !== 'user' && (
                            <Box component="span" sx={{ ml: 0.5, display: { xs: 'none', sm: 'inline' } }}>
                                ({getUserTypeLabel()})
                            </Box>
                        )}
                    </Button>
                );
        }
    };

    return (
        <>
            {renderButton()}

            {/* Menú desplegable (solo si no hay guía específica) */}
            {!specificGuide && (
                <Menu
                    id="tutorial-menu"
                    anchorEl={anchorEl}
                    open={menuOpen}
                    onClose={handleMenuClose}
                    onClick={handleMenuClose}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: menuAnchor === 'right' ? 'right' : 'left'
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: menuAnchor === 'right' ? 'right' : 'left'
                    }}
                    PaperProps={{
                        sx: {
                            width: 320,
                            maxWidth: '100%',
                            mt: 1
                        }
                    }}
                >
                    {/* Encabezado del menú */}
                    <Box sx={{ p: 2, pb: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                            <HelpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                            Centro de Ayuda
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Guías y tutoriales paso a paso
                        </Typography>
                        <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Chip
                                label={getUserTypeLabel()}
                                size="small"
                                color={getUserTypeColor()}
                                variant="outlined"
                            />
                            {showBadge && unseenGuidesCount > 0 && (
                                <Chip
                                    label={`${unseenGuidesCount} nueva${unseenGuidesCount > 1 ? 's' : ''}`}
                                    size="small"
                                    color="error"
                                />
                            )}
                        </Box>
                    </Box>

                    <Divider />

                    {/* Guías disponibles */}
                    <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                        {availableGuides.map((guide) => (
                            <MenuItem
                                key={guide.id}
                                onClick={() => handleTutorialOpen(guide.id)}
                                sx={{
                                    py: 1.5,
                                    borderLeft: 3,
                                    borderColor: 'transparent',
                                    '&:hover': {
                                        borderColor: 'primary.main',
                                        backgroundColor: 'action.hover'
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
                                        fontWeight: 500
                                    }}
                                    secondaryTypographyProps={{
                                        variant: 'caption'
                                    }}
                                />
                                <StartIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                            </MenuItem>
                        ))}

                        {/* Mensaje si no hay guías */}
                        {availableGuides.length === 0 && (
                            <Box sx={{ p: 2, textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary">
                                    No hay guías disponibles para tu tipo de usuario.
                                </Typography>
                            </Box>
                        )}
                    </Box>

                    <Divider />

                    {/* Acciones adicionales */}
                    <Box sx={{ p: 1 }}>
                        <MenuItem onClick={handleQuickStart}>
                            <ListItemIcon>
                                <TutorialIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary="Inicio Rápido" />
                        </MenuItem>
{/** 
                        <MenuItem onClick={() => window.open('/tutorial/manual-completo.pdf', '_blank')}>
                            <ListItemIcon>
                                <GuideIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary="Manual Completo (PDF)" />
                        </MenuItem>
*/}
                        <Divider sx={{ my: 1 }} />
                        <MenuItem onClick={handleMenuClose}>
                            <ListItemIcon>
                                <ExitIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary="Cerrar" />
                        </MenuItem>
                    </Box>
                </Menu>
            )}

            {/* Componente de tutorial */}
            <UserGuideTutorial
                open={openTutorial || showQuickStart}
                onClose={handleTutorialClose}
                initialGuideId={selectedGuideId}
                userType={normalizedUserType}
            />
        </>
    );
};

export default TutorialButton;