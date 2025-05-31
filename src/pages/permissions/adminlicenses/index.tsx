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
    Business,
    Add
} from '@mui/icons-material';
import { License } from 'src/interfaces/licenseTypes';
import { User } from 'src/interfaces/usertypes';
import useUser from 'src/hooks/useUser';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import ReportDownloadModal from 'src/pages/reports/reportDownloadModal';
import LicenseDetailDialog from '../detail-dialog';
import Link from 'next/link';

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
    const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
    const [userDetails, setUserDetails] = useState<{
        [key: string]: {
            name: string;
            ci: string;
            celular: string;
            department: string;
            academicUnit: string
        }
    }>({});
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterApproval, setFilterApproval] = useState<'all' | 'approved' | 'pending'>('all');
    const [filterType, setFilterType] = useState<'all' | 'supervisor' | 'personal'>('all');
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [licenseDialogOpen, setLicenseDialogOpen] = useState(false);
    const [viewDeleted, setViewDeleted] = useState(false);

    useEffect(() => {
        fetchAllLicenses();
    }, []);

    const fetchAllLicenses = () => {
        setLoading(true);
        axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/licenses`)
            .then((response) => {
                const licensesData = response.data;
                const sortedLicenses = licensesData.sort((a: License, b: License) => b.id - a.id);
                setLicenses(sortedLicenses);
                const userRequests = sortedLicenses.map((license: License) =>
                    axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/${license.userId}`)
                        .then(userResponse => ({
                            userId: license.userId,
                            userName: userResponse.data.fullName,
                            userCi: userResponse.data.ci,
                            celular: userResponse.data.celular || 'N/A',
                            department: userResponse.data.department?.name || 'Sin departamento',
                            academicUnit: userResponse.data.academicUnit?.name || 'Sin Unidad academica'
                        }))
                );

                return Promise.all(userRequests)
            })
            .then(userDetailsArray => {
                const userDetailsMap: {
                    [key: string]: {
                        name: string;
                        ci: string;
                        celular: string;
                        department: string;
                        academicUnit: string;
                    };
                } = {};
                userDetailsArray.forEach(user => {
                    userDetailsMap[user.userId] = {
                        name: user.userName,
                        ci: user.userCi,
                        celular: user.celular,
                        department: user.department,
                        academicUnit: user.academicUnit
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
    const fetchDeletedLicenses = () => {
        setLoading(true);
        axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/licenses/deleted`)
            .then((response) => {
                const deletedLicenses = response.data.sort((a: License, b: License) => b.id - a.id);
                setLicenses(deletedLicenses);
                const userRequests = deletedLicenses.map((license: License) =>
                    axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/${license.userId}`)
                        .then(userResponse => ({
                            userId: license.userId,
                            userName: userResponse.data.fullName,
                            userCi: userResponse.data.ci,
                            celular: userResponse.data.celular || 'N/A',
                            department: userResponse.data.department?.name || 'Sin departamento',
                            academicUnit: userResponse.data.academicUnit?.name || 'Sin Unidad academica'
                        }))
                );
                return Promise.all(userRequests);
            })
            .then(userDetailsArray => {
                const userDetailsMap: {
                    [key: string]: {
                        name: string;
                        ci: string;
                        celular: string;
                        department: string;
                        academicUnit: string;
                    };
                } = {};
                userDetailsArray.forEach(user => {
                    userDetailsMap[user.userId] = {
                        name: user.userName,
                        ci: user.userCi,
                        celular: user.celular,
                        department: user.department,
                        academicUnit: user.academicUnit
                    };
                });
                setUserDetails(userDetailsMap);
                applyFilters(licenses, userDetailsMap, searchTerm, filterApproval, filterType);
            })
            .catch(() => {
                setError('Error al obtener licencias eliminadas');
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

        if (approvalFilter === 'approved') {
            filtered = filtered.filter(license => license.personalDepartmentApproval);
        } else if (approvalFilter === 'pending') {
            filtered = filtered.filter(license => !license.personalDepartmentApproval);
        }

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
        setFilterApproval(prev => (prev === type ? 'all' : type));
    };

    const handleFilterType = (type: 'all' | 'supervisor' | 'personal') => {
        setFilterType(prev => (prev === type ? 'all' : type));
    };


    const handleViewLicense = (license: License) => {
        setSelectedLicense(license);
        setLicenseDialogOpen(true);
    };

    const handleLicenseUpdate = (updatedLicense: License) => {
        if (updatedLicense.deleted) {
            setLicenses(prev => prev.filter(lic => lic.id !== updatedLicense.id));
        } else {
            setLicenses(prev =>
                prev.map(lic => (lic.id === updatedLicense.id ? updatedLicense : lic))
            );
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
                    {viewDeleted && (
                        <Typography variant="subtitle2" color="error" sx={{ ml: 2 }}>
                            (Visualizando solicitudes eliminadas)
                        </Typography>
                    )}
                </Typography>


                <Tooltip title="Recargar datos">
                    <IconButton onClick={fetchAllLicenses} color="primary">
                        <Refresh />
                    </IconButton>
                </Tooltip>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setReportModalOpen(true)}
                    sx={{ ml: 2 }}
                >
                    Generar Reporte
                </Button>
                <Button
                    variant="contained"
                    color={viewDeleted ? 'success' : 'warning'}
                    onClick={() => {
                        if (viewDeleted) {
                            fetchAllLicenses();
                        } else {
                            fetchDeletedLicenses();
                        }
                        setViewDeleted(!viewDeleted);
                    }}
                    sx={{ ml: 2 }}
                >
                    {viewDeleted ? 'Ver Licencias Activas' : 'Ver Licencias Eliminadas'}
                </Button>

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
                            label="Aprobadas Dpto. Personal"
                            onClick={() => handleFilterApproval('approved')}
                            color={filterApproval === 'approved' ? 'primary' : 'default'}
                            variant={filterApproval === 'approved' ? 'filled' : 'outlined'}
                        />
                        <Chip
                            label="Pendientes Dpto. Personal. "
                            onClick={() => handleFilterApproval('pending')}
                            color={filterApproval === 'pending' ? 'primary' : 'default'}
                            variant={filterApproval === 'pending' ? 'filled' : 'outlined'}
                        />
                        <Chip
                            label="Pendientes Jefe Superior"
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
                            <TableCell sx={{ fontWeight: 'bold' }}>Unidad Academica</TableCell>
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
                                            {userDetails[license.userId]?.ci ? (
                                                <Link href={`/users/${userDetails[license.userId].ci}`} passHref>
                                                    <Box
                                                        component="a" // Esto hace que se comporte como un enlace
                                                        color="primary.main" // Usamos `primary.main` porque `Box` no tiene la prop `color` directa como `Typography`
                                                        sx={{
                                                            cursor: 'pointer',
                                                            textDecoration: 'none',
                                                            fontWeight: 'bold',
                                                            display: 'inline-block', // Para mantener el comportamiento en línea como un texto
                                                            '&:hover': {
                                                                textDecoration: 'none', // Aseguramos que no haya subrayado al pasar el mouse
                                                            },
                                                        }}
                                                    >
                                                        {userDetails[license.userId].name}
                                                    </Box>
                                                </Link>
                                            ) : 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                            {userDetails[license.userId]?.ci || 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                            {userDetails[license.userId]?.department || 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                            {userDetails[license.userId]?.academicUnit || 'N/A'}
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
                                                    label={license.immediateSupervisorApproval ? 'Aprobado Jefe' : 'Pendiente Jefe'}
                                                    color={license.immediateSupervisorApproval ? 'primary' : 'default'}
                                                    size="small"
                                                    icon={license.immediateSupervisorApproval ? <CheckCircle /> : <Cancel />}
                                                />
                                                <Chip
                                                    label={license.personalDepartmentApproval ? 'Aprobado Personal' : 'Pendiente Personal'}
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
                                                onClick={() => handleViewLicense(license)}
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

            {/* Diálogo de detalles de licencia */}
            {selectedLicense && (
                <LicenseDetailDialog
                    open={licenseDialogOpen}
                    onClose={() => setLicenseDialogOpen(false)}
                    license={selectedLicense}
                    userDetails={userDetails}
                    currentUser={user}
                    onLicenseUpdate={handleLicenseUpdate}
                />
            )}

            <ReportDownloadModal
                open={reportModalOpen}
                onClose={() => setReportModalOpen(false)}
            />
        </Paper>
    );
};

AdminLicenses.acl = {
    action: 'manage',
    subject: 'all-licenses',
};

export default AdminLicenses;