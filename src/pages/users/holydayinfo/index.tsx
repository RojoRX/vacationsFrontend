import React, { useEffect, useState } from 'react';
import {
  Box, Button, CircularProgress, Snackbar, Typography, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogActions, DialogContent, DialogTitle, TextField,
  MenuItem, TablePagination, Chip, Toolbar, IconButton, InputAdornment,
  FormControl, InputLabel, Select
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Event as EventIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import axios from 'src/lib/axios';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import getBusinessDays from 'src/utils/businessDays';

interface HolidayPeriod {
  id: number;
  userId: number;
  name: string;
  startDate: string;
  endDate: string;
  year: number;
}

interface UserHolidayPeriodsProps {
  userId: number;
  year: number;
}

interface AclComponent extends React.FC<UserHolidayPeriodsProps> {
  acl?: {
    action: string;
    subject: string;
  };
}

const UserHolidayPeriods: AclComponent = ({ userId, year }) => {
  const [holidayPeriods, setHolidayPeriods] = useState<HolidayPeriod[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [selectedHolidayPeriod, setSelectedHolidayPeriod] = useState<HolidayPeriod | null>(null);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [editHoliday, setEditHoliday] = useState<Partial<HolidayPeriod> | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');

  // Cambiar el estado inicial del typeFilter para que coincida con los valores del MenuItem
  const [typeFilter, setTypeFilter] = useState<string>('all');


  const fetchHolidayPeriods = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user-holiday-periods/${userId}`);
      if (Array.isArray(response.data)) {
        setHolidayPeriods(response.data);
      } else {
        setSnackbarMessage(response.data.message);
      }
    } catch (error) {
      setSnackbarMessage('Error al obtener los recesos personalizados.');
      console.error('Error fetching holiday periods:', error);
    }
    setLoading(false);
  };

  const handleOpenDialog = (holidayPeriod: HolidayPeriod) => {
    setSelectedHolidayPeriod(holidayPeriod);
    setEditHoliday({
      name: holidayPeriod.name,
      startDate: holidayPeriod.startDate,
      endDate: holidayPeriod.endDate
    });
    setOpenDialog(true);
  };


  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedHolidayPeriod(null);
    setEditHoliday(null);
  };
  const handleUpdate = async () => {
    if (selectedHolidayPeriod && editHoliday) {
      try {
        await axios.put(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/user-holiday-periods/${selectedHolidayPeriod.id}`,
          editHoliday
        );
        setSnackbarMessage('Receso actualizado exitosamente.');
        fetchHolidayPeriods();
        handleCloseDialog();
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message ||
          'Error al actualizar el receso.';
        setSnackbarMessage(errorMessage);
        console.error('Error updating holiday period:', error);
      }
    }
  };
  ;

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user-holiday-periods/${id}`);
      setSnackbarMessage('Receso eliminado exitosamente.');
      fetchHolidayPeriods();
    } catch (error) {
      setSnackbarMessage('Error al eliminar el receso.');
      console.error('Error deleting holiday period:', error);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
  };

  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), 'dd MMM yyyy', { locale: es });
  };


  const filteredPeriods = holidayPeriods
    .filter(period => {
      const matchesSearch =
        searchTerm === '' ||
        period.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        period.year.toString().includes(searchTerm);

      const matchesType =
        typeFilter === 'all' ||
        period.name === typeFilter;

      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      // Ordenar por año descendente y luego por nombre
      if (b.year !== a.year) return b.year - a.year;
      
return a.name.localeCompare(b.name);
    });

  // Resetear la página cuando cambian los filtros
  useEffect(() => {
    setPage(0);
  }, [searchTerm, typeFilter]);


  useEffect(() => {
    fetchHolidayPeriods();
  }, [userId, year]);

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ mb: 2 }}>
        <Toolbar
          sx={{
            pl: { sm: 2 },
            pr: { xs: 1, sm: 1 },
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' },
            justifyContent: 'space-between',
            gap: 2
          }}
        >
          <Typography variant="h6" component="div">
            Recesos Personalizados
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, width: { xs: '100%', sm: 'auto' } }}>
            <TextField
              size="small"
              variant="outlined"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Tipo</InputLabel>
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as string)}
                label="Tipo"
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="INVIERNO">Invierno</MenuItem>
                <MenuItem value="FINDEGESTION">Fin de Gestión</MenuItem>
              </Select>
            </FormControl>

            <IconButton onClick={handleResetFilters}>
              <RefreshIcon />
            </IconButton>
          </Box>
        </Toolbar>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Año</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Fecha Inicio</TableCell>
                <TableCell>Fecha Fin</TableCell>
                <TableCell>Duración</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredPeriods.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No se encontraron recesos personalizados
                  </TableCell>
                </TableRow>
              ) : (
                filteredPeriods
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((period) => {
                    const startDate = parseISO(period.startDate);
                    const endDate = parseISO(period.endDate);
                    const duration = getBusinessDays(startDate, endDate);
                    
return (
                      <TableRow key={period.id} hover>
                        <TableCell>{period.year}</TableCell>
                        <TableCell>
                          <Chip
                            label={period.name === 'INVIERNO' ? 'Invierno' : 'Fin de Gestión'}
                            color={period.name === 'INVIERNO' ? 'primary' : 'secondary'}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <EventIcon color="action" fontSize="small" />
                            {formatDate(period.startDate)}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <EventIcon color="action" fontSize="small" />
                            {formatDate(period.endDate)}
                          </Box>
                        </TableCell>
                        <TableCell>{duration} días habiles</TableCell>
                        <TableCell align="right">
                          <IconButton
                            onClick={() => handleOpenDialog(period)}
                            color="primary"
                            aria-label="editar"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            onClick={() => handleDelete(period.id)}
                            color="error"
                            aria-label="eliminar"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredPeriods.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0); // Resetear a la primera página al cambiar el tamaño
          }}
        />
      </Paper>

      {/* Diálogo de edición */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedHolidayPeriod ? 'Editar Receso' : 'Nuevo Receso'}
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Tipo de Receso"
            select
            fullWidth
            margin="normal"
            value={editHoliday?.name || ''}
            onChange={(e) => setEditHoliday({ ...editHoliday!, name: e.target.value })}
          >
            <MenuItem value="INVIERNO">Invierno</MenuItem>
            <MenuItem value="FINDEGESTION">Fin de Gestión</MenuItem>
          </TextField>
          <TextField
            label="Fecha de Inicio"
            type="date"
            fullWidth
            margin="normal"
            value={editHoliday?.startDate?.split('T')[0] || ''}
            onChange={(e) => setEditHoliday({ ...editHoliday!, startDate: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Fecha de Fin"
            type="date"
            fullWidth
            margin="normal"
            value={editHoliday?.endDate?.split('T')[0] || ''}
            onChange={(e) => setEditHoliday({ ...editHoliday!, endDate: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />

        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancelar
          </Button>
          <Button onClick={handleUpdate} color="primary" variant="contained">
            Guardar Cambios
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!snackbarMessage}
        autoHideDuration={6000}
        onClose={() => setSnackbarMessage('')}
        message={snackbarMessage}
      />

    </Box>
  );
};

// Configuración ACL para el componente
UserHolidayPeriods.acl = {
  action: 'manage',
  subject: 'holiday-periods'
};

export default UserHolidayPeriods;