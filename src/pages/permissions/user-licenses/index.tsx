import React, { FC, useEffect, useState } from 'react';
import axios from 'src/lib/axios';
import {
    Box, Typography, CircularProgress, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, TablePagination, Button, Dialog,
    DialogTitle, DialogContent, DialogActions, IconButton, TableSortLabel,
    TextField, MenuItem, Chip, Toolbar, InputAdornment
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

    useEffect(() => {
        if (user) {
            axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/licenses/user/${user.id}`)
                .then((response) => {
                    const sortedLicenses = response.data.sort((a: License, b: License) =>
                        new Date(b.issuedDate).getTime() - new Date(a.issuedDate).getTime()
                    );
                    setLicenses(sortedLicenses);
                    setFilteredLicenses(sortedLicenses);
                })
                .catch(() => {
                    setError('Error al obtener las licencias');
                })
                .finally(() => {
                    setLoading(false);
                });
        }
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

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
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

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box>
                <Typography variant="h6" color="error">
                    {error}
                </Typography>
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
                        <DialogContent dividers>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <WorkIcon color="action" />
                                    <Typography variant="body1">
                                        <strong>Tipo de Licencia:</strong> {selectedLicense.licenseType}
                                    </Typography>
                                </Box>

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <EventAvailableIcon color="action" />
                                    <Typography variant="body1">
                                        <strong>Fecha de Inicio:</strong> {formatDate(selectedLicense.startDate)}
                                    </Typography>
                                </Box>

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <EventNoteIcon color="action" />
                                    <Typography variant="body1">
                                        <strong>Fecha de Fin:</strong> {formatDate(selectedLicense.endDate)}
                                    </Typography>
                                </Box>

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <CalendarIcon color="action" />
                                    <Typography variant="body1">
                                        <strong>Días Totales:</strong> {selectedLicense.totalDays}
                                    </Typography>
                                </Box>

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

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    {selectedLicense.personalDepartmentApproval ? (
                                        <CheckIcon color="success" />
                                    ) : (
                                        <PendingIcon color="warning" />
                                    )}
                                    <Typography variant="body1">
                                        <strong>Aprobación RRHH:</strong>{' '}
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