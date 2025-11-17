import React, { useEffect, useState } from 'react';
import axios from 'src/lib/axios';
import {
    Box,
    Button,
    CircularProgress,
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
    Chip,
    IconButton,
    Stack,
    Tooltip,
    MenuItem,
    Grid
} from '@mui/material';
import {
    Description as DescriptionIcon,
    Search,
    Refresh as RefreshIcon,
    Business,
    Edit as EditIcon,
    Visibility as VisibilityIcon,
    Delete as DeleteIcon,
    RestoreFromTrash as RestoreIcon
} from '@mui/icons-material';
import { License } from 'src/interfaces/licenseTypes';
import { User } from 'src/interfaces/usertypes';
import useUser from 'src/hooks/useUser';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import LicenseDetailDialog from '../detail-dialog';
import EditLicenseDialog from '../editLicenses';
import GeneralReportDialog from 'src/pages/users/generalReports';
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
    const [editLicense, setEditLicense] = useState<License | null>(null);
    const [userDetails, setUserDetails] = useState<{ [key: string]: any }>({});
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterApproval, setFilterApproval] = useState<'all' | 'approved' | 'rejected' | 'pending'>('all');
    const [viewDeleted, setViewDeleted] = useState(false);
    const [openReportDialog, setOpenReportDialog] = useState(false);
    const [licenseDialogOpen, setLicenseDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);

    useEffect(() => {
        fetchAllLicenses();
    }, []);

    const fetchAllLicenses = () => {
        setLoading(true);
        axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/licenses`)
            .then((response) => {
                const licensesData: License[] = response.data.map((lic: any) => ({
                    ...lic,
                    totalDays: lic.totalDays ?? 0,
                    startHalfDay: lic.startHalfDay ?? 'Completo',
                    endHalfDay: lic.endHalfDay ?? 'Completo',
                    timeRequested: lic.timeRequested ?? '-',
                    detectedHolidays: lic.detectedHolidays ?? [],
                }));
                const sortedLicenses = licensesData.sort((a: License, b: License) => b.id - a.id);
                setLicenses(sortedLicenses);

                const userRequests = sortedLicenses.map((license: License) =>
                    axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/${license.userId}`)
                        .then(userResponse => ({
                            userId: license.userId,
                            name: userResponse.data.fullName,
                            ci: userResponse.data.ci,
                            celular: userResponse.data.celular || 'N/A',
                            department: userResponse.data.department?.name || 'Sin departamento',
                            academicUnit: userResponse.data.academicUnit?.name || 'Sin Unidad académica'
                        }))
                );

                return Promise.all(userRequests);
            })
            .then(userDetailsArray => {
                const userDetailsMap: { [key: string]: any } = {};
                userDetailsArray.forEach(u => { userDetailsMap[u.userId] = u; });
                setUserDetails(userDetailsMap);
                applyFilters(licenses, userDetailsMap, searchTerm, filterApproval);
            })
            .catch(() => setError('Error al obtener las licencias'))
            .finally(() => setLoading(false));
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
                            name: userResponse.data.fullName,
                            ci: userResponse.data.ci,
                            celular: userResponse.data.celular || 'N/A',
                            department: userResponse.data.department?.name || 'Sin departamento',
                            academicUnit: userResponse.data.academicUnit?.name || 'Sin Unidad académica'
                        }))
                );
                
return Promise.all(userRequests);
            })
            .then(userDetailsArray => {
                const userDetailsMap: { [key: string]: any } = {};
                userDetailsArray.forEach(u => { userDetailsMap[u.userId] = u; });
                setUserDetails(userDetailsMap);
                applyFilters(licenses, userDetailsMap, searchTerm, filterApproval);
            })
            .catch(() => setError('Error al obtener licencias eliminadas'))
            .finally(() => setLoading(false));
    };

    const applyFilters = (
        licenses: License[],
        details: any,
        term: string,
        approvalFilter: string
    ) => {
        let filtered = [...licenses];

        if (term) {
            filtered = filtered.filter(license => {
                const userDetail = details[license.userId];
                if (!userDetail) return false;
                
return (
                    userDetail.name.toLowerCase().includes(term.toLowerCase()) ||
                    userDetail.ci.toLowerCase().includes(term.toLowerCase()) ||
                    userDetail.department.toLowerCase().includes(term.toLowerCase()) ||
                    userDetail.academicUnit.toLowerCase().includes(term.toLowerCase())
                );
            });
        }

        if (approvalFilter === 'approved') {
            filtered = filtered.filter(license => license.personalDepartmentApproval === true);
        } else if (approvalFilter === 'rejected') {
            filtered = filtered.filter(license => license.personalDepartmentApproval === false);
        } else if (approvalFilter === 'pending') {
            filtered = filtered.filter(license => license.personalDepartmentApproval === null);
        }


        setFilteredLicenses(filtered);
        setPage(0);
    };

    useEffect(() => {
        applyFilters(licenses, userDetails, searchTerm, filterApproval);
    }, [licenses, userDetails, searchTerm, filterApproval]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value);
    const handleViewLicense = (license: License) => { setSelectedLicense(license); setLicenseDialogOpen(true); };
    const handleEditLicense = (license: License) => { setEditLicense(license); setEditDialogOpen(true); };

    const handleLicenseUpdate = (updatedLicense: License) => {
        if (updatedLicense.deleted) {
            setLicenses(prev => prev.filter(lic => lic.id !== updatedLicense.id));
        } else {
            setLicenses(prev => prev.map(lic => (lic.id === updatedLicense.id ? updatedLicense : lic)));
        }
    };

    const formatDate = (dateString: string) => format(parseISO(dateString), 'PPP', { locale: es });

    if (loading) return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
            <CircularProgress />
        </Box>
    );

    if (error) return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
            <Typography variant="h6" color="error">{error}</Typography>
            <Button onClick={fetchAllLicenses} sx={{ ml: 2 }} startIcon={<RefreshIcon />}>Reintentar</Button>
        </Box>
    );

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
                <Stack direction="row" spacing={1} alignItems="center">
                    <Tooltip title={viewDeleted ? "Ver activas" : "Ver eliminadas"}>
                        <IconButton
                            color={viewDeleted ? "error" : "default"}
                            onClick={() => {
                                setViewDeleted(!viewDeleted);
                                if (!viewDeleted) fetchDeletedLicenses();
                                else fetchAllLicenses();
                            }}
                        >
                            {viewDeleted ? <RestoreIcon /> : <DeleteIcon />}
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Recargar datos">
                        <IconButton onClick={fetchAllLicenses} color="primary">
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>
                    <Button variant="contained" color="primary" startIcon={<DescriptionIcon />} onClick={() => setOpenReportDialog(true)}>
                        Reporte Permisos
                    </Button>
                </Stack>
            </Box>

            <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="Buscar por nombre, CI, departamento o unidad académica..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        InputProps={{ startAdornment: <Search sx={{ color: 'action.active', mr: 1 }} /> }}
                        size="small"
                    />
                </Grid>
                <Grid item xs={12} md={3}>
                    <TextField
                        select
                        fullWidth
                        label="Estado"
                        value={filterApproval}
                        onChange={(e) => setFilterApproval(e.target.value as 'all' | 'approved' | 'rejected' | 'pending')}
                        size="small"
                    >
                        <MenuItem value="all">Todos</MenuItem>
                        <MenuItem value="approved">Aprobadas</MenuItem>
                        <MenuItem value="pending">Pendientes</MenuItem>
                        <MenuItem value="rejected">Rechazadas</MenuItem>
                    </TextField>
                </Grid>
            </Grid>

            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Solicitante</TableCell>
                            <TableCell>CI</TableCell>
                            <TableCell>Departamento</TableCell>
                            <TableCell>Unidad Académica</TableCell>
                            <TableCell>Fechas</TableCell>
                            <TableCell>Estado</TableCell>
                            <TableCell>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredLicenses.length > 0 ? (
                            filteredLicenses.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((license) => (
                                <TableRow key={license.id} hover>
                                    <TableCell>{license.id}</TableCell>
                                    <TableCell>
                                        {userDetails[license.userId]?.ci ? (
                                            <Link href={`/users/${userDetails[license.userId].ci}`} passHref>
                                                <Box component="a" color="primary.main" sx={{ cursor: 'pointer', textDecoration: 'none', fontWeight: 'bold' }}>
                                                    {userDetails[license.userId].name}
                                                </Box>
                                            </Link>
                                        ) : 'N/A'}
                                    </TableCell>
                                    <TableCell>{userDetails[license.userId]?.ci || 'N/A'}</TableCell>
                                    <TableCell>{userDetails[license.userId]?.department || 'N/A'}</TableCell>
                                    <TableCell>{userDetails[license.userId]?.academicUnit || 'N/A'}</TableCell>
                                    <TableCell>
                                        <Typography variant="body2"><strong>Inicio:</strong> {formatDate(license.startDate)}</Typography>
                                        <Typography variant="body2"><strong>Fin:</strong> {formatDate(license.endDate)}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Stack direction="column" spacing={1}>
                                            <Chip
                                                label={
                                                    license.immediateSupervisorApproval === true ? 'Aprobado Jefe' :
                                                        license.immediateSupervisorApproval === false ? 'Rechazado Jefe' :
                                                            'Pendiente Jefe'
                                                }
                                                color={
                                                    license.immediateSupervisorApproval === true ? 'primary' :
                                                        license.immediateSupervisorApproval === false ? 'error' :
                                                            'default'
                                                }
                                                size="small"
                                            />
                                            <Chip
                                                label={
                                                    license.personalDepartmentApproval === true ? 'Aprobado Personal' :
                                                        license.personalDepartmentApproval === false ? 'Rechazado Personal' :
                                                            'Pendiente Personal'
                                                }
                                                color={
                                                    license.personalDepartmentApproval === true ? 'primary' :
                                                        license.personalDepartmentApproval === false ? 'error' :
                                                            'default'
                                                }
                                                size="small"
                                            />
                                        </Stack>

                                    </TableCell>
                                    <TableCell>
                                        <Tooltip title="Editar">
                                            <IconButton size="small" onClick={() => handleEditLicense(license)}>
                                                <EditIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Ver detalles">
                                            <IconButton size="small" onClick={() => handleViewLicense(license)}>
                                                <VisibilityIcon />
                                            </IconButton>
                                        </Tooltip>
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

            <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredLicenses.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                labelRowsPerPage="Licencias por página:"
            />

            {/* Dialog de detalles */}
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

            {/* Dialog de edición */}
            {editLicense && (
                <EditLicenseDialog
                    open={editDialogOpen}
                    onClose={() => setEditDialogOpen(false)}
                    license={editLicense!}
                    refreshList={fetchAllLicenses}
                />
            )}

            {/* Dialog de reporte */}
            {openReportDialog && (
                <GeneralReportDialog
                    open={openReportDialog}
                    onClose={() => setOpenReportDialog(false)}
                />
            )}
        </Paper>
    );
};

AdminLicenses.acl = {
    action: 'manage',
    subject: 'all-licenses',
};

export default AdminLicenses;
