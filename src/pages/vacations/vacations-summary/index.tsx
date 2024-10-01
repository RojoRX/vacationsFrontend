// ** Importaciones
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Icon from 'src/@core/components/icon';
import ApexChartWrapper from 'src/@core/styles/libs/react-apexcharts';
import { vacationDataMock } from 'src/mocks/vacationDataMock';
import { useEffect, useState } from 'react';

// Componente de Resumen de Vacaciones
const VacationSummary = () => {
    const [vacationData, setVacationData] = useState(vacationDataMock);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('/api/vacation-summary');
                const data = await response.json();

                if (response.ok) {
                    setVacationData(data);
                }
            } catch (error) {
                console.error('Error fetching vacation data:', error);
            }
        };

        if (process.env.USE_MOCK === 'false') {
            fetchData();
        }
    }, []);

    const data = vacationData;

    return (
        <ApexChartWrapper>
            <Grid container spacing={6} className='match-height'>
                {/* Card de Resumen de Vacaciones */}
                <Grid item xs={12} md={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h5" component="div" gutterBottom>
                                Resumen de Vacaciones para {data.name || 'Usuario Desconocido'}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Fecha de Ingreso: {new Date(data.fechaIngreso).toLocaleDateString()}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Antigüedad: {data.antiguedadEnAnios} años, {data.antiguedadEnMeses} meses ({data.antiguedadEnDias} días)
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Días Totales de Vacaciones segun Antiguedad: {data.diasDeVacacion}
                            </Typography>
                            <Typography
                                variant="body2"
                                color={data.diasDeVacacionRestantes < 0 ? 'error.main' : 'textSecondary'}
                            >
                                Días Restantes de Vacaciones: {data.diasDeVacacionRestantes < 0 ? `${data.diasDeVacacionRestantes} (Exceso)` : data.diasDeVacacionRestantes}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Recesos Descontados */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" component="div" gutterBottom>
                                Recesos Aplicados
                            </Typography>
                            {data.recesos.length > 0 ? (
                                data.recesos.map((receso, index) => (
                                    <Typography key={index} variant="body2" color="textSecondary">
                                        {receso.name}: del {new Date(receso.startDate).toLocaleDateString()} al {new Date(receso.endDate).toLocaleDateString()} ({receso.daysCount} días, Tipo de Receso: {receso.type})
                                    </Typography>
                                ))
                            ) : (
                                <Typography variant="body2" color="textSecondary">
                                    No hay recesos aplicados.
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>


                {/* Días No Hábiles */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" component="div" gutterBottom>
                                Días No Hábiles
                            </Typography>
                            {data.nonHolidayDaysDetails.length > 0 ? (
                                data.nonHolidayDaysDetails.map((day, index) => (
                                    <Typography key={index} variant="body2" color="textSecondary">
                                        {day.date}: {day.reason}
                                    </Typography>
                                ))
                            ) : (
                                <Typography variant="body2" color="textSecondary">
                                    No hay días no hábiles registrados.
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Licencias Autorizadas */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" component="div" gutterBottom>
                                Licencias Autorizadas
                            </Typography>
                            {data.licenciasAutorizadas.requests.length > 0 ? (
                                data.licenciasAutorizadas.requests.map((request, index) => (
                                    <Typography key={index} variant="body2" color="textSecondary">
                                        {request.licenseType} ({request.timeRequested}): del {new Date(request.startDate).toLocaleDateString()} al {new Date(request.endDate).toLocaleDateString()} - {request.totalDays} días
                                    </Typography>
                                ))
                            ) : (
                                <Typography variant="body2" color="textSecondary">
                                    No hay licencias autorizadas.
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Acciones Rápidas */}
                <Grid item xs={12} md={6}>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<Icon icon="mdi:beach" />}
                        fullWidth
                    >
                        Solicitar Vacaciones
                    </Button>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<Icon icon="mdi:briefcase" />}
                        fullWidth
                    >
                        Solicitar Licencia
                    </Button>
                </Grid>
            </Grid>
        </ApexChartWrapper>
    );
};

// Configurar ACL para dar acceso a clientes
VacationSummary.acl = {
    action: 'read',
    subject: 'vacation-summary'
};

export default VacationSummary;
