import React, { useState } from 'react';
import {
    Box,
    Button,
    CircularProgress,
    Snackbar,
    TextField,
    Typography,
    Grid,
    Paper
} from '@mui/material';
import axios from 'axios';
import CustomHolidayForm from '../customholyday';
import UserHolidayPeriods from '../holydayinfo';

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
    const [ci, setCi] = useState<string>('');
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [snackbarMessage, setSnackbarMessage] = useState<string>('');
    const [openDialog, setOpenDialog] = useState<boolean>(false);

    // Función para buscar usuario
    const fetchUser = async () => {
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

    const handleSuccess = () => {
        setSnackbarMessage('Receso personalizado creado exitosamente');
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
                    Buscar Usuario
                </Typography>

                <TextField
                    label="Carnet de Identidad"
                    value={ci}
                    onChange={(e) => setCi(e.target.value)}
                    fullWidth
                    variant="outlined"
                    margin="normal"
                />
                <Button 
                    variant="contained" 
                    onClick={fetchUser}
                    fullWidth
                    color="primary"
                    sx={{ mb: 2 }}
                >
                    Buscar
                </Button>

                {loading && <CircularProgress style={{ marginTop: '16px' }} />}

                {user && (
                    <>
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="h6">Información del Usuario:</Typography>
                            <Typography>ID: {user.id}</Typography>
                            <Typography>Carnet de Identidad: {user.ci}</Typography>
                            <Typography>Nombre Completo: {user.fullName}</Typography>
                            <Typography>Posición: {user.position}</Typography>
                            <Typography>Fecha de Ingreso: {new Date(user.fecha_ingreso).toLocaleDateString()}</Typography>
                            <Typography>Rol: {user.role}</Typography>

                            <Button
                                variant="contained"
                                onClick={handleOpenDialog}
                                color="success"
                                sx={{ mt: 2 }}
                            >
                                Crear Receso Personalizado
                            </Button>
                        </Box>

                        <Box sx={{ mt: 3 }}>
                            <UserHolidayPeriods userId={user.id} year={new Date().getFullYear()} />
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
        </Box>
    );
};

export default UserInformation;
