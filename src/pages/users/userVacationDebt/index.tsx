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
    Grid,
    useTheme,
    CircularProgress,
    Alert
} from '@mui/material';
import {
    BeachAccess as VacationIcon,
} from '@mui/icons-material';
import axios from 'src/lib/axios';

interface VacationDebtDetail {
    startDate: string;
    endDate: string;
    deuda: number;
    diasDeVacacion: number;
    diasDeVacacionRestantes: number;
    deudaAcumulativaHastaEstaGestion: number;
    deudaAcumulativaAnterior: number;
    diasDisponibles: number;
    contratoTipo?: string;
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
    startDate: string;
}

const safeNum = (v: any, decimals = 1) => {
    const n = Number(v ?? 0);
    if (isNaN(n)) return (0).toFixed(decimals);
    return n % 1 === 0 ? n.toString() : n.toFixed(decimals);
};

// Función para obtener el año de una fecha UTC sin problemas de zona horaria
const getUTCYear = (dateString: string): number => {
    if (!dateString) return NaN;
    // Extraer directamente el año de la cadena ISO
    const yearMatch = dateString.match(/^(\d{4})-/);
    return yearMatch ? parseInt(yearMatch[1], 10) : NaN;
};

const UserVacationDebt: React.FC<UserVacationDebtProps> = ({ ci, fechaIngreso, startDate }) => {
    const theme = useTheme();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<VacationDebtResponse | null>(null);

    useEffect(() => {
        const fetchVacationDebt = async () => {
            try {
                setLoading(true);

                // Parsear la fecha de ingreso de manera segura
                const ingresoParts = fechaIngreso.split('-');
                const ingresoYear = parseInt(ingresoParts[0], 10);
                const ingresoMonth = parseInt(ingresoParts[1], 10) - 1; // Mes 0-indexed
                const ingresoDay = parseInt(ingresoParts[2], 10);

                const now = new Date();
                const currentYear = now.getFullYear();

                // Construir endDate usando UTC para evitar problemas de zona horaria
                const endDate = new Date(Date.UTC(currentYear, ingresoMonth, ingresoDay))
                    .toISOString()
                    .split('T')[0];

                console.log('Solicitando datos con:', { ci, endDate });

                const response = await axios.get(
                    `${process.env.NEXT_PUBLIC_API_BASE_URL}/vacations/accumulated-debt`,
                    {
                        params: {
                            carnetIdentidad: ci,
                            endDate
                        }
                    }
                );

                console.log('Datos recibidos del backend:', response.data);
                setData(response.data);
            } catch (err) {
                console.error('Error fetching vacation debt:', err);
                if (axios.isAxiosError(err)) {
                    console.error('Error response:', err.response);
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

    if (!data) return null;

    return (
        <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <VacationIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                <Typography variant="h6">Deuda Acumulativa de Vacaciones</Typography>
            </Box>

            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle2" color="textSecondary">Total Dias Disponibles</Typography>
                        <Typography variant="h4" color={data.resumenGeneral.deudaTotal > 0 ? 'error' : 'success'}>
                            {safeNum(data.resumenGeneral.diasDisponiblesActuales, 1)} días
                        </Typography>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle2" color="textSecondary">Deuda Total</Typography>
                        <Typography variant="h4" color={data.resumenGeneral.deudaTotal > 0 ? 'error' : 'success'}>
                            {safeNum(data.resumenGeneral.deudaTotal, 1)} días
                        </Typography>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle2" color="textSecondary">Gestiones con Deuda</Typography>
                        <Typography variant="h4">
                            {data.resumenGeneral.gestionesConDeuda} / {data.detalles.length}
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Gestión</TableCell>
                            <TableCell align="right">Días Vacación (Antigüedad)</TableCell>
                            <TableCell align="right">Deuda Gestión</TableCell>
                            <TableCell align="right">Deuda Acumulada (Saldo)</TableCell>
                            <TableCell align="right">Días Disponibles</TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {data.detalles.map((detail, index) => {
                            // Usar la función segura para obtener años UTC
                            const startYear = getUTCYear(detail.startDate);
                            const endYear = getUTCYear(detail.endDate);
                            
                            let gestionLabel = 'N/A';
                            if (!isNaN(startYear) && !isNaN(endYear)) {
                                gestionLabel = `${startYear} - ${endYear}`;
                            }

                            const deudaGestion = Number(detail.deuda ?? 0);
                            const deudaAcum = Number(detail.deudaAcumulativaHastaEstaGestion ?? 0);
                            const diasVac = Number(detail.diasDeVacacion ?? 0);
                            const diasDisp = Number(detail.diasDisponibles ?? 0);

                            return (
                                <TableRow key={index}>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight="medium">
                                            {gestionLabel}
                                        </Typography>
                                        {detail.contratoTipo === 'OTRO' && (
                                            <Typography variant="caption" color="text.secondary">
                                                Contrato: {detail.contratoTipo}
                                            </Typography>
                                        )}
                                    </TableCell>

                                    <TableCell align="right">
                                        <Typography fontWeight="bold">{safeNum(diasVac, 0)}</Typography>
                                    </TableCell>

                                    <TableCell align="right">
                                        <Typography
                                            fontWeight="bold"
                                            color={deudaGestion > 0 ? 'error' : 'success'}
                                        >
                                            {safeNum(deudaGestion, 1)}
                                        </Typography>
                                    </TableCell>

                                    <TableCell align="right">
                                        <Typography
                                            color={deudaAcum > 0 ? 'error' : 'success'}
                                            fontWeight="bold"
                                        >
                                            {safeNum(deudaAcum, 1)}
                                        </Typography>
                                    </TableCell>

                                    <TableCell align="right">
                                        <Typography
                                            fontWeight="bold"
                                            color={diasDisp > 0 ? 'success.main' : 'text.primary'}
                                        >
                                            {safeNum(diasDisp, 1)}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

            <Box sx={{ mt: 3, p: 2, bgcolor: theme.palette.grey[100], borderRadius: 1 }}>
                <Typography variant="body2">
                    <strong>Primera gestión:</strong> {getUTCYear(data.resumenGeneral.primeraGestion)}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                    <strong>Última gestión:</strong> {getUTCYear(data.resumenGeneral.ultimaGestion)}
                </Typography>
            </Box>
        </Paper>
    );
};

export default UserVacationDebt;