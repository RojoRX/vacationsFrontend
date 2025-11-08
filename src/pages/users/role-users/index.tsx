import React, { FC, useEffect, useState } from 'react';
import axios from 'src/lib/axios';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  TextField,
  MenuItem,
  Button,
  Chip,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  useTheme,
  Alert,
  IconButton,
  Grid,
  Avatar,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Info as InfoIcon,
  AdminPanelSettings as AdminIcon,
  SupervisorAccount as SupervisorIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { RoleEnum } from 'src/enum/roleEnum';
import { translateRole } from 'src/utils/translateRole';
import Link from 'next/link';

interface User {
  id: number;
  ci: string;
  fullName: string;
  role: RoleEnum;
  department?: string;
  academicUnit?: string;
  email?: string;
  position?: string;
  tipoEmpleado: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

const SupervisorsAdminsTable: FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleEnum | ''>('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [openRoleDialog, setOpenRoleDialog] = useState(false);
  const [newRole, setNewRole] = useState<RoleEnum>(RoleEnum.USER);
  const [feedback, setFeedback] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);


  // 1. Centralize the fetch function and make it reusable
  const fetchUsers = async () => {
    setLoading(true); // Set loading true before fetching
    try {
      // Use the new endpoint to fetch ALL users with details and proper ordering
      const response = await axios.get(`${API_BASE_URL}/users/supervisors-admins`);
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setFeedback({ message: 'Error al cargar usuarios', severity: 'error' });
    } finally {
      setLoading(false); // Set loading false after fetching (success or error)
    }
  };

  // 2. Call fetchUsers on initial component mount
  useEffect(() => {
    fetchUsers();
  }, []); // Empty dependency array means it runs once on mount



  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.ci.includes(searchQuery) ||
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.department && user.department.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.academicUnit && user.academicUnit.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = roleFilter === '' || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDetailDialog = (user: User) => {
    setSelectedUser(user);
    setOpenDetailDialog(true);
  };

  const handleCloseDetailDialog = () => {
    setOpenDetailDialog(false);
    setSelectedUser(null);
  };

  const handleOpenRoleDialog = (user: User) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setOpenRoleDialog(true);
  };

  const handleCloseRoleDialog = () => {
    setOpenRoleDialog(false);
    setSelectedUser(null);
  };

  // 3. Modify handleRoleChange to re-fetch all users after a successful update
  const handleRoleChange = async () => {
    if (!selectedUser) return;

    try {
      await axios.patch(`${API_BASE_URL}/users/${selectedUser.id}/role`, { role: newRole });

      // Instead of manually updating `users` state, re-fetch all users
      // This ensures all implicit changes (like old supervisor becoming 'user') are reflected
      await fetchUsers(); // <--- RE-FETCH ALL USERS HERE

      setFeedback({ message: 'Rol actualizado correctamente', severity: 'success' });
      handleCloseRoleDialog();
      setPage(0); // Optional: reset pagination to the first page after a significant update
    } catch (error: any) { // Catch error to access response details
      console.error('Error updating role:', error);
      let errorMessage = 'Error al actualizar el rol';

      if (axios.isAxiosError(error) && error.response) {
        // More specific error messages from backend
        errorMessage = error.response.data.message || errorMessage;
      }
      setFeedback({ message: errorMessage, severity: 'error' });
    }
  };

  const getRoleChip = (role: RoleEnum) => {
    // Translate the role name first
    const translatedLabel = translateRole(role);

    switch (role) {
      case RoleEnum.ADMIN:
        // Use the translated label
        return <Chip icon={<AdminIcon />} label={translatedLabel} color="error" />;
      case RoleEnum.SUPERVISOR:
        // Use the translated label
        return <Chip icon={<SupervisorIcon />} label={translatedLabel} color="primary" />;
      case RoleEnum.USER: // Add a case for USER if you have it
        return <Chip label={translatedLabel} color="default" />;
      default:
        // Fallback: Use the translated label or the raw role if translation fails
        return <Chip label={translatedLabel || role} />;
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Jefes Superiores y Administradores
      </Typography>

      {feedback && (
        <Alert severity={feedback.severity} sx={{ mb: 2 }} onClose={() => setFeedback(null)}>
          {feedback.message}
        </Alert>
      )}

      {/* Filtros */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <TextField
            fullWidth
            label="Buscar por CI, nombre, departamento o unidad"
            variant="outlined"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Filtrar por rol</InputLabel>
            <Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as RoleEnum | '')}
              label="Filtrar por rol"
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value={RoleEnum.SUPERVISOR}>Jefes Superiores</MenuItem>
              <MenuItem value={RoleEnum.ADMIN}>Administradores</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Tabla de usuarios */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Usuario</TableCell>
              <TableCell>CI</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Rol</TableCell>
              <TableCell>Departamento/Unidad</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No se encontraron usuarios
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ mr: 2 }}>
                          {user.fullName?.charAt(0) ?? '?'}
                        </Avatar>

                        <Box>
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
                          <Typography variant="body2" color="textSecondary">
                            {user.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{user.ci}</TableCell>
                    <TableCell>{user.tipoEmpleado}</TableCell>
                    <TableCell>{getRoleChip(user.role)}</TableCell>
                    <TableCell>
                      {user.department || user.academicUnit || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() => handleOpenDetailDialog(user)}
                        color="primary"
                      >
                        <InfoIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleOpenRoleDialog(user)}
                        color="secondary"
                      >
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredUsers.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      {/* Diálogo de detalles */}
      <Dialog open={openDetailDialog} onClose={handleCloseDetailDialog}>
        <DialogTitle>Detalles del Usuario</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ minWidth: 400 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h6">{selectedUser.fullName}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    CI:
                  </Typography>
                  <Typography>{selectedUser.ci}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Rol:
                  </Typography>
                  {getRoleChip(selectedUser.role)}
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">
                    Email:
                  </Typography>
                  <Typography>{selectedUser.email || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">
                    Cargo:
                  </Typography>
                  <Typography>{selectedUser.position || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">
                    Departamento/Unidad:
                  </Typography>
                  <Typography>
                    {selectedUser.department || selectedUser.academicUnit || 'N/A'}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetailDialog}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para cambiar rol */}
      <Dialog open={openRoleDialog} onClose={handleCloseRoleDialog}>
        <DialogTitle>Cambiar Rol de Usuario</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ minWidth: 400, pt: 2 }}>
              <Typography gutterBottom>
                Cambiar rol de <strong>{selectedUser.fullName}</strong>:
              </Typography>
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Nuevo Rol</InputLabel>
                <Select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as RoleEnum)}
                  label="Nuevo Rol"
                >
                  <MenuItem value={RoleEnum.USER}>Usuario</MenuItem>
                  <MenuItem value={RoleEnum.SUPERVISOR}>Jefe Superior</MenuItem>
                  <MenuItem value={RoleEnum.ADMIN}>Administrador</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRoleDialog} startIcon={<CloseIcon />}>
            Cancelar
          </Button>
          <Button
            onClick={handleRoleChange}
            startIcon={<CheckIcon />}
            color="primary"
            variant="contained"
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SupervisorsAdminsTable;