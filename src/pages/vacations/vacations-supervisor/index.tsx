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
} from '@mui/material';
import  useUser from 'src/hooks/useUser'; // Asegúrate de importar correctamente tu hook
import router from 'next/router';

// Tipado de la solicitud de vacaciones
interface VacationRequest {
  user: any;
  id: number;
  employeeName: string;
  startDate: string;
  endDate: string;
  status: string;
  requestDate: string;
}

// Tipado para la ACL
interface ACL {
  action: string;
  subject: string;
}

// Extendiendo la propiedad ACL a nuestro componente
interface SupervisorVacationRequestsProps {
  acl?: ACL;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

const SupervisorVacationRequests: FC<SupervisorVacationRequestsProps> = () => {
  const  user  = useUser(); // Extraer el usuario (supervisor)
  const [requests, setRequests] = useState<VacationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(''); // Estado para el filtrado por nombre
  const [statusFilter, setStatusFilter] = useState(''); // Estado para el filtrado por estado

  // Obtener las solicitudes de vacaciones por supervisor
  useEffect(() => {
    const fetchVacationRequests = async () => {
      if (user && user.id) { // Asegurarse de que 'user' y 'user.id' existen
        try {
          const response = await axios.get(`${API_BASE_URL}/vacation-requests/supervisor/${user.id}`);
          setRequests(response.data);
        } catch (error) {
          console.error('Error fetching vacation requests:', error);
        } finally {
          setLoading(false); // Asegurarse de que loading se setea en cualquier caso
        }
      } else {
        setLoading(false); // Si no hay 'user', también desactivamos loading
      }
    };

    fetchVacationRequests();
  }, [user]);

  // Filtrar las solicitudes por nombre y estado
  const filteredRequests = requests.filter((request) => {
    const matchesName = request.user.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === '' || request.status === statusFilter;
    return matchesName && matchesStatus;
  });

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Solicitudes de Vacaciones del Departamento o Unidad
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
          <MenuItem value="AUTHORIZED">Aprobado</MenuItem>
          <MenuItem value="PENDING">Pendiente</MenuItem>
          <MenuItem value="POSTPONED">Postpuesto</MenuItem>
          <MenuItem value="DENIED">Rechazado</MenuItem>
          <MenuItem value="SUSPENDED">Suspendido</MenuItem>
        </TextField>
      </div>

      {/* Tabla de solicitudes */}
      {loading ? (
        <CircularProgress />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Empleado</TableCell>
                <TableCell>Fecha de Solicitud</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRequests.length > 0 ? (
                filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>{request.id}</TableCell>
                    <TableCell>{request.user.username}</TableCell>
                    <TableCell>{request.requestDate}</TableCell>
                    <TableCell>{request.status}</TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() =>  router.push(`/vacations/vacations-requests/${request.id}`)} // Aquí puedes redirigir a la página de detalle
                      >
                        Ver Solicitud
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No se encontraron solicitudes
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
};

// Crear una propiedad estática para ACL y agregarla manualmente
(SupervisorVacationRequests as any).acl = {
  action: 'read',
  subject: 'supervisor-vacation-requests',
};

export default SupervisorVacationRequests;
