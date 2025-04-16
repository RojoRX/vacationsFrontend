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
  CircularProgress,
  Box,
  Alert,
  Chip,
  Paper
} from '@mui/material';
import { useRouter } from 'next/router';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const formatDate = (dateString: string) => {
  try {
    return format(parseISO(dateString), 'dd/MM/yyyy', { locale: es });
  } catch {
    return dateString.split('T')[0].split('-').reverse().join('/');
  }
};

const VacationSummary = () => {
  const user = useUser();
  const router = useRouter();
  const [selectedGestion, setSelectedGestion] = useState<GestionPeriod | null>(null);
  const [data, setData] = useState<any>(null);
  const [debtData, setDebtData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGestionChange = (gestion: GestionPeriod) => {
    setSelectedGestion(gestion);
    setError(null);
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
      setLoading(true);
      setData(null);
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/vacations`, {
        params: { carnetIdentidad: user.ci, startDate, endDate },
      });
      setData(response.data);
    } catch (error) {
      console.error('Error fetching vacation data:', error);
      setError('Error al cargar los datos de vacaciones');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchDebtData = async (endDate: string, gestion: GestionPeriod) => {
    if (!user?.ci) return;

    try {
      setLoading(true);
      setDebtData(null);

      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/vacations/accumulated-debt`, {
        params: { carnetIdentidad: user.ci, endDate },
        timeout: 5000,
      });

      if (!response.data?.detalles) {
        throw new Error("Datos de deuda no válidos");
      }

      const gestionStartDate = format(parseISO(gestion.startDate), 'yyyy-MM-dd');
      const gestionEndDate = format(parseISO(gestion.endDate), 'yyyy-MM-dd');

      const gestionDebt = response.data.detalles.find((detalle: any) => {
        const detalleStartDate = format(parseISO(detalle.startDate), 'yyyy-MM-dd');
        const detalleEndDate = format(parseISO(detalle.endDate), 'yyyy-MM-dd');
        return detalleStartDate === gestionStartDate && detalleEndDate === gestionEndDate;
      });

      setDebtData(gestionDebt || { 
        deuda: 0, 
        deudaAcumulativaAnterior: 0, 
        diasDisponibles: 0 
      });
    } catch (error) {
      console.error('Error fetching debt data:', error);
      setDebtData({ 
        deuda: 0, 
        deudaAcumulativaAnterior: 0, 
        diasDisponibles: 0 
      });
    } finally {
      setLoading(false);
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

  const renderSummarySection = () => (
    <Grid container spacing={2} sx={{ mt: 2 }}>
      <Grid item xs={12} md={6}>
        <Paper elevation={0} sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Información Básica
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
            <Typography variant="body1"><strong>Fecha Ingreso:</strong></Typography>
            <Typography>{formatDate(data.fechaIngreso)}</Typography>
            
            <Typography variant="body1"><strong>Antigüedad:</strong></Typography>
            <Typography>
              {data.antiguedadEnAnios || 0} años, {data.antiguedadEnMeses || 0} meses
            </Typography>
            
            <Typography variant="body1"><strong>Días por antigüedad:</strong></Typography>
            <Typography>{data.diasDeVacacion || 0}</Typography>
          </Box>
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper elevation={0} sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Estado de Vacaciones
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
            <Typography variant="body1"><strong>Deuda Gestión:</strong></Typography>
            <Typography color={debtData?.deuda > 0 ? 'error' : 'inherit'}>
              {debtData?.deuda ?? 0}
            </Typography>
            
            <Typography variant="body1"><strong>Deuda Acumulada:</strong></Typography>
            <Typography color={debtData?.deudaAcumulativaAnterior > 0 ? 'error' : 'inherit'}>
              {debtData?.deudaAcumulativaAnterior ?? 0}
            </Typography>
            
            <Typography variant="body1"><strong>Total Deuda:</strong></Typography>
            <Typography color={(debtData?.deudaAcumulativaAnterior + debtData?.deuda) > 0 ? 'error' : 'inherit'}>
              {(debtData?.deudaAcumulativaAnterior ?? 0) + (debtData?.deuda ?? 0)}
            </Typography>
            
            <Typography variant="body1"><strong>Días Disponibles:</strong></Typography>
            <Typography color={debtData?.diasDisponibles > 0 ? 'success.main' : 'inherit'}>
              {debtData?.diasDisponibles ?? 0}
            </Typography>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderRecesosSection = () => (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
        Recesos Aplicados
      </Typography>
      {data.recesos?.length > 0 ? (
        <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
          {data.recesos.map((receso: any, index: number) => (
            <React.Fragment key={index}>
              <ListItem>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle2">{receso.name}</Typography>
                      <Chip label={receso.type} size="small" />
                    </Box>
                  }
                  secondary={`${formatDate(receso.startDate)} - ${formatDate(receso.endDate)} (${receso.daysCount} días)`}
                />
              </ListItem>
              {index < data.recesos.length - 1 && <Divider component="li" />}
            </React.Fragment>
          ))}
        </List>
      ) : (
        <Alert severity="info">No hay recesos aplicados</Alert>
      )}
    </Box>
  );

  const renderNonHolidaysSection = () => (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
        Días No Hábiles / Feriados
      </Typography>
      {data.nonHolidayDaysDetails?.length > 0 ? (
        <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
          {data.nonHolidayDaysDetails.map((day: any, index: number) => (
            <React.Fragment key={index}>
              <ListItem>
                <ListItemText
                  primary={formatDate(day.date)}
                  secondary={day.reason}
                />
              </ListItem>
              {index < data.nonHolidayDaysDetails.length - 1 && <Divider component="li" />}
            </React.Fragment>
          ))}
        </List>
      ) : (
        <Alert severity="info">No hay días no hábiles registrados</Alert>
      )}
    </Box>
  );

  const renderAuthorizedVacations = () => (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
        Vacaciones Autorizadas
      </Typography>
      <Typography variant="body1" gutterBottom>
        <strong>Total Días Autorizados:</strong> {data.solicitudesDeVacacionAutorizadas?.totalAuthorizedVacationDays ?? 0}
      </Typography>
      {data.solicitudesDeVacacionAutorizadas?.requests?.length > 0 ? (
        <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
          {data.solicitudesDeVacacionAutorizadas.requests.map((request: any, index: number) => (
            <React.Fragment key={index}>
              <ListItem>
                <ListItemText
                  primary={`Solicitud #${request.id}`}
                  secondary={
                    <>
                      <Typography component="span" variant="body2">
                        {formatDate(request.startDate)} - {formatDate(request.endDate)}
                      </Typography>
                      <br />
                      <Typography component="span" variant="caption">
                        {request.position}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
              {index < data.solicitudesDeVacacionAutorizadas.requests.length - 1 && <Divider component="li" />}
            </React.Fragment>
          ))}
        </List>
      ) : (
        <Alert severity="info">No hay solicitudes de vacaciones</Alert>
      )}
    </Box>
  );

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Resumen de Vacaciones
        </Typography>
        
        <GestionSelect 
          onChange={handleGestionChange} 
          selectedGestion={selectedGestion} 
        />

        <Stack direction="row" spacing={2} sx={{ my: 3 }}>
          <Button 
            variant="contained" 
            onClick={handleRequestVacation}
            disabled={!selectedGestion}
            startIcon={<span className="mdi mdi-beach" />}
          >
            Solicitar Vacaciones
          </Button>
          <Button 
            variant="outlined" 
            onClick={handleRequestLicense}
            disabled={!selectedGestion}
            startIcon={<span className="mdi mdi-file-document-outline" />}
          >
            Solicitar Licencia
          </Button>
        </Stack>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ my: 2 }}>
            {error}
          </Alert>
        ) : data ? (
          <Card variant="outlined">
            <CardContent>
              {renderSummarySection()}
              <Divider sx={{ my: 3 }} />
              {renderRecesosSection()}
              <Divider sx={{ my: 3 }} />
              {renderNonHolidaysSection()}
              <Divider sx={{ my: 3 }} />
              {renderAuthorizedVacations()}
            </CardContent>
          </Card>
        ) : (
          <Alert severity="info" sx={{ my: 2 }}>
            Seleccione una gestión para ver el resumen de vacaciones
          </Alert>
        )}
      </Box>
    </Container>
  );
};

VacationSummary.acl = {
  action: 'read',
  subject: 'vacation-summary',
};

export default VacationSummary;