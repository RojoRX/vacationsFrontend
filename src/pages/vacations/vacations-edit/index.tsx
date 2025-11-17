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
  FormControlLabel,
  Checkbox,
  Alert,
  Box,
  Grid,
} from '@mui/material';
import axios from 'src/lib/axios';
import { VacationRequest } from 'src/interfaces/vacationRequests';

interface EditVacationDialogProps {
  open: boolean;
  onClose: () => void;
  request: VacationRequest | null;
  onUpdate: (updatedRequest: VacationRequest) => void;
}

const statusOptions = [
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'AUTHORIZED', label: 'Autorizado' },
  { value: 'POSTPONED', label: 'Postergado' },
  { value: 'DENIED', label: 'Rechazado' },
  { value: 'SUSPENDED', label: 'Suspendido' },
];

const approvedByHROptions = [
  { value: 'null', label: 'Sin revisar' },
  { value: 'true', label: 'Aprobado' },
  { value: 'false', label: 'Rechazado' },
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
    postponedReason: '',
    approvedByHR: 'null' as 'null' | 'true' | 'false',
    deleted: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (request) {
      setFormData({
        startDate: request.startDate.split('T')[0],
        endDate: request.endDate.split('T')[0],
        status: request.status,
        postponedReason: request.postponedReason || '',
        approvedByHR: request.approvedByHR === null ? 'null' : request.approvedByHR ? 'true' : 'false',
        deleted: request.deleted || false,
      });
      setError('');
    }
  }, [request]);

  // Manejar cambios en Select
  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Manejar cambios en TextField
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Manejar cambios en Checkbox
  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const validateForm = (): boolean => {
    // Validar fechas
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (start > end) {
        setError('La fecha de inicio no puede ser posterior a la fecha de fin');
        
return false;
      }
    }

    // Validar razón de postergación
    if (formData.status === 'POSTPONED' && !formData.postponedReason.trim()) {
      setError('La razón de postergación es obligatoria cuando el estado es POSTERGADO');
      
return false;
    }

    setError('');
    
return true;
  };

  const handleSubmit = async () => {
    if (!request) return;

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Preparar datos para enviar
      const updateData: any = {};

      // Solo incluir campos que han cambiado o son necesarios
      if (formData.startDate !== request.startDate.split('T')[0]) {
        updateData.startDate = formData.startDate;
      }
      if (formData.endDate !== request.endDate.split('T')[0]) {
        updateData.endDate = formData.endDate;
      }
      if (formData.status !== request.status) {
        updateData.status = formData.status;
      }
      if (formData.postponedReason !== (request.postponedReason || '')) {
        updateData.postponedReason = formData.postponedReason;
      }
      if (formData.approvedByHR !== (request.approvedByHR === null ? 'null' : request.approvedByHR ? 'true' : 'false')) {
        updateData.approvedByHR = formData.approvedByHR === 'null' ? null : formData.approvedByHR === 'true';
      }
      if (formData.deleted !== request.deleted) {
        updateData.deleted = formData.deleted;
      }

      const response = await axios.put<VacationRequest>(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/vacation-requests/${request.id}`,
        updateData
      );

      onUpdate(response.data);
      onClose();
    } catch (error: any) {
      console.error('Error al actualizar la solicitud:', error);
      setError(error.response?.data?.message || 'Error al actualizar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const isPostponed = formData.status === 'POSTPONED';
  const isAuthorized = formData.status === 'AUTHORIZED';

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        Editar Solicitud de Vacaciones
        {request && (
          <Box sx={{ fontSize: '0.875rem', color: 'text.secondary', mt: 0.5 }}>
            CI: {request.ci} | Días solicitados: {request.totalDays}
          </Box>
        )}
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2}>
          {/* Fechas de vacaciones */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Fecha de Inicio"
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Fecha de Fin"
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* Estado y Aprobación RRHH */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth margin="normal">
              <InputLabel id="status-label">Estado</InputLabel>
              <Select
                labelId="status-label"
                name="status"
                value={formData.status}
                onChange={handleSelectChange}
                label="Estado"
              >
                {statusOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth margin="normal">
              <InputLabel id="approvedByHR-label">Aprobación RRHH</InputLabel>
              <Select
                labelId="approvedByHR-label"
                name="approvedByHR"
                value={formData.approvedByHR}
                onChange={handleSelectChange}
                label="Aprobación RRHH"
              >
                {approvedByHROptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Razón de postergación */}
          {isPostponed && (
            <Grid item xs={12}>
              <TextField
                label="Motivo de Postergación"
                name="postponedReason"
                value={formData.postponedReason}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                multiline
                rows={3}
                placeholder="Describa el motivo de la postergación..."
                required
              />
            </Grid>
          )}

          {/* Campo de eliminación */}
          <Grid item xs={12}>
            
            <FormControlLabel
              control={
                <Checkbox
                  name="deleted"
                  checked={formData.deleted}
                  onChange={handleCheckboxChange}
                  color="error"
                />
              }
              label="Marcar como eliminado"
            />
            {formData.deleted && (
              <Alert severity="warning" sx={{ mt: 1 }}>
                Esta solicitud será eliminada
              </Alert>
            )}
          </Grid>

          {/* Información de solo lectura */}
          {request && (
            <>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Fecha de Solicitud"
                  value={request.requestDate ? new Date(request.requestDate).toLocaleDateString() : ''}
                  fullWidth
                  margin="normal"
                  InputProps={{ readOnly: true }}
                  variant="filled"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Fecha de Reincorporación"
                  value={request.returnDate ? new Date(request.returnDate).toLocaleDateString() : ''}
                  fullWidth
                  margin="normal"
                  InputProps={{ readOnly: true }}
                  variant="filled"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Período de Gestión"
                  value={`${request.managementPeriodStart ? new Date(request.managementPeriodStart).toLocaleDateString() : ''} - ${request.managementPeriodEnd ? new Date(request.managementPeriodEnd).toLocaleDateString() : ''}`}
                  fullWidth
                  margin="normal"
                  InputProps={{ readOnly: true }}
                  variant="filled"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Días Totales"
                  value={request.totalDays || ''}
                  fullWidth
                  margin="normal"
                  InputProps={{ readOnly: true }}
                  variant="filled"
                />
              </Grid>
            </>
          )}
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          color="primary"
          variant="contained"
          disabled={loading}
        >
          {loading ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditVacationDialog;