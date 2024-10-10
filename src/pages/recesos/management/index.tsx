import React, { useEffect, useState } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    MenuItem,
    Snackbar,
    TextField,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CircularProgress,
} from '@mui/material';
import axios from 'axios';
import GeneralHolidayForm from '../create-form';

interface GeneralHolidayPeriod {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
    year: number;
}

const HolidayManagement = () => {
    const [holidays, setHolidays] = useState<GeneralHolidayPeriod[]>([]);
    const [filteredYear, setFilteredYear] = useState<number>(new Date().getFullYear());
    const [editHoliday, setEditHoliday] = useState<GeneralHolidayPeriod | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [openDialog, setOpenDialog] = useState<boolean>(false);
    const [snackbarMessage, setSnackbarMessage] = useState<string>('');
    const [openCreateDialog, setOpenCreateDialog] = useState<boolean>(false); // Nuevo estado para el diálogo de creación

    // Cargar recesos generales
    const fetchHolidays = async (year: number | null = null) => {
        setLoading(true);
        try {
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/general-holiday-periods${year ? `/${year}` : ''}`
            );
            setHolidays(response.data);
        } catch (error) {
            console.error('Error fetching holidays:', error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchHolidays();
    }, []);

    // Filtrar por año
    const handleYearFilter = (year: number) => {
        setFilteredYear(year);
        fetchHolidays(year);
    };

    // Editar receso
    const handleEditHoliday = (holiday: GeneralHolidayPeriod) => {
        setEditHoliday({ ...holiday });
        setOpenDialog(true);
    };

    // Guardar cambios del receso
    const handleSaveHoliday = async () => {
        if (editHoliday) {
            try {
                await axios.put(`${process.env.NEXT_PUBLIC_API_BASE_URL}/general-holiday-periods/${editHoliday.id}`, editHoliday);
                setSnackbarMessage('Receso actualizado correctamente.');
                fetchHolidays(filteredYear);
            } catch (error) {
                setSnackbarMessage('Error al actualizar el receso.');
                console.error('Error updating holiday:', error);
            }
            setOpenDialog(false);
        }
    };

    // Eliminar receso
    const handleDeleteHoliday = async (id: number) => {
        try {
            await axios.delete(`${process.env.NEXT_PUBLIC_API_BASE_URL}/general-holiday-periods/${id}`);
            setSnackbarMessage('Receso eliminado correctamente.');
            fetchHolidays(filteredYear);
        } catch (error) {
            setSnackbarMessage('Error al eliminar el receso.');
            console.error('Error deleting holiday:', error);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Gestión de Recesos Generales
            </Typography>

            {/* Botón para crear nuevo receso */}
            <Button
                variant="contained"
                color="primary"
                onClick={() => setOpenCreateDialog(true)}
                style={{ marginBottom: '20px' }}
            >
                + Crear Receso
            </Button>

            {/* Filtro por año */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <TextField
                    label="Filtrar por Año"
                    type="number"
                    value={filteredYear}
                    onChange={(e) => handleYearFilter(Number(e.target.value))}
                />
            </Box>

            {/* Tabla de recesos */}
            {loading ? (
                <CircularProgress />
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Nombre</TableCell>
                                <TableCell>Fecha de Inicio</TableCell>
                                <TableCell>Fecha de Fin</TableCell>
                                <TableCell>Año</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {holidays.map((holiday) => (
                                <TableRow key={holiday.id}>
                                    <TableCell>{holiday.name}</TableCell>
                                    <TableCell>{new Date(holiday.startDate).toLocaleDateString()}</TableCell> {/* Muestra solo la fecha */}
                                    <TableCell>{new Date(holiday.endDate).toLocaleDateString()}</TableCell> {/* Muestra solo la fecha */}
                                    <TableCell>{holiday.year}</TableCell>
                                    <TableCell>
                                        {/* Botón Editar */}
                                        <Button
                                            onClick={() => handleEditHoliday(holiday)}
                                            style={{
                                                backgroundColor: '#1976d2',
                                                color: 'white',
                                                marginRight: '10px'
                                            }}>
                                            ✏️ Editar
                                        </Button>
                                        {/* Botón Eliminar */}
                                        <Button
                                            onClick={() => handleDeleteHoliday(holiday.id)}
                                            style={{
                                                backgroundColor: '#d32f2f',
                                                color: 'white'
                                            }}>
                                            🗑️ Eliminar
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Diálogo para editar receso */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
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
                        type="date"  // Cambiado a 'date' para formato solo de fecha
                        fullWidth
                        margin="normal"
                        value={editHoliday?.startDate.split('T')[0] || ''}  // Solo la parte de la fecha
                        onChange={(e) => setEditHoliday({ ...editHoliday!, startDate: e.target.value })}
                        InputLabelProps={{
                            shrink: true,
                        }}
                    />
                    <TextField
                        label="Fecha de Fin"
                        type="date"  // Cambiado a 'date' para formato solo de fecha
                        fullWidth
                        margin="normal"
                        value={editHoliday?.endDate.split('T')[0] || ''}  // Solo la parte de la fecha
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
                    <Button onClick={handleSaveHoliday} color="primary" variant="contained">
                        Guardar
                    </Button>
                    <Button onClick={() => setOpenDialog(false)} color="secondary">
                        Cancelar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Diálogo para crear receso */}
            <GeneralHolidayForm
                open={openCreateDialog}
                onClose={() => setOpenCreateDialog(false)}
                onSuccess={fetchHolidays} // Agrega esta línea para recargar los recesos
            />


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

export default HolidayManagement;
