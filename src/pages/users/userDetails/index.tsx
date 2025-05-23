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
  BeachAccess as HolidayIcon,
  Person as DebtIcon
} from '@mui/icons-material';
import { TextField } from '@mui/material';
import axios from 'axios';
import CustomHolidayForm from '../customholyday';
import UserHolidayPeriods from '../holydayinfo';
import { useRouter } from 'next/router';
import useUser from 'src/hooks/useUser';
import EditUserForm from '../edit-user';
import { TipoEmpleadoEnum } from 'src/utils/enums/typeEmployees';
import BulkLicenseForm from 'src/pages/permissions/bulkLicenseForm';
import UserLicenseList from 'src/pages/permissions/userLicenseList';
import UserVacationDebt from '../userVacationDebt';
import UserReportModal from 'src/pages/reports/reportTypes/userReportForm';
import { User } from 'src/interfaces/user.interface';
import { CreateCredentialsDialog } from 'src/pages/credentials/userCredentials';
import { ChangePasswordDialog } from 'src/pages/management/passwordChangeAdmin';
import CombinedHolidayPeriods from '../combined-recess';

interface Department {
  id: number;
  name: string;
  isCareer: boolean;
  createdAt: string;
  updatedAt: string;
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
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const userCi = user?.ci; // Reemplaza con tu valor real
  const fechaIngresoStr = user?.fecha_ingreso; // '2020-05-09'
  const fechaIngreso = fechaIngresoStr
    ? new Date(fechaIngresoStr + 'T00:00:00')
    : null;
  const [openCreate, setOpenCreate] = useState(false);
  const [openChangePassword, setOpenChangePassword] = useState(false);

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
      // Usar directamente el objeto obtenido
      const ingresoYear = new Date(response.data.fecha_ingreso).getFullYear();
      setSelectedYear(ingresoYear);
    } catch (error) {
      //setSnackbarMessage('Error al buscar usuario. Verifique el carnet de identidad.');
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

  const handleYearChange = (event: SelectChangeEvent<number>, child: React.ReactNode) => {
    const value = Number(event.target.value);

    if (value >= 1980 && value <= currentYear) {
      setSelectedYear(value);
    } else {
      setSnackbarMessage('Por favor, seleccione un año válido entre 1980 y el año actual.');
    }
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
                  <strong>Ingreso:</strong> {(user.fecha_ingreso)}
                </Typography>

                <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <strong>Celular:</strong> {user.celular || 'No registrado'}
                </Typography>

                <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <SchoolIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <strong>Profesión:</strong> {user.profession?.name || 'No registrada'}
                </Typography>

                <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <SchoolIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <strong>Departamento:</strong> {user.department?.name || 'No registrado'}
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
              {user.username === null ? (
                <Button variant="contained" color="primary" onClick={() => setOpenCreate(true)}>
                  Crear credenciales
                </Button>
              ) : (
                <Button variant="outlined" color="secondary" onClick={() => setOpenChangePassword(true)}>
                  Cambiar contraseña
                </Button>
              )}
              <CreateCredentialsDialog open={openCreate} onClose={() => setOpenCreate(false)} ci={user.ci} />

            </CardContent>
          </Card>
        </Grid>

        {/* Sección de gestión */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
                <Tab icon={<HolidayIcon />} label="Recesos Personalizados" />
                <Tab icon={<LicenseIcon />} label="Permisos" />
                <Tab icon={<HolidayIcon />} label="Deuda Vacacional" />
                <Tab icon={<HolidayIcon />} label="Recesos Generales" />
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
                      sx={{ m: 2 }}
                      variant="contained"
                      onClick={() => setReportModalOpen(true)}

                    >
                      Reporte de Licencias
                    </Button>
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
              {activeTab === 2 && user && (
                <>
                  {/* Selector de años disponibles */}
                  <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <FormControl sx={{ minWidth: 150 }}>
                      <InputLabel id="year-select-label">Desde la Gestión</InputLabel>
                      <Select
                        labelId="year-select-label"
                        value={selectedYear}
                        onChange={handleYearChange}
                        size="small"
                        label="Desde la Gestión"
                      >
                        {/* Generar los años disponibles dinámicamente */}
                        {Array.from({ length: currentYear - new Date(user.fecha_ingreso).getFullYear() + 1 }, (_, i) => {
                          const year = new Date(user.fecha_ingreso).getFullYear() + i;
                          return (
                            <MenuItem key={year} value={year}>
                              {year}
                            </MenuItem>
                          );
                        })}
                      </Select>
                    </FormControl>
                  </Box>

                  {/* Botón para disparar el fetch de la deuda vacacional */}
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                    <Button
                      variant="contained"
                      onClick={() => {
                        // Acción de disparar el fetch cuando se hace clic en el botón
                        console.log(`Obteniendo deuda vacacional para el año ${selectedYear}`);
                      }}
                    >
                      Obtener Deuda Vacacional
                    </Button>
                  </Box>

                  {/* Componente UserVacationDebt */}
                  <UserVacationDebt
                    ci={user.ci}
                    fechaIngreso={user.fecha_ingreso}
                    startDate={selectedYear.toString()}
                  />
                </>
              )}
               {activeTab === 3 && (
                <>
                  <CombinedHolidayPeriods userId={user.id} joinDate={user.fecha_ingreso}/>
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
          department: user.department,
          profession: user.profession,
          academicUnit: user.academicUnit,
        }}
        onSave={async () => {
          setSnackbarMessage('Usuario actualizado exitosamente');
          await fetchUser(user.ci);
          setEditDialogOpen(false);
        }}
      />

      <UserReportModal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        defaultCi={userCi} // Opcional: puedes pasarlo aquí o dejarlo que lo ingrese el usuario
        fechaIngreso={fechaIngreso ? fechaIngreso.toISOString().split('T')[0] : undefined}// Opcional: puedes pasarlo aquí o dejarlo que lo ingrese el usuario
      />
 <ChangePasswordDialog
        open={openChangePassword}
        onClose={() => setOpenChangePassword(false)}
        ci={user.ci}
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