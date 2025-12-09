import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    Typography,
    Box,
    Chip,
    Button,
    CircularProgress,
    Alert,
    IconButton
} from '@mui/material';
import { PictureAsPdf, Business, CheckCircle, Cancel, Close, Delete } from '@mui/icons-material';
import axios from 'src/lib/axios';
import { License } from 'src/interfaces/licenseTypes';
import { generateLicensePdf } from 'src/utils/licensePdfGenerator';
import { formatDate } from 'src/utils/dateUtils';

interface LicenseDetailDialogProps {
    open: boolean;
    onClose: () => void;
    license: License;
    userDetails: {
        [key: string]: {
            academicUnit: string;
            name: string;
            ci: string;
            celular: string;
            department: string;
        };
    };
    currentUser: any;
    onLicenseUpdate: (updatedLicense: License) => void;
}

const LicenseDetailDialog: React.FC<LicenseDetailDialogProps> = ({
    open,
    onClose,
    license,
    userDetails,
    currentUser,
    onLicenseUpdate
}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [displayLicense, setDisplayLicense] = useState<License>(license);

    // Sincronizar cuando cambia el prop license
    useEffect(() => {
        setDisplayLicense(license);
    }, [license]);

    const handlePersonalApprove = async () => {
        await handlePersonalApprovalChange(true);
    };

    const handlePersonalReject = async () => {
        await handlePersonalApprovalChange(false);
    };

    const handlePersonalApprovalChange = async (approval: boolean) => {
        if (!displayLicense || !currentUser) return;

        setLoading(true);
        setError(null);
        setSuccessMessage(null); // Limpiar mensaje anterior

        try {
            // Realizar la solicitud PATCH
            await axios.patch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/licenses/${displayLicense.id}/personal-approval`,
                { approval }
            );

            // Obtener la licencia actualizada del servidor
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/licenses/${displayLicense.id}`
            );
            
            const updatedLicense = response.data;
            
            // Actualizar estado local inmediatamente
            setDisplayLicense(updatedLicense);
            
            // Notificar al componente padre
            onLicenseUpdate(updatedLicense);

            setSuccessMessage(
                approval
                    ? 'Licencia aprobada correctamente por el Dpto. Personal.'
                    : 'Licencia rechazada correctamente por el Dpto. Personal.'
            );
            
        } catch (err) {
            console.error('Error al cambiar el estado de la licencia:', err);
            setError('Error al cambiar el estado de la licencia');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = () => {
        const user = userDetails[displayLicense.userId];
        if (!displayLicense || !user) return;

        const pdf = generateLicensePdf(displayLicense, {
            user: {
                fullName: user.name,
                ci: user.ci
            }
        });

        pdf.save(`licencia_${displayLicense.id}.pdf`);
    };

    const handleDelete = async () => {
        if (!currentUser) return;
        const isAdmin = currentUser.role === 'admin';
        const isOwner = currentUser.id === displayLicense.userId;
        if (!isAdmin && !isOwner) return;
        
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        
        try {
            await axios.delete(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/licenses/${displayLicense.id}`,
                { data: { userId: currentUser.id } }
            );
            
            const deletedLicense = { ...displayLicense, deleted: true };
            setDisplayLicense(deletedLicense);
            onLicenseUpdate(deletedLicense);
            
            setSuccessMessage('Licencia eliminada correctamente');
            setTimeout(() => {
                onClose();
            }, 1500);
            
        } catch (err) {
            console.error('Error al eliminar la licencia:', err);
            setError('Error al eliminar la licencia');
        } finally {
            setLoading(false);
        }
    };

    // Determinar el color del chip basado en el valor booleano
    const getApprovalChipColor = (approval: boolean | null) => {
        if (approval === null) return 'default';
        return approval ? 'success' : 'error';
    };

    // Determinar el label del chip basado en el valor
    const getApprovalChipLabel = (approval: boolean | null) => {
        if (approval === null) return 'Pendiente';
        return approval ? 'Aprobado' : 'Rechazado';
    };

    return (
        <>
            <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
                <DialogTitle
                    sx={{
                        backgroundColor: 'primary.main',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        pr: 2
                    }}
                >
                    <Box display="flex" alignItems="center" gap={1}>
                        <Business sx={{ fontSize: 24 }} />
                        Gestión de Licencia
                    </Box>
                    <IconButton onClick={onClose} sx={{ color: 'white' }}>
                        <Close />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ py: 3 }}>
                    {error && (
                        <Alert 
                            severity="error" 
                            sx={{ mb: 2 }} 
                            onClose={() => setError(null)}
                        >
                            {error}
                        </Alert>
                    )}
                    
                    {successMessage && (
                        <Alert 
                            severity="success" 
                            sx={{ mb: 2 }} 
                            onClose={() => setSuccessMessage(null)}
                        >
                            {successMessage}
                        </Alert>
                    )}

                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} mt={2}>
                            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                                Información de la Licencia
                            </Typography>
                            <Typography><strong>ID:</strong> {displayLicense.id}</Typography>
                            <Typography><strong>Tipo:</strong> {displayLicense.licenseType}</Typography>
                            <Typography>
                                <strong>Inicio:</strong> {formatDate(displayLicense.startDate)} 
                                ({displayLicense.startHalfDay || 'Completo'})
                            </Typography>
                            <Typography>
                                <strong>Fin:</strong> {formatDate(displayLicense.endDate)} 
                                ({displayLicense.endHalfDay || 'Completo'})
                            </Typography>
                            <Typography><strong>Tipo de Solicitud:</strong> {displayLicense.timeRequested}</Typography>
                            <Typography><strong>Tiempo Solicitado:</strong> {displayLicense.totalDays} días</Typography>
                            <Typography><strong>Emisión:</strong> {formatDate(displayLicense.issuedDate)}</Typography>

                            {(displayLicense.detectedHolidays || []).length > 0 && (
                                <Box mt={1}>
                                    <Typography variant="subtitle2" fontWeight="bold">
                                        Feriados Detectados:
                                    </Typography>
                                    <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                                        {(displayLicense.detectedHolidays || []).map((h) => (
                                            <li key={h.date}>
                                                {h.date} - {h.description}
                                            </li>
                                        ))}
                                    </ul>
                                </Box>
                            )}
                        </Grid>
                        
                        <Grid item xs={12} sm={6} mt={2}>
                            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                                Información del Solicitante
                            </Typography>
                            <Typography><strong>Nombre:</strong> {userDetails[displayLicense.userId]?.name || 'N/A'}</Typography>
                            <Typography><strong>CI:</strong> {userDetails[displayLicense.userId]?.ci || 'N/A'}</Typography>
                            <Typography><strong>Celular:</strong> {userDetails[displayLicense.userId]?.celular || 'N/A'}</Typography>
                            <Typography><strong>Departamento:</strong> {userDetails[displayLicense.userId]?.department || 'N/A'}</Typography>
                            <Typography><strong>Unidad Académica:</strong> {userDetails[displayLicense.userId]?.academicUnit || 'N/A'}</Typography>
                        </Grid>
                        
                        <Grid item xs={12}>
                            <Box display="flex" justifyContent="space-around" mt={2} p={2} borderRadius={1}>
                                <Box textAlign="center">
                                    <Typography variant="body2" fontWeight="bold" gutterBottom>
                                        Aprobación Jefe Superior
                                    </Typography>
                                    <Chip
                                        label={getApprovalChipLabel(displayLicense.immediateSupervisorApproval)}
                                        color={getApprovalChipColor(displayLicense.immediateSupervisorApproval)}
                                        icon={displayLicense.immediateSupervisorApproval === null ? 
                                            <Cancel /> : 
                                            displayLicense.immediateSupervisorApproval ? 
                                            <CheckCircle /> : 
                                            <Cancel />
                                        }
                                        variant={displayLicense.immediateSupervisorApproval === null ? "outlined" : "filled"}
                                    />
                                </Box>
                                
                                <Box textAlign="center">
                                    <Typography variant="body2" fontWeight="bold" gutterBottom>
                                        Aprobación Dpto. Personal
                                    </Typography>
                                    <Chip
                                        label={getApprovalChipLabel(displayLicense.personalDepartmentApproval)}
                                        color={getApprovalChipColor(displayLicense.personalDepartmentApproval)}
                                        icon={displayLicense.personalDepartmentApproval === null ? 
                                            <Cancel /> : 
                                            displayLicense.personalDepartmentApproval ? 
                                            <CheckCircle /> : 
                                            <Cancel />
                                        }
                                        variant={displayLicense.personalDepartmentApproval === null ? "outlined" : "filled"}
                                    />
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>
                </DialogContent>

                <DialogActions sx={{ px: 3, py: 2, flexWrap: 'wrap', justifyContent: 'center', gap: 2 }}>
                    <Button
                        onClick={handleDownloadPDF}
                        variant="outlined"
                        color="primary"
                        startIcon={<PictureAsPdf />}
                        disabled={loading}
                    >
                        Descargar Licencia
                    </Button>

                    {!displayLicense.deleted && (
                        <>
                            {currentUser?.role === 'admin' && displayLicense.personalDepartmentApproval === null && (
                                <Box display="flex" gap={2}>
                                    <Button
                                        onClick={handlePersonalApprove}
                                        color="success"
                                        variant="contained"
                                        startIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
                                        disabled={loading}
                                    >
                                        Aprobar
                                    </Button>
                                    <Button
                                        onClick={handlePersonalReject}
                                        color="error"
                                        variant="contained"
                                        startIcon={loading ? <CircularProgress size={20} /> : <Cancel />}
                                        disabled={loading}
                                    >
                                        Rechazar
                                    </Button>
                                </Box>
                            )}

                            {(currentUser?.role === 'admin' || currentUser?.id === displayLicense.userId) && (
                                <Button
                                    onClick={() => setConfirmDeleteOpen(true)}
                                    variant="outlined"
                                    color="error"
                                    startIcon={<Delete />}
                                    disabled={loading}
                                >
                                    Eliminar
                                </Button>
                            )}
                        </>
                    )}
                </DialogActions>
            </Dialog>

            {/* Diálogo de confirmación para eliminar */}
            <Dialog 
                open={confirmDeleteOpen} 
                onClose={() => !loading && setConfirmDeleteOpen(false)}
            >
                <DialogTitle>¿Estás seguro?</DialogTitle>
                <DialogContent>
                    <Typography>
                        ¿Deseas eliminar esta licencia? Esta acción no se puede deshacer.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={() => setConfirmDeleteOpen(false)} 
                        color="primary"
                        disabled={loading}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleDelete}
                        color="error"
                        variant="contained"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} /> : <Delete />}
                    >
                        {loading ? 'Eliminando...' : 'Confirmar Eliminación'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default LicenseDetailDialog;