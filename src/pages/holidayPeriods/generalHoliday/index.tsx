import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    Box,
    Button,
    CircularProgress,
    Paper,
    Typography,
    Chip,
    IconButton,
    Tooltip,
    Grid,
    TextField,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    SelectChangeEvent,
    Badge,
    ToggleButton,
    ToggleButtonGroup
} from '@mui/material';
import {
    CalendarToday,
    Refresh,
    FilterAlt,
    Event,
    Today,
    DateRange,
    ChevronLeft,
    ChevronRight
} from '@mui/icons-material';
import { format, parseISO, getYear, getMonth, getDate, isWithinInterval, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import useUser from 'src/hooks/useUser';
import SnowflakeIcon from '@mui/icons-material/AcUnit'; // Invierno
import HolidayVillageIcon from '@mui/icons-material/HolidayVillage'; // Navidad/Fin de gestión

interface HolidayPeriod {
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
const getPeriodColorAndIcon = (name: string) => {
    if (name === 'FINDEGESTION') {
        return { color: '#d32f2f', icon: <HolidayVillageIcon fontSize="small" /> }; // Rojo oscuro
    }
    if (name === 'INVIERNO') {
        return { color: '#0288d1', icon: <SnowflakeIcon fontSize="small" /> }; // Azul invierno
    }
    return { color: '#4caf50', icon: <Today fontSize="small" /> }; // Default
};

const GeneralHolidayCalendar: AclComponent = () => {
    const [holidayPeriods, setHolidayPeriods] = useState<HolidayPeriod[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedYear, setSelectedYear] = useState<number>(getYear(new Date()));
    const [currentMonth, setCurrentMonth] = useState<number>(getMonth(new Date())); // inicia en el mes actual
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'FINDEGESTION' | 'INVIERNO'>('all');
    const [userNavigated, setUserNavigated] = useState(false); // <<<<<< NUEVO: saber si el usuario ya navegó
    const user = useUser();

    useEffect(() => {
        fetchHolidayPeriods();
    }, []);

    const filteredPeriods = holidayPeriods.filter(period => {
        const start = parseISO(period.startDate);
        const end = parseISO(period.endDate);

        // Coincide si el receso toca algún día del año seleccionado
        const periodIncludesSelectedYear =
            getYear(start) === selectedYear ||
            getYear(end) === selectedYear ||
            (getYear(start) < selectedYear && getYear(end) > selectedYear);

        const matchesSearch = period.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || period.name === filterType;

        return periodIncludesSelectedYear && matchesSearch && matchesType;
    });


    useEffect(() => {
        if (!userNavigated) { // <<<< SOLO SI EL USUARIO NO NAVEGÓ
            if (holidayPeriods.length > 0) {
                const sortedPeriods = [...holidayPeriods].sort((a, b) =>
                    new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
                );
                const firstPeriodThisYear = sortedPeriods.find(p => p.year === selectedYear);
                if (firstPeriodThisYear) {
                    const periodMonth = getMonth(parseISO(firstPeriodThisYear.startDate));
                    setCurrentMonth(periodMonth);
                }
            }
        }
    }, [holidayPeriods, selectedYear, userNavigated]); // <<<< agregamos userNavigated como dependencia

    useEffect(() => {
        if (!userNavigated) { // <<<< SOLO SI EL USUARIO NO NAVEGÓ
            if (filteredPeriods.length > 0) {
                const sortedFiltered = [...filteredPeriods].sort((a, b) =>
                    new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
                );
                const firstFilteredMonth = getMonth(parseISO(sortedFiltered[0].startDate));
                setCurrentMonth(firstFilteredMonth);
            }
        }
    }, [filteredPeriods, userNavigated]); // <<<< agregamos userNavigated como dependencia

    const fetchHolidayPeriods = () => {
        setLoading(true);
        axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/general-holiday-periods`)
            .then((response) => {
                setHolidayPeriods(response.data);
            })
            .catch(() => {
                setError('Error al obtener los períodos de receso');
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const handleYearChange = (event: SelectChangeEvent<number>) => {
        setSelectedYear(event.target.value as number);
        setUserNavigated(false); // <<<<< el usuario no ha navegado cuando cambia año
    };

    const handleMonthChange = (newMonth: number) => {
        if (newMonth > 11) {
            setSelectedYear(prev => prev + 1);  // Si el mes es mayor que 11, avanzamos al siguiente año
            setCurrentMonth(0);  // Enero
        } else if (newMonth < 0) {
            setSelectedYear(prev => prev - 1);  // Si el mes es menor que 0, retrocedemos al año anterior
            setCurrentMonth(11);  // Diciembre
        } else {
            setCurrentMonth(newMonth);  // Si está dentro del rango de meses, solo actualizamos el mes
        }
        setUserNavigated(true);  // Indicamos que el usuario ya navegó
    };



    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setUserNavigated(false); // <<<<< el usuario no ha navegado cuando cambia la búsqueda
    };

    const handleFilterType = (event: React.MouseEvent<HTMLElement>, newFilter: 'all' | 'FINDEGESTION' | 'INVIERNO') => {
        if (newFilter !== null) {
            setFilterType(newFilter);
            setUserNavigated(false); // <<<<< el usuario no ha navegado cuando cambia el filtro
        }
    };

    const handleRefresh = () => {
        fetchHolidayPeriods();
        setUserNavigated(false); // <<<<< al refrescar tampoco
    };

    const formatDate = (dateString: string) => {
        return format(parseISO(dateString), 'PPP', { locale: es });
    };



    const getMonthDays = (month: number, year: number) => {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        return eachDayOfInterval({ start: firstDay, end: lastDay });
    };

    const isHoliday = (date: Date) => {
        return filteredPeriods.some(period => {
            const start = parseISO(period.startDate);
            const end = parseISO(period.endDate);
            return isWithinInterval(date, { start, end });
        });
    };

    const getHolidayName = (date: Date) => {
        const holiday = filteredPeriods.find(period => {
            const start = parseISO(period.startDate);
            const end = parseISO(period.endDate);
            return isWithinInterval(date, { start, end });
        });
        return holiday ? holiday.name : '';
    };

    const monthDays = getMonthDays(currentMonth, selectedYear);
    const monthName = format(new Date(selectedYear, currentMonth, 1), 'MMMM yyyy', { locale: es });

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
                <Typography variant="h6" color="error">
                    {error}
                </Typography>
                <Button onClick={fetchHolidayPeriods} sx={{ ml: 2 }} startIcon={<Refresh />}>
                    Reintentar
                </Button>
            </Box>
        );
    }
    return (
        <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" component="h2" sx={{ display: 'flex', alignItems: 'center' }}>
                    <CalendarToday sx={{ mr: 1, color: 'primary.main' }} />
                    Calendario de Recesos Generales
                </Typography>

                <Tooltip title="Recargar datos">
                    <IconButton onClick={handleRefresh} color="primary">
                        <Refresh />
                    </IconButton>
                </Tooltip>
            </Box>

            {/* Filtros y controles */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="Buscar por nombre..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        InputProps={{
                            startAdornment: <FilterAlt sx={{ color: 'action.active', mr: 1 }} />
                        }}
                        size="small"
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Año</InputLabel>
                        <Select
                            value={selectedYear}
                            onChange={handleYearChange}
                            label="Año"
                        >
                            {Array.from(new Set(holidayPeriods.map(p => p.year))).sort().map(year => (
                                <MenuItem key={year} value={year}>{year}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                    <ToggleButtonGroup
                        value={filterType}
                        onChange={handleFilterType}
                        exclusive
                        fullWidth
                    >
                        <ToggleButton value="all">Todos</ToggleButton>
                        <ToggleButton value="FINDEGESTION">Fin de Gestión</ToggleButton>
                        <ToggleButton value="INVIERNO">Invierno</ToggleButton>
                    </ToggleButtonGroup>
                </Grid>
            </Grid>

            {/* Controles de navegación del mes */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <IconButton onClick={() => handleMonthChange(currentMonth - 1)}><ChevronLeft /></IconButton>
                <Typography variant="h6">{monthName}</Typography>
                <IconButton onClick={() => handleMonthChange(currentMonth + 1)}><ChevronRight /></IconButton>
            </Box>

            {/* Calendario */}
            <Box sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 1,
                mb: 3
            }}>
                {/* Encabezados de días */}
                {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, index) => (
                    <Typography key={index} align="center" fontWeight="bold">
                        {day}
                    </Typography>
                ))}

                {/* Días del mes */}
                {monthDays.map((day, index) => {
                    const isHolidayDay = isHoliday(day);
                    const holiday = filteredPeriods.find(period =>
                        isWithinInterval(day, {
                            start: parseISO(period.startDate),
                            end: parseISO(period.endDate),
                        })
                    );

                    const { color } = getPeriodColorAndIcon(holiday?.name || '');

                    return (
                        <Tooltip key={index} title={isHolidayDay ? holiday?.name : ''} arrow>
                            <Box
                                sx={{
                                    p: 1,
                                    height: '40px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: 1,
                                    bgcolor: isHolidayDay ? color : 'transparent',
                                    color: isHolidayDay ? '#fff' : 'text.primary',
                                    border: '1px solid #e0e0e0',
                                    fontWeight: isHolidayDay ? 'bold' : 'normal',
                                }}
                            >
                                {getDate(day)}
                            </Box>
                        </Tooltip>
                    );
                })}
            </Box>

            {/* Leyenda y lista de recesos */}
            <Grid container spacing={2}>
                {filteredPeriods.map(period => {
                    const isWinter = period.name === 'INVIERNO';
                    const isEndOfYear = period.name === 'FINDEGESTION';

                    const styles = {
                        backgroundColor: isWinter ? '#1976d2' : '#ef6c00',
                        borderLeft: `6px solid ${isWinter ? '#1565c0' : '#e65100'}`,
                        icon: isWinter ? '❄️' : '🎄',
                        svgIcon: isWinter
                            ? '/images/icons/winter.png' // Usa tus propios SVGs
                            : '/images/icons/christmas.png',
                    };

                    return (
                        <Grid item xs={12} sm={6} key={period.id}>
                            <Paper elevation={3} sx={{ p: 2, position: 'relative', overflow: 'hidden', ...styles }}>
                                {/* Imagen decorativa superpuesta */}
                                <Box
                                    component="img"
                                    src={styles.svgIcon}
                                    alt="Decoración"
                                    sx={{
                                        position: 'absolute',
                                        right: 10,
                                        top: 10,
                                        width: 60, // ajusta el tamaño aquí
                                        height: 'auto',
                                        opacity: 0.8, // opcional, si quieres un efecto tenue
                                        zIndex: 1,
                                    }}
                                />

                                {/* Contenido principal */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: 'white', zIndex: 2, position: 'relative' }}>
                                    <Box sx={{ fontSize: 20 }}>{styles.icon}</Box>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'white' }}>
                                        {period.name} ({period.year})
                                    </Typography>

                                </Box>

                                <Typography variant="body2" sx={{ color: 'white', zIndex: 2, position: 'relative' }}>
                                    <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Today fontSize="small" />
                                        {formatDate(period.startDate)} - {formatDate(period.endDate)}
                                    </Box>
                                </Typography>

                                <Typography variant="body2" sx={{ mt: 1, color: 'white', zIndex: 2, position: 'relative' }}>
                                    Duración:{' '}
                                    {Math.ceil(
                                        (new Date(period.endDate).getTime() - new Date(period.startDate).getTime()) /
                                        (1000 * 60 * 60 * 24) +
                                        1
                                    )} días
                                </Typography>
                            </Paper>
                        </Grid>
                    );
                })}
            </Grid>


        </Paper>
    );
};

GeneralHolidayCalendar.acl = {
    action: 'read',
    subject: 'holiday-periods',
};

export default GeneralHolidayCalendar;