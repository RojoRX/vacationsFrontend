import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import { useRouter } from 'next/router'; // Importar useRouter

const VacationSummary = () => {
    const user = useUser();
    const router = useRouter(); // Inicializar useRouter
    const [selectedGestion, setSelectedGestion] = useState<GestionPeriod | null>(null);
    const [data, setData] = useState<any>(null);
    const [debtData, setDebtData] = useState<any>(null); // Nuevo estado para deuda acumulada

    const handleGestionChange = (gestion: GestionPeriod) => {
        //console.log('Cambio de gestión seleccionado:', gestion);
        setSelectedGestion(gestion);
    
        // Usamos un callback en setState para asegurar que los datos sean correctos
        setSelectedGestion(prevGestion => {
            if (prevGestion) {
                fetchVacationData(gestion.startDate, gestion.endDate);
                fetchDebtData(gestion.endDate, gestion); // Pasar la gestión correcta
            }
            return gestion;
        });
    };
    
    const fetchVacationData = async (startDate: string, endDate: string) => {
        if (!user || !user.ci) {
            //console.error('Carnet de identidad no disponible.');
            return;
        }
    
        //console.log("Solicitando datos de vacaciones para:", { carnetIdentidad: user.ci, startDate, endDate });
    
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/vacations`, {
                params: {
                    carnetIdentidad: user.ci,
                    startDate,
                    endDate,
                },
            });
            //console.log("Respuesta de vacaciones:", response.data);
            setData(response.data);
        } catch (error) {
            //console.error('Error fetching vacation data:', error);
            setData(null);
        }
    };
    
    // Función para obtener la deuda acumulada y días disponibles
    const fetchDebtData = async (endDate: string, gestion: GestionPeriod) => {
        if (!user || !user.ci) {
            console.error('Carnet de identidad no disponible.');
            return;
        }
    
        //console.log('Solicitando datos de deuda para:', { carnetIdentidad: user.ci, endDate });
    
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/vacations/accumulated-debt`, {
                params: {
                    carnetIdentidad: user.ci,
                    endDate,
                },
            });
    
            //console.log('Respuesta de deuda recibida:', response.data);
    
            // Convertir las fechas de la gestión seleccionada
            const gestionStartDate = new Date(gestion.startDate).toISOString().split('T')[0];
            const gestionEndDate = new Date(gestion.endDate).toISOString().split('T')[0];
    
            //console.log('Filtrando detalle de deuda para la gestión:', { gestionStartDate, gestionEndDate });
    
            // Filtrar correctamente los detalles de deuda
            const gestionDebt = response.data.detalles.find((detalle: any) => {
                const detalleStartDate = new Date(detalle.startDate).toISOString().split('T')[0];
                const detalleEndDate = new Date(detalle.endDate).toISOString().split('T')[0];
    
                //console.log('Comparando detalle:', { detalleStartDate, detalleEndDate });
    
                return detalleStartDate === gestionStartDate && detalleEndDate === gestionEndDate;
            });
    
            setDebtData(gestionDebt || null); // Establecer la deuda encontrada o null si no hay coincidencia
        } catch (error) {
            console.error('Error fetching debt data:', error);
            setDebtData(null);
        }
    };
    
    const handleRequestVacation = () => {
        if (selectedGestion) {
            //console.log('Gestión seleccionada para solicitud de vacaciones:', selectedGestion);
            router.push({
                pathname: '/vacations-form',
                query: {
                    startDate: selectedGestion.startDate,
                    endDate: selectedGestion.endDate,
                },
            });
        } else {
            //console.log('No hay gestión seleccionada.');
        }
    };
    
    const handleRequestLicense = () => {
        if (selectedGestion) {
            //console.log('Gestión seleccionada para solicitud de licencia:', selectedGestion);
            router.push({
                pathname: '/permissions/create-permission',
                query: {
                    startDate: selectedGestion.startDate,
                    endDate: selectedGestion.endDate,
                },
            });
        } else {
            //console.log('No hay gestión seleccionada.');
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

            {data ? (
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
                                    <strong>Deuda de la Gestion:</strong> {debtData?.deuda || 0} {/* Mostrar la deuda */}
                                </Typography>
                                <Typography variant="body1">
                                    <strong>Deuda Acumulada Gestiones Anteriores:</strong> {debtData?.deudaAcumulativaAnterior || 0} {/* Mostrar la deuda */}
                                </Typography>
                                <Typography variant="body1">
                                    <strong>Días Disponibles de Vacacion:</strong> {debtData?.diasDisponibles || 0} {/* Mostrar los días disponibles desde la deuda acumulada */}
                                </Typography>

                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="body1">
                                    <strong>Licencias Autorizadas:</strong> {data.licenciasAutorizadas.totalAuthorizedDays || 0}
                                </Typography>
                                <Typography variant="body1">
                                    <strong>Solicitudes de Vacación Autorizadas:</strong> {data.solicitudesDeVacacionAutorizadas.totalAuthorizedVacationDays || 0}
                                </Typography>
                            </Grid>
                        </Grid>
                        <Divider sx={{ margin: '16px 0' }} />
                        <Typography variant="h6">Recesos Aplicados</Typography>
                        <List>
                            {data.recesos.length > 0 ? (
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
                            {data.nonHolidayDaysDetails.length > 0 ? (
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
                            <strong>Total de Días Autorizados:</strong> {data.solicitudesDeVacacionAutorizadas.totalAuthorizedVacationDays || 0}
                        </Typography>
                        <List>
                            {data.solicitudesDeVacacionAutorizadas.requests.length > 0 ? (
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
