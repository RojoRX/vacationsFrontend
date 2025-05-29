import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
} from '@mui/material';
import axios from 'src/lib/axios';

interface VacationRequest {
  id: number;
  position: string;
  requestDate: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  status: 'PENDING' | 'AUTHORIZED' | 'DENIED' | 'SUSPENDED';
  postponedDate: string | null;
  postponedReason: string | null;
  returnDate: string;
  approvedByHR: boolean;
  approvedBySupervisor: boolean;
  ci: string;
}

interface EditVacationDialogProps {
  open: boolean;
  onClose: () => void;
  request: VacationRequest | null;
  onUpdate: (updatedRequest: VacationRequest) => void;
}

const statusOptions = [
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'AUTHORIZED', label: 'Autorizado' },
  { value: 'DENIED', label: 'Rechazado' },
  { value: 'SUSPENDED', label: 'Suspendido' },
];

const EditVacationDialog: React.FC<EditVacationDialogProps> = ({
  open,
  onClose,
  request,
  onUpdate,
}) => {
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    status: '',
    postponedDate: '',
    postponedReason: '',
  });

  useEffect(() => {
    if (request) {
      setFormData({
        startDate: request.startDate,
        endDate: request.endDate,
        status: request.status,
        postponedDate: request.postponedDate || '',
        postponedReason: request.postponedReason || '',
      });
    }
  }, [request]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!request) return;

    try {
      let response;

      if (formData.status === 'SUSPENDED') {
        response = await axios.patch<VacationRequest>(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/vacation-requests/${request.id}/suspend`,
          {
            startDate: formData.startDate,
            endDate: formData.endDate,
          }
        );
      } else {
        response = await axios.put<VacationRequest>(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/vacation-requests/${request.id}`,
          {
            startDate: formData.startDate,
            status: formData.status,
            postponedDate: formData.postponedDate || null,
            postponedReason: formData.postponedReason || null,
          }
        );
      }

      onUpdate(response.data);
      onClose();
    } catch (error) {
      console.error('Error al actualizar la solicitud:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Editar Solicitud de Vacaciones</DialogTitle>
      <DialogContent>
        <TextField
          label="Fecha de Inicio"
          type="date"
          name="startDate"
          value={formData.startDate}
          onChange={handleChange}
          fullWidth
          margin="normal"
          InputLabelProps={{ shrink: true }}
        />

        {formData.status === 'SUSPENDED' && (
          <TextField
            label="Fecha de Fin"
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
        )}

        <FormControl fullWidth margin="normal">
          <InputLabel id="status-label">Estado</InputLabel>
          <Select
            labelId="status-label"
            name="status"
            value={formData.status}
            onChange={handleChange}
            label="Estado"
          >
            {statusOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {formData.status !== 'SUSPENDED' && (
          <>
            <TextField
              label="Fecha de Postergación"
              type="date"
              name="postponedDate"
              value={formData.postponedDate}
              onChange={handleChange}
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Motivo de Postergación"
              name="postponedReason"
              value={formData.postponedReason}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit} color="primary" variant="contained">
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditVacationDialog;
