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
import axios from 'axios';
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
  });

  useEffect(() => {
    if (request) {
      setFormData({
        startDate: request.startDate || '',
        endDate: request.endDate || '',
      });
    }
  }, [request]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!request) return;
    
    try {
      const response = await axios.patch<VacationRequest>(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/vacation-requests/${request.id}/suspend`,
        {
          startDate: formData.startDate,
          endDate: formData.endDate,
          status: 'SUSPENDED'
        }
      );
      onSuccess(response.data);
      onClose();
    } catch (error) {
      console.error('Error al suspender la solicitud:', error);
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