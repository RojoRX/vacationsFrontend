import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from '@mui/material';
import { Pause as SuspendIcon } from '@mui/icons-material';
import axios from 'src/lib/axios';
import { VacationRequest } from 'src/interfaces/vacationRequests';

interface SuspendVacationDialogProps {
  open: boolean;
  onClose: () => void;
  request: Omit<VacationRequest, 'managementPeriodStart' | 'managementPeriodEnd' | 'reviewDate'> | null;
  onSuccess: (updatedRequest: VacationRequest) => void;
}

const SuspendVacationDialog: React.FC<SuspendVacationDialogProps> = ({
  open,
  onClose,
  request,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    postponedReason: '', // NUEVO
  });

  useEffect(() => {
    if (request) {
      setFormData({
        startDate: request.startDate || '',
        endDate: request.endDate || '',
        postponedReason: '', // Inicializa vacío
      });
    }
  }, [request]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async () => {
    if (!request) return;

    try {
      const response = await axios.patch<VacationRequest>(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/vacation-requests/${request.id}/suspend`,
        {
          startDate: formData.startDate,
          endDate: formData.endDate,
          postponedReason: formData.postponedReason?.trim() || undefined, // SOLO si hay texto
        }
      );
      onSuccess(response.data);
      onClose();
    } catch (error: any) {
      console.error('Error al suspender la solicitud:', error);
      const message = error.response?.data?.message || 'Error inesperado.';
      setErrorMessage(message);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SuspendIcon color="warning" />
        Suspender Solicitud de Vacaciones
      </DialogTitle>
      <DialogContent>
        <TextField
          label="Nueva Fecha de Inicio"
          type="date"
          name="startDate"
          value={formData.startDate}
          onChange={handleChange}
          fullWidth
          margin="normal"
          InputLabelProps={{ shrink: true }}
          sx={{ mt: 2 }}
        />
        <TextField
          label="Nueva Fecha de Fin"
          type="date"
          name="endDate"
          value={formData.endDate}
          onChange={handleChange}
          fullWidth
          margin="normal"
          InputLabelProps={{ shrink: true }}
        />
        {/* NUEVO CAMPO OPCIONAL */}
        <TextField
          label="Razón de suspensión (opcional)"
          name="postponedReason"
          value={formData.postponedReason}
          onChange={handleChange}
          fullWidth
          margin="normal"
          multiline
          rows={3}
          placeholder="Opcional: describe la razón de la suspensión (max. 300 caracteres)"
          inputProps={{ maxLength: 300 }}
        />

        {errorMessage && (
          <p style={{ color: 'red', marginTop: 8 }}>{errorMessage}</p>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          onClick={handleSubmit}
          color="warning"
          variant="contained"
          startIcon={<SuspendIcon />}
        >
          Confirmar Suspensión
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SuspendVacationDialog;
