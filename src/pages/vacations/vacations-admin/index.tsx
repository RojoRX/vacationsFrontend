import React, { FC, useEffect, useState } from 'react';
import axios from 'src/lib/axios';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  TextField,
  MenuItem,
  Button,
  Chip,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  useTheme,
  Alert,
  IconButton,
  Grid
} from '@mui/material';
import router from 'next/router';
import { Info as InfoIcon } from '@mui/icons-material';
import IdentifierIcon from '@mui/icons-material/Numbers';
import AccountTieIcon from '@mui/icons-material/AccountCircle';
import CalendarCheckIcon from '@mui/icons-material/EventAvailable';
import CalendarStartIcon from '@mui/icons-material/Event';
import CalendarEndIcon from '@mui/icons-material/EventNote';
import CalendarWeekIcon from '@mui/icons-material/DateRange';
import CalendarReturnIcon from '@mui/icons-material/EventRepeat';
import StatusIcon from '@mui/icons-material/Flag';
import HumanResourcesIcon from '@mui/icons-material/People';
import AccountSupervisorIcon from '@mui/icons-material/SupervisorAccount';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import ArrowRightIcon from '@mui/icons-material/ArrowForward';
import EditIcon from '@mui/icons-material/Edit';

import { format } from 'date-fns';
import SuspendVacationDialog from '../vacations-suspend';
import { VacationRequest } from 'src/interfaces/vacationRequests';
import { formatDate } from 'src/utils/dateUtils';
import Link from 'next/link';
import useUser from 'src/hooks/useUser';
import EditVacationDialog from '../vacations-editDate';

// Tipado de la solicitud de vacaciones
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

const AdminVacationRequests: FC = () => {
  const [requests, setRequests] = useState<VacationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedRequest, setSelectedRequest] = useState<VacationRequest | null>(null);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const theme = useTheme();
  const [openSuspendDialog, setOpenSuspendDialog] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const user = useUser();
  const [openEditDialog, setOpenEditDialog] = useState(false);

  const statusMap = {
    PENDING: { label: 'Pendiente', color: 'default' },
    AUTHORIZED: { label: 'Autorizado', color: 'success' },
    POSTPONED: { label: 'Postergado', color: 'info' },
    DENIED: { label: 'Rechazado', color: 'error' },
    SUSPENDED: { label: 'Suspendido', color: 'warning' },
  } as const;

  useEffect(() => {
    const fetchVacationRequests = async () => {
      try {
        const endpoint = showDeleted
          ? `${API_BASE_URL}/vacation-requests/deleted`
          : `${API_BASE_URL}/vacation-requests`;

        const response = await axios.get(endpoint);
        setRequests(response.data);
      } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
          console.error('Error response data:', error.response.data);
          console.error('Error status:', error.response.status);
          alert(`Error ${error.response.status}: ${JSON.stringify(error.response.data)}`);
        } else {
          console.error('Unexpected error:', error);
          alert('Error inesperado al cargar las solicitudes de vacaciones.');
        }
      }
      finally {
        setLoading(false);
      }
    };

    fetchVacationRequests();
  }, [showDeleted]);

  const filteredRequests = requests
    .filter((request) => {
      const lowerQuery = searchQuery.toLowerCase();
      const matchesNameOrCI =
        (request.username || '').toLowerCase().includes(lowerQuery) ||
        (request.ci || '').toString().includes(lowerQuery);
      const matchesStatus = statusFilter === '' || request.status === statusFilter;
      return matchesNameOrCI && matchesStatus;
    })
    .sort((a, b) => b.id - a.id);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Modifica la función handleOpenDetailDialog
  const handleOpenDetailDialog = (request: VacationRequest) => {
    setSelectedRequest(request);
    setOpenDetailDialog(true);
  };

  const handleCloseDetailDialog = () => {
    setOpenDetailDialog(false);
    setSelectedRequest(null); // ✅ solo aquí
  };



  const handleSuspendSuccess = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/vacation-requests`);
      setRequests(response.data);
      setOpenDetailDialog(false);
      setOpenSuspendDialog(false);
    } catch (error) {
      console.error('Error al actualizar las solicitudes:', error);
    }
  };
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackSeverity, setFeedbackSeverity] = useState<'success' | 'error'>('success');

  const handleSoftDelete = async () => {
    if (!selectedRequest) return;
    try {
      await axios.patch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/vacation-requests/${selectedRequest.id}/soft-delete`, {
        userId: user?.id,
      });

      setFeedbackSeverity('success');
      setFeedbackMessage('Solicitud eliminada exitosamente');

      // Recargar solicitudes para reflejar el cambio
      const response = await axios.get(`${API_BASE_URL}/vacation-requests`);
      setRequests(response.data);

      // Opcional: cerrar el diálogo después de un tiempo
      setTimeout(() => {
        setOpenDetailDialog(false);
        setFeedbackMessage(null);
      }, 2000);
    } catch (error: any) {
      console.error('Error al eliminar la solicitud:', error);
      setFeedbackSeverity('error');
      setFeedbackMessage(error?.response?.data?.message || 'Ocurrió un error al eliminar la solicitud.');
    }
  };
  const handleOpenEditDialog = (request: VacationRequest) => {
    setSelectedRequest(request);
    setOpenEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    // ❌ NO poner setSelectedRequest(null) aquí
  };


  const handleEditSuccess = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/vacation-requests`);
      setRequests(response.data);

      setFeedbackSeverity('success');
      setFeedbackMessage('Solicitud actualizada correctamente ✅');

      setTimeout(() => {
        setFeedbackMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Error al actualizar la lista después de editar:', error);
    }
  };



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'default';
      case 'AUTHORIZED': return 'success';
      case 'POSTPONED': return 'warning';
      case 'DENIED': return 'error';
      case 'SUSPENDED': return 'info';
      default: return 'default';
    }
  };

  return (
    <Container>

      <Typography variant="h4" gutterBottom>
        Solicitudes de Vacaciones
      </Typography>
      {showDeleted && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Estás viendo solicitudes eliminadas
        </Alert>
      )}
      {/* Filtros */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <TextField
          label="Buscar por empleado"
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '45%' }}
        />
        <TextField
          label="Filtrar por estado"
          variant="outlined"
          select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ width: '45%' }}
        >
          <MenuItem value="">Todos</MenuItem>
          {Object.keys(statusMap).map((status) => (
            <MenuItem key={status} value={status}>
              {statusMap[status as keyof typeof statusMap].label}
            </MenuItem>
          ))}
        </TextField>
      </div>

      {/* Tabla de solicitudes */}
      {loading ? (
        <CircularProgress />
      ) : (
        <>
          <Button
            variant="outlined"
            color={showDeleted ? 'error' : 'primary'}
            onClick={() => {
              setLoading(true);
              setShowDeleted(!showDeleted);
            }}
            sx={{ mb: 2 }}
          >
            {showDeleted ? 'Ver activas' : 'Ver eliminadas'}
          </Button>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Empleado</TableCell>
                  <TableCell>CI</TableCell> {/* NUEVA COLUMNA */}
                  <TableCell>Departamento</TableCell> {/* NUEVA COLUMNA */}
                  <TableCell>Unidad Academica</TableCell> {/* NUEVA COLUMNA */}

                  <TableCell>Fecha de Solicitud</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Aprobado</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRequests
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>{request.id}</TableCell>
                      <TableCell>
                        <Link href={`/users/${request.ci}`} passHref>
                          <Box
                            component="a"
                            color="primary.main"
                            sx={{
                              cursor: 'pointer',
                              textDecoration: 'none',
                              fontWeight: 'bold',
                              display: 'inline-block',
                              '&:hover': {
                                textDecoration: 'none',
                              }
                            }}
                          >
                            {request.fullname}
                          </Box>
                        </Link>
                      </TableCell>

                      <TableCell>{request.ci}</TableCell> {/* NUEVA CELDA */}
                      <TableCell>{request.department || "No Registrado"}</TableCell> {/* NUEVA CELDA */}
                      <TableCell>{request.academicUnit}</TableCell> {/* NUEVA CELDA */}
                      <TableCell>{formatDate(request.requestDate)}</TableCell>
                      <TableCell>
                        <Chip
                          label={statusMap[request.status as keyof typeof statusMap]?.label || 'Desconocido'}
                          color={statusMap[request.status as keyof typeof statusMap]?.color || 'default'}
                        />
                      </TableCell>
                      <TableCell>{request.approvedByHR ? 'Sí' : 'No'}</TableCell>
                      <TableCell>
                        <Box display="flex" flexDirection="column" gap={1}>
                          {/*    <Button
                            variant="contained"
                            color="primary"
                            onClick={() => router.push(`/vacations/vacations-requests/${request.id}`)}
                          >
                            Ver Solicitud
                          </Button>*/}

                          <Button
                            variant="outlined"
                            color="info"
                            startIcon={<InfoIcon />}
                            onClick={() => handleOpenDetailDialog(request)}
                          >
                            Detalles
                          </Button>
                        </Box>
                      </TableCell>

                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Paginación */}
          <TablePagination
            component="div"
            count={filteredRequests.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Filas por página"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          />
        </>
      )}

      {/* Diálogo de detalles */}
      <Dialog open={openDetailDialog} onClose={handleCloseDetailDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InfoIcon color="primary" />
            Detalles de la Solicitud #{selectedRequest?.id}
          </Box>
          <IconButton onClick={handleCloseDetailDialog}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        {feedbackMessage && (
          <Alert severity={feedbackSeverity} sx={{ mx: 3, mt: 1 }}>
            {feedbackMessage}
          </Alert>
        )}
        <DialogContent dividers>
          {selectedRequest && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <AccountTieIcon color="action" />
                <Typography variant="body1">
                  <strong>Empleado:</strong> {selectedRequest.fullname}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <AccountTieIcon color="action" />
                <Typography variant="body1">
                  <strong>Departamento:</strong> {selectedRequest.department}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <AccountTieIcon color="action" />
                <Typography variant="body1">
                  <strong>Unidad Academica:</strong> {selectedRequest.academicUnit}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CalendarCheckIcon color="action" />
                <Typography variant="body1">
                  <strong>Fecha Solicitud:</strong> {formatDate(selectedRequest.requestDate)}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CalendarStartIcon color="action" />
                <Typography variant="body1">
                  <strong>Fecha Inicio:</strong> {formatDate(selectedRequest.startDate)}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CalendarEndIcon color="action" />
                <Typography variant="body1">
                  <strong>Fecha Fin:</strong> {formatDate(selectedRequest.endDate)}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CalendarWeekIcon color="action" />
                <Typography variant="body1">
                  <strong>Días Solicitados:</strong> {selectedRequest.totalDays}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CalendarReturnIcon color="action" />
                <Typography variant="body1">
                  <strong>Fecha Retorno:</strong> {formatDate(selectedRequest.returnDate ?? '')}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <StatusIcon color="action" />
                <Typography variant="body1">
                  <strong>Estado:</strong>{' '}
                  <Chip
                    label={statusMap[selectedRequest.status as keyof typeof statusMap]?.label || 'Desconocido'}
                    color={getStatusColor(selectedRequest.status)}
                    size="small"
                  />
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <HumanResourcesIcon color="action" />
                <Typography variant="body1">
                  <strong>Aprobado por Dpto. Personal:</strong>{' '}
                  {selectedRequest.approvedByHR ? (
                    <CheckIcon color="success" fontSize="small" />
                  ) : (
                    <CloseIcon color="error" fontSize="small" />
                  )}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <AccountSupervisorIcon color="action" />
                <Typography variant="body1">
                  <strong>Aprobado por Jefe Superior:</strong>{' '}
                  {selectedRequest.approvedBySupervisor ? (
                    <CheckIcon color="success" fontSize="small" />
                  ) : (
                    <CloseIcon color="error" fontSize="small" />
                  )}
                </Typography>
              </Box>

              {selectedRequest.postponedReason && (
                <Box sx={{
                  p: 2,
                  backgroundColor: theme.palette.warning.light,
                  borderRadius: 1
                }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    <strong>Motivo de postergación:</strong> {selectedRequest.postponedReason}
                  </Typography>
                </Box>
              )}
              {selectedRequest?.deleted !== true && (
                <Grid container spacing={1}>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<EditIcon />}
                      onClick={() => setOpenEditDialog(true)}
                      fullWidth
                    >
                      Editar Solicitud
                    </Button>
                  </Grid>
                </Grid>
              )}

              {/* Botón para suspender */}
              {selectedRequest.status !== 'SUSPENDED' && selectedRequest.deleted !== true && (
                <Grid container spacing={1}>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      color="warning"
                      startIcon={<EditIcon />}
                      onClick={() => setOpenSuspendDialog(true)}
                      fullWidth
                    >
                      Suspender Solicitud
                    </Button>
                  </Grid>
                </Grid>
              )}

            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Grid container spacing={1}>
            <Grid item xs={12} sm={6}>
              <Button
                onClick={() => {
                  if (selectedRequest) {
                    router.push(`/vacations/vacations-requests/${selectedRequest.id}`);
                  }
                }}
                color="secondary"
                variant="contained"
                fullWidth
                startIcon={<ArrowRightIcon />}
              >
                Ver solicitud completa
              </Button>
            </Grid>

            {selectedRequest?.deleted !== true && (
              <Grid item xs={12} sm={6}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<EditIcon />}
                  onClick={() => handleOpenEditDialog(selectedRequest!)} // 🔹 pasa la request al hijo
                  fullWidth
                >
                  Editar Solicitud
                </Button>

              </Grid>
            )}
          </Grid>
        </DialogActions>


      </Dialog>
      {/* Diálogo de suspensión (componente reutilizable) */}
      <SuspendVacationDialog
        open={openSuspendDialog}
        onClose={() => setOpenSuspendDialog(false)}
        request={selectedRequest}
        onSuccess={handleSuspendSuccess}
      />
      <EditVacationDialog
        open={openEditDialog}
        onClose={handleCloseEditDialog}
        request={selectedRequest}
        onSuccess={async () => {
          await handleEditSuccess();
          handleCloseDetailDialog(); // 🔹 cerrar el dialogo padre también
          handleCloseEditDialog();   // 🔹 cerrar el dialogo de edición
        }}
      />


    </Container>
  );
};

export default AdminVacationRequests;