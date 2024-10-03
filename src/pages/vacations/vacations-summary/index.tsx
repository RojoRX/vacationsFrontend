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
} from '@mui/material';

const VacationSummary = () => {
    const user = useUser();
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

    return (
        <div>
            <GestionSelect onChange={handleGestionChange} selectedGestion={selectedGestion} />

            {data ? (
                <Card variant="outlined" sx={{ marginTop: 2 }}>
                    <CardContent>
                        <Typography variant="h5" component="div">
                            Resumen de Vacaciones Disponibles por Gestion
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
                                            secondary={`Del ${new Date(receso.startDate).toLocaleDateString()} al ${new Date(receso.endDate).toLocaleDateString()} (${receso.daysCount} días habiles)`}
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
