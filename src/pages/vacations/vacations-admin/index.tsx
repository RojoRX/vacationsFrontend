import React, { FC, useEffect, useState } from 'react';
import axios from 'axios';
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
  useTheme
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
        const response = await axios.get(`${API_BASE_URL}/vacation-requests`);
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
  }, []);

  const filteredRequests = requests
    .filter((request) => {
      const matchesName = (request.username || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === '' || request.status === statusFilter;
      return matchesName && matchesStatus;
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
    setSelectedRequest(null);
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
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Empleado</TableCell>
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
                      <TableCell>{request.username}</TableCell>
                      <TableCell>{formatDate(request.requestDate)}</TableCell>
                      <TableCell>
                        <Chip
                          label={statusMap[request.status as keyof typeof statusMap]?.label || 'Desconocido'}
                          color={statusMap[request.status as keyof typeof statusMap]?.color || 'default'}
                        />
                      </TableCell>
                      <TableCell>{request.approvedByHR ? 'Sí' : 'No'}</TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => router.push(`/vacations/vacations-requests/${request.id}`)}
                          sx={{ mr: 1 }}
                        >
                          Ver Solicitud
                        </Button>
                        <Button
                          variant="outlined"
                          color="info"
                          startIcon={<InfoIcon />}
                          onClick={() => handleOpenDetailDialog(request)}
                        >
                          Detalles
                        </Button>
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
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InfoIcon color="primary" />
          Detalles de la Solicitud #{selectedRequest?.id}
        </DialogTitle>
        <DialogContent dividers>
          {selectedRequest && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <AccountTieIcon color="action" />
                <Typography variant="body1">
                  <strong>Empleado:</strong> {selectedRequest.username}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <AccountTieIcon color="action" />
                <Typography variant="body1">
                  <strong>Posición:</strong> {selectedRequest.position}
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

              {/* Botón para suspender */}
              {selectedRequest.status !== 'SUSPENDED' && (
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    color="warning"
                    startIcon={<EditIcon />}
                    onClick={() => setOpenSuspendDialog(true)}
                  >
                    Suspender Solicitud
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetailDialog} color="primary">
            Cerrar
          </Button>
          <Button
            onClick={() => {
              if (selectedRequest) {
                router.push(`/vacations/vacations-requests/${selectedRequest.id}`);
              }
            }}
            color="secondary"
            variant="contained"
          >
            Ver solicitud completa
          </Button>
        </DialogActions>
      </Dialog>
      {/* Diálogo de suspensión (componente reutilizable) */}
      <SuspendVacationDialog
        open={openSuspendDialog}
        onClose={() => setOpenSuspendDialog(false)}
        request={selectedRequest}
        onSuccess={handleSuspendSuccess}
      />
    </Container>
  );
};

export default AdminVacationRequests;