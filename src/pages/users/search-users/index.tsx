import React, { useState, useEffect } from 'react';
import { 
  Box, TextField, Button, Typography, Container, Alert, 
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
  FilterList as FilterIcon
} from '@mui/icons-material';
import axios from 'axios';
import { User } from 'src/interfaces/usertypes';
import router from 'next/router';

const SearchUsers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [positionFilter, setPositionFilter] = useState<string>('all');

  const handleSearch = async () => {
    setError(null);
    setLoading(true);
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/search-by-ci?ci=${searchTerm}`);
      setUsers(response.data);
      setPage(0); // Resetear a la primera página al realizar nueva búsqueda
    } catch (err) {
      setUsers([]);
      setError('No se encontraron usuarios o ocurrió un error.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSearchTerm('');
    setRoleFilter('all');
    setPositionFilter('all');
    setUsers([]);
    setError(null);
  };

  const handleViewDetails = (ci: string) => {
    router.push(`/users/${ci}`);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Filtrado adicional por rol y posición
  const filteredUsers = users.filter(user => {
    const matchesRole = roleFilter === 'all' || user.role?.toLowerCase() === roleFilter.toLowerCase();
    const matchesPosition = positionFilter === 'all' || 
      (user.position && user.position.toLowerCase().includes(positionFilter.toLowerCase()));
    return matchesRole && matchesPosition;
  });

  // Obtener roles y posiciones únicas para los filtros
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
              label="Buscar por CI"
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
                  <MenuItem key={role} value={role}>{role}</MenuItem>
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

            <Button
              variant="contained"
              onClick={handleSearch}
              disabled={loading || !searchTerm}
              startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
              sx={{ minWidth: 120 }}
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </Button>

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

        {users.length > 0 && (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>CI</TableCell>
                  <TableCell>Nombre Completo</TableCell>
                  <TableCell>Rol</TableCell>
                  <TableCell>Posición</TableCell>
                  <TableCell>Profesión</TableCell>
                  <TableCell>Fecha Ingreso</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers
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
                          label={user.role} 
                          color={
                            user.role === 'SUPERVISOR' ? 'primary' : 
                            user.role === 'ADMIN' ? 'secondary' : 'default'
                          } 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>{user.position || '-'}</TableCell>
                      <TableCell>{user.profesion || '-'}</TableCell>
                      <TableCell>
                        {new Date(user.fecha_ingreso).toLocaleDateString('es-ES')}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<VisibilityIcon />}
                          onClick={() => handleViewDetails(user.ci)}
                        >
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
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
// Configurar ACL para dar acceso a empleados
SearchUsers.acl = {
  action: 'read',
  subject: 'search-users'
};
export default SearchUsers;