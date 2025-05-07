import React, { useEffect, useState } from 'react';
import {
  Box, Button, CircularProgress, Snackbar, Typography, Paper,
  Select, MenuItem, FormControl, InputLabel, Avatar, Card,
  CardContent, Divider, Chip, Grid, useTheme,
  Alert,
  SelectChangeEvent,
  Tabs,
  Tab
} from '@mui/material';
import {
  Person as PersonIcon,
  Work as WorkIcon,
  Phone as PhoneIcon,
  School as SchoolIcon,
  Event as EventIcon,
  Edit as EditIcon,
  Lock as LockIcon,
  EventNote as LicenseIcon,
  BeachAccess as HolidayIcon
} from '@mui/icons-material';
import axios from 'axios';
import CustomHolidayForm from '../customholyday';
import UserHolidayPeriods from '../holydayinfo';
import { useRouter } from 'next/router';
import useUser from 'src/hooks/useUser';
import EditUserForm from '../edit-user';
import { TipoEmpleadoEnum } from 'src/utils/enums/typeEmployees';
import BulkLicenseForm from 'src/pages/permissions/bulkLicenseForm';
import UserLicenseList from 'src/pages/permissions/userLicenseList';

interface Department {
  id: number;
  name: string;
  isCareer: boolean;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: number;
  ci: string;
  username?: string;
  fullName: string;
  celular?: string;
  email?: string;
  profesion?: string;
  fecha_ingreso: string;
  position?: string;
  tipoEmpleado?: TipoEmpleadoEnum;
  department: Department;
  departmentId?: number;
  role: string;
}

interface AclComponent extends React.FC {
  acl?: {
    action: string;
    subject: string;
  };
}

const UserInformation: AclComponent = () => {
  const router = useRouter();
  const { ci } = router.query;
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [openHolidayDialog, setOpenHolidayDialog] = useState<boolean>(false);
  const [openLicenseDialog, setOpenLicenseDialog] = useState<boolean>(false);
  const currentUser = useUser();
  const theme = useTheme();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (ci) {
      fetchUser(ci as string);
    }
  }, [ci]);

  const fetchUser = async (ci: string) => {
    setLoading(true);
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/find/${ci}`);
      setUser(response.data);
    } catch (error) {
      setSnackbarMessage('Error al buscar usuario. Verifique el carnet de identidad.');
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (event: SelectChangeEvent<string>) => {
    const newRole = event.target.value;
    if (user) {
      try {
        await axios.put(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/${user.id}/role`, { role: newRole });
        setUser({ ...user, role: newRole });
        setSnackbarMessage('Rol actualizado exitosamente.');
      } catch (error) {
        setSnackbarMessage('Error al actualizar el rol.');
        console.error('Error updating role:', error);
      }
    }
  };

  const handleHolidaySuccess = async () => {
    setSnackbarMessage('Receso personalizado creado exitosamente');
    if (ci) await fetchUser(ci as string);
  };

  const handleLicenseSuccess = async () => {
    setSnackbarMessage('Licencias registradas exitosamente');
    if (ci) await fetchUser(ci as string);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'error';
      case 'SUPERVISOR': return 'primary';
      default: return 'default';
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <Alert severity="error">
          No se encontró información para el usuario con CI: {ci}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Grid container spacing={3}>
        {/* Sección de información del usuario */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{
                width: 120,
                height: 120,
                mx: 'auto',
                mb: 2,
                bgcolor: theme.palette.primary.main
              }}>
                <PersonIcon sx={{ fontSize: 60 }} />
              </Avatar>

              <Typography variant="h5" gutterBottom>
                {user.fullName}
              </Typography>

              <Chip
                label={user.role}
                color={getRoleColor(user.role)}
                sx={{ mb: 2 }}
              />

              <Divider sx={{ my: 2 }} />

              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <WorkIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <strong>Posición:</strong> {user.position}
                </Typography>

                <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <EventIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <strong>Ingreso:</strong> {new Date(user.fecha_ingreso).toLocaleDateString()}
                </Typography>

                <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <strong>Celular:</strong> {user.celular || 'No registrado'}
                </Typography>

                <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <SchoolIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <strong>Profesión:</strong> {user.profesion || 'No registrada'}
                </Typography>

                <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <SchoolIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <strong>Departamento:</strong> {user.department.name || 'No registrada'}
                </Typography>

                <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <LockIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <strong>Carnet de Identidad:</strong> {user.ci}
                </Typography>

                <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <LockIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <strong>Username:</strong> {user.username || 'No registrado'}
                </Typography>

                <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center' }}>
                  <LockIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <strong>Email:</strong> {user.email || 'No registrado'}
                </Typography>

                <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <LockIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <strong>Tipo de Empleado:</strong> {user.tipoEmpleado}
                </Typography>
              </Box>

              {currentUser?.role === 'admin' && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <FormControl fullWidth>
                    <InputLabel id="role-select-label">Cambiar Rol</InputLabel>
                    <Select
                      labelId="role-select-label"
                      value={user.role}
                      onChange={handleRoleChange}
                      label="Cambiar Rol"
                    >
                      <MenuItem value="USER">Usuario</MenuItem>
                      <MenuItem value="SUPERVISOR">Supervisor</MenuItem>
                      <MenuItem value="ADMIN">Administrador</MenuItem>
                    </Select>
                  </FormControl>
                </>
              )}
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                sx={{ mt: 2 }}
                onClick={() => setEditDialogOpen(true)}
              >
                Editar Usuario
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Sección de gestión */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
                <Tab icon={<HolidayIcon />} label="Vacaciones y Recesos" />
                <Tab icon={<LicenseIcon />} label="Licencias y Permisos" />
              </Tabs>

              {activeTab === 0 && (
                <>
                  <Box sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    mb: 3
                  }}>
                    <Button
                      variant="contained"
                      startIcon={<EditIcon />}
                      onClick={() => setOpenHolidayDialog(true)}
                    >
                      Crear Receso
                    </Button>
                  </Box>
                  <UserHolidayPeriods userId={user.id} year={new Date().getFullYear()} />
                </>
              )}

              {activeTab === 1 && (
                <>
                  <Box sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    mb: 3
                  }}>
                    <Button
                      variant="contained"
                      startIcon={<EventIcon />}
                      onClick={() => setOpenLicenseDialog(true)}
                    >
                      Registrar Licencias
                    </Button>
                  </Box>
                  <UserLicenseList userId={user.id} />
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Diálogos */}
      <CustomHolidayForm
        open={openHolidayDialog}
        onClose={() => setOpenHolidayDialog(false)}
        onSuccess={handleHolidaySuccess}
        userId={user.id}
      />

      <BulkLicenseForm
        open={openLicenseDialog}
        onClose={() => setOpenLicenseDialog(false)}
        userId={user.id}
        onSuccess={handleLicenseSuccess}
      />

      <EditUserForm
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        initialData={{
          ...user,
          departmentId: user.departmentId
        }}
        onSave={async () => {
          setSnackbarMessage('Usuario actualizado exitosamente');
          await fetchUser(user.ci);
          setEditDialogOpen(false);
        }}
      />

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={!!snackbarMessage}
        autoHideDuration={4000}
        onClose={() => setSnackbarMessage('')}
        message={snackbarMessage}
      />
    </Box>
  );
};

UserInformation.acl = {
  action: 'read',
  subject: 'user-profile'
};

export default UserInformation;