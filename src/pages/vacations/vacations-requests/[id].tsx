import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import {
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Box,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import useUser from 'src/hooks/useUser';
import { SelectChangeEvent } from '@mui/material/Select'; // Asegúrate de importar SelectChangeEvent
import { People, Info, Approval, Assignment } from '@mui/icons-material';
import PostponeVacationRequestForm from '../vacations-postponed';
import { generateVacationAuthorizationPDF } from 'src/utils/pdfGenerator';

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
  reviewDate: string;
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
  const [selectedStatus, setSelectedStatus] = useState<string>('PENDING');
  const user = useUser(); // Hook para obtener el usuario actual
  const [openDialog, setOpenDialog] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');

  const validStatuses = [
    { value: 'PENDING', label: 'Pendiente' },
    { value: 'AUTHORIZED', label: 'Autorizado' },
    { value: 'POSTPONED', label: 'Postergado' },
    { value: 'DENIED', label: 'Rechazado' },
    { value: 'SUSPENDED', label: 'Suspendido' },
  ];

  const fetchRequestDetails = async () => {
    if (!id) return;

    try {
      const response = await axios.get<VacationRequest>(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/vacation-requests/${id}/details`
      );
      setRequest(response.data);
      setSelectedStatus(response.data.status); // Establece el estado seleccionado al cargar
    } catch (error) {
      console.error('Error fetching vacation request details:', error);
      setError('Error al obtener los detalles de la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequestDetails();
  }, [id]);

  const refreshRequestDetails = () => {
    setLoading(true);
    fetchRequestDetails(); // Vuelve a obtener los detalles de la solicitud
  };

  const handleStatusChange = async (event: SelectChangeEvent<string>) => {
    const newStatus = event.target.value as string;

    // Verifica si se intenta establecer el estado como "POSTPONED"
    if (newStatus === 'POSTPONED') {
      setInfoMessage('Para postergar la solicitud, utilice el formulario de postergación.');
      setOpenDialog(true); // Abre el diálogo
      return;
    }

    if (!request || newStatus === request.status) return;

    // Lógica para cambiar el estado
    try {
      await axios.patch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/vacation-requests/${request.requestId}/status`, {
        status: newStatus,
      });
      setRequest((prev) => (prev ? { ...prev, status: newStatus } : null));
      setSelectedStatus(newStatus);
    } catch (error) {
      console.error('Error updating status:', error);
      setError('Error al actualizar el estado de la solicitud.');
    }
  };



  const toggleApprovedByHR = async () => {
    if (!request) return;

    try {
      await axios.put(`${process.env.NEXT_PUBLIC_API_BASE_URL}/vacation-requests/${request.requestId}/toggle-approved-by-hr`);
      setRequest((prev) => (prev ? { ...prev, approvedByHR: !prev.approvedByHR } : null));
    } catch (error) {
      console.error('Error toggling approvedByHR:', error);
      setError('Error al actualizar la aprobación de Recursos Humanos.');
    }
  };
  const formatearFecha = (fechaISO: string | number | Date) => {
    const opciones: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Date(fechaISO).toLocaleDateString('es-ES', opciones);
  };

  const obtenerRecesoPorNombre = (nombre: string) => {
    return request?.recesos.find((receso) => receso.name === nombre);
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
  const getColor = (status: any) => {
    switch (status) {
      case 'PENDING':
        return 'default'; // color gris
      case 'AUTHORIZED':
        return 'success'; // color verde
      case 'POSTPONED':
        return 'warning'; // color amarillo
      case 'DENIED':
        return 'error'; // color rojo
      case 'SUSPENDED':
        return 'info'; // color azul
      default:
        return 'default'; // color por defecto
    }
  };


  const estadoTraducido = validStatuses.find(status => status.value === request.status)?.label || request.status;
  return (

    <Card>

      <CardContent>
        <div style={{ textAlign: 'center' }}> {/* Centro el texto usando un div */}
          <Typography variant="h3" gutterBottom style={{ fontWeight: 'bold' }}>
            Universidad Autónoma Tomás Frías
          </Typography>
          <Typography variant="h5" gutterBottom>
            Departamento de Personal
          </Typography>
          <Typography variant="h6" gutterBottom>
            Formulario de Solicitud y Concesión de Vacaciones
          </Typography>
          {/* Botón para generar el PDF */}
          <Button
            variant="contained"
            color="primary"
            onClick={() => generateVacationAuthorizationPDF(request)}
            style={{ marginTop: '20px' }}
            disabled={request.status !== "AUTHORIZED"} // Botón deshabilitado si no está autorizado
          >
            Descargar Autorización en PDF
          </Button>

        </div>

        {/* Sección #1 - Datos de Solicitante */}
        <Card variant="outlined" style={{ marginTop: '20px' }}>
          <CardContent>
            <Typography variant="h6" mt={2}>Datos de Solicitante</Typography>
            <Typography variant="body1"><strong>Nombre de Usuario:</strong> {request.userName}</Typography>
            <Typography variant="body1"><strong>Fecha de Ingreso:</strong> {formatearFecha(request.fechaIngreso)}</Typography>
            <Typography variant="body1"><strong>Fecha de Solicitud:</strong> {request.requestDate}</Typography>
            <Typography variant="body1"><strong>Departamento:</strong> {request.department || 'No especificado'}</Typography>
            <Typography variant="body1"><strong>Cargo que Ocupa:</strong> {request.position || 'No especificado'}</Typography>
            <Typography variant="body1"><strong>Solicita Vacacion a partir de:</strong> {request.startDate || 'No especificado'}</Typography>
          </CardContent>
        </Card>

        {/* Sección #2 - Informe del departamento de Personal */}
        <Card variant="outlined" style={{ marginTop: '20px' }}>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Sección #3 - Autorización del jefe inmediato Superior */}
        <Card variant="outlined" style={{ marginTop: '20px' }}>
          <CardContent>
            <Typography variant="h6" mt={2}>Autorización del jefe inmediato Superior</Typography>
            <Typography variant="body1">
              <strong>Estado:</strong>
              <Chip label={estadoTraducido} color={getColor(request.status)} style={{ marginLeft: '8px' }} />
            </Typography>
            <Typography variant="body1"><strong>Fecha de Inicio:</strong> {request.startDate}</Typography>
            <Typography variant="body1"><strong>Fecha de Revision Jefe Superior:</strong> {request.reviewDate || 'No disponible'}</Typography>
            <Typography variant="body1"><strong>Postergado hasta:</strong> {request.postponedDate || 'No disponible'}</Typography>
            <Typography variant="body1"><strong>Justificación de la postergación:</strong> {request.postponedReason || 'No disponible'}</Typography>
          </CardContent>
        </Card>

        {/* Sección #4 - Decreto del Departamento de Personal */}
        <Card variant="outlined" style={{ marginTop: '20px' }}>
          <CardContent>
            <Typography variant="h6" mt={2}>Decreto del Departamento de Personal</Typography>
            <Typography variant="body1">
              <strong>Autorizado por Personal:</strong> {request.approvedByHR ? 'Sí' : 'No'}
            </Typography>
            <Typography variant="body1"><strong>Fecha Fin de la vacación:</strong> {request.endDate}</Typography>
            <Typography variant="body1"><strong>Total de días solicitados:</strong> {request.totalDays}</Typography>
            <Typography variant="body1"><strong>Regreso:</strong> {request.returnDate}</Typography>
          </CardContent>
        </Card>


        {/* Sección #5 para actualizar el estado de la solicitud */}
        {user && (user.role === 'admin' || user.role === 'supervisor') && (
          <Card variant="outlined" style={{ marginTop: '20px' }}>
            <CardContent>
              <Typography variant="h6">Actualizar Estado de la Solicitud por Jefe Superior</Typography>
              <FormControl variant="outlined" style={{ marginTop: '16px', minWidth: '120px' }}>
                <InputLabel id="status-select-label">Estado</InputLabel>
                <Select
                  labelId="status-select-label"
                  value={selectedStatus}
                  onChange={handleStatusChange}
                >
                  {validStatuses.map((status) => (
                    <MenuItem key={status.value} value={status.value}>
                      {status.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </CardContent>
          </Card>
        )}

        {/* Sección #5 para actualizar el estado de la solicitud */}
        {user && (user.role === 'admin' || user.role === 'supervisor') && (
          <Card variant="outlined" style={{ marginTop: '20px' }}>
            <CardContent>
              {/* Cambia onSuccess a onRequestUpdate */}
              <PostponeVacationRequestForm
                requestId={request?.requestId}
                onRequestUpdate={refreshRequestDetails}
              />
            </CardContent>
          </Card>
        )}


        <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
          <DialogTitle>Información Importante</DialogTitle>
          <DialogContent>
            <DialogContentText>
              {infoMessage}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)} color="primary">
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>


        {/* Sección #4 - Modificar Aprobación de Recursos Humanos */}
        {user?.role === 'admin' && (
          <Card variant="outlined" style={{ marginTop: '20px' }}>
            <CardContent>
              <Typography variant="h6" mt={2}>Aprobación de Recursos Humanos</Typography>
              <Typography variant="body1"><strong>Aprobado por Recursos Humanos:</strong> {request.approvedByHR ? 'Sí' : 'No'}</Typography>
              <Button
                variant="contained"
                color={request.approvedByHR ? 'error' : 'success'}
                onClick={toggleApprovedByHR}
              >
                {request.approvedByHR ? 'Desaprobar' : 'Aprobar'}
              </Button>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};

VacationRequestDetails.acl = {
  action: 'read',
  subject: 'vacation-request-details',
};

export default VacationRequestDetails;
