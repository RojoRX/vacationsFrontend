import React, { useEffect, useState } from 'react';
import {
    Box,
    Button,
    CircularProgress,
    Snackbar,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Paper,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    MenuItem
} from '@mui/material';
import axios from 'axios';

interface HolidayPeriod {
    id: number;
    userId: number;
    name: string;
    startDate: string;
    endDate: string;
    year: number;
}

interface UserHolidayPeriodsProps {
    userId: number;
    year: number;
}

const UserHolidayPeriods: React.FC<UserHolidayPeriodsProps> = ({ userId, year }) => {
    const [holidayPeriods, setHolidayPeriods] = useState<HolidayPeriod[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [snackbarMessage, setSnackbarMessage] = useState<string>('');
    const [selectedHolidayPeriod, setSelectedHolidayPeriod] = useState<HolidayPeriod | null>(null);
    const [openDialog, setOpenDialog] = useState<boolean>(false);
    const [editHoliday, setEditHoliday] = useState<Partial<HolidayPeriod> | null>(null);

    // Función para obtener los recesos del usuario
    const fetchHolidayPeriods = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user-holiday-periods/${userId}`);
            if (Array.isArray(response.data)) {
                setHolidayPeriods(response.data);
            } else {
                setSnackbarMessage(response.data.message);
            }
        } catch (error) {
            setSnackbarMessage('Error al obtener los recesos personalizados.');
            console.error('Error fetching holiday periods:', error);
        }
        setLoading(false);
    };

    // Función para abrir el diálogo de edición
    const handleOpenDialog = (holidayPeriod: HolidayPeriod) => {
        setSelectedHolidayPeriod(holidayPeriod);
        setEditHoliday({
            name: holidayPeriod.name,
            startDate: holidayPeriod.startDate,
            endDate: holidayPeriod.endDate,
            year: holidayPeriod.year
        });
        setOpenDialog(true);
    };

    // Función para cerrar el diálogo
    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedHolidayPeriod(null);
        setEditHoliday(null);
    };

    // Función para actualizar un receso
    const handleUpdate = async () => {
        if (selectedHolidayPeriod && editHoliday) {
            try {
                await axios.put(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user-holiday-periods/${selectedHolidayPeriod.id}`, editHoliday);
                setSnackbarMessage('Receso actualizado exitosamente.');
                fetchHolidayPeriods(); // Actualiza la lista de recesos
                handleCloseDialog(); // Cierra el diálogo
            } catch (error) {
                setSnackbarMessage('Error al actualizar el receso.');
                console.error('Error updating holiday period:', error);
            }
        }
    };

    // Función para eliminar un receso
    const handleDelete = async (id: number) => {
        try {
            await axios.delete(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user-holiday-periods/${id}`);
            setSnackbarMessage('Receso eliminado exitosamente.');
            fetchHolidayPeriods(); // Actualiza la lista de recesos
        } catch (error) {
            setSnackbarMessage('Error al eliminar el receso.');
            console.error('Error deleting holiday period:', error);
        }
    };

    useEffect(() => {
        fetchHolidayPeriods();
    }, [userId, year]); // Vuelve a buscar los recesos al cambiar el usuario o el año

    return (
        <Box mt={3}>
            <Typography variant="h6">Recesos Personalizados</Typography>
            {loading ? (
                <CircularProgress />
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Año</TableCell>
                                <TableCell>Tipo de Receso</TableCell>
                                <TableCell>Fecha de Inicio</TableCell>
                                <TableCell>Fecha de Fin</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {holidayPeriods.map((period) => (
                                <TableRow key={period.id}>
                                    <TableCell>{period.id}</TableCell>
                                    <TableCell>{period.year}</TableCell>
                                    <TableCell>{period.name}</TableCell>
                                    <TableCell>{period.startDate.split('T')[0]}</TableCell> {/* Solo muestra YYYY-MM-DD */}
                                    <TableCell>{period.endDate.split('T')[0]}</TableCell>   {/* Solo muestra YYYY-MM-DD */}
                                    <TableCell>
                                        <Button variant="contained" color="primary" onClick={() => handleOpenDialog(period)}>
                                            Editar
                                        </Button>
                                        <Button variant="contained" color="secondary" onClick={() => handleDelete(period.id)} sx={{ ml: 1 }}>
                                            Eliminar
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>

                    </Table>
                </TableContainer>
            )}

            {/* Diálogo para editar un receso */}
            <Dialog open={openDialog} onClose={handleCloseDialog}>
                <DialogTitle>Editar Receso</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Nombre"
                        select
                        fullWidth
                        margin="normal"
                        value={editHoliday?.name || ''}
                        onChange={(e) => setEditHoliday({ ...editHoliday!, name: e.target.value })}
                    >
                        <MenuItem value="INVIERNO">Invierno</MenuItem>
                        <MenuItem value="FINDEGESTION">Fin de Gestión</MenuItem>
                    </TextField>
                    <TextField
                        label="Fecha de Inicio"
                        type="date"
                        fullWidth
                        margin="normal"
                        value={editHoliday?.startDate?.split('T')[0] || ''}
                        onChange={(e) => setEditHoliday({ ...editHoliday!, startDate: e.target.value })}
                        InputLabelProps={{
                            shrink: true,
                        }}
                    />
                    <TextField
                        label="Fecha de Fin"
                        type="date"
                        fullWidth
                        margin="normal"
                        value={editHoliday?.endDate?.split('T')[0] || ''}
                        onChange={(e) => setEditHoliday({ ...editHoliday!, endDate: e.target.value })}
                        InputLabelProps={{
                            shrink: true,
                        }}
                    />
                    <TextField
                        label="Año"
                        type="number"
                        fullWidth
                        margin="normal"
                        value={editHoliday?.year || ''}
                        onChange={(e) => setEditHoliday({ ...editHoliday!, year: Number(e.target.value) })}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleUpdate} color="primary" variant="contained">
                        Guardar
                    </Button>
                    <Button onClick={handleCloseDialog} color="secondary">
                        Cancelar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar para notificaciones */}
            <Snackbar
                open={!!snackbarMessage}
                autoHideDuration={4000}
                onClose={() => setSnackbarMessage('')}
                message={snackbarMessage}
            />
        </Box>
    );
};

export default UserHolidayPeriods;
