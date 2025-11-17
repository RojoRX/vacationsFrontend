// src/components/vacations/EditVacationDialog.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  Box,
} from '@mui/material';
import axios from 'src/lib/axios';
import { VacationRequest } from 'src/interfaces/vacationRequests';

interface EditVacationDialogProps {
  open: boolean;
  onClose: () => void;
  request: VacationRequest | null;
  onSuccess: () => void; // para que el padre refresque datos
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

const EditVacationDialog: React.FC<EditVacationDialogProps> = ({
  open,
  onClose,
  request,
  onSuccess,
}) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 👉 actualizar fechas por defecto cada vez que cambie la request
  useEffect(() => {
    if (request) {
      setStartDate(request.startDate.split('T')[0]);
      setEndDate(request.endDate.split('T')[0]);
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [request]);

  if (!request) return null;

  const handleSave = async () => {
    if (!startDate || !endDate) {
      setErrorMessage('Debe seleccionar ambas fechas.');
      
return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setErrorMessage('La fecha de inicio no puede ser posterior a la fecha de fin.');
      
return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      await axios.put(`${API_BASE_URL}/vacation-requests/${request.id}`, {
        startDate,
        endDate,
      });

      setSuccessMessage('Solicitud actualizada con éxito');
      onSuccess(); // notifica al padre para que refresque
    } catch (error: any) {
      console.error('Error al actualizar:', error);
      setErrorMessage(error?.response?.data?.message || 'Error inesperado al editar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Editar Solicitud #{request.id}</DialogTitle>
      <DialogContent dividers>
        {errorMessage && <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert>}
        {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            type="date"
            label="Fecha de inicio"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            type="date"
            label="Fecha de fin"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cerrar
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditVacationDialog;
