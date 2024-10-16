// src/pages/user/[ci].tsx
import React, { useEffect, useState } from 'react';
import {
    Box,
    Button,
    CircularProgress,
    Snackbar,
    Typography,
    Paper,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    SelectChangeEvent
} from '@mui/material';
import axios from 'axios';
import CustomHolidayForm from '../customholyday'; // Asegúrate de que esta ruta sea correcta
import UserHolidayPeriods from '../holydayinfo'; // Asegúrate de que esta ruta sea correcta
import { useRouter } from 'next/router';
import useUser from 'src/hooks/useUser';

interface User {
    id: number;
    ci: string;
    fecha_ingreso: string;
    username: string;
    createdAt: string;
    updatedAt: string;
    fullName: string;
    celular: string | null;
    profesion: string | null;
    position: string;
    role: string;
}

const UserInformation = () => {
    const router = useRouter();
    const { ci } = router.query; // Obtener el CI desde los parámetros de la ruta
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [snackbarMessage, setSnackbarMessage] = useState<string>('');
    const [openDialog, setOpenDialog] = useState<boolean>(false);
    const userRole  = useUser(); // Hook para obtener el rol del usuario

    // Función para buscar usuario por CI cuando el componente se monta
    useEffect(() => {
        if (ci) {
            fetchUser(ci as string);
        }
    }, [ci]);

    // Función para buscar usuario
    const fetchUser = async (ci: string) => {
        setLoading(true);
        setUser(null); // Limpiar información del usuario antes de la búsqueda
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/find/${ci}`);
            setUser(response.data);
        } catch (error) {
            setSnackbarMessage('Error al buscar usuario. Verifique el carnet de identidad.');
            console.error('Error fetching user:', error);
        }
        setLoading(false);
    };

    // Función para abrir el diálogo
    const handleOpenDialog = () => {
        setOpenDialog(true);
    };

    // Función para cerrar el diálogo
    const handleCloseDialog = () => {
        setOpenDialog(false);
    };

    const handleSuccess = async () => {
        setSnackbarMessage('Receso personalizado creado exitosamente');
        // Recargar la información del usuario después de crear el receso
        if (ci) {
            await fetchUser(ci as string);
        }
    };

    const handleRoleChange = async (event: SelectChangeEvent<string>) => {
        const newRole = event.target.value;
        if (user) {
            try {
                await axios.put(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/${user.id}/role`, { role: newRole });
                setUser({ ...user, role: newRole });
                setSnackbarMessage('Rol actualizado exitosamente.');
            } catch (error) {
                setSnackbarMessage('Error al actualizar el rol.');
                console.error('Error updating role:', error);
            }
        }
    };

    return (
        <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="flex-start"
            height="100vh"
            p={3}
        >
            <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
                <Typography variant="h4" gutterBottom align="center">
                    Información del Usuario
                </Typography>

                {loading && <CircularProgress style={{ marginTop: '16px' }} />}

                {user && (
                    <>
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="h6">Detalles del Usuario:</Typography>
                            <Typography variant="body1"><strong>ID:</strong> {user.id}</Typography>
                            <Typography variant="body1"><strong>Carnet de Identidad:</strong> {user.ci}</Typography>
                            <Typography variant="body1"><strong>Nombre Completo:</strong> {user.fullName}</Typography>
                            <Typography variant="body1"><strong>Posición:</strong> {user.position}</Typography>
                            <Typography variant="body1"><strong>Fecha de Ingreso:</strong> {new Date(user.fecha_ingreso).toLocaleDateString()}</Typography>
                            <Typography variant="body1"><strong>Rol:</strong> {user.role}</Typography>
                            <Typography variant="body1"><strong>Celular:</strong> {user.celular || 'No registrado'}</Typography>
                            <Typography variant="body1"><strong>Profesión:</strong> {user.profesion || 'No registrada'}</Typography>

                            {userRole && userRole.role === 'admin' && ( // Verificar si el usuario es admin
                                <FormControl fullWidth sx={{ mt: 5, mb: 5 }}>
                                    <InputLabel id="role-select-label">Cambiar Rol</InputLabel>
                                    <Select
                                        labelId="role-select-label"
                                        value={user.role}
                                        onChange={handleRoleChange}
                                    >
                                        <MenuItem value="USER">Usuario</MenuItem>
                                        <MenuItem value="SUPERVISOR">Supervisor</MenuItem>
                                    </Select>
                                </FormControl>
                            )}
                            <Button
                                variant="contained"
                                onClick={handleOpenDialog}
                                color="primary"
                                sx={{ mt: 2 }}
                            >
                                Crear Receso Personalizado
                            </Button>
                        </Box>
                    </>
                )}

                {/* Diálogo para crear receso personalizado */}
                <CustomHolidayForm
                    open={openDialog}
                    onClose={handleCloseDialog}
                    onSuccess={handleSuccess} // Se llama a esta función cuando se crea el receso
                    userId={user ? user.id : 0} // Se toma el ID del usuario encontrado
                />

                {/* Snackbar para notificaciones */}
                <Snackbar
                    open={!!snackbarMessage}
                    autoHideDuration={4000}
                    onClose={() => setSnackbarMessage('')}
                    message={snackbarMessage}
                />
            </Paper>
            <Paper elevation={3} sx={{ padding: 5, mt: 2, width: '100%' }}>

                {user ? ( // Verificar si user no es null
                    <UserHolidayPeriods userId={user.id} year={new Date().getFullYear()} />
                ) : (
                    <Typography variant="body1">No hay períodos de vacaciones disponibles.</Typography>
                )}
            </Paper>

        </Box>
    );
};

export default UserInformation;
