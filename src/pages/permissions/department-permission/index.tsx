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
    Avatar,
    Chip,
    IconButton,
    Tooltip,
    Badge,
    Alert
} from '@mui/material';
import {
    Search,
    CheckCircle,
    Cancel,
    Visibility,
    Person,
    FilterAlt,
    Refresh,
    Inbox
} from '@mui/icons-material';
import { License } from 'src/interfaces/licenseTypes';
import { User } from 'src/interfaces/usertypes';
import useUser from 'src/hooks/useUser';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatDate } from 'src/utils/dateUtils';

interface DepartmentLicensesProps {
    licenses: License[];
    userInfo: User | null;
    user: any;
}

interface AclComponent extends React.FC<DepartmentLicensesProps> {
    acl?: {
        action: string;
        subject: string;
    };
}

const DepartmentLicenses: AclComponent = () => {
    const user = useUser();
    const [licenses, setLicenses] = useState<License[]>([]);
    const [filteredLicenses, setFilteredLicenses] = useState<License[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
    const [userDetails, setUserDetails] = useState<{
        [key: string]: {
            name: string;
            ci: string;
            celular: string
        }
    }>({});
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterApproval, setFilterApproval] = useState<'all' | 'approved' | 'pending'>('all');

    useEffect(() => {
        if (user) {
            fetchLicenses();
        }
    }, [user]);

    const fetchLicenses = () => {
        setLoading(true);
        axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/licenses/department/${user?.id}`)
            .then((response) => {
                const licensesData = response.data;
                setLicenses(licensesData);

                const userRequests = licensesData.map((license: License) =>
                    axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/${license.userId}`)
                        .then(userResponse => ({
                            userId: license.userId,
                            userName: userResponse.data.fullName,
                            userCi: userResponse.data.ci,
                            celular: userResponse.data.celular || 'N/A'
                        }))
                );

                return Promise.all(userRequests);
            })
            .then(userDetailsArray => {
                const userDetailsMap: { [key: string]: { name: string; ci: string; celular: string } } = {};
                userDetailsArray.forEach(user => {
                    userDetailsMap[user.userId] = {
                        name: user.userName,
                        ci: user.userCi,
                        celular: user.celular
                    };
                });
                setUserDetails(userDetailsMap);
                applyFilters(licenses, userDetailsMap, searchTerm, filterApproval);
            })
            .catch(() => {
                setError('Error al obtener las licencias');
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const applyFilters = (licenses: License[], details: any, term: string, approvalFilter: string) => {
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

        // Filtrar por estado de aprobación
        if (approvalFilter === 'approved') {
            filtered = filtered.filter(license => license.immediateSupervisorApproval);
        } else if (approvalFilter === 'pending') {
            filtered = filtered.filter(license => !license.immediateSupervisorApproval);
        }

        setFilteredLicenses(filtered);
        setPage(0); // Resetear a la primera página al aplicar filtros
    };

    useEffect(() => {
        applyFilters(licenses, userDetails, searchTerm, filterApproval);
    }, [licenses, userDetails, searchTerm, filterApproval]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const handleFilterApproval = (type: 'all' | 'approved' | 'pending') => {
        setFilterApproval(type);
    };

    const handleOpenDialog = (license: License) => {
        setSelectedLicense(license);
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedLicense(null);
    };

    const handleApprove = () => {
        if (selectedLicense && user?.id) {
            const approval = !selectedLicense.immediateSupervisorApproval;

            axios.patch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/licenses/${selectedLicense.id}/approve?supervisorId=${user?.id}`,
                { approval } // <-- se envía como booleano
            )
                .then(() => {
                    setLicenses(prev =>
                        prev.map(license =>
                            license.id === selectedLicense.id
                                ? { ...license, immediateSupervisorApproval: approval }
                                : license
                        )
                    );

                    handleCloseDialog();
                })
                .catch((error) => {
                    setError('Error al cambiar el estado de la licencia');
                    console.error('Error al aprobar/desaprobar licencia:', error);
                });
        }
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
                <Grid item xs={12} md={6}>
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
                <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip
                            label="Todas"
                            onClick={() => handleFilterApproval('all')}
                            color={filterApproval === 'all' ? 'primary' : 'default'}
                            variant={filterApproval === 'all' ? 'filled' : 'outlined'}
                        />
                        <Chip
                            label="Aprobadas"
                            onClick={() => handleFilterApproval('approved')}
                            color={filterApproval === 'approved' ? 'primary' : 'default'}
                            variant={filterApproval === 'approved' ? 'filled' : 'outlined'}
                        />
                        <Chip
                            label="Pendientes"
                            onClick={() => handleFilterApproval('pending')}
                            color={filterApproval === 'pending' ? 'primary' : 'default'}
                            variant={filterApproval === 'pending' ? 'filled' : 'outlined'}
                        />
                    </Box>
                </Grid>
            </Grid>

            {/* Tabla de licencias */}
            {/* Tabla o mensaje si no hay licencias */}
            {licenses.length === 0 && !loading ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                    <Inbox sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="h6" color="textSecondary">
                        No hay licencias registradas para este departamento o unidad academica.
                    </Typography>
                </Box>
            ) : (
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Solicitante</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>CI</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Tipo</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Fechas</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                                {user?.role === 'supervisor' && <TableCell sx={{ fontWeight: 'bold' }}>Acciones</TableCell>}
                            </TableRow>


                        </TableHead>
                        <TableBody>
                            {filteredLicenses.length > 0 ? (
                                filteredLicenses
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map((license) => (
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
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                    <Chip
                                                        label={license.immediateSupervisorApproval ? 'Aprobado' : 'Pendiente'}
                                                        color={license.immediateSupervisorApproval ? 'primary' : 'default'}
                                                        size="small"
                                                        icon={license.immediateSupervisorApproval ? <CheckCircle /> : <Cancel />}
                                                    />
                                                    <Chip
                                                        label={license.personalDepartmentApproval ? 'Aprobado Dpto. Personal' : 'Pendiente Dpto. Personal'}
                                                        color={license.personalDepartmentApproval ? 'primary' : 'default'}
                                                        size="small"
                                                        icon={license.personalDepartmentApproval ? <CheckCircle /> : <Cancel />}
                                                    />
                                                </Box>
                                            </TableCell>
                                            {user?.role === 'supervisor' && (
                                                <TableCell>
                                                    <Button
                                                        variant="outlined"
                                                        size="small"
                                                        startIcon={<Visibility />}
                                                        onClick={() => handleOpenDialog(license)}
                                                    >
                                                        Ver
                                                    </Button>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={user?.role === 'supervisor' ? 7 : 6} align="center" sx={{ py: 4 }}>
                                        <Typography color="textSecondary">
                                            No se encontraron licencias {searchTerm ? 'con ese filtro' : ''}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    {error && (
                        <Alert severity="error" sx={{ my: 3 }}>
                            {error}
                        </Alert>
                    )}

                </TableContainer>
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
                    gap: 1
                }}>
                    <Person sx={{ fontSize: 24 }} />
                    Detalles de la Licencia
                </DialogTitle>
                <DialogContent sx={{ py: 3 }}>
                    {selectedLicense && (
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle1" gutterBottom>
                                    <strong>Información de la Licencia</strong>
                                </Typography>
                                <Typography><strong>ID:</strong> {selectedLicense.id}</Typography>
                                <Typography><strong>Tipo:</strong> {selectedLicense.licenseType}</Typography>
                                <Typography><strong>Inicio:</strong> {formatDate(selectedLicense.startDate)}</Typography>
                                <Typography><strong>Fin:</strong> {formatDate(selectedLicense.endDate)}</Typography>
                                <Typography><strong>Emisión:</strong> {formatDate(selectedLicense.issuedDate)}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle1" gutterBottom>
                                    <strong>Información del Solicitante</strong>
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
                                    backgroundColor: 'default',
                                    borderRadius: 1
                                }}>
                                    <Box textAlign="center">
                                        <Typography variant="body2">
                                            <strong>Aprobación Jefe Superior</strong>
                                        </Typography>
                                        <Chip
                                            label={selectedLicense.immediateSupervisorApproval ? 'Aprobado' : 'Pendiente'}
                                            color={selectedLicense.immediateSupervisorApproval ? 'primary' : 'default'}
                                            icon={selectedLicense.immediateSupervisorApproval ? <CheckCircle /> : <Cancel />}
                                        />
                                    </Box>
                                    <Box textAlign="center">
                                        <Typography variant="body2">
                                            <strong>Aprobación Dpto. Personal</strong>
                                        </Typography>
                                        <Chip
                                            label={selectedLicense.personalDepartmentApproval ? 'Aprobado' : 'Pendiente'}
                                            color={selectedLicense.personalDepartmentApproval ? 'primary' : 'default'}
                                            icon={selectedLicense.personalDepartmentApproval ? <CheckCircle /> : <Cancel />}
                                        />
                                    </Box>
                                </Box>
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button
                        onClick={handleCloseDialog}
                        color="inherit"
                        variant="outlined"
                    >
                        Cerrar
                    </Button>
                    {user?.role === 'supervisor' && (
                        <Tooltip title="La aprobación del Jefe Superior está deshabilitada por el momento">
                            <span> {/* Necesario para que Tooltip funcione con botones deshabilitados */}
                                <Button
                                    onClick={handleApprove}
                                    color={selectedLicense?.immediateSupervisorApproval ? "error" : "success"}
                                    variant="contained"
                                    startIcon={selectedLicense?.immediateSupervisorApproval ? <Cancel /> : <CheckCircle />}
                                    disabled // <- desactivado por ahora
                                >
                                    {selectedLicense?.immediateSupervisorApproval ? "Desaprobar" : "Aprobar"}
                                </Button>
                            </span>
                        </Tooltip>
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