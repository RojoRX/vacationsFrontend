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
    Search as SearchIcon,
    Refresh as RefreshIcon,
    Event as EventIcon,
    FilterList as FilterIcon,
    Add as AddIcon,
    CalendarToday as CalendarIcon
} from '@mui/icons-material';
import axios from 'src/lib/axios';
import { format, parseISO, eachDayOfInterval, isWeekend } from 'date-fns';
import { es } from 'date-fns/locale';
import GeneralHolidayForm from '../create-form';
interface GeneralHolidayPeriod {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
    year: number;
}

interface AclComponent extends React.FC {
    acl?: {
        action: string;
        subject: string;
    };
}

const HolidayManagement: AclComponent = () => {
    const [holidays, setHolidays] = useState<GeneralHolidayPeriod[]>([]);
    const [filteredYear, setFilteredYear] = useState<number | null>(null);
    const [editHoliday, setEditHoliday] = useState<GeneralHolidayPeriod | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [snackbarMessage, setSnackbarMessage] = useState<string>('');
    const [openDialog, setOpenDialog] = useState<boolean>(false);
    const [openCreateDialog, setOpenCreateDialog] = useState<boolean>(false);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');

    // Modificamos la función fetchHolidays para ordenar los resultados
    const fetchHolidays = async (year: number | null = null) => {
        setLoading(true);
        try {
            const url = year
                ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/general-holiday-periods/${year}`
                : `${process.env.NEXT_PUBLIC_API_BASE_URL}/general-holiday-periods`;

            const response = await axios.get(url);
            // Ordenar por fecha de inicio descendente (más recientes primero)
            const sortedData = response.data.sort((a: GeneralHolidayPeriod, b: GeneralHolidayPeriod) => {
                return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
            });
            setHolidays(sortedData);
        } catch (error) {
            console.error('Error fetching holidays:', error);
            setSnackbarMessage('Error al cargar los recesos generales');
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchHolidays();
    }, []);

    const handleYearFilter = (year: number | null) => {
        setFilteredYear(year);
        // Si year es null, obtenemos todos los registros
        if (year === null) {
            fetchHolidays();
        } else {
            fetchHolidays(year);
        }
        setPage(0);
    };

    const handleEditHoliday = (holiday: GeneralHolidayPeriod) => {
        setEditHoliday({ ...holiday });
        setOpenDialog(true);
    };

    const handleSaveHoliday = async () => {
        if (editHoliday) {
            try {
                await axios.put(
                    `${process.env.NEXT_PUBLIC_API_BASE_URL}/general-holiday-periods/${editHoliday.id}`,
                    editHoliday
                );
                setSnackbarMessage('Receso actualizado correctamente.');
                fetchHolidays(filteredYear);
            } catch (error) {
                setSnackbarMessage('Error al actualizar el receso.');
                console.error('Error updating holiday:', error);
            }
            setOpenDialog(false);
        }
    };

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

    const handleResetFilters = () => {
        setSearchTerm('');
        setTypeFilter('all');
        setFilteredYear(new Date().getFullYear());
        fetchHolidays();
    };

    const formatDate = (dateString: string) => {
        return format(parseISO(dateString), 'dd MMM yyyy', { locale: es });
    };

    const calculateDuration = (startDate: string, endDate: string): number => {
        const start = parseISO(startDate);
        const end = parseISO(endDate);
      
        const allDays = eachDayOfInterval({ start, end });
      
        const workingDays = allDays.filter(date => !isWeekend(date));
      
        return workingDays.length;
      };

    // Filtrado modificado
    const filteredHolidays = holidays.filter(holiday => {
        const matchesSearch =
            holiday.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            holiday.year.toString().includes(searchTerm);

        const matchesType =
            typeFilter === 'all' ||
            holiday.name.toLowerCase() === typeFilter.toLowerCase();

        const matchesYear =
            filteredYear === null ||
            holiday.year === filteredYear;

        return matchesSearch && matchesType && matchesYear;
    });
    // Nuevo estado para manejar errores
    const [errors, setErrors] = useState({
        name: '',
        startDate: '',
        endDate: '',
        year: ''
    });

    // Función de validación
    const validateForm = (holiday: Partial<GeneralHolidayPeriod>) => {
        const newErrors = {
            name: '',
            startDate: '',
            endDate: '',
            year: ''
        };

        let isValid = true;

        if (!holiday.name) {
            newErrors.name = 'El tipo de receso es requerido';
            isValid = false;
        }

        if (!holiday.startDate) {
            newErrors.startDate = 'La fecha de inicio es requerida';
            isValid = false;
        }

        if (!holiday.endDate) {
            newErrors.endDate = 'La fecha de fin es requerida';
            isValid = false;
        } else if (holiday.startDate && new Date(holiday.endDate) < new Date(holiday.startDate)) {
            newErrors.endDate = 'La fecha de fin no puede ser anterior a la de inicio';
            isValid = false;
        }

        if (!holiday.year) {
            newErrors.year = 'El año es requerido';
            isValid = false;
        } else if (holiday.year < 2000 || holiday.year > new Date().getFullYear() + 5) {
            newErrors.year = 'El año debe ser válido';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    return (
        <Box sx={{ width: '100%', p: 3 }}>
            <Card>
                <CardHeader
                    avatar={
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <CalendarIcon />
                        </Avatar>
                    }
                    title="Gestión de Recesos Generales"
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
                    <Toolbar
                        sx={{
                            p: 0,
                            mb: 3,
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            alignItems: { xs: 'flex-start', sm: 'center' },
                            justifyContent: 'space-between',
                            gap: 2
                        }}
                    >
                        <Box sx={{ display: 'flex', gap: 2, width: { xs: '100%', sm: 'auto' } }}>
                            {/**<TextField
                                size="small"
                                label="Año"
                                type="number"
                                value={filteredYear || ''}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    handleYearFilter(value === '' ? null : Number(value));
                                }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <EventIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            /> */}

                            <FormControl size="small" sx={{ minWidth: 120 }}>
                                <InputLabel>Tipo</InputLabel>
                                <Select
                                    value={typeFilter}
                                    onChange={(e) => setTypeFilter(e.target.value)}
                                    label="Tipo"
                                >
                                    <MenuItem value="all">Todos</MenuItem>
                                    <MenuItem value="INVIERNO">Invierno</MenuItem>
                                    <MenuItem value="FINDEGESTION">Fin de Gestión</MenuItem>
                                </Select>
                            </FormControl>

                            <TextField
                                size="small"
                                label="Año"
                                type="number"
                                value={filteredYear}
                                onChange={(e) => handleYearFilter(Number(e.target.value))}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <EventIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            <IconButton onClick={handleResetFilters}>
                                <RefreshIcon />
                            </IconButton>
                        </Box>
                    </Toolbar>

                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Tipo</TableCell>
                                    <TableCell>Fecha Inicio</TableCell>
                                    <TableCell>Fecha Fin</TableCell>
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
                                            No se encontraron recesos generales
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredHolidays
                                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                        .map((holiday) => (
                                            <TableRow key={holiday.id} hover>
                                                <TableCell>
                                                    <Chip
                                                        label={holiday.name === 'INVIERNO' ? 'Invierno' : 'Fin de Gestión'}
                                                        color={holiday.name === 'INVIERNO' ? 'primary' : 'secondary'}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <EventIcon color="action" fontSize="small" />
                                                        {formatDate(holiday.startDate)}
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <EventIcon color="action" fontSize="small" />
                                                        {formatDate(holiday.endDate)}
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    {calculateDuration(holiday.startDate, holiday.endDate)} días hábiles
                                                </TableCell>
                                                <TableCell>{holiday.year}</TableCell>
                                                <TableCell align="right">
                                                    <IconButton
                                                        onClick={() => handleEditHoliday(holiday)}
                                                        color="primary"
                                                        aria-label="editar"
                                                    >
                                                        <EditIcon />
                                                    </IconButton>
                                                    <IconButton
                                                        onClick={() => handleDeleteHoliday(holiday.id)}
                                                        color="error"
                                                        aria-label="eliminar"
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                )}
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

            {/* Diálogo de edición */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Editar Receso General</DialogTitle>
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
                        onChange={(e) => {
                            if (editHoliday) {
                                const newHoliday = { ...editHoliday, startDate: e.target.value };
                                setEditHoliday(newHoliday);
                                // Validar fechas
                                if (newHoliday.endDate && new Date(newHoliday.endDate) < new Date(e.target.value)) {
                                    setErrors(prev => ({
                                        ...prev,
                                        endDate: 'La fecha de fin no puede ser anterior a la de inicio'
                                    }));
                                } else {
                                    setErrors(prev => ({ ...prev, endDate: '' }));
                                }
                            }
                        }}
                        InputLabelProps={{ shrink: true }}
                        error={!!errors.startDate}
                        helperText={errors.startDate}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton edge="end">
                                        <EventIcon />
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />

                    <TextField
                        label="Fecha de Fin"
                        type="date"
                        fullWidth
                        margin="normal"
                        value={editHoliday?.endDate.split('T')[0] || ''}
                        onChange={(e) => {
                            if (editHoliday) {
                                const newHoliday = { ...editHoliday, endDate: e.target.value };
                                setEditHoliday(newHoliday);
                                // Validar que la fecha de fin no sea anterior a la de inicio
                                if (newHoliday.startDate && new Date(e.target.value) < new Date(newHoliday.startDate)) {
                                    setErrors(prev => ({
                                        ...prev,
                                        endDate: 'La fecha de fin no puede ser anterior a la de inicio'
                                    }));
                                } else {
                                    setErrors(prev => ({ ...prev, endDate: '' }));
                                }
                            }
                        }}
                        InputLabelProps={{ shrink: true }}
                        error={!!errors.endDate}
                        helperText={errors.endDate}
                        disabled={!editHoliday?.startDate}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton edge="end">
                                        <EventIcon />
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />

                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {
                        setOpenDialog(false);
                        setErrors({ name: '', startDate: '', endDate: '', year: '' });
                    }} color="inherit">
                        Cancelar
                    </Button>
                    <Button onClick={() => {
                        if (editHoliday && validateForm(editHoliday)) {
                            handleSaveHoliday();
                        }
                    }} color="primary" variant="contained">
                        Guardar Cambios
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Diálogo para crear receso */}
            <GeneralHolidayForm
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
HolidayManagement.acl = {
    action: 'manage',
    subject: 'general-holidays'
};

export default HolidayManagement;