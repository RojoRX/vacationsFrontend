import React, { useState } from 'react';
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

interface LicenseDetailDialogProps {
    open: boolean;
    onClose: () => void;
    license: License;
    userDetails: {
        [key: string]: {
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

    const formatDate = (dateString: string) => {
        if (!dateString) return 'No disponible';
        return new Date(dateString).toLocaleDateString('es-ES');
    };

    const handlePersonalApprove = async () => {
        if (!license || !currentUser) return;

        const newApprovalState = !license.personalDepartmentApproval;
        setLoading(true);
        setError(null);

        try {
            await axios.patch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/licenses/${license.id}/personal-approval`, {
                approval: newApprovalState,
                userId: currentUser.id
            });

            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/licenses/${license.id}`);
            onLicenseUpdate(res.data);

            setSuccessMessage(
                newApprovalState
                    ? 'Licencia aprobada correctamente por el Dpto. Personal.'
                    : 'Aprobación del Dpto. Personal removida.'
            );
            setTimeout(() => setSuccessMessage(null), 10000);
        } catch (err) {
            setError('Error al cambiar el estado de la licencia');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = () => {
        const user = userDetails[license.userId];
        if (!license || !user) return;

        const pdf = generateLicensePdf(license, {
            user: {
                fullName: user.name,
                ci: user.ci
            }
        });

        pdf.save(`licencia_${license.id}.pdf`);
    };

    const handleDelete = async () => {
        if (!currentUser) return;
        const isAdmin = currentUser.role === 'admin';
        const isOwner = currentUser.id === license.userId;
        if (!isAdmin && !isOwner) return;
        setLoading(true);
        setError(null);
        try {
            await axios.delete(`${process.env.NEXT_PUBLIC_API_BASE_URL}/licenses/${license.id}`, {
                data: { userId: currentUser.id }
            });
            onLicenseUpdate({ ...license, deleted: true });
            setSuccessMessage('Licencia eliminada correctamente');
            setTimeout(() => setSuccessMessage(null), 10000);
            onClose();
        } catch (err) {
            setError('Error al eliminar la licencia');
        }
        finally {
            setLoading(false);
        }
    };


    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle
                sx={{
                    backgroundColor: 'primary.main',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
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
            {error && (
                <Box px={3} pt={2}>
                    <Alert severity="error" onClose={() => setError(null)}>
                        {error}
                    </Alert>
                </Box>
            )}

            {successMessage && (
                <Box px={3} pt={2}>
                    <Alert severity="success" onClose={() => setSuccessMessage(null)}>
                        {successMessage}
                    </Alert>
                </Box>
            )}

            <DialogContent sx={{ py: 3 }}>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}

                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} mt={4}>
                        <Typography variant="subtitle1" gutterBottom><strong>Información de la Licencia</strong></Typography>
                        <Typography><strong>ID:</strong> {license.id}</Typography>
                        <Typography><strong>Tipo:</strong> {license.licenseType}</Typography>
                        <Typography><strong>Inicio:</strong> {formatDate(license.startDate)}</Typography>
                        <Typography><strong>Fin:</strong> {formatDate(license.endDate)}</Typography>
                        <Typography><strong>Tipo:</strong> {license.timeRequested}</Typography>
                        <Typography><strong>Tiempo Solicitado:</strong> {license.totalDays}</Typography>
                        <Typography><strong>Emisión:</strong> {formatDate(license.issuedDate)}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} mt={4}>
                        <Typography variant="subtitle1" gutterBottom><strong>Información del Solicitante</strong></Typography>
                        <Typography><strong>Nombre:</strong> {userDetails[license.userId]?.name || 'N/A'}</Typography>
                        <Typography><strong>CI:</strong> {userDetails[license.userId]?.ci || 'N/A'}</Typography>
                        <Typography><strong>Celular:</strong> {userDetails[license.userId]?.celular || 'N/A'}</Typography>
                        <Typography><strong>Departamento:</strong> {userDetails[license.userId]?.department || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <Box display="flex" justifyContent="space-around" mt={2} p={2} borderRadius={1}>
                            <Box textAlign="center">
                                <Typography variant="body2"><strong>Aprobación Jefe Superior</strong></Typography>
                                <Chip
                                    label={license.immediateSupervisorApproval ? 'Aprobado' : 'Pendiente'}
                                    color={license.immediateSupervisorApproval ? 'primary' : 'default'}
                                    icon={license.immediateSupervisorApproval ? <CheckCircle /> : <Cancel />}
                                />
                            </Box>
                            <Box textAlign="center">
                                <Typography variant="body2"><strong>Aprobación Dpto. Personal</strong></Typography>
                                <Chip
                                    label={license.personalDepartmentApproval ? 'Aprobado' : 'Pendiente'}
                                    color={license.personalDepartmentApproval ? 'primary' : 'default'}
                                    icon={license.personalDepartmentApproval ? <CheckCircle /> : <Cancel />}
                                />
                            </Box>
                        </Box>
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions
                sx={{ px: 3, py: 2, flexWrap: 'wrap', justifyContent: 'center', gap: 2 }}
            >
                {/* Descargar PDF siempre visible (puedes ajustar si también quieres ocultarlo en eliminadas) */}
                <Button
                    onClick={handleDownloadPDF}
                    variant="outlined"
                    color="primary"
                    startIcon={<PictureAsPdf />}
                    disabled={loading}
                >
                    Descargar Licencia
                </Button>

                {/* Ocultar botones de aprobar y eliminar si la licencia está eliminada */}
                {!license.deleted && (
                    <>
                        {/* Aprobación por personal */}
                        {currentUser?.role === 'admin' && (
                            <Button
                                onClick={handlePersonalApprove}
                                color={license.personalDepartmentApproval ? 'error' : 'success'}
                                variant="contained"
                                startIcon={
                                    loading ? (
                                        <CircularProgress size={20} color="inherit" />
                                    ) : license.personalDepartmentApproval ? (
                                        <Cancel />
                                    ) : (
                                        <CheckCircle />
                                    )
                                }
                                disabled={
                                    loading ||
                                    (license.immediateSupervisorApproval && license.personalDepartmentApproval)
                                }
                            >
                                {license.personalDepartmentApproval ? 'Desaprobar' : 'Aprobar'}
                            </Button>
                        )}

                        {/* Botón Eliminar (admin o dueño) */}
                        {(currentUser?.role === 'admin' || currentUser?.id === license.userId) && (
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
            <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)}>
                <DialogTitle>¿Estás seguro?</DialogTitle>
                <DialogContent>
                    <Typography>
                        ¿Deseas eliminar esta licencia? Esta acción no se puede deshacer.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDeleteOpen(false)} color="primary">
                        Cancelar
                    </Button>
                    <Button
                        onClick={async () => {
                            setConfirmDeleteOpen(false);
                            await handleDelete();
                        }}
                        color="error"
                        variant="contained"
                        disabled={loading}
                    >
                        Confirmar Eliminación
                    </Button>
                </DialogActions>
            </Dialog>

        </Dialog>

    );
};

export default LicenseDetailDialog;
