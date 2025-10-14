import React, { FC, useEffect, useState } from 'react';
import axios from 'src/lib/axios';
import {
    Box, Typography, CircularProgress, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, TablePagination, Button, Dialog,
    DialogTitle, DialogContent, DialogActions, IconButton, TableSortLabel,
    TextField, MenuItem, Chip, Toolbar, InputAdornment,
    Alert
} from '@mui/material';
import { DatePicker } from '@mui/lab';
import { green, red, orange, blue } from '@mui/material/colors';
import useUser from 'src/hooks/useUser';
import {
    Close as CloseIcon,
    Search as SearchIcon,
    Refresh as RefreshIcon,
    Check as CheckIcon,
    Clear as ClearIcon,
    Info as InfoIcon,
    CalendarMonth as CalendarIcon,
    Work as WorkIcon,
    Event as EventIcon,
    EventAvailable as EventAvailableIcon,
    EventNote as EventNoteIcon,
    HowToReg as ApprovedIcon,
    PendingActions as PendingIcon
} from '@mui/icons-material';
import { License } from 'src/interfaces/licenseTypes';
import PictureAsPdfIcon from '@mui/icons-material';
import { generateLicensePdf } from 'src/utils/licensePdfGenerator';
import { formatDate } from 'src/utils/dateUtils';
interface AclComponent extends FC {
    acl?: {
        action: string;
        subject: string;
    };
}

const UserLicenses: AclComponent = () => {
    const user = useUser();
    const [licenses, setLicenses] = useState<License[]>([]);
    const [filteredLicenses, setFilteredLicenses] = useState<License[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [orderBy, setOrderBy] = useState<'asc' | 'desc'>('desc');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [yearFilter, setYearFilter] = useState<string>('');
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [alertSeverity, setAlertSeverity] = useState<'success' | 'error'>('success');

    const fetchLicenses = async () => {
        if (!user) return;

        setLoading(true); // Activar loading si deseas mostrar spinner

        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/licenses/user/${user.id}`);
            const sortedLicenses = response.data.sort((a: License, b: License) =>
                new Date(b.issuedDate).getTime() - new Date(a.issuedDate).getTime()
            );
            setLicenses(sortedLicenses);
            setFilteredLicenses(sortedLicenses);
            setError('');
        } catch (error: any) {
            console.error('Error al obtener licencias:', error);

            const apiMessage = error?.response?.data?.message;

            if (typeof apiMessage === 'string') {
                setError(apiMessage);
            } else {
                setError('Error al obtener las licencias');
            }
        }
        finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLicenses();
    }, [user]);

    useEffect(() => {
        let result = licenses;

        // Filtro por texto
        if (searchTerm) {
            result = result.filter(
                (license) =>
                    license.licenseType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    license.id.toString().includes(searchTerm)
            )
        }

        // Filtro por estado
        if (statusFilter !== 'all') {
            if (statusFilter === 'approved') {
                result = result.filter(license => license.personalDepartmentApproval && license.immediateSupervisorApproval);
            } else if (statusFilter === 'pending') {
                result = result.filter(license => !license.personalDepartmentApproval || !license.immediateSupervisorApproval);
            }
        }


        // Filtro por fechas - Corrección clave
        // Filtro por año simplificado
        if (yearFilter.trim()) {
            result = result.filter((license) => {
                return (
                    license.startDate.includes(yearFilter) ||
                    license.endDate.includes(yearFilter) ||
                    license.issuedDate.includes(yearFilter)
                );
            });
        }


        setFilteredLicenses(result);
        setPage(0); // Resetear a la primera página al aplicar filtros
    }, [searchTerm, statusFilter, licenses, yearFilter]);

    const handleSortByIssuedDate = () => {
        const newOrder = orderBy === 'asc' ? 'desc' : 'asc';
        setOrderBy(newOrder);
        const sortedLicenses = [...filteredLicenses].sort((a, b) => {
            return newOrder === 'asc'
                ? new Date(a.issuedDate).getTime() - new Date(b.issuedDate).getTime()
                : new Date(b.issuedDate).getTime() - new Date(a.issuedDate).getTime();
        });
        setFilteredLicenses(sortedLicenses);
    };

    const handleOpenDetails = (license: License) => {
        setSelectedLicense(license);
    };

    const handleCloseDetails = () => {
        setSelectedLicense(null);
    };
    const handleDeleteLicense = async () => {
        if (!selectedLicense) return;

        try {
            await axios.delete(`${process.env.NEXT_PUBLIC_API_BASE_URL}/licenses/${selectedLicense.id}`);
            setAlertMessage('Licencia eliminada correctamente');
            setAlertSeverity('success');
            // Recargar lista
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/licenses/user/${user?.id}`);
            const sortedLicenses = response.data.sort((a: License, b: License) =>
                new Date(b.issuedDate).getTime() - new Date(a.issuedDate).getTime()
            );
            setLicenses(sortedLicenses);
            setFilteredLicenses(sortedLicenses);
            setSelectedLicense(null); // Cierra el diálogo
        } catch (error) {
            setAlertMessage('Error al eliminar la licencia');
            setAlertSeverity('error');
        }
    };

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(+event.target.value);
        setPage(0);
    };

    const handleRefresh = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setYearFilter('');
    };
    const getApprovalStatus = (license: License) => {
        if (license.personalDepartmentApproval && license.immediateSupervisorApproval) {
            return { label: 'Aprobado', color: green[500] };
        } else if (!license.personalDepartmentApproval && !license.immediateSupervisorApproval) {
            return { label: 'Pendiente', color: orange[500] };
        } else {
            return { label: 'Parcial', color: blue[500] };
        }
    };

    if (loading && licenses.length === 0) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
            </Box>
        );
    }


    return (
        <Box sx={{ width: '100%' }}>
            <Paper sx={{ width: '100%', mb: 2, p: 2 }}>
                <Toolbar
                    sx={{
                        pl: { sm: 2 },
                        pr: { xs: 1, sm: 1 },
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { xs: 'flex-start', sm: 'center' },
                        justifyContent: 'space-between',
                        gap: 2
                    }}
                >
                    <Typography variant="h5" component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WorkIcon color="primary" />
                        Licencias del Usuario
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2, width: { xs: '100%', sm: 'auto' }, flexWrap: 'wrap' }}>
                        <TextField
                            label="Filtrar por año"
                            placeholder="Ej: 2022 o 07/2022"
                            value={yearFilter}
                            onChange={(e) => setYearFilter(e.target.value)}
                            size="small"
                            sx={{ width: 180 }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <CalendarIcon />
                                    </InputAdornment>
                                ),
                            }}
                        />

                        {/*  <TextField
                            size="small"
                            variant="outlined"
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ flexGrow: { xs: 1, sm: 0 } }}
                        />*/}

                        <TextField
                            select
                            size="small"
                            variant="outlined"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            sx={{ minWidth: 120 }}
                            SelectProps={{
                                native: true,
                                inputProps: { 'aria-label': 'Filtrar por estado' },
                            }}
                            label="Estado"
                            fullWidth={false}
                        >
                            <option value="all">Todos</option>
                            <option value="approved">Aprobadas</option>
                            <option value="pending">Pendientes</option>
                        </TextField>

                        <IconButton onClick={handleRefresh}>
                            <RefreshIcon />
                        </IconButton>
                    </Box>
                </Toolbar>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Tipo</TableCell>
                                <TableCell>Fecha Inicio</TableCell>
                                <TableCell>Fecha Fin</TableCell>
                                <TableCell>
                                    <TableSortLabel
                                        active
                                        direction={orderBy}
                                        onClick={handleSortByIssuedDate}
                                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                                    >
                                        <CalendarIcon fontSize="small" />
                                        Fecha Emisión
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell>Estado</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {filteredLicenses.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((license) => {
                                const status = getApprovalStatus(license);
                                return (
                                    <TableRow key={license.id} hover>
                                        <TableCell>{license.id}</TableCell>
                                        <TableCell>{license.licenseType}</TableCell>
                                        <TableCell>{formatDate(license.startDate)}</TableCell>
                                        <TableCell>{formatDate(license.endDate)}</TableCell>
                                        <TableCell>{formatDate(license.issuedDate)}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={status.label}
                                                sx={{ backgroundColor: status.color, color: 'white' }}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                startIcon={<InfoIcon />}
                                                onClick={() => handleOpenDetails(license)}
                                            >
                                                Detalles
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                    {error && (
                        <Box my={2} textAlign="center" >
                            <Alert severity="error">
                                {error}
                            </Alert>
                        </Box>
                    )}
                </TableContainer>

                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={filteredLicenses.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage="Filas por página:"
                    labelDisplayedRows={({ from, to, count }) =>
                        `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
                    }
                />

                {/* Diálogo de detalles */}
                {selectedLicense && (
                    <Dialog open={!!selectedLicense} onClose={handleCloseDetails} maxWidth="sm" fullWidth>
                        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <InfoIcon color="primary" />
                            Detalles de la Licencia
                            <IconButton
                                aria-label="close"
                                onClick={handleCloseDetails}
                                sx={{ position: 'absolute', right: 8, top: 8 }}
                            >
                                <CloseIcon />
                            </IconButton>
                        </DialogTitle>
                        {alertMessage && (
                            <Box mt={2}>
                                <Alert severity={alertSeverity} onClose={() => setAlertMessage(null)}>
                                    {alertMessage}
                                </Alert>
                            </Box>
                        )}

                        <DialogContent dividers>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {/* Tipo de Licencia */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <WorkIcon color="action" />
                                    <Typography variant="body1">
                                        <strong>Licencia a cuenta:</strong> {selectedLicense.licenseType}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <WorkIcon color="action" />
                                    <Typography variant="body1">
                                        <strong>Tipo:</strong> {selectedLicense.timeRequested}
                                    </Typography>
                                </Box>

                                {/* Fecha de Inicio */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <EventAvailableIcon color="action" />
                                    <Typography variant="body1">
                                        <strong>Fecha de Inicio:</strong> {formatDate(selectedLicense.startDate)}
                                    </Typography>
                                </Box>

                                {/* Inicio Medio Día */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <EventIcon color="action" />
                                    <Typography variant="body1">
                                        <strong>Inicio Medio Día:</strong> {selectedLicense.startHalfDay || 'Completo'}
                                    </Typography>
                                </Box>

                                {/* Fecha de Fin */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <EventNoteIcon color="action" />
                                    <Typography variant="body1">
                                        <strong>Fecha de Fin:</strong> {formatDate(selectedLicense.endDate)}
                                    </Typography>
                                </Box>

                                {/* Fin Medio Día */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <EventIcon color="action" />
                                    <Typography variant="body1">
                                        <strong>Fin Medio Día:</strong> {selectedLicense.endHalfDay || 'Completo'}
                                    </Typography>
                                </Box>

                                {/* Días Totales */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <CalendarIcon color="action" />
                                    <Typography variant="body1">
                                        <strong>Días Totales:</strong> {selectedLicense.totalDays ?? 0}
                                    </Typography>
                                </Box>

                                {/* Feriados Detectados */}
                                {selectedLicense.detectedHolidays?.length ? (
                                    <Box sx={{ mt: 1 }}>
                                        <Typography variant="body1"><strong>Feriados Detectados:</strong></Typography>
                                        <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                                            {selectedLicense.detectedHolidays.map((holiday) => (
                                                <li key={holiday.date}>
                                                    {holiday.date} - {holiday.description}
                                                </li>
                                            ))}
                                        </ul>
                                    </Box>
                                ) : null}

                                {/* Estado */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <ApprovedIcon color="action" />
                                    <Typography variant="body1">
                                        <strong>Estado:</strong>{' '}
                                        <Chip
                                            label={getApprovalStatus(selectedLicense).label}
                                            sx={{
                                                backgroundColor: getApprovalStatus(selectedLicense).color,
                                                color: 'white'
                                            }}
                                            size="small"
                                        />
                                    </Typography>
                                </Box>

                                {/* Aprobación Supervisor */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    {selectedLicense.immediateSupervisorApproval ? (
                                        <CheckIcon color="success" />
                                    ) : (
                                        <PendingIcon color="warning" />
                                    )}
                                    <Typography variant="body1">
                                        <strong>Aprobación Supervisor:</strong>{' '}
                                        {selectedLicense.immediateSupervisorApproval ? 'Aprobado' : 'Pendiente'}
                                    </Typography>
                                </Box>

                                {/* Aprobación RRHH */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    {selectedLicense.personalDepartmentApproval ? (
                                        <CheckIcon color="success" />
                                    ) : (
                                        <PendingIcon color="warning" />
                                    )}
                                    <Typography variant="body1">
                                        <strong>Aprobación Dpto. Personal:</strong>{' '}
                                        {selectedLicense.personalDepartmentApproval ? 'Aprobado' : 'Pendiente'}
                                    </Typography>
                                </Box>
                            </Box>

                        </DialogContent>
                        <DialogActions>
                            <Button
                                onClick={handleCloseDetails}
                                variant="contained"
                                startIcon={<CloseIcon />}
                            >
                                Cerrar
                            </Button>

                            <Button
                                onClick={() => {
                                    if (selectedLicense && user) {
                                        const pdf = generateLicensePdf(selectedLicense, {
                                            title: 'AUTORIZACIÓN DE LICENCIA',
                                            user: {
                                                fullName: user.fullName,
                                                ci: user.ci
                                            }
                                        });
                                        pdf.save(`licencia-${selectedLicense.id}.pdf`);
                                    }
                                }}
                                color="secondary"
                                variant="contained"

                            >
                                Generar PDF
                            </Button>
                            {selectedLicense && !selectedLicense.immediateSupervisorApproval && !selectedLicense.personalDepartmentApproval && (
                                <Button
                                    onClick={handleDeleteLicense}
                                    variant="outlined"
                                    color="error"
                                    startIcon={<ClearIcon />}
                                >
                                    Eliminar
                                </Button>
                            )}

                        </DialogActions>
                    </Dialog>
                )}
            </Paper>
        </Box>
    );
};

UserLicenses.acl = {
    action: 'read',
    subject: 'user-licenses',
};

export default UserLicenses;