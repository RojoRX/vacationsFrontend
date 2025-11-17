import React, { useEffect, useState } from 'react';
import {
    Box, Button, CircularProgress, Snackbar, Typography, Paper,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Dialog, DialogActions, DialogContent, DialogTitle, TextField,
    MenuItem, TablePagination, Chip, Toolbar, IconButton, InputAdornment,
    FormControl, InputLabel, Select, Card, CardHeader, Avatar,
    CardContent
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Refresh as RefreshIcon,
    Event as EventIcon,
    Add as AddIcon,
    CalendarToday as CalendarIcon,
    Clear as ClearIcon
} from '@mui/icons-material';
import axios from 'src/lib/axios';
import { format, parseISO, eachDayOfInterval, isWeekend } from 'date-fns';
import { es } from 'date-fns/locale';
import AdministrativeHolidayForm from '../AdministrativeHolidayForm';

interface AdministrativeHolidayPeriod {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
    year: number;
}

const AdministrativeHolidayManagement: React.FC = () => {
    const [holidays, setHolidays] = useState<AdministrativeHolidayPeriod[]>([]);
    const [filteredYear, setFilteredYear] = useState<string>(''); // Cambiado a string para permitir vacío
    const [editHoliday, setEditHoliday] = useState<AdministrativeHolidayPeriod | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [snackbarMessage, setSnackbarMessage] = useState<string>('');
    const [openDialog, setOpenDialog] = useState<boolean>(false);
    const [openCreateDialog, setOpenCreateDialog] = useState<boolean>(false);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');

    const fetchHolidays = async (year = '') => {
        setLoading(true);
        try {
            // Si year está vacío, obtener todos los recesos
            // Si year tiene valor, obtener solo los de ese año
            const url = year
                ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/administrative-holiday-periods/${year}`
                : `${process.env.NEXT_PUBLIC_API_BASE_URL}/administrative-holiday-periods`;

            console.log('Fetching from URL:', url);
            const response = await axios.get(url);
            const sortedData = response.data.sort(
                (a: AdministrativeHolidayPeriod, b: AdministrativeHolidayPeriod) =>
                    new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
            );
            setHolidays(sortedData);
            console.log('Fetched holidays:', sortedData);
        } catch (error) {
            console.error('Error fetching administrative holidays:', error);
            setSnackbarMessage('Error al cargar los recesos administrativos');
        }
        setLoading(false);
    };

    useEffect(() => {
        // Al cargar el componente, obtener todos los recesos (sin filtro de año)
        fetchHolidays('');
    }, []);

    const handleYearFilter = (year: string) => {
        setFilteredYear(year);
        setPage(0);

        // Si year está vacío, obtener todos los recesos
        // Si year tiene valor, obtener solo los de ese año
        fetchHolidays(year);
    };

    const handleClearYearFilter = () => {
        setFilteredYear('');
        setPage(0);
        fetchHolidays(''); // Obtener todos los recesos
    };

    const handleEditHoliday = (holiday: AdministrativeHolidayPeriod) => {
        setEditHoliday({ ...holiday });
        setOpenDialog(true);
    };

    const handleSaveHoliday = async () => {
        if (!editHoliday) return;
        try {
            await axios.put(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/administrative-holiday-periods/${editHoliday.id}`,
                editHoliday
            );
            setSnackbarMessage('Receso administrativo actualizado correctamente.');
            fetchHolidays(filteredYear); // Recargar con el filtro actual
        } catch (error) {
            console.error('Error updating administrative holiday:', error);
            setSnackbarMessage('Error al actualizar el receso administrativo.');
        }
        setOpenDialog(false);
    };

    const handleDeleteHoliday = async (id: number) => {
        try {
            await axios.delete(`${process.env.NEXT_PUBLIC_API_BASE_URL}/administrative-holiday-periods/${id}`);
            setSnackbarMessage('Receso administrativo eliminado correctamente.');
            fetchHolidays(filteredYear); // Recargar con el filtro actual
        } catch (error) {
            console.error('Error deleting administrative holiday:', error);
            setSnackbarMessage('Error al eliminar el receso administrativo.');
        }
    };

    const handleResetFilters = () => {
        setSearchTerm('');
        setTypeFilter('all');
        setFilteredYear('');
        setPage(0);
        fetchHolidays(''); // Obtener todos los recesos
    };

    const formatDate = (dateString: string) =>
        format(parseISO(dateString), 'dd MMM yyyy', { locale: es });

    const calculateDuration = (startDate: string, endDate: string) => {
        const start = parseISO(startDate);
        const end = parseISO(endDate);
        const allDays = eachDayOfInterval({ start, end });
        
return allDays.filter(date => !isWeekend(date)).length;
    };

    // Filtrar holidays basado en los filtros aplicados
    const filteredHolidays = holidays.filter(holiday => {
        const matchesSearch =
            holiday.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            holiday.year.toString().includes(searchTerm);

        const matchesType =
            typeFilter === 'all' || holiday.name.toLowerCase() === typeFilter.toLowerCase();

        // Si filteredYear está vacío, mostrar todos los años
        // Si filteredYear tiene valor, mostrar solo los del año especificado
        const matchesYear = filteredYear === '' || holiday.year.toString() === filteredYear;

        return matchesSearch && matchesType && matchesYear;
    });

    const [errors, setErrors] = useState({
        name: '', startDate: '', endDate: '', year: ''
    });

    const validateForm = (holiday: Partial<AdministrativeHolidayPeriod>) => {
        const newErrors = { name: '', startDate: '', endDate: '', year: '' };
        let isValid = true;
        if (!holiday.name) { newErrors.name = 'Tipo requerido'; isValid = false; }
        if (!holiday.startDate) { newErrors.startDate = 'Fecha inicio requerida'; isValid = false; }
        if (!holiday.endDate) { newErrors.endDate = 'Fecha fin requerida'; isValid = false; }
        else if (holiday.startDate && new Date(holiday.endDate) < new Date(holiday.startDate)) {
            newErrors.endDate = 'Fecha fin no puede ser anterior a inicio'; isValid = false;
        }
        if (!holiday.year) { newErrors.year = 'Año requerido'; isValid = false; }
        setErrors(newErrors);
        
return isValid;
    };

    // Obtener años únicos para mostrar en el selector
    const uniqueYears = [...new Set(holidays.map(holiday => holiday.year))].sort((a, b) => b - a);

    return (
        <Box sx={{ width: '100%', p: 3 }}>
            <Card>
                <CardHeader
                    avatar={<Avatar sx={{ bgcolor: 'primary.main' }}><CalendarIcon /></Avatar>}
                    title="Gestión de Recesos Administrativos"
                    titleTypographyProps={{ variant: 'h4' }}
                    action={
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<AddIcon />}
                            onClick={() => setOpenCreateDialog(true)}
                        >
                            Nuevo Receso
                        </Button>
                    }
                />
                <CardContent>
                    <Toolbar sx={{ p: 0, mb: 3, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'flex-start' }}>
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                            <InputLabel>Tipo</InputLabel>
                            <Select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                label="Tipo"
                            >
                                <MenuItem value="all">Todos los tipos</MenuItem>
                                <MenuItem value="INVIERNO">Invierno</MenuItem>
                                <MenuItem value="FINDEGESTION">Fin de Gestión</MenuItem>
                            </Select>
                        </FormControl>


                        <FormControl size="small" sx={{ minWidth: 150 }}>
                            <InputLabel>Año</InputLabel>
                            <Select
                                value={filteredYear}
                                onChange={(e) => handleYearFilter(e.target.value)}
                                label="Año"
                                endAdornment={
                                    filteredYear && (
                                        <InputAdornment position="end">
                                            <IconButton
                                                size="small"
                                                onClick={handleClearYearFilter}
                                                edge="end"
                                            >
                                                <ClearIcon />
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }
                            >
                                <MenuItem value="">
                                    <em>Todos los años</em>
                                </MenuItem>
                                {uniqueYears.map(year => (
                                    <MenuItem key={year} value={year.toString()}>
                                        {year}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            size="small"
                            label="Buscar"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Nombre o año..."
                            sx={{ minWidth: 200 }}
                        />

                        <IconButton onClick={handleResetFilters} title="Restablecer filtros">
                            <RefreshIcon />
                        </IconButton>
                    </Toolbar>

                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            Mostrando {filteredHolidays.length} recesos
                            {filteredYear && ` del año ${filteredYear}`}
                            {typeFilter !== 'all' && ` - Tipo: ${typeFilter === 'INVIERNO_ADMIN' ? 'Invierno' : 'Fin de Gestión'}`}
                        </Typography>
                    </Box>

                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Tipo</TableCell>
                                    <TableCell>Inicio</TableCell>
                                    <TableCell>Fin</TableCell>
                                    <TableCell>Duración</TableCell>
                                    <TableCell>Año</TableCell>
                                    <TableCell align="right">Acciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center">
                                            <CircularProgress />
                                        </TableCell>
                                    </TableRow>
                                ) : filteredHolidays.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center">
                                            {holidays.length === 0
                                                ? 'No se encontraron recesos administrativos'
                                                : 'No hay recesos que coincidan con los filtros aplicados'
                                            }
                                        </TableCell>
                                    </TableRow>
                                ) : filteredHolidays
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map((holiday) => (
                                        <TableRow key={holiday.id} hover>
                                            <TableCell>
                                                <Chip
                                                    label={holiday.name === 'INVIERNO' ? 'Invierno' : 'Fin de Gestión'}
                                                    color={holiday.name === 'INVIERNO' ? 'primary' : 'secondary'}
                                                    variant="outlined"
                                                />


                                            </TableCell>
                                            <TableCell>{formatDate(holiday.startDate)}</TableCell>
                                            <TableCell>{formatDate(holiday.endDate)}</TableCell>
                                            <TableCell>{calculateDuration(holiday.startDate, holiday.endDate)} días hábiles</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={holiday.year}
                                                    size="small"
                                                    variant="filled"
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <IconButton
                                                    onClick={() => handleEditHoliday(holiday)}
                                                    color="primary"
                                                    title="Editar"
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                                <IconButton
                                                    onClick={() => handleDeleteHoliday(holiday.id)}
                                                    color="error"
                                                    title="Eliminar"
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                }
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        component="div"
                        count={filteredHolidays.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={(_, newPage) => setPage(newPage)}
                        onRowsPerPageChange={(e) => {
                            setRowsPerPage(parseInt(e.target.value, 10));
                            setPage(0);
                        }}
                        labelRowsPerPage="Filas por página:"
                        labelDisplayedRows={({ from, to, count }) =>
                            `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
                        }
                    />
                </CardContent>
            </Card>

            {/* Diálogo edición */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Editar Receso Administrativo</DialogTitle>
                <DialogContent dividers>
                    <TextField
                        label="Tipo de Receso"
                        select
                        fullWidth
                        margin="normal"
                        value={editHoliday?.name || ''}
                        onChange={(e) => editHoliday && setEditHoliday({ ...editHoliday, name: e.target.value })}
                        error={!!errors.name}
                        helperText={errors.name}
                    >
                        <MenuItem value="INVIERNO">Invierno</MenuItem>
                        <MenuItem value="FINDEGESTION">Fin de Gestión</MenuItem>
                    </TextField>



                    <TextField
                        label="Fecha de Inicio"
                        type="date"
                        fullWidth
                        margin="normal"
                        value={editHoliday?.startDate.split('T')[0] || ''}
                        onChange={(e) =>
                            editHoliday && setEditHoliday({ ...editHoliday, startDate: e.target.value })
                        }
                        InputLabelProps={{ shrink: true }}
                        error={!!errors.startDate}
                        helperText={errors.startDate}
                    />

                    <TextField
                        label="Fecha de Fin"
                        type="date"
                        fullWidth
                        margin="normal"
                        value={editHoliday?.endDate.split('T')[0] || ''}
                        onChange={(e) =>
                            editHoliday && setEditHoliday({ ...editHoliday, endDate: e.target.value })
                        }
                        InputLabelProps={{ shrink: true }}
                        error={!!errors.endDate}
                        helperText={errors.endDate}
                    />

                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)} color="inherit">Cancelar</Button>
                    <Button onClick={() => editHoliday && validateForm(editHoliday) && handleSaveHoliday()} color="primary" variant="contained">
                        Guardar Cambios
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Diálogo creación */}
            <AdministrativeHolidayForm
                open={openCreateDialog}
                onClose={() => setOpenCreateDialog(false)}
                onSuccess={() => {
                    fetchHolidays(filteredYear);
                    setOpenCreateDialog(false);
                }}
            />

            <Snackbar
                open={!!snackbarMessage}
                autoHideDuration={4000}
                onClose={() => setSnackbarMessage('')}
                message={snackbarMessage}
            />
        </Box>
    );
};

// Configuración ACL para el componente
AdministrativeHolidayManagement.acl = {
    action: 'manage',
    subject: 'admin-management'
};

export default AdministrativeHolidayManagement;