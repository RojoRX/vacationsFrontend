import React, { useState, useEffect } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Typography, TextField, TablePagination, CircularProgress, Box,
    MenuItem, Select, FormControl, InputLabel,
    Chip
} from '@mui/material';
import axios from 'axios';
import getBusinessDays from 'src/utils/businessDays';

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
}

const CombinedHolidayPeriods: React.FC<CombinedHolidayPeriodsProps> = ({ userId, joinDate  }) => {
    const [combinedPeriods, setCombinedPeriods] = useState<HolidayPeriod[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [yearFilter, setYearFilter] = useState<string>('');
    const [nameFilter, setNameFilter] = useState<string>('');
    const [typeFilter, setTypeFilter] = useState<string>('');

    useEffect(() => {
        const fetchHolidayPeriods = async () => {
            try {
                setLoading(true);

                const [generalResponse, personalizedResponse] = await Promise.all([
                    axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/general-holiday-periods`),
                    axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user-holiday-periods/${userId}`)
                ]);

                const generalPeriods: HolidayPeriod[] = generalResponse.data.map((p: any) => ({
                    ...p,
                    isPersonalized: false
                }));

                const personalizedPeriods: HolidayPeriod[] = personalizedResponse.data.map((p: any) => ({
                    ...p,
                    isPersonalized: true
                }));

                const combined = [...generalPeriods];
                personalizedPeriods.forEach(personalized => {
                    const index = combined.findIndex(
                        g => g.name === personalized.name && g.year === personalized.year
                    );
                    if (index !== -1) {
                        combined[index] = personalized;
                    } else {
                        combined.push(personalized);
                    }
                });

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

        fetchHolidayPeriods();
    }, [userId]);

    const handleChangePage = (event: unknown, newPage: number) => setPage(newPage);
    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
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
        const isValidGeneral = period.isPersonalized || period.year >= joinYear;
        const matchesYear = yearFilter ? period.year.toString().includes(yearFilter) : true;
        const matchesName = nameFilter ? period.name === nameFilter : true;
        const matchesType = typeFilter
            ? (typeFilter === 'Personalizado' ? period.isPersonalized : !period.isPersonalized)
            : true;

        return matchesYear && matchesName && matchesType && isValidGeneral ;
    });

    const uniqueNames = [...new Set(combinedPeriods.map(p => p.name))];
    const uniqueTypes = ['General', 'Personalizado'];

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', padding: 3 }}><CircularProgress /></Box>;
    }

    if (error) {
        return <Box sx={{ padding: 3 }}><Typography color="error">{error}</Typography></Box>;
    }

    return (
        <Box sx={{ padding: 3 }}>
            <Typography variant="h4" gutterBottom>Recesos Combinados</Typography>

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
                        <MenuItem value="GENERAL">General</MenuItem>
                        <MenuItem value="Personalizado">Personalizado </MenuItem>
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
                            <TableCell>Duración </TableCell>
                            <TableCell>Tipo</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredPeriods.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((period) => (
                            <TableRow key={`${period.id}-${period.isPersonalized ? 'p' : 'g'}`}>
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
                                        label={period.isPersonalized ? 'Personalizado' : 'General'}
                                        color={period.isPersonalized ? 'warning' : 'info'}

                                    />
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
        </Box>
    );
};

export default CombinedHolidayPeriods;
