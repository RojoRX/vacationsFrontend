import React, { useState, useEffect } from 'react';
import {
  Box, TextField, Typography, Container, CircularProgress, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, InputAdornment, IconButton, Chip, Toolbar, Button,
  Dialog, DialogTitle, DialogContent
} from '@mui/material';
import { Search as SearchIcon, Restore as RestoreIcon, Refresh as RefreshIcon, Person as PersonIcon } from '@mui/icons-material';
import axios from 'src/lib/axios';
import { User } from 'src/interfaces/usertypes';
import { translateRole } from 'src/utils/translateRole';
import { useDebounce } from 'src/hooks/useDebounce';

const DeletedUsers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [dialogMessage, setDialogMessage] = useState<string | null>(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Cargar usuarios eliminados
  const fetchDeletedUsers = async (term?: string) => {
    try {
      setLoading(true);
      const url = term
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/users/deleted/search?term=${term}`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/users/deleted`;
      const res = await axios.get(url);
      setUsers(res.data);
      setError(null);
      setPage(0);
    } catch (err: any) {
      setUsers([]);
      setError('Error al cargar los usuarios eliminados.');
    } finally {
      setLoading(false);
    }
  };

  // Cargar inicialmente todos los eliminados
  useEffect(() => {
    fetchDeletedUsers();
  }, []);

  // Buscar según el término escrito
  useEffect(() => {
    fetchDeletedUsers(debouncedSearchTerm.trim() || undefined);
  }, [debouncedSearchTerm]);

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRestoreUser = async (userId: number) => {
    try {
      const res = await axios.patch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/restore/${userId}`);
      setDialogMessage(res.data.message || 'Usuario restaurado exitosamente');
      fetchDeletedUsers(debouncedSearchTerm.trim() || undefined); // recarga tabla actualizada
    } catch (err: any) {
      setDialogMessage(err.response?.data?.message || 'Error al restaurar usuario');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon color="primary" />
          Usuarios Eliminados
        </Typography>

        <Toolbar sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: 2, p: 0, mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', width: { xs: '100%', sm: 'auto' } }}>
            <TextField
              label="Buscar por CI o Nombre"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 250 }}
            />

            <IconButton onClick={() => fetchDeletedUsers()} title="Recargar lista">
              <RefreshIcon />
            </IconButton>
          </Box>
        </Toolbar>

        {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>CI</TableCell>
                  <TableCell>Nombre Completo</TableCell>
                  <TableCell>Rol</TableCell>
                  <TableCell>Posición</TableCell>
                  <TableCell>Profesión</TableCell>
                  <TableCell>Departamento</TableCell>
                  <TableCell>Unidad Académica</TableCell>
                  <TableCell>Fecha Ingreso</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <Typography color="text.secondary">No se encontraron usuarios eliminados.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(user => (
                    <TableRow key={user.id} hover>
                      <TableCell>{user.ci}</TableCell>
                      <TableCell>{user.fullName}</TableCell>
                      <TableCell>
                        <Chip label={translateRole(user.role)} size="small" />
                      </TableCell>
                      <TableCell>{user.position || '-'}</TableCell>
                      <TableCell>{user.profession?.name || '-'}</TableCell>
                      <TableCell>{user.department?.name || '-'}</TableCell>
                      <TableCell>{user.academicUnit?.name || '-'}</TableCell>
                      <TableCell>{new Date(user.fecha_ingreso).toLocaleDateString('es-ES')}</TableCell>
                      <TableCell>
                        <IconButton
                          color="success"
                          size="small"
                          onClick={() => handleRestoreUser(user.id)}
                          title="Restaurar usuario"
                        >
                          <RestoreIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={users.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Usuarios por página:"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
              }
            />
          </TableContainer>
        )}

        <Dialog open={!!dialogMessage} onClose={() => setDialogMessage(null)}>
          <DialogTitle>Información</DialogTitle>
          <DialogContent>
            <Typography>{dialogMessage}</Typography>
            <Button fullWidth sx={{ mt: 2 }} onClick={() => setDialogMessage(null)}>
              Cerrar
            </Button>
          </DialogContent>
        </Dialog>
      </Paper>
    </Container>
  );
};

export default DeletedUsers;
