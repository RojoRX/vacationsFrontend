import React, { useState } from 'react';
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
} from '@mui/material';
import { useRouter } from 'next/router'; // Importar useRouter

const VacationSummary = () => {
    const user = useUser();
    const router = useRouter(); // Inicializar useRouter
    const [selectedGestion, setSelectedGestion] = useState<GestionPeriod | null>(null);
    const [data, setData] = useState<any>(null);

    const handleGestionChange = (gestion: GestionPeriod) => {
        setSelectedGestion(gestion);
        fetchVacationData(gestion.startDate, gestion.endDate);
    };

    const fetchVacationData = async (startDate: string, endDate: string) => {
        if (!user || !user.ci) {
            console.error('Carnet de identidad no disponible.');
            return;
        }

        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/vacations`, {
                params: {
                    carnetIdentidad: user.ci,
                    startDate,
                    endDate,
                },
            });
            setData(response.data);
        } catch (error) {
            console.error('Error fetching vacation data:', error);
            setData(null);
        }
    };

    // Nueva función para manejar el clic del botón
    const handleRequestVacation = () => {
        if (selectedGestion) {
            console.log('Gestión seleccionada:', selectedGestion);
            // Redirigir al componente de solicitar vacaciones y pasar datos en la query
            router.push({
                pathname: '/vacations-form', // Cambiar a la ruta de tu componente
                query: { 
                    startDate: selectedGestion.startDate,
                    endDate: selectedGestion.endDate,
                },
            });
        } else {
            console.log('No hay gestión seleccionada.');
        }
    };

    return (
        <div>
            <GestionSelect onChange={handleGestionChange} selectedGestion={selectedGestion} />

            {/* Botón para solicitar vacaciones */}
            <Button 
                variant="contained" 
                color="primary" 
                onClick={handleRequestVacation} 
                sx={{ marginTop: 2 }}
            >
                Solicitar Vacaciones
            </Button>

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
                                    <strong>Fecha de Ingreso:</strong> {new Date(data.fechaIngreso).toLocaleDateString()}
                                </Typography>
                                <Typography variant="body1">
                                    <strong>Antigüedad:</strong> {data.antiguedadEnAnios || 0} años, {data.antiguedadEnMeses || 0} meses ({data.antiguedadEnDias || 0} días)
                                </Typography>
                                <Typography variant="body1">
                                    <strong>Días Totales de Vacaciones:</strong> {data.diasDeVacacion || 0}
                                </Typography>
                                <Typography variant="body1">
                                    <strong>Días Restantes:</strong> {data.diasDeVacacionRestantes || 0}
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
                                            primary={`${receso.name} Tipo de Receso: (${receso.type}):`} // Muestra el tipo de receso
                                            secondary={`Del ${new Date(receso.startDate).toLocaleDateString()} al ${new Date(receso.endDate).toLocaleDateString()} (${receso.daysCount} días hábiles)`}
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

                        {/* Sección de Solicitudes de Vacación Autorizadas */}
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
                                                        <strong>Fecha de Solicitud:</strong> {new Date(request.requestDate).toLocaleDateString()}
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        <strong>Período:</strong> Del {new Date(request.startDate).toLocaleDateString()} al {new Date(request.endDate).toLocaleDateString()} ({request.totalDays} días)
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        <strong>Estado:</strong> {request.status}
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        <strong>Fecha de Retorno:</strong> {new Date(request.returnDate).toLocaleDateString()}
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        <strong>Aprobado por Recursos Humanos:</strong> {request.approvedByHR ? 'Sí' : 'No'}
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        <strong>Aprobado por Supervisor:</strong> {request.approvedBySupervisor ? 'Sí' : 'No'}
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        <strong>Periodo de Gestión:</strong> {request.managementPeriodStart} - {request.managementPeriodEnd}
                                                    </Typography>
                                                </>
                                            }
                                        />
                                    </ListItem>
                                ))
                            ) : (
                                <ListItem>
                                    <ListItemText primary="No hay solicitudes de vacación autorizadas." />
                                </ListItem>
                            )}
                        </List>
                    </CardContent>
                </Card>
            ) : (
                <Typography>No se encontraron datos de vacaciones.</Typography>
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
