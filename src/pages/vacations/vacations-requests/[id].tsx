import React, { useEffect, useState, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
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
  Paper,
  Divider,
  Stack,
  Alert,
  IconButton,
  Container
} from '@mui/material';
import {
  People as PeopleIcon,
  Info as InfoIcon,
  Approval as ApprovalIcon,
  Assignment as AssignmentIcon,
  Close as CloseIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import useUser from 'src/hooks/useUser';
import { SelectChangeEvent } from '@mui/material/Select';
import PostponeVacationRequestForm from '../vacations-postponed';
import { generateVacationAuthorizationPDF } from 'src/utils/pdfGenerator';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { VacationDebt } from 'src/interfaces/vacationDebt';
import { Gestion } from 'src/interfaces/gestion';
import { Receso } from 'src/interfaces/receso';
import { AuthorizedVacationRequest } from 'src/interfaces/authorizedVacationRequest';

interface VacationRequest {
  ci: string;
  gestion: Gestion;
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
  recesos: Receso[];
  licenciasAutorizadas: {
    totalAuthorizedDays: number;
    requests: any[];
  };
  solicitudesDeVacacionAutorizadas: {
    totalAuthorizedVacationDays: number;
    requests: AuthorizedVacationRequest[];
  };
}

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pendiente', color: 'default' },
  { value: 'AUTHORIZED', label: 'Autorizado', color: 'success' },
  { value: 'POSTPONED', label: 'Postergado', color: 'warning' },
  { value: 'DENIED', label: 'Rechazado', color: 'error' },
  { value: 'SUSPENDED', label: 'Suspendido', color: 'info' },
];

const formatDate = (dateString: string) => {
  try {
    return format(parseISO(dateString), 'dd/MM/yyyy', { locale: es });
  } catch {
    return dateString.split('T')[0].split('-').reverse().join('/');
  }
};

const VacationRequestDetails = () => {
  const router = useRouter();
  const { id } = router.query;
  const user = useUser();
  const [request, setRequest] = useState<VacationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState('PENDING');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');
  const [debtData, setDebtData] = useState<VacationDebt | null>(null);

  const fetchRequestDetails = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get<VacationRequest>(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/vacation-requests/${id}/details`
      );
      
      setRequest(response.data);
      setSelectedStatus(response.data.status);

      if (response.data.managementPeriodStart && response.data.managementPeriodEnd) {
        await fetchDebtData(
          response.data.managementPeriodStart, 
          response.data.managementPeriodEnd, 
          response.data.ci
        );
      }
    } catch (err) {
      handleFetchError(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchDebtData = async (startDate: string, endDate: string, ci: string) => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/vacations/accumulated-debt`, {
        params: { carnetIdentidad: ci, endDate },
        timeout: 5000,
      });
  
      console.log('Respuesta completa del servidor:', response.data);
  
      // Verificar si hay detalles en la respuesta
      if (!response.data.detalles || !Array.isArray(response.data.detalles)) {
        console.error('Formato de datos inesperado: detalles no es un array');
        throw new Error('Formato de datos inesperado');
      }
  
      // Formatear fechas de búsqueda
      const gestionStart = new Date(startDate);
      const gestionEnd = new Date(endDate);
  
      // Buscar la gestión que coincida con el rango de fechas
      const gestionDebt = response.data.detalles.find((detalle: any) => {
        try {
          const detalleStart = new Date(detalle.startDate);
          const detalleEnd = new Date(detalle.endDate);
          
          // Comparar las fechas como objetos Date directamente
          return (
            detalleStart.getTime() === gestionStart.getTime() &&
            detalleEnd.getTime() === gestionEnd.getTime()
          );
        } catch (e) {
          console.error('Error al parsear fechas del detalle:', detalle, e);
          return false;
        }
      });
  
      if (!gestionDebt) {
        console.warn('No se encontró deuda para la gestión específica, usando el último registro');
        // Usar el último registro si no se encuentra la gestión específica
        const lastRecord = response.data.detalles[response.data.detalles.length - 1];
        setDebtData({
          diasDisponibles: lastRecord?.diasDisponibles ?? 0,
          deudaAcumulativaAnterior: lastRecord?.deudaAcumulativaAnterior ?? 0,
          deuda: lastRecord?.deuda ?? 0,
          startDate: lastRecord?.startDate ?? '',
          endDate: lastRecord?.endDate ?? '',
          deudaAcumulativaHastaEstaGestion: lastRecord?.deudaAcumulativaHastaEstaGestion ?? 0,
        });
        return;
      }
  
      console.log('Datos encontrados para la gestión:', gestionDebt);
      setDebtData(gestionDebt);
      
    } catch (err) {
      console.error('Error fetching debt data:', err);
      setDebtData({ 
        diasDisponibles: 0, 
        deudaAcumulativaAnterior: 0,
        deuda: 0,
        startDate: '',
        endDate: '',
        deudaAcumulativaHastaEstaGestion: 0,
      });
    }
  };

  const handleFetchError = (error: unknown) => {
    let errorMessage = 'Error al obtener los detalles de la solicitud';
    
    if (axios.isAxiosError(error)) {
      errorMessage = error.response?.data?.message || error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    console.error('Error:', error);
    setError(errorMessage);
  };

  useEffect(() => {
    fetchRequestDetails();
  }, [fetchRequestDetails]);

  const handleStatusChange = async (event: SelectChangeEvent<string>) => {
    const newStatus = event.target.value;

    if (newStatus === 'POSTPONED') {
      setInfoMessage('Para postergar la solicitud, utilice el formulario de postergación.');
      setDialogOpen(true);
      return;
    }

    if (!request || newStatus === request.status || !user?.id) return;

    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/vacation-requests/${request.requestId}/status`,
        { status: newStatus, supervisorId: user.id }
      );

      setRequest(prev => ({ ...prev!, status: newStatus }));
      setSelectedStatus(newStatus);
    } catch (err) {
      handleStatusUpdateError(err);
    }
  };

  const handleStatusUpdateError = (error: unknown) => {
    let errorMessage = 'Error al actualizar el estado';
    
    if (axios.isAxiosError(error)) {
      errorMessage = error.response?.data?.message || error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    console.error('Error updating status:', error);
    setError(errorMessage);
  };

  const toggleApprovedByHR = async () => {
    if (!request) return;

    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/vacation-requests/${request.requestId}/toggle-approved-by-hr`
      );
      setRequest(prev => ({ ...prev!, approvedByHR: !prev!.approvedByHR }));
    } catch (err) {
      handleStatusUpdateError(err);
    }
  };

  const getRecessByName = (name: string) => {
    return request?.recesos.find(receso => receso.name === name);
  };

  const renderHeader = () => (
    <Box textAlign="center" mb={4}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Universidad Autónoma Tomás Frías
      </Typography>
      <Typography variant="h6" gutterBottom>
        Departamento de Personal
      </Typography>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Formulario de Solicitud y Concesión de Vacaciones
      </Typography>
      
      {request?.status === "AUTHORIZED" && (
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={() => generateVacationAuthorizationPDF(request)}
          sx={{ mt: 2 }}
        >
          Descargar Autorización en PDF
        </Button>
      )}
    </Box>
  );

  const renderSection = (title: string, children: React.ReactNode) => (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        {title}
      </Typography>
      <Divider sx={{ mb: 2 }} />
      {children}
    </Paper>
  );

  const renderApplicantInfo = () => (
    <>
      <Typography variant="body1">
        <strong>Nombre de Usuario:</strong> {request?.userName}
      </Typography>
      <Typography variant="body1">
        <strong>Fecha de Ingreso:</strong> {formatDate(request?.fechaIngreso || '')}
      </Typography>
      <Typography variant="body1">
        <strong>Fecha de Solicitud:</strong> {formatDate(request?.requestDate || '')}
      </Typography>
      <Typography variant="body1">
        <strong>Departamento:</strong> {request?.department || 'No especificado'}
      </Typography>
      <Typography variant="body1">
        <strong>Cargo que Ocupa:</strong> {request?.position || 'No especificado'}
      </Typography>
      <Typography variant="body1">
        <strong>Solicita Vacacion a partir de:</strong> {formatDate(request?.startDate || '')}
      </Typography>
    </>
  );

  const renderPersonalDepartmentReport = () => (
    <>
      <Typography variant="body1">
        <strong>Vacación correspondiente a las gestión(es):</strong> {formatDate(request?.managementPeriodStart || '')} - {formatDate(request?.managementPeriodEnd || '')}
      </Typography>
      <Typography variant="body1">
        <strong>Años de Antigüedad:</strong> {request?.antiguedadEnAnios}
      </Typography>
      <Typography variant="body1">
        <strong>Días de Vacación por Antigüedad:</strong> {request?.diasDeVacacion}
      </Typography>
      <Typography variant="body1">
        <strong>Días de Licencia Autorizados cuenta Vacación:</strong> {request?.licenciasAutorizadas.totalAuthorizedDays ?? 'No disponibles'}
      </Typography>
      <Typography variant="body1">
        <strong>Descanso pedagógico de Invierno:</strong> {getRecessByName('INVIERNO')?.daysCount || '0'} días
      </Typography>
      <Typography variant="body1">
        <strong>Descanso de Fin de Año:</strong> {getRecessByName('FINDEGESTION')?.daysCount || '0'} días
      </Typography>
      <Typography variant="body1">
        <strong>Días Acumulados de Deuda:</strong> {debtData?.deudaAcumulativaHastaEstaGestion ?? 0}
      </Typography>
      <Typography variant="body1">
        <strong>Días de Vacación Disponibles Restantes:</strong> {debtData?.diasDisponibles ?? 0}
      </Typography>
    </>
  );

  const renderSupervisorAuthorization = () => (
    <>
      <Stack direction="row" alignItems="center" spacing={1}>
        <strong>Estado:</strong>
        <Chip 
          label={STATUS_OPTIONS.find(s => s.value === request?.status)?.label || request?.status} 
          color={STATUS_OPTIONS.find(s => s.value === request?.status)?.color as any} 
        />
      </Stack>
      <Typography variant="body1">
        <strong>Fecha de Inicio:</strong> {formatDate(request?.startDate || '')}
      </Typography>
      <Typography variant="body1">
        <strong>Fecha de Revisión Jefe Superior:</strong> {request?.reviewDate ? formatDate(request.reviewDate) : 'No disponible'}
      </Typography>
      <Typography variant="body1">
        <strong>Postergado hasta:</strong> {request?.postponedDate ? formatDate(request.postponedDate) : 'No disponible'}
      </Typography>
      <Typography variant="body1">
        <strong>Justificación de la postergación:</strong> {request?.postponedReason || 'No disponible'}
      </Typography>
    </>
  );

  const renderPersonalDepartmentDecree = () => (
    <>
      <Typography variant="body1">
        <strong>Autorizado por Personal:</strong> 
        <Chip 
          label={request?.approvedByHR ? 'Sí' : 'No'} 
          color={request?.approvedByHR ? 'success' : 'error'} 
          size="small"
          sx={{ ml: 1 }}
        />
      </Typography>
      <Typography variant="body1">
        <strong>Fecha Fin de la vacación:</strong> {formatDate(request?.endDate || '')}
      </Typography>
      <Typography variant="body1">
        <strong>Total de días solicitados:</strong> {request?.totalDays}
      </Typography>
      <Typography variant="body1">
        <strong>Regreso:</strong> {formatDate(request?.returnDate || '')}
      </Typography>
    </>
  );

  const renderStatusUpdateSection = () => (
    <FormControl fullWidth sx={{ mt: 2 }}>
      <InputLabel id="status-select-label">Estado</InputLabel>
      <Select
        labelId="status-select-label"
        value={selectedStatus}
        onChange={handleStatusChange}
        label="Estado"
      >
        {STATUS_OPTIONS.map((status) => (
          <MenuItem key={status.value} value={status.value}>
            {status.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );

  const renderHRApprovalSection = () => (
    <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2 }}>
      <Typography variant="body1">
        <strong>Aprobado por Recursos Humanos:</strong>
      </Typography>
      <Button
        variant="contained"
        color={request?.approvedByHR ? 'error' : 'success'}
        startIcon={request?.approvedByHR ? <CancelIcon /> : <CheckIcon />}
        onClick={toggleApprovedByHR}
      >
        {request?.approvedByHR ? 'Desaprobar' : 'Aprobar'}
      </Button>
    </Stack>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ my: 4 }}>
        {error}
      </Alert>
    );
  }

  if (!request) {
    return (
      <Alert severity="info" sx={{ my: 4 }}>
        No se encontró la solicitud.
      </Alert>
    );
  }

  return (
    <Container maxWidth="md">
      {renderHeader()}

      {renderSection('Datos de Solicitante', renderApplicantInfo())}
      {renderSection('Informe del departamento de Personal', renderPersonalDepartmentReport())}
      {renderSection('Autorización del jefe inmediato Superior', renderSupervisorAuthorization())}
      {renderSection('Decreto del Departamento de Personal', renderPersonalDepartmentDecree())}

      {(user?.role === 'admin' || user?.role === 'supervisor') && (
        renderSection('Actualizar Estado de la Solicitud', renderStatusUpdateSection())
      )}

      {(user?.role === 'admin' || user?.role === 'supervisor') && (
        renderSection('Postergar Solicitud', (
          <PostponeVacationRequestForm
            requestId={request.requestId}
            onRequestUpdate={fetchRequestDetails}
          />
        ))
      )}

      {user?.role === 'admin' && (
        renderSection('Aprobación de Recursos Humanos', renderHRApprovalSection())
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>
          Información Importante
          <IconButton
            aria-label="close"
            onClick={() => setDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>{infoMessage}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} color="primary" autoFocus>
            Entendido
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

VacationRequestDetails.acl = {
  action: 'read',
  subject: 'vacation-request-details',
};

export default VacationRequestDetails;