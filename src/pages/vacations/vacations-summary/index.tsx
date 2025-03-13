import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import GestionSelect from 'src/pages/gestion/gestion-selector';
import { GestionPeriod } from 'src/interfaces';
import useUser from 'src/hooks/useUser';
import {
    Card,
    CardContent,
    Typography,
    Grid,
    List,
    ListItem,
    ListItemText,
    Divider,
    Button,
    Container,
    Stack,
    CircularProgress,
} from '@mui/material';
import { useRouter } from 'next/router'; // Importar useRouter


const VacationSummary = () => {
    const user = useUser();
    const router = useRouter();
    const [selectedGestion, setSelectedGestion] = useState<GestionPeriod | null>(null);
    const [data, setData] = useState<any>(null);
    const [debtData, setDebtData] = useState<any>(null);
    const [loading, setLoading] = useState(false); // Declaración del estado de carga

    const handleGestionChange = (gestion: GestionPeriod) => {
        setSelectedGestion(gestion);
    };

    useEffect(() => {
        if (selectedGestion && user?.ci) {
            fetchVacationData(selectedGestion.startDate, selectedGestion.endDate);
            fetchDebtData(selectedGestion.endDate, selectedGestion);
        }
    }, [selectedGestion, user?.ci]);

    const fetchVacationData = async (startDate: string, endDate: string) => {
        if (!user?.ci) return;

        try {
            setLoading(true); // Activar el estado de carga
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/vacations`, {
                params: { carnetIdentidad: user.ci, startDate, endDate },
            });
            setData(response.data);
        } catch (error) {
            console.error('Error fetching vacation data:', error);
            setData(null);
        } finally {
            setLoading(false); // Desactivar el estado de carga
        }
    };

    const fetchDebtData = async (endDate: string, gestion: GestionPeriod) => {
        if (!user?.ci) return;

        try {
            setLoading(true); // Activar el estado de carga
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/vacations/accumulated-debt`, {
                params: { carnetIdentidad: user.ci, endDate },
            });

            const gestionStartDate = new Date(gestion.startDate).toISOString().split('T')[0];
            const gestionEndDate = new Date(gestion.endDate).toISOString().split('T')[0];

            const gestionDebt = response.data.detalles.find((detalle: any) => {
                const detalleStartDate = new Date(detalle.startDate).toISOString().split('T')[0];
                const detalleEndDate = new Date(detalle.endDate).toISOString().split('T')[0];
                return detalleStartDate === gestionStartDate && detalleEndDate === gestionEndDate;
            });

            setDebtData(gestionDebt || { deuda: 0, deudaAcumulativaAnterior: 0, diasDisponibles: 0 });
        } catch (error) {
            console.error('Error fetching debt data:', error);
            setDebtData({ deuda: 0, deudaAcumulativaAnterior: 0, diasDisponibles: 0 });
        } finally {
            setLoading(false); // Desactivar el estado de carga
        }
    };

    const handleRequestVacation = () => {
        if (selectedGestion) {
            router.push({
                pathname: '/vacations-form',
                query: {
                    startDate: selectedGestion.startDate,
                    endDate: selectedGestion.endDate,
                },
            });
        }
    };

    const handleRequestLicense = () => {
        if (selectedGestion) {
            router.push({
                pathname: '/permissions/create-permission',
                query: {
                    startDate: selectedGestion.startDate,
                    endDate: selectedGestion.endDate,
                },
            });
        }
    };

    return (
        <div>
            <GestionSelect onChange={handleGestionChange} selectedGestion={selectedGestion} />
            <Container>
                <Stack direction="row" spacing={2} justifyContent="flex-start" mt={4} mb={4}>
                    <Button variant="contained" color="primary" onClick={handleRequestVacation}>
                        Solicitar Vacaciones
                    </Button>
                    <Button variant="contained" color="info" onClick={handleRequestLicense}>
                        Solicitar Licencia
                    </Button>
                </Stack>
            </Container>

            {loading ? (
                <CircularProgress /> // Indicador de carga
            ) : data ? (
                <Card variant="outlined" sx={{ marginTop: 2 }}>
                    <CardContent>
                        <Typography variant="h5" component="div">
                            Resumen de Vacaciones Disponibles por Gestión
                        </Typography>
                        <Typography variant="subtitle1" color="text.secondary">
                            Usuario: {data.name || 'Usuario Desconocido'}
                        </Typography>
                        <Grid container spacing={2} sx={{ marginTop: 2 }}>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="body1">
                                    <strong>Fecha de Ingreso:</strong> {data.fechaIngreso.split('T')[0].split('-').reverse().join('/')}
                                </Typography>
                                <Typography variant="body1">
                                    <strong>Antigüedad:</strong> {data.antiguedadEnAnios || 0} años, {data.antiguedadEnMeses || 0} meses ({data.antiguedadEnDias || 0} días)
                                </Typography>
                                <Typography variant="body1">
                                    <strong>Días de Vacaciones por antigüedad:</strong> {data.diasDeVacacion || 0}
                                </Typography>
                                <Typography variant="body1">
                                    <strong>Deuda de la Gestión:</strong> {debtData?.deuda ?? 0}
                                </Typography>
                                <Typography variant="body1">
                                    <strong>Deuda Acumulada Gestiones Anteriores:</strong> {debtData?.deudaAcumulativaAnterior ?? 0}
                                </Typography>
                                <Typography variant="body1">
                                    <strong>Días Disponibles de Vacación:</strong> {debtData?.diasDisponibles ?? 0}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="body1">
                                    <strong>Licencias Autorizadas:</strong> {data.licenciasAutorizadas?.totalAuthorizedDays ?? 0}
                                </Typography>
                                <Typography variant="body1">
                                    <strong>Solicitudes de Vacación Autorizadas:</strong> {data.solicitudesDeVacacionAutorizadas?.totalAuthorizedVacationDays ?? 0}
                                </Typography>
                            </Grid>
                        </Grid>
                        <Divider sx={{ margin: '16px 0' }} />
                        <Typography variant="h6">Recesos Aplicados</Typography>
                        <List>
                            {data.recesos?.length > 0 ? (
                                data.recesos.map((receso: any, index: number) => (
                                    <ListItem key={index}>
                                        <ListItemText
                                            primary={`${receso.name} Tipo de Receso: (${receso.type}):`}
                                            secondary={`Del ${receso.startDate.split('T')[0].split('-').reverse().join('/')} al ${receso.endDate.split('T')[0].split('-').reverse().join('/')} (${receso.daysCount} días hábiles)`}
                                        />
                                    </ListItem>
                                ))
                            ) : (
                                <ListItem>
                                    <ListItemText primary="No hay recesos aplicados." />
                                </ListItem>
                            )}
                        </List>

                        <Divider sx={{ margin: '16px 0' }} />
                        <Typography variant="h6">Días No Hábiles o Feriados</Typography>
                        <List>
                            {data.nonHolidayDaysDetails?.length > 0 ? (
                                data.nonHolidayDaysDetails.map((day: any, index: number) => (
                                    <ListItem key={index}>
                                        <ListItemText primary={`${day.date}: ${day.reason}`} />
                                    </ListItem>
                                ))
                            ) : (
                                <ListItem>
                                    <ListItemText primary="No hay días no hábiles registrados." />
                                </ListItem>
                            )}
                        </List>

                        <Divider sx={{ margin: '16px 0' }} />
                        <Typography variant="h6">Solicitudes de Vacación Autorizadas</Typography>
                        <Typography variant="body1">
                            <strong>Total de Días Autorizados:</strong> {data.solicitudesDeVacacionAutorizadas?.totalAuthorizedVacationDays ?? 0}
                        </Typography>
                        <List>
                            {data.solicitudesDeVacacionAutorizadas?.requests?.length > 0 ? (
                                data.solicitudesDeVacacionAutorizadas.requests.map((request: any, index: number) => (
                                    <ListItem key={index}>
                                        <ListItemText
                                            primary={`Solicitud #${request.id} - ${request.position}`}
                                            secondary={
                                                <>
                                                    <Typography variant="body2">
                                                        Del {request.startDate.split('T')[0].split('-').reverse().join('/')} al {request.endDate.split('T')[0].split('-').reverse().join('/')}
                                                    </Typography>
                                                </>
                                            }
                                        />
                                    </ListItem>
                                ))
                            ) : (
                                <ListItem>
                                    <ListItemText primary="No hay solicitudes de vacaciones." />
                                </ListItem>
                            )}
                        </List>
                    </CardContent>
                </Card>
            ) : (
                <Typography variant="h6" sx={{ marginTop: 2 }}>
                    No se han encontrado datos de vacaciones para este periodo.
                </Typography>
            )}
        </div>
    );
};




// Configurar ACL para dar acceso a clientes
VacationSummary.acl = {
    action: 'read',
    subject: 'vacation-summary',
};

export default VacationSummary;
