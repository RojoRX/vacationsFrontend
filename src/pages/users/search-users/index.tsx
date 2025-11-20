import React, { useState, useEffect } from 'react';
import {
  Box, TextField, Typography, Container, Alert,
  CircularProgress, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination,
  InputAdornment, IconButton, Chip, Toolbar, MenuItem,
  FormControl, InputLabel, Select, Button,
  useTheme
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  Visibility as VisibilityIcon,
  Description as DescriptionIcon,
  Assignment as AssignmentAddIcon, // 🔹 Agregar este ícono
} from '@mui/icons-material';
import axios from 'src/lib/axios';
import { User } from 'src/interfaces/usertypes';
import router from 'next/router';
import { translateRole } from 'src/utils/translateRole';
import { useDebounce } from 'src/hooks/useDebounce';
import GeneralReportDialog from '../generalReports';
import BulkLicenseForm from 'src/pages/permissions/bulkLicenseForm';
import Link from 'next/link';

const SearchUsers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openBulkDialog, setOpenBulkDialog] = useState(false); // 🔹 Nuevo estado
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [tipoEmpleadoFilter, setTipoEmpleadoFilter] = useState<string>('all');

  const [openReportDialog, setOpenReportDialog] = useState(false);

  // 🔹 Cargar últimos 20 usuarios al inicio
  useEffect(() => {
    const fetchLatestUsers = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/latest`);
        setUsers(res.data);
      } catch {
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
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/latest`);
        setUsers(res.data);
        console.log(res.data);
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

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    fetchUsers(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  const handleReset = () => {
    setSearchTerm('');
    setRoleFilter('all');
    setTipoEmpleadoFilter('all');
    setError(null);
    fetchUsers('');
  };

  const handleViewDetails = (ci: string) => {
    router.push(`/users/${ci}`);
  };

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenBulkDialog = (userId: number) => {
    setSelectedUserId(userId);
    setOpenBulkDialog(true);
  };

  const handleCloseBulkDialog = () => {
    setOpenBulkDialog(false);
    setSelectedUserId(null);
  };

  const handleBulkSuccess = () => {
    handleCloseBulkDialog();
    fetchUsers(searchTerm); // 🔹 recarga la tabla tras crear licencias
  };


  const filteredUsers = users.filter(user => {
    const matchesRole = roleFilter === 'all' || user.role?.toLowerCase() === roleFilter.toLowerCase();
    const matchesTipoEmpleado =
      tipoEmpleadoFilter === 'all' ||
      user.tipoEmpleado?.toLowerCase() === tipoEmpleadoFilter.toLowerCase();

    return matchesRole && matchesTipoEmpleado;

  });

  const uniqueRoles = Array.from(new Set(users.map(user => user.role)));
  const uniqueTiposEmpleado = Array.from(
    new Set(users.map(user => user.tipoEmpleado).filter(Boolean))
  );

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

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Rol</InputLabel>
              <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} label="Rol">
                <MenuItem value="all">Todos los roles</MenuItem>
                {uniqueRoles.map(role => (
                  <MenuItem key={role} value={role}>{translateRole(role)}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Tipo Empleado</InputLabel>
              <Select
                value={tipoEmpleadoFilter}
                onChange={(e) => setTipoEmpleadoFilter(e.target.value)}
                label="Tipo Empleado"
              >
                <MenuItem value="all">Todos</MenuItem>
                {uniqueTiposEmpleado.map(tipo => (
                  <MenuItem key={tipo} value={tipo}>
                    {tipo === 'DOCENTE' ? 'Docente' : 'Administrativo'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>


            <IconButton onClick={handleReset} title="Restablecer búsqueda">
              <RefreshIcon />
            </IconButton>


          </Box>
        </Toolbar>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

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
                  <TableCell>Tipo Empleado</TableCell>
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
                      <Typography color="text.secondary">No se encontraron usuarios.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map(user => (
                      <TableRow key={user.id} hover>
                        <TableCell>{user.ci}</TableCell>
                        <TableCell>
                          <Typography
                            variant="body1"
                            component={Link}
                            href={`/users/${user.ci}`}
                            sx={{

                              textDecoration: 'none',
                              fontWeight: 500,
                              '&:hover': {
                                textDecoration: 'underline',
                                cursor: 'pointer',
                              },
                            }}
                          >
                            {user.fullName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">@{user.username}</Typography>
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
                        <TableCell>
                          <Chip
                            label={user.tipoEmpleado === 'DOCENTE' ? 'Docente' : 'Administrativo'}
                            color={user.tipoEmpleado === 'DOCENTE' ? 'info' : 'success'}
                            size="small"
                            sx={{ fontWeight: 'bold' }}
                          />
                        </TableCell>

                        <TableCell>{user.profession?.name || '-'}</TableCell>
                        <TableCell>{user.department?.name || '-'}</TableCell>
                        <TableCell>{user.academicUnit?.name || '-'}</TableCell>
                        <TableCell>{new Date(user.fecha_ingreso).toLocaleDateString('es-ES')}</TableCell>
                        <TableCell>
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => handleViewDetails(user.ci)}
                            title="Ver detalles"
                          >
                            <VisibilityIcon />
                          </IconButton>

                          {/* 🔹 Nuevo botón para crear múltiples licencias */}
                          <IconButton
                            color="secondary"
                            size="small"
                            onClick={() => handleOpenBulkDialog(user.id)}
                            title="Crear múltiples licencias"
                          >
                            <AssignmentAddIcon />
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
        {/* 🔹 Diálogo de licencias múltiples */}
        {openBulkDialog && selectedUserId && (
          <BulkLicenseForm
            open={openBulkDialog}
            onClose={handleCloseBulkDialog}
            userId={selectedUserId}
            onSuccess={handleBulkSuccess}
          />
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

