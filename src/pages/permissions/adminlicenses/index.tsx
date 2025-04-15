import React, { useEffect, useState } from 'react';
import axios from 'axios';
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
    Badge
} from '@mui/material';
import { 
    Search, 
    CheckCircle, 
    Cancel, 
    Visibility, 
    Person, 
    FilterAlt,
    Refresh,
    Business
} from '@mui/icons-material';
import { License } from 'src/interfaces/licenseTypes';
import { User } from 'src/interfaces/usertypes';
import useUser from 'src/hooks/useUser';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface AdminLicensesProps {
    licenses: License[];
    userInfo: User | null;
    user: any;
}

interface AclComponent extends React.FC<AdminLicensesProps> {
    acl?: {
        action: string;
        subject: string;
    };
}

const AdminLicenses: AclComponent = () => {
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
            celular: string;
            department: string;
        } 
    }>({});
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterApproval, setFilterApproval] = useState<'all' | 'approved' | 'pending'>('all');
    const [filterType, setFilterType] = useState<'all' | 'supervisor' | 'personal'>('all');

    useEffect(() => {
        fetchAllLicenses();
    }, []);

    const fetchAllLicenses = () => {
        setLoading(true);
        axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/licenses`)
            .then((response) => {
                const licensesData = response.data;
                setLicenses(licensesData);
                
                const userRequests = licensesData.map((license: License) =>
                    axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/${license.userId}`)
                        .then(userResponse => ({
                            userId: license.userId,
                            userName: userResponse.data.fullName,
                            userCi: userResponse.data.ci,
                            celular: userResponse.data.celular || 'N/A',
                            department: userResponse.data.department?.name || 'Sin departamento'
                        }))
                );

                return Promise.all(userRequests);
            })
            .then(userDetailsArray => {
                const userDetailsMap: { [key: string]: { 
                    name: string; 
                    ci: string; 
                    celular: string;
                    department: string;
                } } = {};
                userDetailsArray.forEach(user => {
                    userDetailsMap[user.userId] = { 
                        name: user.userName, 
                        ci: user.userCi,
                        celular: user.celular,
                        department: user.department
                    };
                });
                setUserDetails(userDetailsMap);
                applyFilters(licenses, userDetailsMap, searchTerm, filterApproval, filterType);
            })
            .catch(() => {
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
        approvalFilter: string,
        typeFilter: string
    ) => {
        let filtered = [...licenses];
        
        // Filtrar por término de búsqueda (nombre, CI o departamento)
        if (term) {
            filtered = filtered.filter(license => {
                const userDetail = details[license.userId];
                if (!userDetail) return false;
                return (
                    userDetail.name.toLowerCase().includes(term.toLowerCase()) ||
                    userDetail.ci.toLowerCase().includes(term.toLowerCase()) ||
                    userDetail.department.toLowerCase().includes(term.toLowerCase())
                );
            });
        }
        
        // Filtrar por estado de aprobación
        if (approvalFilter === 'approved') {
            filtered = filtered.filter(license => license.personalDepartmentApproval);
        } else if (approvalFilter === 'pending') {
            filtered = filtered.filter(license => !license.personalDepartmentApproval);
        }
        
        // Filtrar por tipo de aprobación
        if (typeFilter === 'supervisor') {
            filtered = filtered.filter(license => !license.immediateSupervisorApproval);
        } else if (typeFilter === 'personal') {
            filtered = filtered.filter(license => !license.personalDepartmentApproval);
        }
        
        setFilteredLicenses(filtered);
        setPage(0);
    };

    useEffect(() => {
        applyFilters(licenses, userDetails, searchTerm, filterApproval, filterType);
    }, [licenses, userDetails, searchTerm, filterApproval, filterType]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const handleFilterApproval = (type: 'all' | 'approved' | 'pending') => {
        setFilterApproval(type);
    };

    const handleFilterType = (type: 'all' | 'supervisor' | 'personal') => {
        setFilterType(type);
    };

    const handleOpenDialog = (license: License) => {
        setSelectedLicense(license);
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedLicense(null);
    };

    const handlePersonalApprove = () => {
        if (selectedLicense && user) {
            const newApprovalState = !selectedLicense.personalDepartmentApproval;
    
            axios.patch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/licenses/${selectedLicense.id}/personal-approval`,
                {
                    approval: newApprovalState,
                    userId: user.id,
                }
            )
            .then(() => {
                setLicenses(prev =>
                    prev.map(license =>
                        license.id === selectedLicense.id
                            ? { ...license, personalDepartmentApproval: newApprovalState }
                            : license
                    )
                );
                handleCloseDialog();
            })
            .catch(() => {
                setError('Error al cambiar el estado de la licencia');
            });
        }
    };
    

    const formatDate = (dateString: string) => {
        return format(parseISO(dateString), 'PPP', { locale: es });
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
                <Typography variant="h6" color="error">
                    {error}
                </Typography>
                <Button onClick={fetchAllLicenses} sx={{ ml: 2 }} startIcon={<Refresh />}>
                    Reintentar
                </Button>
            </Box>
        );
    }

    return (
        <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" component="h2" sx={{ display: 'flex', alignItems: 'center' }}>
                    <Business sx={{ mr: 1, color: 'primary.main' }} />
                    Gestión General de Permisos
                </Typography>
                
                <Tooltip title="Recargar datos">
                    <IconButton onClick={fetchAllLicenses} color="primary">
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
                        placeholder="Buscar por nombre, CI o departamento..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        InputProps={{
                            startAdornment: <Search sx={{ color: 'action.active', mr: 1 }} />
                        }}
                        size="small"
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        <Chip
                            label="Todas"
                            onClick={() => handleFilterApproval('all')}
                            color={filterApproval === 'all' ? 'primary' : 'default'}
                            variant={filterApproval === 'all' ? 'filled' : 'outlined'}
                        />
                        <Chip
                            label="Aprobadas RRHH"
                            onClick={() => handleFilterApproval('approved')}
                            color={filterApproval === 'approved' ? 'primary' : 'default'}
                            variant={filterApproval === 'approved' ? 'filled' : 'outlined'}
                        />
                        <Chip
                            label="Pendientes RRHH"
                            onClick={() => handleFilterApproval('pending')}
                            color={filterApproval === 'pending' ? 'primary' : 'default'}
                            variant={filterApproval === 'pending' ? 'filled' : 'outlined'}
                        />
                        <Chip
                            label="Pendientes Supervisor"
                            onClick={() => handleFilterType('supervisor')}
                            color={filterType === 'supervisor' ? 'secondary' : 'default'}
                            variant={filterType === 'supervisor' ? 'filled' : 'outlined'}
                        />
                    </Box>
                </Grid>
            </Grid>

            {/* Tabla de licencias */}
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Solicitante</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>CI</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Departamento</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Tipo</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Fechas</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Acciones</TableCell>
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
                                            {userDetails[license.userId]?.department || 'N/A'}
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
                                                    label={license.immediateSupervisorApproval ? 'Aprobado Sup.' : 'Pendiente Sup.'}
                                                    color={license.immediateSupervisorApproval ? 'primary' : 'default'}
                                                    size="small"
                                                    icon={license.immediateSupervisorApproval ? <CheckCircle /> : <Cancel />}
                                                />
                                                <Chip
                                                    label={license.personalDepartmentApproval ? 'Aprobado RRHH' : 'Pendiente RRHH'}
                                                    color={license.personalDepartmentApproval ? 'primary' : 'default'}
                                                    size="small"
                                                    icon={license.personalDepartmentApproval ? <CheckCircle /> : <Cancel />}
                                                />
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                startIcon={<Visibility />}
                                                onClick={() => handleOpenDialog(license)}
                                            >
                                                Gestionar
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                                    <Typography color="textSecondary">
                                        No se encontraron licencias {searchTerm ? 'con ese filtro' : ''}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

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
                    <Business sx={{ fontSize: 24 }} />
                    Gestión de Licencia
                </DialogTitle>
                <DialogContent sx={{ py: 3 }}>
                    {selectedLicense && (
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6} mt={4}>
                                <Typography variant="subtitle1" gutterBottom>
                                    <strong>Información de la Licencia</strong>
                                </Typography>
                                <Typography><strong>ID:</strong> {selectedLicense.id}</Typography>
                                <Typography><strong>Tipo:</strong> {selectedLicense.licenseType}</Typography>
                                <Typography><strong>Inicio:</strong> {formatDate(selectedLicense.startDate)}</Typography>
                                <Typography><strong>Fin:</strong> {formatDate(selectedLicense.endDate)}</Typography>
                                <Typography><strong>Emisión:</strong> {formatDate(selectedLicense.issuedDate)}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} mt={4}>
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
                                <Typography>
                                    <strong>Departamento:</strong> {userDetails[selectedLicense.userId]?.department || 'N/A'}
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
                                            <strong>Aprobación Supervisor</strong>
                                        </Typography>
                                        <Chip
                                            label={selectedLicense.immediateSupervisorApproval ? 'Aprobado' : 'Pendiente'}
                                            color={selectedLicense.immediateSupervisorApproval ? 'primary' : 'default'}
                                            icon={selectedLicense.immediateSupervisorApproval ? <CheckCircle /> : <Cancel />}
                                        />
                                    </Box>
                                    <Box textAlign="center">
                                        <Typography variant="body2">
                                            <strong>Aprobación RRHH</strong>
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
                    <Button
                        onClick={handlePersonalApprove}
                        color={selectedLicense?.personalDepartmentApproval ? "error" : "success"}
                        variant="contained"
                        startIcon={selectedLicense?.personalDepartmentApproval ? <Cancel /> : <CheckCircle />}
                    >
                        {selectedLicense?.personalDepartmentApproval ? "Desaprobar RRHH" : "Aprobar RRHH"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
};

// Configurar ACL para dar acceso a administradores
AdminLicenses.acl = {
    action: 'manage',
    subject: 'all-licenses',
};

export default AdminLicenses;