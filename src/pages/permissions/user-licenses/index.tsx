import React, { FC, useEffect, useState } from 'react';
import axios from 'axios';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography,
    CircularProgress, Box, TablePagination, Button, Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
    TableSortLabel
} from '@mui/material';
import { green, red } from '@mui/material/colors';
import useUser from 'src/hooks/useUser';
import CloseIcon from '@mui/icons-material/Close';

// Tipos
interface License {
    id: number;
    licenseType: string;
    timeRequested: string;
    startDate: string;
    endDate: string;
    issuedDate: string;
    immediateSupervisorApproval: boolean;
    personalDepartmentApproval: boolean;
    totalDays: string;
}
interface AclComponent extends FC {
    acl?: {
        action: string;
        subject: string;
    };
}

const UserLicenses: AclComponent = () => {
    const user = useUser(); // Hook para obtener los datos del usuario
    const [licenses, setLicenses] = useState<License[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedLicense, setSelectedLicense] = useState<License | null>(null); // Licencia seleccionada
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [orderBy, setOrderBy] = useState<'asc' | 'desc'>('desc');

    useEffect(() => {
        if (user) {
            axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/licenses/user/${user.id}`)
                .then((response) => {
                    const sortedLicenses = response.data.sort((a: License, b: License) =>
                        new Date(b.issuedDate).getTime() - new Date(a.issuedDate).getTime()
                    );
                    setLicenses(sortedLicenses);
                })
                .catch(() => {
                    setError('Error al obtener las licencias');
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [user]);

    // Función para manejar el orden al hacer clic en el encabezado
    const handleSortByIssuedDate = () => {
        setOrderBy(orderBy === 'asc' ? 'desc' : 'asc');
        const sortedLicenses = licenses.sort((a, b) => {
            return orderBy === 'asc'
                ? new Date(a.issuedDate).getTime() - new Date(b.issuedDate).getTime()
                : new Date(b.issuedDate).getTime() - new Date(a.issuedDate).getTime();
        });
        setLicenses([...sortedLicenses]);
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

    // Mientras carga la información
    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
            </Box>
        );
    }

    // Si hubo un error al cargar
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
        <TableContainer component={Paper}>
            <Typography variant="h5" component="div" sx={{ padding: 2 }}>
                Licencias del Usuario
            </Typography>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Tipo</TableCell>
                        <TableCell>Fecha de Inicio</TableCell>
                        <TableCell>Fecha de Fin</TableCell>
                        <TableCell>
                            <TableSortLabel
                                active
                                direction={orderBy}
                                onClick={handleSortByIssuedDate}
                            >
                                Fecha de Emisión
                            </TableSortLabel>
                        </TableCell>
                        <TableCell>Aprobación Supervisor</TableCell>
                        <TableCell>Aprobación RRHH</TableCell>
                        <TableCell>Acciones</TableCell>
                    </TableRow>
                </TableHead>

                <TableBody>
                    {licenses.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((license) => (
                        <TableRow key={license.id}>
                            <TableCell>{license.id}</TableCell>
                            <TableCell>{license.licenseType}</TableCell>
                            <TableCell>{new Date(license.startDate).toLocaleDateString()}</TableCell>
                            <TableCell>{new Date(license.endDate).toLocaleDateString()}</TableCell>
                            <TableCell>{new Date(license.issuedDate).toLocaleDateString()}</TableCell> {/* Mostrar fecha de emisión */}
                            <TableCell sx={{ color: license.immediateSupervisorApproval ? green[500] : red[500] }}>
                                {license.immediateSupervisorApproval ? 'Aprobado' : 'Pendiente'}
                            </TableCell>
                            <TableCell sx={{ color: license.personalDepartmentApproval ? green[500] : red[500] }}>
                                {license.personalDepartmentApproval ? 'Aprobado' : 'Pendiente'}
                            </TableCell>
                            <TableCell>
                                <Button variant="outlined" onClick={() => handleOpenDetails(license)}>
                                    Ver Detalles
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <TablePagination
                component="div"
                count={licenses.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />

            {/* Diálogo para mostrar más detalles */}
            {selectedLicense && (
                <Dialog open={!!selectedLicense} onClose={handleCloseDetails} maxWidth="sm" fullWidth>
                    <DialogTitle>
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
                        <Typography variant="body1"><strong>ID:</strong> {selectedLicense.id}</Typography>
                        <Typography variant="body1"><strong>Tipo de Licencia:</strong> {selectedLicense.licenseType}</Typography>
                        <Typography variant="body1"><strong>Tiempo Solicitado:</strong> {selectedLicense.timeRequested}</Typography>
                        <Typography variant="body1"><strong>Fecha de Inicio:</strong> {new Date(selectedLicense.startDate).toLocaleDateString()}</Typography>
                        <Typography variant="body1"><strong>Fecha de Fin:</strong> {new Date(selectedLicense.endDate).toLocaleDateString()}</Typography>
                        <Typography variant="body1"><strong>Días Totales:</strong> {selectedLicense.totalDays}</Typography>
                        <Typography variant="body1"><strong>Emitido en:</strong> {new Date(selectedLicense.issuedDate).toLocaleDateString()}</Typography>
                        <Typography variant="body1" sx={{ color: selectedLicense.immediateSupervisorApproval ? green[500] : red[500] }}><strong>Aprobación Supervisor:</strong> {selectedLicense.immediateSupervisorApproval ? 'Sí' : 'No'}</Typography>
                        <Typography variant="body1"  sx={{ color: selectedLicense.personalDepartmentApproval ? green[500] : red[500] }}><strong>Aprobación RRHH:</strong> {selectedLicense.personalDepartmentApproval ? 'Sí' : 'No'}</Typography>

                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDetails} variant="contained">Cerrar</Button>
                    </DialogActions>
                </Dialog>
            )}
        </TableContainer>
    );
};

// Configurar ACL para dar acceso a empleados
UserLicenses.acl = {
    action: 'read',
    subject: 'user-licenses'
};

export default UserLicenses;
