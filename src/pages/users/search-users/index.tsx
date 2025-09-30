import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, TextField, Typography, Container, Alert,
  CircularProgress, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination,
  InputAdornment, IconButton, Chip, Toolbar, MenuItem,
  FormControl, InputLabel, Select
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import axios from 'src/lib/axios';
import { User } from 'src/interfaces/usertypes';
import router from 'next/router';
import { translateRole } from 'src/utils/translateRole';
import { useDebounce } from 'src/hooks/useDebounce'; // ajusta la ruta

const SearchUsers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [positionFilter, setPositionFilter] = useState<string>('all');

  // 🔹 Cargar últimos 20 usuarios al inicio
  useEffect(() => {
    const fetchLatestUsers = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/latest`);
        setUsers(res.data);
      } catch (err) {
        setError('Error al cargar los últimos usuarios.');
      } finally {
        setLoading(false);
      }
    };
    fetchLatestUsers();
  }, []);

  // 🔹 Función de búsqueda dinámica (CI o nombre)
  const fetchUsers = async (term: string) => {
    if (!term.trim()) {
      // Si no hay búsqueda, traer últimos 20
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/latest`);
        setUsers(res.data);
        setError(null);
      } catch {
        setUsers([]);
        setError('Error al cargar los usuarios.');
      }
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/users/search?term=${term}`
      );
      setUsers(response.data);
      setPage(0);
    } catch {
      setUsers([]);
      setError('No se encontraron usuarios.');
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Debounce para evitar llamadas en cada tecla
const debouncedSearchTerm = useDebounce(searchTerm, 500);

useEffect(() => {
  fetchUsers(debouncedSearchTerm);
}, [debouncedSearchTerm]);

  const handleReset = () => {
    setSearchTerm('');
    setRoleFilter('all');
    setPositionFilter('all');
    setError(null);
    fetchUsers('');
  };

  const handleViewDetails = (ci: string) => {
    router.push(`/users/${ci}`);
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 🔹 Filtrado adicional por rol y posición
  const filteredUsers = users.filter(user => {
    const matchesRole = roleFilter === 'all' || user.role?.toLowerCase() === roleFilter.toLowerCase();
    const matchesPosition = positionFilter === 'all' ||
      (user.position && user.position.toLowerCase().includes(positionFilter.toLowerCase()));
    return matchesRole && matchesPosition;
  });

  // 🔹 Roles y posiciones únicas para filtros
  const uniqueRoles = Array.from(new Set(users.map(user => user.role)));
  const uniquePositions = Array.from(new Set(users.map(user => user.position).filter(Boolean)));

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon color="primary" />
          Búsqueda de Usuarios
        </Typography>

        <Toolbar sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2,
          p: 0,
          mb: 3
        }}>
          <Box sx={{
            display: 'flex',
            gap: 2,
            width: { xs: '100%', sm: 'auto' },
            flexWrap: 'wrap'
          }}>
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

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Rol</InputLabel>
              <Select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                label="Rol"
              >
                <MenuItem value="all">Todos los roles</MenuItem>
                {uniqueRoles.map(role => (
                  <MenuItem key={role} value={role}>{translateRole(role)}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Posición</InputLabel>
              <Select
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value)}
                label="Posición"
              >
                <MenuItem value="all">Todas las posiciones</MenuItem>
                {uniquePositions.map(position => (
                  <MenuItem key={position} value={position}>{position}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <IconButton onClick={handleReset} title="Restablecer búsqueda">
              <RefreshIcon />
            </IconButton>
          </Box>
        </Toolbar>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

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
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <Typography color="text.secondary">
                        No se encontraron usuarios.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((user) => (
                      <TableRow key={user.id} hover>
                        <TableCell>{user.ci}</TableCell>
                        <TableCell>
                          <Typography fontWeight="medium">{user.fullName}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            @{user.username}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={translateRole(user.role)}
                            color={
                              user.role === 'SUPERVISOR' ? 'primary' :
                                user.role === 'ADMIN' ? 'secondary' :
                                  'default'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{user.position || '-'}</TableCell>
                        <TableCell>{user.profession?.name || '-'}</TableCell>
                        <TableCell>{user.department?.name || '-'}</TableCell>
                        <TableCell>{user.academicUnit?.name || '-'}</TableCell>
                        <TableCell>{new Date(user.fecha_ingreso).toLocaleDateString('es-ES')}</TableCell>
                        <TableCell>
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => handleViewDetails(user.ci)}
                          >
                            <VisibilityIcon />
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
              count={filteredUsers.length}
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
      </Paper>
    </Container>
  );
};

// Configurar ACL
SearchUsers.acl = {
  action: 'read',
  subject: 'search-users'
};
export default SearchUsers;
