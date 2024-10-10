import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import { Typography, Card, CardContent, CircularProgress, Box, Button } from '@mui/material';

interface Recess {
  name: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  nonHolidayDays: number;
  daysCount: number;
  type: string;
}

interface AuthorizedVacationRequest {
  id: number;
  position: string;
  requestDate: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  status: string;
  postponedDate: string | null;
  postponedReason: string | null;
  returnDate: string;
  approvedByHR: boolean;
  approvedBySupervisor: boolean;
  managementPeriodStart: string;
  managementPeriodEnd: string;
}

interface VacationRequest {
  requestId: number;
  userName: string;
  requestDate: string;
  position: string;
  department: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  status: string;
  returnDate: string;
  postponedDate: string | null;
  postponedReason: string | null;
  approvedByHR: boolean;
  approvedBySupervisor: boolean;
  managementPeriodStart: string;
  managementPeriodEnd: string;
  fechaIngreso: string;
  antiguedadEnAnios: number;
  diasDeVacacion: number;
  diasDeVacacionRestantes: number;
  recesos: Recess[]; // Actualiza el tipo de recesos
  licenciasAutorizadas: {
    totalAuthorizedDays: number;
    requests: any[]; 
  };
  solicitudesDeVacacionAutorizadas: {
    totalAuthorizedVacationDays: number;
    requests: AuthorizedVacationRequest[];
  };
}

const VacationRequestDetails = () => {
  const router = useRouter();
  const { id } = router.query; 
  const [request, setRequest] = useState<VacationRequest | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRequestDetails = async () => {
      if (!id) return;

      try {
        const response = await axios.get<VacationRequest>(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/vacation-requests/${id}/details`
        );
        setRequest(response.data);
      } catch (error) {
        console.error('Error fetching vacation request details:', error);
        setError('Error al obtener los detalles de la solicitud.');
      } finally {
        setLoading(false);
      }
    };

    fetchRequestDetails();
  }, [id]);

  const formatearFecha = (fechaISO: string | number | Date) => {
    const opciones: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Date(fechaISO).toLocaleDateString('es-ES', opciones);
  };

  const obtenerRecesoPorNombre = (nombre: string) => {
    return request?.recesos.find(receso => receso.name === nombre);
  };

  const recesoInvierno = obtenerRecesoPorNombre('INVIERNO');
  const recesoFinDeGestion = obtenerRecesoPorNombre('FINDEGESTION');

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Typography variant="h6" color="error">{error}</Typography>;
  }

  if (!request) {
    return <Typography variant="h6">No se encontró la solicitud.</Typography>;
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h4" gutterBottom>
          Universidad Autónoma Tomás Frías
        </Typography>
        <Typography variant="h5" gutterBottom>
          Departamento de Personal
        </Typography>
        <Typography variant="h6" gutterBottom>
          Formulario de Solicitud y Concesión de Vacaciones
        </Typography>

        <Typography variant="h6" mt={2}>Datos de Solicitante</Typography>
        <Typography variant="body1"><strong>Nombre de Usuario:</strong> {request.userName}</Typography>
        <Typography variant="body1"><strong>Fecha de Ingreso:</strong> {formatearFecha(request.fechaIngreso)}</Typography>
        <Typography variant="body1"><strong>Fecha de Solicitud:</strong> {request.requestDate}</Typography>
        <Typography variant="body1"><strong>Departamento:</strong> {request.department || 'No especificado'}</Typography>
        <Typography variant="body1"><strong>Cargo que Ocupa:</strong> {request.position || 'No especificado'}</Typography>
        <Typography variant="body1"><strong>Solicita Vacacion a partir de:</strong> {request.startDate || 'No especificado'}</Typography>

        <Typography variant="h6" mt={2}>Informe del departamento de Personal</Typography>
        <Typography variant="body1"><strong>Vacacion correspondiente a las gestion(es):</strong> {request.managementPeriodStart} - {request.managementPeriodEnd}</Typography>
        <Typography variant="body1"><strong>Años de Antigüedad:</strong> {request.antiguedadEnAnios}</Typography>
        <Typography variant="body1"><strong>Días de Vacación por Antigüedad:</strong> {request.diasDeVacacion}</Typography>
        <Typography variant="body1">
          <strong>Días de Licencia Autorizados cuenta Vacacion:</strong> {request.licenciasAutorizadas.totalAuthorizedDays !== undefined && request.licenciasAutorizadas.totalAuthorizedDays !== null ? request.licenciasAutorizadas.totalAuthorizedDays : 'No disponibles'}
        </Typography>
        <Typography variant="body1">
          <strong>Descanso pedagógico de Invierno:</strong> {recesoInvierno ? `${recesoInvierno.daysCount} días (Tipo: ${recesoInvierno.type})` : 'No disponible'}
        </Typography>
        <Typography variant="body1">
          <strong>Descanso de Fin de Año:</strong> {recesoFinDeGestion ? `${recesoFinDeGestion.daysCount} días (Tipo: ${recesoFinDeGestion.type})` : 'No disponible'}
        </Typography>
        <Typography variant="body1"><strong>Días de Vacación Restantes:</strong> {request.diasDeVacacionRestantes}</Typography>

        <Typography variant="h6" mt={2}>Autorizacion del jefe inmediato Superior</Typography>
        <Typography variant="body1"><strong>Estado:</strong> {request.status}</Typography>
        <Typography variant="body1"><strong>Fecha de Inicio:</strong> {request.startDate}</Typography>
        <Typography variant="body1"><strong>Fecha de Autorizacion:</strong> </Typography>
        <Typography variant="body1"><strong>Postergado hasta:</strong>{request.postponedDate} </Typography>
        <Typography variant="body1"><strong>Justificacion de la postergacion:</strong> {request.postponedReason}</Typography>

        <Typography variant="h6" mt={2}>Decreto del Departamento de Personal</Typography>
        <Typography variant="body1">Se autoriza el uso de la vacacion por Decreto NO: </Typography>
        <Typography variant="body1"><strong>Fecha de Inicio de la vacacion:</strong> {request.startDate}</Typography>
        <Typography variant="body1"><strong>Fecha de Final de la vacacion:</strong> {request.endDate}</Typography>
        <Typography variant="body1"><strong>Fecha de Retorno:</strong> {request.returnDate}</Typography>

        <Box mt={2}>
          <Button variant="contained" color="primary" onClick={() => router.push('/vacations/vacations-requests')}>
            Volver a la lista
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};
VacationRequestDetails.acl = {
    action: 'read',
    subject: 'vacation-request-details',
};

export default VacationRequestDetails;

