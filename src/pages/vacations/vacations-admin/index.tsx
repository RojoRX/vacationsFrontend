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
} from '@mui/material';
import router from 'next/router';

// Tipado de la solicitud de vacaciones
interface VacationRequest {
  approvedByHR: boolean;
  username: string;
  user: any;
  id: number;
  employeeName: string;
  startDate: string;
  endDate: string;
  status: string;
  requestDate: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

const AdminVacationRequests: FC = () => {
  const [requests, setRequests] = useState<VacationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(''); // Estado para el filtrado por nombre
  const [statusFilter, setStatusFilter] = useState(''); // Estado para el filtrado por estado

  // Estado para la paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10); // Mostrar 10 filas por página por defecto

  const statusMap = {
    PENDING: { label: 'Pendiente', color: 'default' },
    AUTHORIZED: { label: 'Autorizado', color: 'success' },
    POSTPONED: { label: 'Postergado', color: 'warning' },
    DENIED: { label: 'Rechazado', color: 'error' },
    SUSPENDED: { label: 'Suspendido', color: 'info' },
  } as const;

  // Obtener las solicitudes de vacaciones para el administrador
  useEffect(() => {
    const fetchVacationRequests = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/vacation-requests`);
        setRequests(response.data);
      } catch (error) {
        console.error('Error fetching vacation requests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVacationRequests();
  }, []);

  // Filtrar las solicitudes por nombre y estado
  const filteredRequests = requests
    .filter((request) => {
      const matchesName = request.username.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === '' || request.status === statusFilter;
      return matchesName && matchesStatus;
    })
    .sort((a, b) => b.id - a.id); // Ordenar por ID de mayor a menor

  // Manejar el cambio de página
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // Manejar el cambio en la cantidad de filas por página
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Resetear a la primera página cuando se cambia el número de filas por página
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
                      <TableCell>{request.requestDate}</TableCell>
                      <TableCell>
                        {/* Mostrar estado con Chip de color y traducción */}
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
                        >
                          Ver Solicitud
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
    </Container>
  );
};

export default AdminVacationRequests;
