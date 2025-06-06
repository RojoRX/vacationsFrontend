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
import axios from 'src/lib/axios';
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
import { CalendarIcon } from '@mui/x-date-pickers';
import VacationRequestsTable from '../vacations-user';
import { VacationReportDialog } from 'src/pages/reports/vacationReports';
import UserConfigDialog from '../userConfig';
import { PastVacationDialog } from 'src/pages/vacations/createPastVacations';
import CreatePastVacationDto from 'src/interfaces/createPastVacation.dto';
import { RoleEnum } from 'src/enum/roleEnum';
import { translateRole } from 'src/utils/translateRole';

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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [openConfig, setOpenConfig] = useState(false);
  const [openPastVacationDialog, setOpenPastVacationDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleOpenPastVacationDialog = () => setOpenPastVacationDialog(true);
  const handleClosePastVacationDialog = () => setOpenPastVacationDialog(false);
  const [reloadRequests, setReloadRequests] = useState(false);
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('success');


  const triggerReload = () => {
    setReloadRequests(prev => !prev); // Alternar el valor para forzar la recarga
    setSnackbar({
      open: true,
      message: 'Vacación pasada agregada correctamente',
      severity: 'success'
    });
  };


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
    const newRole = event.target.value as RoleEnum; // Asegura que el valor sea del tipo RoleEnum

    if (!user || !user.id) {
      setSnackbarMessage('Error: No se pudo obtener la información del usuario.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    try {
      // 1. Usa PATCH en lugar de PUT para el endpoint de actualización de rol
      // 2. Envía el rol en el formato esperado: { role: newRole }
      const response = await axios.patch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/${user.id}/role`, { role: newRole });

      // Si la operación fue exitosa, actualiza el estado del usuario en el contexto
      // El backend devuelve el usuario actualizado, usa esos datos si están disponibles y completos
      // Si el backend no devuelve el usuario actualizado, o solo parte de él,
      // actualiza manualmente solo la propiedad 'role'
      if (response.data && response.data.role) {
        setUser({ ...user, role: response.data.role });
      } else {
        // Fallback: si el backend no devuelve el usuario actualizado, asume que el cambio fue exitoso
        setUser({ ...user, role: newRole });
      }


      setSnackbarMessage('Rol actualizado exitosamente.');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

    } catch (error: any) { // Captura el error para acceder a 'response'
      console.error('Error al actualizar el rol:', error);

      // Manejo de errores específicos del backend
      if (error.response) {
        const statusCode = error.response.status;
        const errorMessage = error.response.data.message || 'Error desconocido del servidor.';

        switch (statusCode) {
          case 400: // BadRequestException (ej: límite de admins, usuario sin departamento/unidad)
            setSnackbarMessage(`Error: ${errorMessage}`);
            setSnackbarSeverity('error');
            break;
          case 404: // NotFoundException (ej: usuario no encontrado)
            setSnackbarMessage(`Error: ${errorMessage}`);
            setSnackbarSeverity('error');
            break;
          case 409: // ConflictException (ej: ya existe un supervisor, si tuvieras esa excepción sin reemplazo)
            // Nota: Con la lógica de reemplazo en el backend, esta excepción no debería ocurrir
            // si el nuevo rol es SUPERVISOR y ya hay uno. Pero si la dejaste en algún caso, se capturaría.
            setSnackbarMessage(`Conflicto: ${errorMessage}`);
            setSnackbarSeverity('warning'); // Podría ser warning si indica una situación manejada por el backend
            break;
          case 401: // Unauthorized (token inválido/expirado, manejado por AuthProvider globalmente)
          case 403: // Forbidden (rol no permitido para la acción, manejado por RolesGuard)
            setSnackbarMessage('No tienes permiso para realizar esta acción o tu sesión ha expirado.');
            setSnackbarSeverity('error');
            // Podrías forzar un logout aquí si no lo hace el interceptor de axios global
            break;
          default:
            setSnackbarMessage(`Error del servidor: ${errorMessage}`);
            setSnackbarSeverity('error');
            break;
        }
      } else {
        // Errores de red u otros errores que no tienen una respuesta HTTP
        setSnackbarMessage('Error de red o desconocido al actualizar el rol.');
        setSnackbarSeverity('error');
      }
      setSnackbarOpen(true);
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
        <Grid item xs={12} md={12}>
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
                // Aquí es donde usas el traductor:
                label={translateRole(user.role)} // <--- ¡Aplica la traducción aquí!
                color={getRoleColor(user.role)}
                sx={{ mb: 2 }}
              />

              <Divider sx={{ my: 2 }} />

              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <WorkIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <strong>Posición:</strong> {user.position || 'No registrado'}
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
                Editar Informacion
              </Button>
              {user.username === null ? (
                <Button variant="contained" color="primary" sx={{ mt: 2, ml: 1 }} onClick={() => setOpenCreate(true)}>
                  Crear credenciales
                </Button>
              ) : (
                <Button variant="outlined" color="secondary" sx={{ mt: 2, ml: 1 }} onClick={() => setOpenChangePassword(true)}>
                  Cambiar contraseña
                </Button>
              )}
              <CreateCredentialsDialog open={openCreate} onClose={async () => {
                setOpenCreate(false);
                await fetchUser(user.ci);
              }} ci={user.ci} />
              <Button variant='outlined' sx={{ mt: 2, ml: 1 }} onClick={() => setOpenConfig(true)}>Configurar Usuario</Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Sección de gestión */}
        <Grid item xs={12} md={12}>
          <Card>
            <CardContent>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
                sx={{
                  mb: 3,
                  maxWidth: '100%',
                  '& .MuiTab-root': {
                    minHeight: 64, // Más espacio para icono + texto
                    padding: '6px 12px',
                  }
                }}
              >
                <Tab
                  icon={<HolidayIcon color="primary" />}
                  label="Recesos"
                  iconPosition="start"
                  sx={{
                    '& .MuiTab-iconWrapper': {
                      marginRight: 1,
                    }
                  }}
                />
                <Tab
                  icon={<WorkIcon color="secondary" />}
                  label="Permisos"
                  iconPosition="start"
                />
                <Tab
                  icon={<DebtIcon color="warning" />}
                  label="Deuda Vacacional"
                  iconPosition="start"
                />
                <Tab
                  icon={<CalendarIcon color="success" />}
                  label="Vacaciones"
                  iconPosition="start"
                />
                {/** 
                <Tab
                  icon={<CalendarIcon color="success" />}
                  label="Recesos Generales"
                  iconPosition="start"
                />*/}
                {/* Más tabs aquí si es necesario */}
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
                      Crear Recesos
                    </Button>

                  </Box>
                  <CombinedHolidayPeriods userId={user.id} joinDate={user.fecha_ingreso} />
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
                  <Button variant="outlined" onClick={() => setDialogOpen(true)}>
                    Generar Reporte de Vacaciones
                  </Button>
                  <Button sx={{ ml: 5 }} variant="contained" onClick={handleOpenPastVacationDialog}>
                    Registrar Vacaciones Pasadas
                  </Button>
                  <VacationReportDialog open={dialogOpen}
                    onClose={() => setDialogOpen(false)}
                    ci={user.ci}
                  />
                  <VacationRequestsTable
                    userId={user.id}
                    reloadRequests={reloadRequests}
                  />
                  {/**  <UserHolidayPeriods userId={user.id} year={new Date().getFullYear()} />*/}
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
      <UserConfigDialog
        open={openConfig}
        onClose={() => setOpenConfig(false)}
        userId={user.id}
        fechaIngreso={user.fecha_ingreso}
      />
      <PastVacationDialog
        open={openPastVacationDialog}
        onClose={handleClosePastVacationDialog}
        userId={user.id}
        userCi={user.ci}
        onSuccess={triggerReload}
      />
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity as any}>
          {snackbar.message}
        </Alert>
      </Snackbar>

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