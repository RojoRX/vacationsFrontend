import React from 'react';
import {
  Box,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Button,
  Grid,
  CircularProgress,
} from '@mui/material';

interface MonthlyReportFormProps {
  onSubmit: (params: {
    year?: number;
    month?: number;
    employeeType: string;
  }) => void;
  loading: boolean;
}

const currentYear = new Date().getFullYear();

const MonthlyReportForm: React.FC<MonthlyReportFormProps> = ({ onSubmit, loading }) => {
  const [year, setYear] = React.useState<number>(currentYear);
  const [month, setMonth] = React.useState<number | undefined>(undefined);
  const [employeeType, setEmployeeType] = React.useState<string>('ALL');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ year, month, employeeType });
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Año"
            type="number"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            inputProps={{ min: 2000, max: currentYear + 5 }}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Mes</InputLabel>
            <Select
              value={month || ''}
              onChange={(e) => setMonth(e.target.value ? parseInt(e.target.value as string) : undefined)}
              label="Mes"
            >
              <MenuItem value="">Todos</MenuItem>
              {Array.from({ length: 12 }, (_, i) => (
                <MenuItem key={i + 1} value={i + 1}>
                  {new Date(2000, i, 1).toLocaleString('es', { month: 'long' })}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Tipo de Empleado</InputLabel>
            <Select
              value={employeeType}
              onChange={(e) => setEmployeeType(e.target.value as string)}
              label="Tipo de Empleado"
            >
              <MenuItem value="ALL">Todos</MenuItem>
              <MenuItem value="DOCENTE">Docentes</MenuItem>
              <MenuItem value="ADMINISTRATIVO">Administrativos</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : "Download" }
        >
          Descargar Reporte
        </Button>
      </Box>
    </Box>
  );
};

export default MonthlyReportForm;