import React, { useState, useEffect } from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import {
    Box,
    TextField,
    Grid,
    Paper,
    Typography,
    Chip,
    CircularProgress,
    Button,
    ToggleButtonGroup,
    ToggleButton,
    IconButton,
    Stack
} from '@mui/material';
import {
    CalendarToday,
    Warning,
    ChevronLeft,
    ChevronRight,
    Refresh
} from '@mui/icons-material';
import {
    isWithinInterval,
    parseISO,
    format,
    getYear,
    getMonth,
    getDate,
    eachDayOfInterval
} from 'date-fns';
import axios from 'src/lib/axios';

interface HolidayPeriod {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
    year: number;
}

interface DateRangePickerWithHolidaysProps {
    startDate: Date | null;
    endDate: Date | null;
    onStartDateChange: (date: Date | null) => void;
    onEndDateChange: (date: Date | null) => void;
    disabled?: boolean;
    showEndDate?: boolean; // Nueva prop
}

const DateRangePickerWithHolidays: React.FC<DateRangePickerWithHolidaysProps> = ({
    startDate,
    endDate,
    onStartDateChange,
    onEndDateChange,
    disabled = false,
    showEndDate = true,
}) => {
    const [holidayPeriods, setHolidayPeriods] = useState<HolidayPeriod[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedYear, setSelectedYear] = useState<number>(getYear(new Date()));
    const [currentMonth, setCurrentMonth] = useState<number>(getMonth(new Date()));
    const [filterType, setFilterType] = useState<'all' | 'FINDEGESTION' | 'INVIERNO'>('all');

    useEffect(() => {
        fetchHolidayPeriods();
    }, []);

    const fetchHolidayPeriods = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/general-holiday-periods`);
            setHolidayPeriods(response.data);
        } catch (err) {
            setError('Error al obtener los períodos de receso');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const isDateInHolidayPeriod = (date: Date) => {
        return holidayPeriods.some(period => {
            const start = parseISO(period.startDate);
            const end = parseISO(period.endDate);
            return isWithinInterval(date, { start, end });
        });
    };

    const getHolidayName = (date: Date) => {
        const period = holidayPeriods.find(p => {
            const start = parseISO(p.startDate);
            const end = parseISO(p.endDate);
            return isWithinInterval(date, { start, end });
        });
        return period?.name || '';
    };

    const handleStartDateChange = (date: Date | null) => {
        if (date && isDateInHolidayPeriod(date)) {
            const holidayName = getHolidayName(date);
            alert(`La fecha seleccionada cae en el período de receso: ${holidayName}`);
            return;
        }
        onStartDateChange(date);
    };

    const handleEndDateChange = (date: Date | null) => {
        if (date) {
            if (isDateInHolidayPeriod(date)) {
                const holidayName = getHolidayName(date);
                alert(`La fecha seleccionada cae en el período de receso: ${holidayName}`);
                return;
            }

            if (startDate && date < startDate) {
                alert('La fecha de fin no puede ser anterior a la fecha de inicio');
                return;
            }
        }
        onEndDateChange(date);
    };

    const handleRefresh = () => {
        fetchHolidayPeriods();
    };

    const handleFilterType = (
        event: React.MouseEvent<HTMLElement>,
        newFilter: 'all' | 'FINDEGESTION' | 'INVIERNO'
    ) => {
        if (newFilter !== null) {
            setFilterType(newFilter);
        }
    };

    const getPeriodColor = (name: string) => {
        if (name === 'FINDEGESTION') return '#d32f2f';
        if (name === 'INVIERNO') return '#0288d1';
        return '#4caf50';
    };

    const getPeriodDisplayName = (name: string) => {
        if (name === 'FINDEGESTION') return 'Fin de Gestión';
        if (name === 'INVIERNO') return 'Invierno';
        return 'General';
    };

    const filteredPeriods = holidayPeriods.filter(period => {
        const start = parseISO(period.startDate);
        const end = parseISO(period.endDate);
        return (
            (getYear(start) === selectedYear ||
                getYear(end) === selectedYear ||
                (getYear(start) < selectedYear && getYear(end) > selectedYear)) &&
            (filterType === 'all' || period.name === filterType)
        );
    });

    const monthDays = eachDayOfInterval({
        start: new Date(selectedYear, currentMonth, 1),
        end: new Date(selectedYear, currentMonth + 1, 0)
    });

    const monthName = format(new Date(selectedYear, currentMonth, 1), 'MMMM yyyy', { locale: es });

    if (loading) return <CircularProgress size={24} />;
    if (error) return <Typography color="error">{error}</Typography>;

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                        <CalendarToday sx={{ mr: 1 }} />
                        Selección de Fechas con Recesos
                    </Typography>
                    <Button
                        onClick={handleRefresh}
                        startIcon={<Refresh />}
                        size="small"
                    >
                        Actualizar
                    </Button>
                </Box>

                <Grid container spacing={2} mb={3}>
                    <Grid item xs={12} md={6}>
                        <DatePicker
                            label="Fecha de inicio"
                            value={startDate}
                            onChange={handleStartDateChange}
                            disabled={disabled}
                            shouldDisableDate={isDateInHolidayPeriod}
                            slotProps={{
                                textField: {
                                    fullWidth: true,
                                },
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <DatePicker
                            label="Fecha de fin"
                            value={endDate}
                            onChange={handleEndDateChange}
                            disabled={disabled || !startDate}
                            shouldDisableDate={isDateInHolidayPeriod}
                            minDate={startDate ?? undefined}
                            slotProps={{
                                textField: {
                                    fullWidth: true,
                                },
                            }}
                        />
                    </Grid>
                </Grid>

                {/* Visualización de calendario */}
                <Box mb={3}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <IconButton onClick={() => setCurrentMonth(currentMonth - 1)}><ChevronLeft /></IconButton>
                        <Typography variant="h6">{monthName}</Typography>
                        <IconButton onClick={() => setCurrentMonth(currentMonth + 1)}><ChevronRight /></IconButton>
                    </Box>


                    <ToggleButtonGroup
                        value={filterType}
                        onChange={handleFilterType}
                        exclusive
                        fullWidth
                        sx={{ mb: 2 }}
                    >
                        <ToggleButton value="all">Todos</ToggleButton>
                        <ToggleButton value="FINDEGESTION">Fin de Gestión</ToggleButton>
                        <ToggleButton value="INVIERNO">Invierno</ToggleButton>
                    </ToggleButtonGroup>

                    <Box sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(7, 1fr)',
                        gap: 1
                    }}>
                        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, i) => (
                            <Typography key={i} align="center" fontWeight="bold">
                                {day}
                            </Typography>
                        ))}

                        {monthDays.map((day, i) => {
                            const isHoliday = isDateInHolidayPeriod(day);
                            const period = filteredPeriods.find(p =>
                                isWithinInterval(day, {
                                    start: parseISO(p.startDate),
                                    end: parseISO(p.endDate)
                                })
                            );

                            return (
                                <Box
                                    key={i}
                                    sx={{
                                        p: 1,
                                        height: 40,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: 1,
                                        bgcolor: isHoliday ? getPeriodColor(period?.name || '') : 'transparent',
                                        color: isHoliday ? '#fff' : 'text.primary',
                                        border: '1px solid #e0e0e0',
                                        fontWeight: isHoliday ? 'bold' : 'normal',
                                    }}
                                >
                                    {getDate(day)}
                                </Box>
                            );
                        })}
                    </Box>
                </Box>

                {/* Leyenda de colores */}
                <Box sx={{ 
                    backgroundColor: 'background.paper',
                    p: 2,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    mb: 2
                }}>
                    <Typography variant="subtitle1" gutterBottom>
                        Leyenda de colores:
                    </Typography>
                    <Stack direction="row" spacing={2}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{
                                width: 20,
                                height: 20,
                                backgroundColor: '#d32f2f',
                                mr: 1,
                                borderRadius: '4px'
                            }} />
                            <Typography variant="body2">Fin de Gestión</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{
                                width: 20,
                                height: 20,
                                backgroundColor: '#0288d1',
                                mr: 1,
                                borderRadius: '4px'
                            }} />
                            <Typography variant="body2">Invierno</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{
                                width: 20,
                                height: 20,
                                backgroundColor: '#4caf50',
                                mr: 1,
                                borderRadius: '4px'
                            }} />
                            <Typography variant="body2">General</Typography>
                        </Box>
                    </Stack>
                </Box>

                {startDate && isDateInHolidayPeriod(startDate) && (
                    <Chip
                        icon={<Warning />}
                        label={`Fecha inicial en receso: ${getHolidayName(startDate)}`}
                        color="error"
                        variant="outlined"
                        sx={{ mb: 1 }}
                    />
                )}

                {endDate && isDateInHolidayPeriod(endDate) && (
                    <Chip
                        icon={<Warning />}
                        label={`Fecha final en receso: ${getHolidayName(endDate)}`}
                        color="error"
                        variant="outlined"
                    />
                )}
            </Paper>
        </LocalizationProvider>
    );
};

export default DateRangePickerWithHolidays;