import React, { useState, useEffect } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Typography, TextField, TablePagination, CircularProgress, Box,
    MenuItem, Select, FormControl, InputLabel,
    Chip, IconButton,
    DialogContent,
    Button,
    Dialog,
    DialogActions,
    DialogTitle,
    Snackbar
} from '@mui/material';
import { Edit, Delete, Launch } from '@mui/icons-material';
import axios from 'src/lib/axios';
import getBusinessDays from 'src/utils/businessDays';
import router from 'next/router';

interface HolidayPeriod {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
    year: number;
    isPersonalized?: boolean;
}

interface CombinedHolidayPeriodsProps {
    userId: number;
    joinDate: string;
    tipoEmpleado: 'DOCENTE' | 'ADMINISTRATIVO';
}

const CombinedHolidayPeriods: React.FC<CombinedHolidayPeriodsProps> = ({ userId, joinDate, tipoEmpleado }) => {
    const [combinedPeriods, setCombinedPeriods] = useState<HolidayPeriod[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [yearFilter, setYearFilter] = useState<string>('');
    const [nameFilter, setNameFilter] = useState<string>('');
    const [typeFilter, setTypeFilter] = useState<string>('');
    const [selectedHolidayPeriod, setSelectedHolidayPeriod] = useState<HolidayPeriod | null>(null);
    const [editHoliday, setEditHoliday] = useState<Partial<HolidayPeriod> | null>(null);
    const [snackbarMessage, setSnackbarMessage] = useState<string>('');
    const [openDialog, setOpenDialog] = useState<boolean>(false);

    const fetchHolidayPeriods = async () => {
        try {
            setLoading(true);

            // Elegir endpoint base según tipo de empleado
            const baseEndpoint =
                tipoEmpleado === 'ADMINISTRATIVO'
                    ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/administrative-holiday-periods`
                    : `${process.env.NEXT_PUBLIC_API_BASE_URL}/general-holiday-periods`;

            const [baseResponse, personalizedResponse] = await Promise.all([
                axios.get(baseEndpoint),
                axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user-holiday-periods/${userId}`)
            ]);

            const basePeriods: HolidayPeriod[] = baseResponse.data.map((p: any) => ({
                ...p,
                isPersonalized: false
            }));

            const personalizedPeriods: HolidayPeriod[] = personalizedResponse.data.map((p: any) => ({
                ...p,
                isPersonalized: true
            }));

            // Combinar: personalizados reemplazan los base con mismo nombre/año
            const combined = [...basePeriods];
            personalizedPeriods.forEach(personalized => {
                const index = combined.findIndex(
                    base => base.name === personalized.name && base.year === personalized.year
                );
                if (index !== -1) {
                    combined[index] = personalized;
                } else {
                    combined.push(personalized);
                }
            });

            // Ordenar por año descendente y nombre
            combined.sort((a, b) => {
                if (b.year !== a.year) return b.year - a.year;
                
return a.name.localeCompare(b.name);
            });

            setCombinedPeriods(combined);
            setLoading(false);
        } catch (err) {
            setError('Error al cargar los recesos. Por favor intente nuevamente.');
            setLoading(false);
            console.error('Error fetching holiday periods:', err);
        }
    };

    useEffect(() => {
        fetchHolidayPeriods();
    }, [userId, tipoEmpleado]);

    const handleChangePage = (event: unknown, newPage: number) => setPage(newPage);
    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleDelete = async (id: number) => {
        try {
            await axios.delete(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user-holiday-periods/${id}`);
            setCombinedPeriods(prev => prev.filter(p => p.id !== id));
        } catch (error) {
            console.error('Error eliminando receso personalizado:', error);
        }
    };

    const handleEdit = async () => {
        if (selectedHolidayPeriod && editHoliday) {
            try {
                await axios.put(
                    `${process.env.NEXT_PUBLIC_API_BASE_URL}/user-holiday-periods/${selectedHolidayPeriod.id}`,
                    editHoliday
                );
                setSnackbarMessage('Receso actualizado exitosamente.');
                await fetchHolidayPeriods(); // Actualiza los datos
                handleCloseDialog();
            } catch (error: any) {
                const errorMessage =
                    error.response?.data?.message || 'Error al actualizar el receso.';
                setSnackbarMessage(errorMessage);
                console.error('Error updating holiday period:', error);
            }
        }
    };

    const handleOpenDialog = (holidayPeriod: HolidayPeriod) => {
        setSelectedHolidayPeriod(holidayPeriod);
        setEditHoliday({
            name: holidayPeriod.name,
            startDate: holidayPeriod.startDate,
            endDate: holidayPeriod.endDate
        });
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedHolidayPeriod(null);
        setEditHoliday(null);
    };

    const handleGeneralRedirect = () => {
        router.push("/recesos/management/")
    };

    const formatShortDate = (dateString: string) => {
        const date = new Date(dateString);
        
return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const filteredPeriods = combinedPeriods.filter(period => {
        const joinYear = new Date(joinDate).getFullYear();
        const isValidBase = period.isPersonalized || period.year >= joinYear;
        const matchesYear = yearFilter ? period.year.toString().includes(yearFilter) : true;
        const matchesName = nameFilter ? period.name === nameFilter : true;
        const matchesType = typeFilter
            ? (typeFilter === 'Personalizado' ? period.isPersonalized : !period.isPersonalized)
            : true;

        return matchesYear && matchesName && matchesType && isValidBase;
    });

    const uniqueNames = [...new Set(combinedPeriods.map(p => p.name))];

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', padding: 3 }}><CircularProgress /></Box>;
    }

    if (error) {
        return <Box sx={{ padding: 3 }}><Typography color="error">{error}</Typography></Box>;
    }

    return (
        <Box sx={{ padding: 3 }}>
            <Typography variant="h4" gutterBottom>Recesos Personalizados Y Base</Typography>

            <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                    label="Filtrar por año"
                    variant="outlined"
                    size="small"
                    value={yearFilter}
                    onChange={(e) => setYearFilter(e.target.value)}
                />
                <FormControl variant="outlined" size="small" style={{ minWidth: 120 }}>
                    <InputLabel id="name-filter-label">Nombre</InputLabel>
                    <Select
                        labelId="name-filter-label"
                        value={nameFilter}
                        onChange={(e) => setNameFilter(e.target.value as string)}
                        label="Nombre"
                    >
                        <MenuItem value="">Todos</MenuItem>
                        {uniqueNames.map(name => (
                            <MenuItem key={name} value={name}>{name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <FormControl variant="outlined" size="small" style={{ minWidth: 120 }}>
                    <InputLabel id="type-filter-label">Tipo</InputLabel>
                    <Select
                        labelId="type-filter-label"
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value as string)}
                        label="Tipo"
                    >
                        <MenuItem value="">Todos</MenuItem>
                        <MenuItem value={tipoEmpleado === 'ADMINISTRATIVO' ? 'Administrativo' : 'General'}>
                            {tipoEmpleado === 'ADMINISTRATIVO' ? 'Administrativo' : 'General'}
                        </MenuItem>
                        <MenuItem value="Personalizado">Personalizado</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Año</TableCell>
                            <TableCell>Nombre</TableCell>
                            <TableCell>Fecha Inicio</TableCell>
                            <TableCell>Fecha Fin</TableCell>
                            <TableCell>Duración</TableCell>
                            <TableCell>Tipo</TableCell>
                            <TableCell>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredPeriods.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((period) => (
                            <TableRow key={`${period.id}-${period.isPersonalized ? 'p' : 'b'}`}>
                                <TableCell>{period.year}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={period.name === 'INVIERNO' ? 'Invierno' : 'Fin de Gestión'}
                                        color={period.name === 'INVIERNO' ? 'primary' : 'secondary'}
                                    />
                                </TableCell>
                                <TableCell>{formatShortDate(period.startDate)}</TableCell>
                                <TableCell>{formatShortDate(period.endDate)}</TableCell>
                                <TableCell>{getBusinessDays(new Date(period.startDate), new Date(period.endDate))} (días hábiles)</TableCell>
                                <TableCell>
                                    <Chip
                                        label={period.isPersonalized ? 'Personalizado' : tipoEmpleado === 'ADMINISTRATIVO' ? 'Administrativo' : 'General'}
                                        color={period.isPersonalized ? 'warning' : 'info'}
                                    />
                                </TableCell>
                                <TableCell>
                                    {period.isPersonalized ? (
                                        <>
                                            <IconButton
                                                onClick={() => handleOpenDialog(period)}
                                                color="primary"
                                                aria-label="editar"
                                            >
                                                <Edit />
                                            </IconButton>
                                            <IconButton
                                                onClick={() => handleDelete(period.id)}
                                                color="error"
                                                aria-label="eliminar"
                                            >
                                                <Delete />
                                            </IconButton>
                                        </>
                                    ) : (
                                        <IconButton onClick={handleGeneralRedirect}>
                                            <Launch fontSize="small" />
                                        </IconButton>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredPeriods.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Filas por página:"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
            />

            {/* Diálogo de edición */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>{selectedHolidayPeriod ? 'Editar Receso' : 'Nuevo Receso'}</DialogTitle>
                <DialogContent dividers>
                    <TextField
                        label="Tipo de Receso"
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
                        InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                        label="Fecha de Fin"
                        type="date"
                        fullWidth
                        margin="normal"
                        value={editHoliday?.endDate?.split('T')[0] || ''}
                        onChange={(e) => setEditHoliday({ ...editHoliday!, endDate: e.target.value })}
                        InputLabelProps={{ shrink: true }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} color="inherit">Cancelar</Button>
                    <Button onClick={handleEdit} color="primary" variant="contained">Guardar Cambios</Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={!!snackbarMessage}
                autoHideDuration={6000}
                onClose={() => setSnackbarMessage('')}
                message={snackbarMessage}
            />
        </Box>
    );
};

export default CombinedHolidayPeriods;
