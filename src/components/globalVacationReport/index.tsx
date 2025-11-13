// components/GlobalVacationReportDialog.tsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  FormHelperText,
  Tooltip,
  IconButton,
  Typography,
  CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import axios from 'src/lib/axios';

// Mapas para mostrar al usuario etiquetas en español
const employeeTypeLabels: Record<string, string> = {
  ALL: 'Todos',
  ADMINISTRATIVO: 'Administrativo',
  DOCENTE: 'Docente',
};

const vacationStatusLabels: Record<string, string> = {
  PENDING: 'Pendiente',
  AUTHORIZED: 'Autorizada',
  POSTPONED: 'Postergada',
  DENIED: 'Denegada',
  SUSPENDED: 'Suspendida',
};

const employeeTypes = Object.keys(employeeTypeLabels);
const vacationStatuses = Object.keys(vacationStatusLabels);

interface Props {
  open: boolean;
  onClose: () => void;
}

const GlobalVacationReportDialog: React.FC<Props> = ({ open, onClose }) => {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [year, setYear] = useState<number | ''>('');
  const [month, setMonth] = useState<number | ''>('');
  const [employeeType, setEmployeeType] = useState('ALL');
  const [status, setStatus] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setLoading(true);
    setError('');

    try {
      const params: any = {
        from: from || undefined,
        to: to || undefined,
        year: year || undefined,
        month: month || undefined,
        employeeType: employeeType || undefined,
        status: status.length > 0 ? status : undefined,
      };

      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/vacations/global`, {
        params,
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reporte_global_vacaciones.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      console.error(err);
      setError('No se pudo generar el reporte. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Generar Reporte Global de Vacaciones
        <IconButton
          aria-label="cerrar"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Utiliza los filtros a continuación para generar el reporte. Todos los campos son opcionales. 
          Si no seleccionas filtros, se generará el reporte completo de todas las vacaciones.
        </Typography>

        <Box display="flex" flexWrap="wrap" gap={2}>
          <TextField
            label="Fecha inicio"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={from}
            onChange={e => setFrom(e.target.value)}
            sx={{ flex: 1, minWidth: 180 }}
          />
          <TextField
            label="Fecha fin"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={to}
            onChange={e => setTo(e.target.value)}
            sx={{ flex: 1, minWidth: 180 }}
          />
          <TextField
            label="Año"
            type="number"
            InputLabelProps={{ shrink: true }}
            value={year}
            onChange={e => setYear(e.target.value === '' ? '' : Number(e.target.value))}
            sx={{ flex: 1, minWidth: 120 }}
          />
          <TextField
            label="Mes"
            type="number"
            InputLabelProps={{ shrink: true }}
            value={month}
            onChange={e => setMonth(e.target.value === '' ? '' : Number(e.target.value))}
            inputProps={{ min: 1, max: 12 }}
            sx={{ flex: 1, minWidth: 120 }}
          />

          <FormControl sx={{ flex: 1, minWidth: 180 }}>
            <InputLabel>Tipo de empleado</InputLabel>
            <Select
              value={employeeType}
              onChange={e => setEmployeeType(e.target.value)}
              label="Tipo de empleado"
            >
              {employeeTypes.map(type => (
                <MenuItem key={type} value={type}>{employeeTypeLabels[type]}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ flex: 1, minWidth: 220 }}>
            <InputLabel>Status</InputLabel>
            <Select
              multiple
              value={status}
              onChange={e => setStatus(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
              renderValue={(selected) => selected.map(s => vacationStatusLabels[s]).join(', ')}
              label="Status"
            >
              {vacationStatuses.map(stat => (
                <MenuItem key={stat} value={stat}>
                  <Checkbox checked={status.indexOf(stat) > -1} />
                  <ListItemText primary={vacationStatusLabels[stat]} />
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>Selecciona uno o varios estados</FormHelperText>
          </FormControl>
        </Box>

        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
        <Tooltip title="Generar y descargar reporte en Excel">
          <Button
            variant="contained"
            color="primary"
            startIcon={loading ? <CircularProgress size={20} /> : <DownloadIcon />}
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? 'Generando...' : 'Generar Reporte'}
          </Button>
        </Tooltip>

        <Button onClick={onClose} variant="outlined" color="secondary">
          Cancelar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GlobalVacationReportDialog;
