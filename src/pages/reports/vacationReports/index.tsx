import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Typography,
  IconButton
} from '@mui/material';
import axios from 'axios';
import CloseIcon from '@mui/icons-material/Close';

interface VacationReportDialogProps {
  open: boolean;
  onClose: () => void;
  ci: string;
}

const months = [
  { value: '', label: 'Todos' },
  { value: '1', label: 'Enero' },
  { value: '2', label: 'Febrero' },
  { value: '3', label: 'Marzo' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Mayo' },
  { value: '6', label: 'Junio' },
  { value: '7', label: 'Julio' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' },
];

export const VacationReportDialog: React.FC<VacationReportDialogProps> = ({ open, onClose, ci }) => {
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');

  const handleDownload = async () => {
    try {
      const params = new URLSearchParams({ ci });
      if (year) params.append('year', year);
      if (month) params.append('month', month);

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/vacations/user?${params.toString()}`,
        { responseType: 'blob' }
      );

      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const filename = `vacaciones_${ci}_${year || 'todos'}_${month || 'todos'}.xlsx`;

      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();

      onClose();
    } catch (error) {
      console.error('Error al descargar el reporte:', error);
      alert('Hubo un error al generar el reporte. Intenta nuevamente.');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        Generar Reporte de Vacaciones
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500]
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Este reporte muestra todas las vacaciones tomadas por el usuario con CI <strong>{ci}</strong>.
          Puedes filtrar por año y/o mes si lo deseas. Si dejas ambos campos vacíos, se incluirán todas las vacaciones disponibles.
        </Typography>

        <TextField
          label="Año (opcional)"
          type="number"
          fullWidth
          value={year}
          onChange={(e) => setYear(e.target.value)}
          sx={{ mb: 2 }}
        />

        <TextField
          select
          label="Mes (opcional)"
          fullWidth
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        >
          {months.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancelar
        </Button>
        <Button onClick={handleDownload} variant="contained" color="primary">
          Descargar Reporte
        </Button>
      </DialogActions>
    </Dialog>
  );
};
