import React, { useState, useEffect, useCallback } from 'react';
import axios from 'src/lib/axios';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

// ** Demo Components (asegúrate de que AboutOverivew pueda manejar los nuevos datos)
import AboutOverivew from 'src/views/pages/user-profile/profile/AboutOverivew';

// ** Hooks
import useUser from 'src/hooks/useUser';

// ** Tipos (ajustamos estos tipos a la nueva estructura del backend)
// Asegúrate de que UserData refleje exactamente la estructura de tu backend
interface UserData {
  id: number;
  ci: string;
  fecha_ingreso: string;
  email: string | null;
  username: string;
  createdAt: string;
  updatedAt: string;
  fullName: string;
  celular: string | null;
  position: string | null;
  tipoEmpleado: string;
  role: string;
  department: {
    id: number;
    name: string;
  } | null;
  academicUnit: {
    id: number;
    name: string;
  } | null;
  profession: {
    id: number;
    name: string;
    createdAt: string;
    updatedAt: string;
  } | null;
}

const ProfileTab = () => {
  const [userDataApi, setUserDataApi] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  // Solo los campos que se pueden editar: email y celular
  const [editData, setEditData] = useState<Partial<{ email: string; celular: string }>>({});
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<{ email?: string; celular?: string }>({}); // Estado para errores de validación
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const user = useUser();
  const userId = user?.id;

  const fetchUserData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      setError('ID de usuario no disponible. Por favor, inicia sesión.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const response = await axios.get<UserData>(`${baseUrl}/users/${userId}`);
      setUserDataApi(response.data);
      // Inicializar editData solo con email y celular para la edición
      setEditData({
        email: response.data.email || '', // Asegurarse de que no sea null
        celular: response.data.celular || '', // Asegurarse de que no sea null
      });
      setSaveSuccess(false);
    } catch (err) {
      setError('No se pudieron cargar los datos del usuario. Inténtalo de nuevo más tarde.');
      console.error('Error fetching user data:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const getTransformedData = (data: UserData) => {
    return {
      about: [
        { icon: 'mdi:account', property: 'Nombre Completo', value: data.fullName },
        { icon: 'mdi:identification-card', property: 'Carnet de Identidad', value: data.ci },
        {
          icon: 'mdi:calendar',
          property: 'Fecha de Ingreso',
          value: data.fecha_ingreso ? new Date(data.fecha_ingreso).toLocaleDateString('es-ES') : 'N/A',
        },
        { icon: 'mdi:email', property: 'Email', value: data.email || 'N/A' },
      ],
      contacts: [
        { icon: 'mdi:account-box', property: 'Usuario', value: data.username },
        { icon: 'mdi:phone', property: 'Celular', value: data.celular || 'N/A' },
      ],
      overview: [
        { icon: 'mdi:briefcase', property: 'Cargo', value: data.position || 'N/A' },
        { icon: 'mdi:badge-account-horizontal', property: 'Tipo de Empleado', value: data.tipoEmpleado || 'N/A' },
        { icon: 'mdi:briefcase', property: 'Profesión', value: data.profession?.name || 'N/A' },
        { icon: 'mdi:sitemap', property: 'Rol', value: data.role || 'N/A' },
        { icon: 'mdi:office-building', property: 'Departamento', value: data.department?.name || 'N/A' },
        { icon: 'mdi:school', property: 'Unidad Académica', value: data.academicUnit?.name || 'N/A' },
      ],

    };
  };


  const handleOpenDialog = () => {
    // Asegura que editData siempre se inicialice con los valores actuales de userDataApi para email y celular
    setEditData({
      email: userDataApi?.email || '',
      celular: userDataApi?.celular || '',
    });
    setValidationErrors({}); // Limpiar errores de validación al abrir el diálogo
    setEditDialogOpen(true);
  };

  const handleCloseDialog = () => setEditDialogOpen(false);

  // Validación básica del frontend
  const validateForm = () => {
    const errors: { email?: string; celular?: string } = {};
    if (editData.email && !/\S+@\S+\.\S+/.test(editData.email)) {
      errors.email = 'El email no es válido.';
    }
    if (editData.celular && !/^\d{7,10}$/.test(editData.celular)) { // Ejemplo: 7 a 10 dígitos numéricos
      errors.celular = 'El celular debe contener entre 7 y 10 dígitos numéricos.';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0; // Retorna true si no hay errores
  };

  const handleSaveChanges = async () => {
    if (!userId) return;

    if (!validateForm()) {
      return; // Detener si la validación falla
    }

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const updatePayload = {
        email: editData.email,
        celular: editData.celular,
      };

      await axios.patch(`${baseUrl}/users/${userId}`, updatePayload);
      setSaveSuccess(true);
      fetchUserData(); // Volver a cargar los datos para reflejar los cambios
      handleCloseDialog();
    } catch (err: any) { // Captura el error para acceder a su respuesta
      console.error('Error al guardar los cambios:', err);
      // Intentar obtener el mensaje de error del backend si está disponible
      const errorMessage = err.response?.data?.message || 'Error al guardar los cambios. Por favor, inténtalo de nuevo.';
      setError(errorMessage); // Mostrar el error en el Alert principal
      setSaveSuccess(false); // Asegurarse de que no se muestre el mensaje de éxito
    }
  };
  const handleChangePassword = async () => {
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError("Todos los campos son obligatorios.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Las contraseñas no coinciden.");
      return;
    }

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      await axios.patch(`${baseUrl}/users/change-password`, {
        oldPassword,
        newPassword
      });


      setPasswordSuccess("¡Contraseña cambiada correctamente!");
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');

    } catch (err: any) {
      setPasswordError(err.response?.data?.message || "Error al cambiar la contraseña.");
    }
  };


  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Cargando perfil...</Typography>
      </Box>
    );
  }

  // Si hubo un error en la carga inicial, lo mostramos
  if (error && !editDialogOpen) { // Solo si el error no es del guardado en el diálogo
    return (
      <Alert severity="error" sx={{ mt: 4, mb: 4 }}>
        {error}
      </Alert>
    );
  }

  if (!userDataApi) {
    return (
      <Alert severity="info" sx={{ mt: 4, mb: 4 }}>
        No se encontraron datos del usuario.
      </Alert>
    );
  }

  const transformedDisplayData = getTransformedData(userDataApi);

  return (
    <>
      <Grid container spacing={6}>
        <Grid item xl={8} md={8} xs={12}>
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h5" sx={{ mb: 2 }}>
                Información del Perfil
              </Typography>
              <AboutOverivew about={transformedDisplayData.about}
                contacts={transformedDisplayData.contacts}
                overview={transformedDisplayData.overview} />
              <Button variant="contained" onClick={handleOpenDialog} sx={{ mt: 3 }}>
                Editar Datos
              </Button>
              <Button variant="outlined" onClick={() => setPasswordDialogOpen(true)} sx={{ mt: 2 }}>
                Cambiar Contraseña
              </Button>

              {saveSuccess && (
                <Alert severity="success" sx={{ mt: 3 }}>
                  ¡Cambios guardados con éxito!
                </Alert>
              )}
              {/* Mostrar el error de guardado aquí si existe */}
              {error && (
                <Alert severity="error" sx={{ mt: 3 }}>
                  {error}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={editDialogOpen} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>Editar Datos del Usuario</DialogTitle>
        <DialogContent dividers>
          {/* Campo para Email */}
          <TextField
            fullWidth
            label="Email"
            value={editData.email || ''}
            onChange={(e) => {
              setEditData({ ...editData, email: e.target.value });
              setValidationErrors({ ...validationErrors, email: undefined }); // Limpiar error al cambiar
            }}
            margin="normal"
            variant="outlined"
            sx={{ mb: 2 }}
            type="email" // Para un teclado adecuado en móviles
            error={!!validationErrors.email} // Mostrar error visual
            helperText={validationErrors.email} // Mostrar mensaje de error
          />
          {/* Campo para Celular */}
          <TextField
            fullWidth
            label="Celular"
            value={editData.celular || ''}
            onChange={(e) => {
              setEditData({ ...editData, celular: e.target.value });
              setValidationErrors({ ...validationErrors, celular: undefined }); // Limpiar error al cambiar
            }}
            margin="normal"
            variant="outlined"
            sx={{ mb: 2 }}
            type="tel" // Para un teclado numérico en móviles
            error={!!validationErrors.celular} // Mostrar error visual
            helperText={validationErrors.celular} // Mostrar mensaje de error
          />
          {/* Se eliminan los campos que no se pueden editar */}
          {/* <TextField
            fullWidth
            label="Nombre Completo"
            value={userDataApi.fullName || ''} // Mostrar el valor actual, pero de solo lectura
            margin="normal"
            variant="outlined"
            InputProps={{ readOnly: true }} // Solo lectura
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Posición"
            value={userDataApi.position || ''} // Mostrar el valor actual, pero de solo lectura
            margin="normal"
            variant="outlined"
            InputProps={{ readOnly: true }} // Solo lectura
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Profesión"
            value={userDataApi.profession?.name || ''} // Mostrar el valor actual, pero de solo lectura
            margin="normal"
            variant="outlined"
            InputProps={{ readOnly: true }} // Solo lectura
            sx={{ mb: 2 }}
          /> */}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="secondary">
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleSaveChanges} color="primary">
            Guardar Cambios
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Cambiar Contraseña</DialogTitle>
        <DialogContent dividers>

          {passwordError && <Alert severity="error" sx={{ mb: 2 }}>{passwordError}</Alert>}
          {passwordSuccess && <Alert severity="success" sx={{ mb: 2 }}>{passwordSuccess}</Alert>}

          <TextField
            fullWidth
            label="Contraseña actual"
            type="password"
            margin="normal"
            value={oldPassword}
            onChange={e => setOldPassword(e.target.value)}
          />

          <TextField
            fullWidth
            label="Nueva contraseña"
            type="password"
            margin="normal"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
          />

          <TextField
            fullWidth
            label="Confirmar nueva contraseña"
            type="password"
            margin="normal"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
          />

        </DialogContent>

        <DialogActions>
          <Button onClick={() => setPasswordDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" color="primary" onClick={handleChangePassword}>Guardar</Button>
        </DialogActions>
      </Dialog>

    </>
  );
};

ProfileTab.acl = {
  action: 'read',
  subject: 'profile-tab',
};

export default ProfileTab;
