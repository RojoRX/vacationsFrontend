import React, { useEffect, useState } from 'react';
import axios from 'src/lib/axios';
import {
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Typography,
    TextField,
    Grid,
    IconButton,
    Tooltip,
    Alert,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    SelectChangeEvent,
    Chip
} from '@mui/material';
import {
    Search,
    CheckCircle,
    Cancel,
    Visibility,
    Person,
    Refresh,
    Inbox,
    Pending,
    ThumbDown,
    ThumbUp
} from '@mui/icons-material';
import { License } from 'src/interfaces/licenseTypes';
import useUser from 'src/hooks/useUser';
import { formatDate } from 'src/utils/dateUtils';

interface DepartmentLicensesProps {
    licenses: License[];
    userInfo: any;
    user: any;
}

interface AclComponent extends React.FC<DepartmentLicensesProps> {
    acl?: {
        action: string;
        subject: string;
    };
}

const DepartmentLicenses: AclComponent = () => {
    const currentUser = useUser();
    const [licenses, setLicenses] = useState<License[]>([]);
    const [filteredLicenses, setFilteredLicenses] = useState<License[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
    const [userDetails, setUserDetails] = useState<{
        [key: string]: {
            name: string;
            ci: string;
            celular: string;
        }
    }>({});
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');

    // Estados de filtro mejorados para ambos tipos de aprobación
    const [supervisorFilter, setSupervisorFilter] = useState<string>('all');
    const [personalFilter, setPersonalFilter] = useState<string>('all');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (currentUser) {
            fetchLicenses();
        }
    }, [currentUser]);

    const fetchLicenses = () => {
        setLoading(true);
        setError(null);
        axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/licenses/department/${currentUser?.id}`)
            .then((response) => {
                let licensesData = response.data;

                // Ordenar del más reciente al más antiguo
                licensesData.sort((a: License, b: License) => b.id - a.id);
                setLicenses(licensesData);

                const userRequests = licensesData.map((license: License) =>
                    axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/${license.userId}`)
                        .then(userResponse => ({
                            userId: license.userId,
                            userName: userResponse.data.fullName,
                            userCi: userResponse.data.ci,
                            celular: userResponse.data.celular || 'N/A'
                        }))
                        .catch(() => ({
                            userId: license.userId,
                            userName: 'Usuario no encontrado',
                            userCi: 'N/A',
                            celular: 'N/A'
                        }))
                );

                return Promise.all(userRequests).then(userDetailsArray => ({ userDetailsArray, licensesData }));
            })
            .then(({ userDetailsArray, licensesData }) => {
                const userDetailsMap: { [key: string]: { name: string; ci: string; celular: string } } = {};
                userDetailsArray.forEach(user => {
                    userDetailsMap[user.userId] = {
                        name: user.userName,
                        ci: user.userCi,
                        celular: user.celular
                    };
                });
                setUserDetails(userDetailsMap);
                applyFilters(licensesData, userDetailsMap, searchTerm, supervisorFilter, personalFilter);
            })
            .catch((err) => {
                console.error('Error fetching licenses:', err);
                setError('Error al obtener las licencias');
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const applyFilters = (
        licenses: License[],
        details: any,
        term: string,
        supervisorFilter: string,
        personalFilter: string
    ) => {
        let filtered = [...licenses];

        // Filtrar por término de búsqueda (nombre o CI)
        if (term) {
            filtered = filtered.filter(license => {
                const userDetail = details[license.userId];
                if (!userDetail) return false;

                return (
                    userDetail.name.toLowerCase().includes(term.toLowerCase()) ||
                    userDetail.ci.toLowerCase().includes(term.toLowerCase())
                );
            });
        }

        // Filtrar por estado de aprobación del supervisor
        if (supervisorFilter !== 'all') {
            filtered = filtered.filter(license => {
                switch (supervisorFilter) {
                    case 'approved':
                        return license.immediateSupervisorApproval === true;
                    case 'rejected':
                        return license.immediateSupervisorApproval === false;
                    case 'pending':
                        return license.immediateSupervisorApproval === null;
                    default:
                        return true;
                }
            });
        }

        // Filtrar por estado de aprobación del departamento personal
        if (personalFilter !== 'all') {
            filtered = filtered.filter(license => {
                switch (personalFilter) {
                    case 'approved':
                        return license.personalDepartmentApproval === true;
                    case 'rejected':
                        return license.personalDepartmentApproval === false;
                    case 'pending':
                        return license.personalDepartmentApproval === null;
                    default:
                        return true;
                }
            });
        }

        setFilteredLicenses(filtered);
        setPage(0); // Resetear a la primera página al aplicar filtros
    };

    useEffect(() => {
        applyFilters(licenses, userDetails, searchTerm, supervisorFilter, personalFilter);
    }, [licenses, userDetails, searchTerm, supervisorFilter, personalFilter]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const handleSupervisorFilterChange = (event: SelectChangeEvent) => {
        setSupervisorFilter(event.target.value);
    };

    const handlePersonalFilterChange = (event: SelectChangeEvent) => {
        setPersonalFilter(event.target.value);
    };

    const handleOpenDialog = (license: License) => {
        setSelectedLicense(license);
        setOpenDialog(true);
        setError(null);
        setSuccessMessage(null);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedLicense(null);
        setError(null);
        setSuccessMessage(null);
    };

    const handleApprove = async (approval: boolean) => {
        if (!selectedLicense || !currentUser?.id) {
            setError('No se pudo procesar la solicitud');
            return;
        }

        // Verificar si ya fue revisada (según tu backend)
        if (selectedLicense.immediateSupervisorApproval !== null) {
            setError('La licencia ya fue revisada y no puede modificarse nuevamente.');
            return;
        }

        setActionLoading(true);
        setError(null);

        try {
            // Llamar al endpoint del backend
            const response = await axios.patch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/licenses/${selectedLicense.id}/approve?supervisorId=${currentUser?.id}`,
                { approval }
            );

            // Actualizar la licencia con la respuesta del backend
            const updatedLicense = {
                ...selectedLicense,
                immediateSupervisorApproval: approval,
                approvedBySupervisor: approval ? currentUser : null
            };

            // Actualizar en la lista
            setLicenses(prev =>
                prev.map(license =>
                    license.id === selectedLicense.id ? updatedLicense : license
                )
            );

            // Actualizar la licencia seleccionada
            setSelectedLicense(updatedLicense);

            setSuccessMessage(
                approval
                    ? 'Licencia aprobada exitosamente'
                    : 'Licencia rechazada exitosamente'
            );

            // Recargar datos después de 2 segundos
            setTimeout(() => {
                fetchLicenses();
            }, 2000);

        } catch (err: any) {
            console.error('Error al cambiar el estado de la licencia:', err);

            if (err.response?.status === 400) {
                setError(err.response?.data?.message || 'Error al procesar la solicitud');
            } else if (err.response?.status === 401 || err.response?.status === 403) {
                setError('No tienes permisos para realizar esta acción');
            } else {
                setError('Error al cambiar el estado de la licencia');
            }
        } finally {
            setActionLoading(false);
        }
    };

    // Función auxiliar para mostrar el estado del chip del supervisor
    const getSupervisorChipInfo = (approval: boolean | null) => {
        switch (approval) {
            case true:
                return {
                    label: 'Aprobado',
                    color: 'success' as const,
                    icon: <CheckCircle />,
                    variant: 'filled' as const
                };
            case false:
                return {
                    label: 'Rechazado',
                    color: 'error' as const,
                    icon: <Cancel />,
                    variant: 'filled' as const
                };
            default:
                return {
                    label: 'Pendiente',
                    color: 'warning' as const,
                    icon: <Pending />,
                    variant: 'outlined' as const
                };
        }
    };

    // Función auxiliar para mostrar el estado del chip del departamento personal
    const getPersonalChipInfo = (approval: boolean | null) => {
        switch (approval) {
            case true:
                return {
                    label: 'Aprobado',
                    color: 'success' as const,
                    icon: <CheckCircle />,
                    variant: 'filled' as const
                };
            case false:
                return {
                    label: 'Rechazado',
                    color: 'error' as const,
                    icon: <Cancel />,
                    variant: 'filled' as const
                };
            default:
                return {
                    label: 'Pendiente',
                    color: 'warning' as const,
                    icon: <Pending />,
                    variant: 'outlined' as const
                };
        }
    };

    // Verificar si un supervisor puede actuar sobre una licencia
    const canSupervisorAct = (license: License) => {
        return currentUser?.role === 'supervisor' &&
            license.immediateSupervisorApproval === null;
    };


    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" component="h2" sx={{ display: 'flex', alignItems: 'center' }}>
                    <Person sx={{ mr: 1, color: 'primary.main' }} />
                    Solicitudes de Licencias del departamento
                </Typography>

                <Tooltip title="Recargar datos">
                    <IconButton onClick={fetchLicenses} color="primary">
                        <Refresh />
                    </IconButton>
                </Tooltip>
            </Box>

            {/* Filtros y búsqueda */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="Buscar por nombre o CI..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        InputProps={{
                            startAdornment: <Search sx={{ color: 'action.active', mr: 1 }} />
                        }}
                        size="small"
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Filtro Supervisor</InputLabel>
                        <Select
                            value={supervisorFilter}
                            label="Filtro Supervisor"
                            onChange={handleSupervisorFilterChange}
                        >
                            <MenuItem value="all">Todos los estados (Supervisor)</MenuItem>
                            <MenuItem value="approved">Aprobadas por Supervisor</MenuItem>
                            <MenuItem value="rejected">Rechazadas por Supervisor</MenuItem>
                            <MenuItem value="pending">Pendientes de Supervisor</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Filtro Dpto. Personal</InputLabel>
                        <Select
                            value={personalFilter}
                            label="Filtro Dpto. Personal"
                            onChange={handlePersonalFilterChange}
                        >
                            <MenuItem value="all">Todos los estados (Personal)</MenuItem>
                            <MenuItem value="approved">Aprobadas por Personal</MenuItem>
                            <MenuItem value="rejected">Rechazadas por Personal</MenuItem>
                            <MenuItem value="pending">Pendientes de Personal</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
            </Grid>

            {/* Tabla o mensaje si no hay licencias */}
            {licenses.length === 0 && !loading ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                    <Inbox sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="h6" color="textSecondary">
                        No hay licencias registradas para este departamento o unidad académica.
                    </Typography>
                </Box>
            ) : (
                <>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Solicitante</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>CI</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Tipo</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Fechas</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Estado Supervisor</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Estado Personal</TableCell>
                                    {currentUser?.role === 'supervisor' && (
                                        <TableCell sx={{ fontWeight: 'bold' }}>Acciones</TableCell>
                                    )}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredLicenses.length > 0 ? (
                                    filteredLicenses
                                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                        .map((license) => {
                                            const supervisorChip = getSupervisorChipInfo(license.immediateSupervisorApproval);
                                            const personalChip = getPersonalChipInfo(license.personalDepartmentApproval);

                                            return (
                                                <TableRow key={license.id} hover>
                                                    <TableCell>{license.id}</TableCell>
                                                    <TableCell>
                                                        {userDetails[license.userId]?.name || 'N/A'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {userDetails[license.userId]?.ci || 'N/A'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {license.licenseType}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box>
                                                            <Typography variant="body2">
                                                                <strong>Inicio:</strong> {formatDate(license.startDate)}
                                                            </Typography>
                                                            <Typography variant="body2">
                                                                <strong>Fin:</strong> {formatDate(license.endDate)}
                                                            </Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={supervisorChip.label}
                                                            color={supervisorChip.color}
                                                            size="small"
                                                            icon={supervisorChip.icon}
                                                            variant={supervisorChip.variant}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={personalChip.label}
                                                            color={personalChip.color}
                                                            size="small"
                                                            icon={personalChip.icon}
                                                            variant={personalChip.variant}
                                                        />
                                                    </TableCell>
                                                    {currentUser?.role === 'supervisor' && (
                                                        <TableCell>
                                                            <Button
                                                                variant="outlined"
                                                                size="small"
                                                                startIcon={<Visibility />}
                                                                onClick={() => handleOpenDialog(license)}

                                                                title={!canSupervisorAct(license) ?
                                                                    "Esta licencia ya fue revisada" :
                                                                    "Ver detalles"}
                                                            >
                                                                Ver
                                                            </Button>
                                                        </TableCell>
                                                    )}
                                                </TableRow>
                                            );
                                        })
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={currentUser?.role === 'supervisor' ? 8 : 7}
                                            align="center"
                                            sx={{ py: 4 }}
                                        >
                                            <Typography color="textSecondary">
                                                No se encontraron licencias con los filtros aplicados
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {error && (
                        <Alert
                            severity="error"
                            sx={{ my: 3 }}
                            onClose={() => setError(null)}
                        >
                            {error}
                        </Alert>
                    )}

                    {successMessage && (
                        <Alert
                            severity="success"
                            sx={{ my: 3 }}
                            onClose={() => setSuccessMessage(null)}
                        >
                            {successMessage}
                        </Alert>
                    )}
                </>
            )}

            {/* Paginación */}
            <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredLicenses.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                onRowsPerPageChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                }}
                labelRowsPerPage="Licencias por página:"
                sx={{ mt: 2 }}
            />

            {/* Diálogo de detalles */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle sx={{
                    backgroundColor: 'primary.main',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Person sx={{ fontSize: 24 }} />
                        Detalles de la Licencia
                    </Box>
                </DialogTitle>

                <DialogContent sx={{ py: 3 }}>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                            {error}
                        </Alert>
                    )}

                    {successMessage && (
                        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
                            {successMessage}
                        </Alert>
                    )}

                    {selectedLicense && (
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                                    Información de la Licencia
                                </Typography>
                                <Typography><strong>ID:</strong> {selectedLicense.id}</Typography>
                                <Typography><strong>Tipo:</strong> {selectedLicense.licenseType}</Typography>
                                <Typography>
                                    <strong>Inicio:</strong> {formatDate(selectedLicense.startDate)}
                                    {selectedLicense.startHalfDay && ` (${selectedLicense.startHalfDay})`}
                                </Typography>
                                <Typography>
                                    <strong>Fin:</strong> {formatDate(selectedLicense.endDate)}
                                    {selectedLicense.endHalfDay && ` (${selectedLicense.endHalfDay})`}
                                </Typography>
                                <Typography><strong>Emisión:</strong> {formatDate(selectedLicense.issuedDate)}</Typography>
                                <Typography><strong>Días solicitados:</strong> {selectedLicense.totalDays}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                                    Información del Solicitante
                                </Typography>
                                <Typography>
                                    <strong>Nombre:</strong> {userDetails[selectedLicense.userId]?.name || 'N/A'}
                                </Typography>
                                <Typography>
                                    <strong>CI:</strong> {userDetails[selectedLicense.userId]?.ci || 'N/A'}
                                </Typography>
                                <Typography>
                                    <strong>Celular:</strong> {userDetails[selectedLicense.userId]?.celular || 'N/A'}
                                </Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Box sx={{
                                    display: 'flex',
                                    justifyContent: 'space-around',
                                    mt: 2,
                                    p: 2,
                                    backgroundColor: 'action.hover',
                                    borderRadius: 1,
                                    flexDirection: { xs: 'column', sm: 'row' },
                                    gap: { xs: 2, sm: 0 }
                                }}>
                                    <Box textAlign="center">
                                        <Typography variant="body2" fontWeight="bold" gutterBottom>
                                            Aprobación Jefe Superior
                                        </Typography>
                                        {(() => {
                                            const chipInfo = getSupervisorChipInfo(selectedLicense.immediateSupervisorApproval);
                                            return (
                                                <Chip
                                                    label={chipInfo.label}
                                                    color={chipInfo.color}
                                                    icon={chipInfo.icon}
                                                    variant={chipInfo.variant}
                                                    sx={{ minWidth: 120 }}
                                                />
                                            );
                                        })()}
                                    </Box>
                                    <Box textAlign="center">
                                        <Typography variant="body2" fontWeight="bold" gutterBottom>
                                            Aprobación Dpto. Personal
                                        </Typography>
                                        {(() => {
                                            const chipInfo = getPersonalChipInfo(selectedLicense.personalDepartmentApproval);
                                            return (
                                                <Chip
                                                    label={chipInfo.label}
                                                    color={chipInfo.color}
                                                    icon={chipInfo.icon}
                                                    variant={chipInfo.variant}
                                                    sx={{ minWidth: 120 }}
                                                />
                                            );
                                        })()}
                                    </Box>
                                </Box>
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>

                <DialogActions sx={{ px: 3, py: 2, flexWrap: 'wrap', gap: 1 }}>
                    <Button
                        onClick={handleCloseDialog}
                        color="inherit"
                        variant="outlined"
                        disabled={actionLoading}
                    >
                        Cerrar
                    </Button>

                    {/* Botones de acción solo si el supervisor puede actuar */}
                    {currentUser?.role === 'supervisor' && selectedLicense && canSupervisorAct(selectedLicense) && (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                onClick={() => handleApprove(true)}
                                color="success"
                                variant="contained"
                                startIcon={actionLoading ? <CircularProgress size={20} /> : <ThumbUp />}
                                disabled={actionLoading}
                            >
                                Aprobar
                            </Button>
                            <Button
                                onClick={() => handleApprove(false)}
                                color="error"
                                variant="contained"
                                startIcon={actionLoading ? <CircularProgress size={20} /> : <ThumbDown />}
                                disabled={actionLoading}
                            >
                                Rechazar
                            </Button>
                        </Box>
                    )}

                    {/* Mensaje si ya fue revisada */}
                    {currentUser?.role === 'supervisor' && selectedLicense && !canSupervisorAct(selectedLicense) && (
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            Esta licencia ya fue revisada y no puede modificarse
                        </Typography>
                    )}
                </DialogActions>
            </Dialog>
        </Paper>
    );
};

// Configurar ACL para dar acceso a supervisores
DepartmentLicenses.acl = {
    action: 'read',
    subject: 'department-permission',
};

export default DepartmentLicenses;