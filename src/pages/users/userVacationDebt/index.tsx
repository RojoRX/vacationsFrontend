import React, { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Divider,
    CircularProgress,
    Alert,
    Grid,
    useTheme
} from '@mui/material';
import {
    Event as EventIcon,
    BeachAccess as VacationIcon,
    MoneyOff as DebtIcon,
    AttachMoney as PaidIcon
} from '@mui/icons-material';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatDate } from 'src/utils/dateUtils';

interface VacationDebtDetail {
    startDate: string;
    endDate: string;
    deuda: number;
    diasDeVacacion: number;
    diasDeVacacionRestantes: number;
    deudaAcumulativaHastaEstaGestion: number;
    deudaAcumulativaAnterior: number;
    diasDisponibles: number;
}

interface VacationDebtSummary {
    deudaTotal: number;
    diasDisponiblesActuales: number;
    gestionesConDeuda: number;
    gestionesSinDeuda: number;
    promedioDeudaPorGestion: number;
    primeraGestion: string;
    ultimaGestion: string;
}

interface VacationDebtResponse {
    deudaAcumulativa: number;
    detalles: VacationDebtDetail[];
    resumenGeneral: VacationDebtSummary;
}

interface UserVacationDebtProps {
    ci: string;
    fechaIngreso: string;
    startDate: string; // nuevo
}

const UserVacationDebt: React.FC<UserVacationDebtProps> = ({ ci, fechaIngreso, startDate }) => {
    const theme = useTheme();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<VacationDebtResponse | null>(null);

    useEffect(() => {
        const fetchVacationDebt = async () => {
            try {
                setLoading(true);

                // Convertir año recibido en un Date con mes y día de la fecha de ingreso
                const ingreso = parseISO(fechaIngreso);
                const now = new Date();
                const startDateFormatted = new Date(Number(startDate), ingreso.getMonth(), ingreso.getDate())
                    .toISOString()
                    .split('T')[0];

                const endDate = new Date(now.getFullYear(), ingreso.getMonth(), ingreso.getDate())
                    .toISOString()
                    .split('T')[0];

                const response = await axios.get(
                    `${process.env.NEXT_PUBLIC_API_BASE_URL}/vacations/debt-since-date`,
                    {
                        params: {
                            carnetIdentidad: ci,
                            startDate: startDateFormatted,
                            endDate
                        }
                    }
                );


                setData(response.data);
            } catch (err) {
                console.error('Error fetching vacation debt:', err);

                if (axios.isAxiosError(err)) {
                    console.error('Error response:', err.response); // Ver detalles de la respuesta de la API
                }

                setError('Error al obtener la deuda desde la fecha indicada');
            } finally {
                setLoading(false);
            }
        };

        if (ci && fechaIngreso && startDate) {
            fetchVacationDebt();
        }
    }, [ci, fechaIngreso, startDate]);


    if (loading) {
        return (
            <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ my: 2 }}>
                {error}
            </Alert>
        );
    }

    if (!data) {
        return null;
    }

    return (
        <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <VacationIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                <Typography variant="h6">Deuda Acumulativa de Vacaciones</Typography>
            </Box>

            {/* Resumen General */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, }}>
                        <Typography variant="subtitle2" color="textSecondary">
                            Total Dias Disponibles
                        </Typography>
                        <Typography variant="h4" color={data.resumenGeneral.deudaTotal > 0 ? 'error' : 'success'}>
                            {data.resumenGeneral.diasDisponiblesActuales} días
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2}}>
                        <Typography variant="subtitle2" color="textSecondary">
                            Deuda Total
                        </Typography>
                        <Typography variant="h4" color={data.resumenGeneral.deudaTotal > 0 ? 'error' : 'success'}>
                            {data.resumenGeneral.deudaTotal} días
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle2" color="textSecondary">
                            Gestiones con Deuda
                        </Typography>
                        <Typography variant="h4">
                            {data.resumenGeneral.gestionesConDeuda} / {data.detalles.length}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle2" color="textSecondary">
                            Promedio de Deuda
                        </Typography>
                        <Typography variant="h4">
                            {data.resumenGeneral.promedioDeudaPorGestion.toFixed(1)} días/gestión
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>

            {/* Tabla de Detalles */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Gestión</TableCell>
                            <TableCell align="right">Días Vacación (Antiguedad)</TableCell>
                            <TableCell align="right">Deuda Gestion</TableCell>
                            <TableCell align="right">Deuda Acumulada</TableCell>
                            <TableCell align="right">Días Disponibles</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data.detalles.map((detail, index) => (
                            <TableRow key={index}>
                                <TableCell>
                                    {formatDate(detail.startDate)} - {formatDate(detail.endDate)}
                                </TableCell>
                                <TableCell align="right">{detail.diasDeVacacion}</TableCell>
                                <TableCell align="right">
                                    <Chip
                                        label={detail.deuda}
                                        color={detail.deuda > 0 ? 'error' : 'success'}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell align="right">{detail.deudaAcumulativaHastaEstaGestion}</TableCell>
                                <TableCell align="right">{detail.diasDisponibles}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Resumen adicional */}
            <Box sx={{ mt: 3, p: 2, bgcolor: theme.palette.grey[100], borderRadius: 1 }}>
                <Typography variant="body2">
                    <strong>Primera gestión:</strong> {formatDate(data.resumenGeneral.primeraGestion)}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                    <strong>Última gestión:</strong> {formatDate(data.resumenGeneral.ultimaGestion)}
                </Typography>
            </Box>
        </Paper>
    );
};

export default UserVacationDebt;