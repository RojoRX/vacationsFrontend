import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Alert,
  Typography,
} from '@mui/material';
import { NonHoliday } from 'src/interfaces/nonHoliday';

const NonHolidayManager: React.FC = () => {
  const [nonHolidays, setNonHolidays] = useState<NonHoliday[]>([]);
  const [filteredNonHolidays, setFilteredNonHolidays] = useState<NonHoliday[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [open, setOpen] = useState(false);
  const [currentNonHoliday, setCurrentNonHoliday] = useState<NonHoliday | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [filterYear, setFilterYear] = useState<number | ''>('');
  const [filterDescription, setFilterDescription] = useState('');

  useEffect(() => {
    fetchNonHolidays();
  }, []);

  const fetchNonHolidays = async () => {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/non-holidays`);
    setNonHolidays(response.data);
    setFilteredNonHolidays(response.data); // Inicialmente mostramos todos los días no hábiles
  };

  const handleOpen = (nonHoliday?: NonHoliday) => {
    setCurrentNonHoliday(nonHoliday ? { ...nonHoliday } : { id: 0, year: new Date().getFullYear(), date: '', description: '' });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setCurrentNonHoliday(null);
  };

  const handleSave = async () => {
    try {
      if (currentNonHoliday) {
        if (currentNonHoliday.id) {
          await axios.put(`${process.env.NEXT_PUBLIC_API_BASE_URL}/non-holidays/${currentNonHoliday.id}`, currentNonHoliday);
          setSnackbarMessage('Día no hábil actualizado exitosamente');
        } else {
          await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/non-holidays`, currentNonHoliday);
          setSnackbarMessage('Día no hábil agregado exitosamente');
        }
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        handleClose();
        fetchNonHolidays();
      }
    } catch (error) {
      setSnackbarSeverity('error');
      setSnackbarMessage('Error al guardar el día no hábil');
      setSnackbarOpen(true);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_BASE_URL}/non-holidays/${id}`);
      setSnackbarMessage('Día no hábil eliminado exitosamente');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      fetchNonHolidays();
    } catch (error) {
      setSnackbarSeverity('error');
      setSnackbarMessage('Error al eliminar el día no hábil');
      setSnackbarOpen(true);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (currentNonHoliday) {
      setCurrentNonHoliday({
        ...currentNonHoliday,
        date: e.target.value,
      });
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (currentNonHoliday) {
      setCurrentNonHoliday({
        ...currentNonHoliday,
        description: e.target.value,
      });
    }
  };

  const handleFilterYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value ? parseInt(e.target.value, 10) : '';
    setFilterYear(value);
    filterNonHolidays(value, filterDescription);
  };

  const handleFilterDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilterDescription(value);
    filterNonHolidays(filterYear, value);
  };

  const filterNonHolidays = (year: number | '', description: string) => {
    const filtered = nonHolidays.filter(nonHoliday => {
      const matchesYear = year ? nonHoliday.year === year : true;
      const matchesDescription = nonHoliday.description.toLowerCase().includes(description.toLowerCase());
      return matchesYear && matchesDescription;
    });
    setFilteredNonHolidays(filtered);
    setPage(0); // Reiniciar la página al filtrar
  };

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Gestión de Días No Hábiles o Feriados
      </Typography>
      <TextField
        label="Filtrar por Año"
        type="number"
        variant="outlined"
        value={filterYear}
        onChange={handleFilterYearChange}
        style={{ marginRight: 16 }}
      />
      <TextField
        label="Filtrar por Descripción"
        type="text"
        variant="outlined"
        value={filterDescription}
        onChange={handleFilterDescriptionChange}
        style={{ marginRight: 16 }}
      />
      <Button variant="contained" color="primary" onClick={() => handleOpen()}>
        Agregar Día No Hábil
      </Button>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Año</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredNonHolidays.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((nonHoliday) => (
              <TableRow key={nonHoliday.id}>
                <TableCell>{nonHoliday.id}</TableCell>
                <TableCell>{nonHoliday.year}</TableCell>
                <TableCell>{nonHoliday.date}</TableCell>
                <TableCell>{nonHoliday.description}</TableCell>
                <TableCell>
                  <Button color="primary" onClick={() => handleOpen(nonHoliday)}>Editar</Button>
                  <Button color="secondary" onClick={() => handleDelete(nonHoliday.id)}>Eliminar</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredNonHolidays.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{currentNonHoliday ? 'Editar Día No Hábil' : 'Agregar Día No Hábil'}</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Fecha"
            type="date"
            fullWidth
            variant="outlined"
            value={currentNonHoliday ? currentNonHoliday.date : ''}
            onChange={handleDateChange}
          />
          <TextField
            margin="dense"
            label="Descripción"
            type="text"
            fullWidth
            variant="outlined"
            value={currentNonHoliday ? currentNonHoliday.description : ''}
            onChange={handleDescriptionChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">Cancelar</Button>
          <Button onClick={handleSave} color="primary">Guardar</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={() => setSnackbarOpen(false)}>
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default NonHolidayManager;
