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
} from '@mui/material';
import { License } from 'src/interfaces/licenseTypes';
import { User } from 'src/interfaces/usertypes';
import useUser from 'src/hooks/useUser';

// Define la interfaz de props para el componente
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
    const user = useUser(); // Hook para obtener los datos del usuario
    const [licenses, setLicenses] = useState<License[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
    const [userDetails, setUserDetails] = useState<{ [key: string]: { name: string; ci: string; celular: string} }>({}); // Almacena detalles de usuarios
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [userInfo, setUserInfo] = useState(null);

    useEffect(() => {
        if (user) {
            // Llamada al API para obtener las licencias del departamento
            axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/licenses/department/${user.id}`)
                .then((response) => {
                    const licensesData = response.data;
                    setLicenses(licensesData);

                    // Obtener detalles de usuario para cada licencia
                    const userRequests = licensesData.map((license: License) =>
                        axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/${license.userId}`)
                            .then(userResponse => ({
                                userId: license.userId,
                                userName: userResponse.data.fullName,
                                userCi: userResponse.data.ci,
                            }))
                    );

                    // Esperar a que se completen todas las solicitudes
                    return Promise.all(userRequests);
                })
                .then(userDetailsArray => {
                    // Crear un objeto para facilitar el acceso a los detalles del usuario
                    const userDetailsMap: { [key: string]: { name: string; ci: string; celular:string } } = {};
                    userDetailsArray.forEach(user => {
                        userDetailsMap[user.userId] = { name: user.userName, ci: user.userCi, celular: user.celular };
                    });
                    setUserDetails(userDetailsMap);
                })
                .catch(() => {
                    setError('Error al obtener las licencias');
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [user]);

    const handleOpenDialog = (license: License) => {
        setSelectedLicense(license);
        // Obtener información del usuario correspondiente a la licencia
        axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/${license.userId}`)
            .then((response) => {
                setUserInfo(response.data);
            })
            .catch(() => {
                setError('Error al obtener la información del usuario');
            })
            .finally(() => {
                setOpenDialog(true);
            });
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedLicense(null);
        setUserInfo(null);
    };

    const handleApprove = () => {
        if (selectedLicense) {
            const action = selectedLicense.immediateSupervisorApproval ? 'desaprobar' : 'aprobar'; // Determinar acción
            axios.patch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/licenses/${selectedLicense.id}/supervisor-approval`, { action })
                .then(() => {
                    // Actualizar la lista de licencias después de la acción
                    setLicenses((prev) =>
                        prev.map((license) =>
                            license.id === selectedLicense.id
                                ? { ...license, immediateSupervisorApproval: !license.immediateSupervisorApproval } // Alternar estado
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
                Solicitudes de Licencias del Departamento
            </Typography>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Nombre Solicitante</TableCell>
                        <TableCell>CI</TableCell>
                        <TableCell>Fecha de Emisión</TableCell>
                        <TableCell>Aprobación Supervisor</TableCell>
                        <TableCell>Aprobación RRHH</TableCell>
                        {user && user.role === 'supervisor' && <TableCell>Acciones</TableCell>}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {licenses.length > 0 ? (
                        licenses.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((license) => (
                            <TableRow key={license.id}>
                                <TableCell>{license.id}</TableCell>
                                <TableCell>{userDetails[license.userId]?.name || 'Cargando...'}</TableCell> {/* Nombre del solicitante desde el API */}
                                <TableCell>{userDetails[license.userId]?.ci || 'Cargando...'}</TableCell> {/* C.I. del solicitante desde el API */}
                                <TableCell>
                                    {new Date(license.issuedDate).toLocaleDateString('es-ES', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </TableCell>

                                <TableCell>
                                    <Typography
                                        sx={{
                                            color: license.immediateSupervisorApproval ? 'success.main' : 'error.main', // Usar colores del tema
                                        }}
                                    >
                                        {license.immediateSupervisorApproval ? 'Aprobado' : 'Pendiente'}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography
                                        sx={{
                                            color: license.personalDepartmentApproval ? 'success.main' : 'error.main', // Usar colores del tema
                                        }}
                                    >
                                        {license.personalDepartmentApproval ? 'Aprobado' : 'Pendiente'}
                                    </Typography>
                                </TableCell>
                                {user && user.role === 'supervisor' && (
                                    <TableCell>
                                        <Button variant="outlined" onClick={() => handleOpenDialog(license)}>
                                            Ver Detalles
                                        </Button>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={6} align="center">
                                No hay solicitudes de licencia disponibles.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            {/* Paginación */}
            <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={licenses.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(event, newPage) => setPage(newPage)}
                onRowsPerPageChange={(event) => {
                    setRowsPerPage(parseInt(event.target.value, 10));
                    setPage(0);
                }}
            />

            {/* Diálogo de aprobación */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth='sm' fullWidth >
                <DialogTitle>Aprobar Licencia</DialogTitle>
                <DialogContent>
                    {selectedLicense ? (
                        <>
                            <Typography variant="h6">Información de la Licencia</Typography>
                            <Typography>ID: {selectedLicense.id}</Typography>
                            <Typography>Tipo de Licencia: {selectedLicense.licenseType}</Typography>
                            <Typography>Fecha de Inicio: {new Date(selectedLicense.startDate).toLocaleDateString()}</Typography>
                            <Typography>Fecha de Fin: {new Date(selectedLicense.endDate).toLocaleDateString()}</Typography>
                            <Typography>Fecha de Emisión: {new Date(selectedLicense.issuedDate).toLocaleDateString()}</Typography>
                            <Typography
                                sx={{
                                    color: selectedLicense.immediateSupervisorApproval ? 'success.main' : 'error.main',
                                }}
                            >
                                Aprobación Supervisor: {selectedLicense.immediateSupervisorApproval ? 'Aprobado' : 'Pendiente'}
                            </Typography>
                            <Typography
                                sx={{
                                    color: selectedLicense.personalDepartmentApproval ? 'success.main' : 'error.main',
                                }}
                            >
                                Aprobación RRHH: {selectedLicense.personalDepartmentApproval ? 'Aprobado' : 'Pendiente'}
                            </Typography>
                            <Typography variant="h6" sx={{ mt: 2 }}>Información del Usuario</Typography>
                            {/* <Typography>ID: {selectedLicense.userId}</Typography>  */}
                            <Typography>Nombre: {userDetails[selectedLicense.userId]?.name || 'Cargando...'}</Typography>
                            <Typography>CI: {userDetails[selectedLicense.userId]?.ci || 'Cargando...'}</Typography>
                            {/* <Typography>Celular: {userDetails[selectedLicense.userId]?.celular || 'Cargando...'}</Typography> */}
                        </>
                    ) : (
                        <Typography>Cargando información de la licencia...</Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} color="primary">
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleApprove}
                        color={selectedLicense?.immediateSupervisorApproval ? "error" : "success"}
                        variant="contained"
                    >
                        {selectedLicense?.immediateSupervisorApproval ? "Desaprobar" : "Aprobar"}
                    </Button>
                </DialogActions>

            </Dialog>
        </TableContainer>
    );
};// Configurar ACL para dar acceso a supervisores
DepartmentLicenses.acl = {
    action: 'read',
    subject: 'department-permission',
};

export default DepartmentLicenses;


