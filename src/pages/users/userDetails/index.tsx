import React, { useEffect, useState } from 'react';
import {
  Box, Button, CircularProgress, Snackbar, Typography, Paper,
  Select, MenuItem, FormControl, InputLabel, Avatar, Card,
  CardContent, Divider, Chip, Grid, useTheme,
  Alert,
  SelectChangeEvent
} from '@mui/material';
import {
  Person as PersonIcon,
  Work as WorkIcon,
  Phone as PhoneIcon,
  School as SchoolIcon,
  Event as EventIcon,
  Edit as EditIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import axios from 'axios';
import CustomHolidayForm from '../customholyday';
import UserHolidayPeriods from '../holydayinfo';
import { useRouter } from 'next/router';
import useUser from 'src/hooks/useUser';

interface User {
  id: number;
  ci: string;
  fecha_ingreso: string;
  username: string;
  fullName: string;
  celular: string | null;
  profesion: string | null;
  position: string;
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
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const currentUser = useUser();
  const theme = useTheme();

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

  const handleSuccess = async () => {
    setSnackbarMessage('Receso personalizado creado exitosamente');
    if (ci) await fetchUser(ci as string);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'error';
      case 'SUPERVISOR': return 'primary';
      default: return 'default';
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
                  <strong>Ingreso:</strong> {new Date(user.fecha_ingreso).toLocaleDateString()}
                </Typography>
                
                <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <strong>Celular:</strong> {user.celular || 'No registrado'}
                </Typography>
                
                <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center' }}>
                  <SchoolIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <strong>Profesión:</strong> {user.profesion || 'No registrada'}
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
            </CardContent>
          </Card>
        </Grid>

        {/* Sección de vacaciones y recesos */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 3
              }}>
                <Typography variant="h6">Gestión de Vacaciones</Typography>
                <Button
                  variant="contained"
                  startIcon={<EditIcon />}
                  onClick={() => setOpenDialog(true)}
                >
                  Crear Receso
                </Button>
              </Box>
              
              <UserHolidayPeriods userId={user.id} year={new Date().getFullYear()} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Diálogo para crear receso personalizado */}
      <CustomHolidayForm
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onSuccess={handleSuccess}
        userId={user.id}
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

// Configuración ACL para el componente
UserInformation.acl = {
  action: 'read',
  subject: 'user-profile'
};

export default UserInformation;