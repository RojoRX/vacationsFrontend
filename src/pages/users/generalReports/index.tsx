import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, Typography, Box, CircularProgress,
  FormControl, InputLabel, Select
} from '@mui/material';
import axios from 'src/lib/axios';

interface GeneralReportDialogProps {
  open: boolean;
  onClose: () => void;
}

const monthOptions = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' },
];

const GeneralReportDialog: React.FC<GeneralReportDialogProps> = ({ open, onClose }) => {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [year, setYear] = useState<number | ''>('');
  const [month, setMonth] = useState<number | ''>('');
  const [employeeType, setEmployeeType] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDateRangeActive = !!fromDate || !!toDate;
  const isMonthYearActive = !!year || !!month;

  const handleGenerateReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = { employeeType };

      if (isDateRangeActive) {
        params.from = fromDate;
        params.to = toDate;
      }

      if (isMonthYearActive) {
        params.year = year;
        params.month = month;
      }

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/global`,
        { params, responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `reporte_general_${isMonthYearActive ? year || 'todos' : fromDate || 'todos'}_${isMonthYearActive ? month || 'todos' : toDate || 'todos'}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al generar el reporte');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFromDate('');
    setToDate('');
    setYear('');
    setMonth('');
    setEmployeeType('ALL');
    setError(null);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Generar Reporte General de Usuarios</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
          <Typography variant="body2" color="textSecondary">
            Selecciona un conjunto de filtros para generar el reporte. No se pueden combinar
            rango de fechas con mes/año. Usa el botón "Limpiar" para reiniciar los filtros.
          </Typography>

          {/* 🔹 Sección 1: Rango de fechas */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', opacity: isMonthYearActive ? 0.5 : 1 }}>
            <Typography variant="subtitle2">Filtro por rango de fechas:</Typography>
            <TextField
              label="Fecha inicio"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={isMonthYearActive}
            />
            <TextField
              label="Fecha fin"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={isMonthYearActive}
            />
          </Box>

          {/* 🔹 Sección 2: Mes y año */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', opacity: isDateRangeActive ? 0.5 : 1 }}>
            <Typography variant="subtitle2">Filtro por mes y año:</Typography>
            <TextField
              label="Año"
              type="number"
              value={year}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val < 1990) setYear(1990);
                else if (val > 2050) setYear(2050);
                else setYear(val || '');
              }}
              disabled={isDateRangeActive}
              inputProps={{ min: 1990, max: 2050 }}
            />

            <FormControl sx={{ minWidth: 140 }}>
              <InputLabel>Mes</InputLabel>
              <Select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                disabled={isDateRangeActive}
                label="Mes"
              >
                {monthOptions.map((m) => (
                  <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* 🔹 Tipo de empleado */}
          <FormControl fullWidth>
            <InputLabel>Tipo de empleado</InputLabel>
            <Select
              value={employeeType}
              onChange={(e) => setEmployeeType(e.target.value)}
              label="Tipo de empleado"
            >
              <MenuItem value="ALL">Todos</MenuItem>
              <MenuItem value="ADMINISTRATIVO">Administrativo</MenuItem>
              <MenuItem value="DOCENTE">Docente</MenuItem>
            </Select>
          </FormControl>

          {error && (
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'space-between' }}>
        <Button onClick={handleReset} color="secondary" disabled={loading}>
          Limpiar
        </Button>
        <Box>
          <Button onClick={onClose} color="secondary" disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleGenerateReport}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Generando...' : 'Generar Reporte'}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default GeneralReportDialog;
