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
    Alert
} from '@mui/material';
import { PictureAsPdf } from '@mui/icons-material';
import { Business, CheckCircle, Cancel } from '@mui/icons-material';
import axios from 'axios';
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
        }
    };
    currentUser: any; // O usa el tipo correcto de tu usuario
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
    const formatDate = (dateString: string) => {
        if (!dateString) return 'No disponible';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES');
    };
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handlePersonalApprove = async () => {
        if (!license || !currentUser) return;

        const newApprovalState = !license.personalDepartmentApproval;
        setLoading(true);
        setError(null);

        try {
            await axios.patch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/licenses/${license.id}/personal-approval`,
                {
                    approval: newApprovalState,
                    userId: currentUser.id,
                }
            );

            // Refetch de la licencia actualizada
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/licenses/${license.id}`);
            const updatedLicense = res.data;

            onLicenseUpdate(updatedLicense);

            setSuccessMessage(
                newApprovalState
                    ? 'Licencia aprobada correctamente por el Dpto. Personal.'
                    : 'Aprobación del Dpto. Personal removida.'
            );

            setTimeout(() => setSuccessMessage(null), 10000);
            //onClose();
        } catch (err) {
            setError('Error al cambiar el estado de la licencia');
            console.error('Error updating license:', err);
        } finally {
            setLoading(false);
        }

    };
    const handleDownloadPDF = () => {
        if (!license || !userDetails[license.userId]) return;

        const pdf = generateLicensePdf(license, {
            user: {
                fullName: userDetails[license.userId]?.name,
                ci: userDetails[license.userId]?.ci
            }
        });

        pdf.save(`licencia_${license.id}.pdf`);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{
                backgroundColor: 'primary.main',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: 1
            }}>
                <Business sx={{ fontSize: 24 }} />
                Gestión de Licencia
            </DialogTitle>
            <DialogContent sx={{ py: 3 }}>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}
                {successMessage && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        {successMessage}
                    </Alert>
                )}
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} mt={4}>
                        <Typography variant="subtitle1" gutterBottom>
                            <strong>Información de la Licencia</strong>
                        </Typography>
                        <Typography><strong>ID:</strong> {license.id}</Typography>
                        <Typography><strong>Tipo:</strong> {license.licenseType}</Typography>
                        <Typography><strong>Inicio:</strong> {formatDate(license.startDate)}</Typography>
                        <Typography><strong>Fin:</strong> {formatDate(license.endDate)}</Typography>
                        <Typography><strong>Tipo:</strong> {license.timeRequested}</Typography>
                        <Typography><strong>Tiempo Solicitado:</strong> {license.totalDays}</Typography>
                        <Typography><strong>Emisión:</strong> {formatDate(license.issuedDate)}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} mt={4}>
                        <Typography variant="subtitle1" gutterBottom>
                            <strong>Información del Solicitante</strong>
                        </Typography>
                        <Typography>
                            <strong>Nombre:</strong> {userDetails[license.userId]?.name || 'N/A'}
                        </Typography>
                        <Typography>
                            <strong>CI:</strong> {userDetails[license.userId]?.ci || 'N/A'}
                        </Typography>
                        <Typography>
                            <strong>Celular:</strong> {userDetails[license.userId]?.celular || 'N/A'}
                        </Typography>
                        <Typography>
                            <strong>Departamento:</strong> {userDetails[license.userId]?.department || 'N/A'}
                        </Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'space-around',
                            mt: 2,
                            p: 2,
                            backgroundColor: 'default',
                            borderRadius: 1
                        }}>
                            <Box textAlign="center">
                                <Typography variant="body2">
                                    <strong>Aprobación Jefe Superior</strong>
                                </Typography>
                                <Chip
                                    label={license.immediateSupervisorApproval ? 'Aprobado' : 'Pendiente'}
                                    color={license.immediateSupervisorApproval ? 'primary' : 'default'}
                                    icon={license.immediateSupervisorApproval ? <CheckCircle /> : <Cancel />}
                                />
                            </Box>
                            <Box textAlign="center">
                                <Typography variant="body2">
                                    <strong>Aprobación Dpto. Personal</strong>
                                </Typography>
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
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        width: '100%',
                        gap: 2,
                        flexWrap: 'wrap' // Opcional: permite que los botones bajen a otra línea en pantallas pequeñas
                    }}
                >
                    <Button
                        onClick={handleDownloadPDF}
                        variant="outlined"
                        color="primary"
                        startIcon={<PictureAsPdf />}
                        disabled={loading}
                    >
                        Descargar Licencia
                    </Button>
                    {currentUser?.role === 'admin' && (
                        <Button
                            onClick={handlePersonalApprove}
                            color={license.personalDepartmentApproval ? "error" : "success"}
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
                                (license.immediateSupervisorApproval === true && license.personalDepartmentApproval === true)
                            }
                        >
                            {license.personalDepartmentApproval ? "Desaprobar" : "Aprobar"}
                        </Button>

                    )}
                    <Button
                        onClick={onClose}
                        color="inherit"
                        variant="outlined"
                        disabled={loading}
                    >
                        Cerrar
                    </Button>
                </Box>
            </DialogActions>

        </Dialog>
    );
};

export default LicenseDetailDialog;