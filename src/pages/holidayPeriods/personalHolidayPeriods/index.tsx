import React, { useEffect, useState } from 'react';
import axios from 'src/lib/axios';
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
import {
    format,
    parseISO,
    getYear,
    getMonth,
    getDate,
    isWithinInterval,
    eachDayOfInterval,
    startOfMonth,
    endOfMonth,
    addDays,
    getDay,
    isSameMonth,
    isSameDay
} from 'date-fns';
import { es } from 'date-fns/locale';
import useUser from 'src/hooks/useUser';
import SnowflakeIcon from '@mui/icons-material/AcUnit';
import HolidayVillageIcon from '@mui/icons-material/HolidayVillage';
import { formatDate } from 'src/utils/dateUtils';

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
        return { color: '#d32f2f', icon: <HolidayVillageIcon fontSize="small" /> };
    }
    if (name === 'INVIERNO') {
        return { color: '#0288d1', icon: <SnowflakeIcon fontSize="small" /> };
    }
    return { color: '#4caf50', icon: <Today fontSize="small" /> };
};

const PersonalHolidayCalendar: AclComponent = () => {
    const [holidayPeriods, setHolidayPeriods] = useState<HolidayPeriod[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedYear, setSelectedYear] = useState<number>(getYear(new Date()));
    const [currentMonth, setCurrentMonth] = useState<number>(getMonth(new Date()));
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'FINDEGESTION' | 'INVIERNO'>('all');
    const [userNavigated, setUserNavigated] = useState(false);
    const user = useUser();

    useEffect(() => {
        if (user?.id) {
            fetchHolidayPeriods();
        }
    }, [user]); // Se ejecuta solo cuando el usuario esté definido

    const filteredPeriods = holidayPeriods.filter(period => {
        const start = parseISO(period.startDate);
        const end = parseISO(period.endDate);

        const periodIncludesSelectedYear =
            getYear(start) === selectedYear ||
            getYear(end) === selectedYear ||
            (getYear(start) < selectedYear && getYear(end) > selectedYear);

        const matchesSearch = period.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || period.name === filterType;

        return periodIncludesSelectedYear && matchesSearch && matchesType;
    });

    useEffect(() => {
        if (!userNavigated) {
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
    }, [holidayPeriods, selectedYear, userNavigated]);

    const fetchHolidayPeriods = () => {
        if (!user?.id) return;
        setLoading(true);
        axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user-holiday-periods/${user.id}`)
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
        setUserNavigated(false);
    };

    const handleMonthChange = (newMonth: number) => {
        if (newMonth > 11) {
            setSelectedYear(prev => prev + 1);
            setCurrentMonth(0);
        } else if (newMonth < 0) {
            setSelectedYear(prev => prev - 1);
            setCurrentMonth(11);
        } else {
            setCurrentMonth(newMonth);
        }
        setUserNavigated(true);
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setUserNavigated(false);
    };

    const handleFilterType = (event: React.MouseEvent<HTMLElement>, newFilter: 'all' | 'FINDEGESTION' | 'INVIERNO') => {
        if (newFilter !== null) {
            setFilterType(newFilter);
            setUserNavigated(false);
        }
    };

    const handleRefresh = () => {
        fetchHolidayPeriods();
        setUserNavigated(false);
    };
    const isWeekend = (date: Date) => {
        const day = date.getDay();
        return day === 0 || day === 6;
    };

    const isHoliday = (date: Date) => {
        if (isWeekend(date)) return false;

        const currentDateStr = format(date, 'yyyy-MM-dd'); // Formato ISO sin hora

        return filteredPeriods.some(period => {
            const startDateStr = period.startDate.split('T')[0];
            const endDateStr = period.endDate.split('T')[0];
            return currentDateStr >= startDateStr && currentDateStr <= endDateStr;
        });
    };
    const calculateWorkingDays = (startDate: string, endDate: string) => {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const days = eachDayOfInterval({ start, end });
        return days.filter(day => !isWeekend(day)).length;
    };

    const renderCalendarDays = () => {
        const monthStart = startOfMonth(new Date(selectedYear, currentMonth));
        const monthEnd = endOfMonth(monthStart);

        // CORRECCIÓN: Ajustamos para que el calendario comience en Domingo
        // Obtenemos el día de la semana (0=Domingo, 1=Lunes, etc.)
        const firstDayOfWeek = getDay(monthStart);
        // Calculamos cuántos días del mes anterior mostrar
        const daysFromPrevMonth = firstDayOfWeek === 0 ? 0 : firstDayOfWeek;

        const startDate = addDays(monthStart, -daysFromPrevMonth);
        const endDate = addDays(monthEnd, 6 - getDay(monthEnd));

        const days = eachDayOfInterval({ start: startDate, end: endDate });
        const weeks = [];

        for (let i = 0; i < days.length; i += 7) {
            weeks.push(days.slice(i, i + 7));
        }

        // Encabezados de días (comenzando en Domingo)
        const dayHeaders = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

        return (
            <>
                {/* Encabezados de días */}
                <Box display="flex">
                    {dayHeaders.map((day, index) => (
                        <Typography
                            key={index}
                            align="center"
                            fontWeight="bold"
                            sx={{ flex: 1, p: 1 }}
                        >
                            {day}
                        </Typography>
                    ))}
                </Box>

                {/* Días del calendario */}
                {weeks.map((week, weekIndex) => (
                    <Box key={weekIndex} display="flex">
                        {week.map((day, dayIndex) => {
                            const isCurrentMonth = isSameMonth(day, monthStart);
                            const isWeekendDay = getDay(day) === 0 || getDay(day) === 6; // 0=Domingo, 6=Sábado
                            const isHolidayDay = isCurrentMonth && !isWeekendDay && isHoliday(day);

                            const holiday = isHolidayDay ? filteredPeriods.find(period => {
                                const periodStart = period.startDate.split('T')[0];
                                const periodEnd = period.endDate.split('T')[0];
                                const dayStr = format(day, 'yyyy-MM-dd');
                                return dayStr >= periodStart && dayStr <= periodEnd;
                            }) : null;

                            const { color } = getPeriodColorAndIcon(holiday?.name || '');

                            return (
                                <Tooltip
                                    key={dayIndex}
                                    title={isHolidayDay ? `${holiday?.name} (${format(day, 'dd/MM/yyyy')})` : isWeekendDay ? 'Fin de semana' : ''}
                                    arrow
                                >
                                    <Box
                                        sx={{
                                            flex: 1,
                                            p: 1,
                                            height: '40px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: 1,
                                            bgcolor: isHolidayDay ? color : isWeekendDay ? '#f5f5f5' : 'transparent',
                                            color: isHolidayDay ? '#fff' :
                                                !isCurrentMonth ? 'text.disabled' :
                                                    isWeekendDay ? 'text.secondary' : 'text.primary',
                                            border: '1px solid #e0e0e0',
                                            fontWeight: isHolidayDay ? 'bold' : 'normal',
                                            opacity: !isCurrentMonth ? 0.5 : 1
                                        }}
                                    >
                                        {getDate(day)}
                                    </Box>
                                </Tooltip>
                            );
                        })}
                    </Box>
                ))}
            </>
        );
    };

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
            {/* Encabezado y controles */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" component="h2" sx={{ display: 'flex', alignItems: 'center' }}>
                    <CalendarToday sx={{ mr: 1, color: 'primary.main' }} />
                    Calendario de Recesos Personales
                </Typography>
                <Tooltip title="Recargar datos">
                    <IconButton onClick={handleRefresh} color="primary">
                        <Refresh />
                    </IconButton>
                </Tooltip>
            </Box>

            {/* Filtros */}
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

            {/* Navegación del mes */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <IconButton onClick={() => handleMonthChange(currentMonth - 1)}><ChevronLeft /></IconButton>
                <Typography variant="h6">{monthName}</Typography>
                <IconButton onClick={() => handleMonthChange(currentMonth + 1)}><ChevronRight /></IconButton>
            </Box>

            {/* Calendario */}
            <Box sx={{ mb: 3 }}>



                {/* Días del calendario */}
                {renderCalendarDays()}
            </Box>

            {/* Lista de recesos */}
            <Grid container spacing={2}>
                {filteredPeriods.map(period => {
                    const isWinter = period.name === 'INVIERNO';
                    const styles = {
                        backgroundColor: isWinter ? '#1976d2' : '#ef6c00',
                        borderLeft: `6px solid ${isWinter ? '#1565c0' : '#e65100'}`,
                        icon: isWinter ? '❄️' : '🎄',
                    };

                    return (
                        <Grid item xs={12} sm={6} key={period.id}>
                            <Paper elevation={3} sx={{
                                p: 2,
                                position: 'relative',
                                overflow: 'hidden',
                                backgroundColor: styles.backgroundColor,
                                borderLeft: styles.borderLeft
                            }}>
                                <Box sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    mb: 1,
                                    color: 'white',
                                    zIndex: 2,
                                    position: 'relative'
                                }}>
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
                                    Duración: {calculateWorkingDays(period.startDate, period.endDate)} días hábiles
                                </Typography>
                            </Paper>
                        </Grid>
                    );
                })}
            </Grid>
        </Paper>
    );
};

PersonalHolidayCalendar.acl = {
    action: 'read',
    subject: 'personal-holiday-periods',
};

export default PersonalHolidayCalendar;