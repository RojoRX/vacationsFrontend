import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip
} from '@mui/material';
import axios from 'axios';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface License {
  id: number;
  licenseType: string;
  timeRequested: string;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
}

interface UserLicenseListProps {
  userId: number;
}

const UserLicenseList: React.FC<UserLicenseListProps> = ({ userId }) => {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLicenses = async () => {
        try {
          setLoading(true);
          const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/licenses/user/${userId}`);
          setLicenses(response.data);
          setError(null); // Asegura que no haya mensaje de error si antes hubo
        } catch (err: any) {
          if (axios.isAxiosError(err) && err.response?.status === 404) {
            // El usuario no tiene licencias, lo tratamos como no-error
            setLicenses([]); 
            setError(null);
          } else {
            console.error('Error fetching licenses:', err);
            setError('Error al cargar las licencias desde el servidor');
          }
        } finally {
          setLoading(false);
        }
      };
      
      

    if (userId) {
      fetchLicenses();
    }
  }, [userId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APROBADO': return 'success';
      case 'PENDIENTE': return 'warning';
      case 'RECHAZADO': return 'error';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'PPP', { locale: es });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        {error}
      </Alert>
    );
  }
  
  // Mostrar mensaje si no hay licencias (pero no es error)
  if (!error && licenses.length === 0) {
    return (
      <Typography variant="body1" sx={{ py: 4, textAlign: 'center' }}>
        El usuario no tiene licencias registradas
      </Typography>
    );
  }
  
  return (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Tipo</TableCell>
            <TableCell>Duración</TableCell>
            <TableCell>Fecha Inicio</TableCell>
            <TableCell>Fecha Fin</TableCell>
            <TableCell>Estado</TableCell>
            <TableCell>Registrado</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {licenses.map((license) => (
            <TableRow key={license.id}>
              <TableCell>{license.licenseType}</TableCell>
              <TableCell>{license.timeRequested}</TableCell>
              <TableCell>{formatDate(license.startDate)}</TableCell>
              <TableCell>{formatDate(license.endDate)}</TableCell>
              <TableCell>
                <Chip 
                  label={license.status} 
                  color={getStatusColor(license.status)} 
                  size="small" 
                />
              </TableCell>
              <TableCell>{formatDate(license.createdAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default UserLicenseList;