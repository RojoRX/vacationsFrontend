import React, { useState, useEffect } from 'react';
import axios from 'src/lib/axios';
import {
  Container,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  IconButton,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

// Tipado de política de vacaciones
interface VacationPolicy {
  id: number;
  minYears: number;
  maxYears: number;
  vacationDays: number;
}

// Tipado de los datos para crear o actualizar una política de vacaciones
interface VacationPolicyFormData {
  minYears: number;
  maxYears: number;
  vacationDays: number;
}

const VacationPolicyCrud: React.FC = () => {
  const [policies, setPolicies] = useState<VacationPolicy[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedPolicyId, setSelectedPolicyId] = useState<number | null>(null);
  const [formData, setFormData] = useState<VacationPolicyFormData>({
    minYears: 0,
    maxYears: 0,
    vacationDays: 0,
  });

  useEffect(() => {
    fetchPolicies();
  }, []);

  // Obtener todas las políticas
  const fetchPolicies = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/vacation-policies`);
      setPolicies(response.data);
    } catch (error) {
      console.error('Error fetching policies:', error);
    }
  };

  // Crear una nueva política
  const createPolicy = async () => {
    try {
      await axios.post(`${API_BASE_URL}/vacation-policies`, formData);
      setOpenDialog(false);
      fetchPolicies();
    } catch (error) {
      console.error('Error creating policy:', error);
    }
  };

  // Actualizar una política existente
  const updatePolicy = async () => {
    if (selectedPolicyId === null) return;
    try {
      await axios.put(`${API_BASE_URL}/vacation-policies/${selectedPolicyId}`, formData);
      setOpenDialog(false);
      fetchPolicies();
    } catch (error) {
      console.error('Error updating policy:', error);
    }
  };

  // Eliminar una política
  const deletePolicy = async (id: number) => {
    try {
      await axios.delete(`${API_BASE_URL}/vacation-policies/${id}`);
      fetchPolicies();
    } catch (error) {
      console.error('Error deleting policy:', error);
    }
  };

  // Abrir el diálogo de creación o edición
  const handleOpenDialog = (policy?: VacationPolicy) => {
    setIsEditMode(!!policy);
    setSelectedPolicyId(policy ? policy.id : null);
    setFormData(
      policy
        ? { minYears: policy.minYears, maxYears: policy.maxYears, vacationDays: policy.vacationDays }
        : { minYears: 0, maxYears: 0, vacationDays: 0 }
    );
    setOpenDialog(true);
  };

  // Cerrar el diálogo
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({ minYears: 0, maxYears: 0, vacationDays: 0 });
  };

  // Manejar los cambios en los campos del formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: parseInt(value) });
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Políticas de Vacaciones
      </Typography>
      <Button variant="contained" color="primary" startIcon={<Add />} onClick={() => handleOpenDialog()}>
        Crear Nueva Política
      </Button>
      <TableContainer component={Paper} style={{ marginTop: 20 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Años Mínimos</TableCell>
              <TableCell>Años Máximos</TableCell>
              <TableCell>Días de Vacaciones</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {policies.map((policy) => (
              <TableRow key={policy.id}>
                <TableCell>{policy.id}</TableCell>
                <TableCell>{policy.minYears}</TableCell>
                <TableCell>{policy.maxYears}</TableCell>
                <TableCell>{policy.vacationDays}</TableCell>
                <TableCell>
                  <IconButton color="primary" onClick={() => handleOpenDialog(policy)}>
                    <Edit />
                  </IconButton>
                  <IconButton color="secondary" onClick={() => deletePolicy(policy.id)}>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Diálogo de creación/edición */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{isEditMode ? 'Editar Política de Vacaciones' : 'Crear Política de Vacaciones'}</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Años Mínimos"
            type="number"
            name="minYears"
            fullWidth
            value={formData.minYears}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            label="Años Máximos"
            type="number"
            name="maxYears"
            fullWidth
            value={formData.maxYears}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            label="Días de Vacaciones"
            type="number"
            name="vacationDays"
            fullWidth
            value={formData.vacationDays}
            onChange={handleChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Cancelar
          </Button>
          <Button onClick={isEditMode ? updatePolicy : createPolicy} color="primary">
            {isEditMode ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default VacationPolicyCrud;
