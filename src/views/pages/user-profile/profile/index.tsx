import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress'; // Para el estado de carga
import Box from '@mui/material/Box'; // Para centrar el spinner
import Alert from '@mui/material/Alert'; // Para mensajes de error o éxito
import Typography from '@mui/material/Typography'; // Para títulos y subtítulos
import Card from '@mui/material/Card'; // Para agrupar secciones visualmente
import CardContent from '@mui/material/CardContent'; // Contenido de la tarjeta

// ** Demo Components (asegúrate de que AboutOverivew pueda manejar los nuevos datos)
import AboutOverivew from 'src/views/pages/user-profile/profile/AboutOverivew';

// ** Hooks
import useUser from 'src/hooks/useUser';

// ** Tipos (ajustamos estos tipos a la nueva estructura del backend)
import { ProfileTabCommonType, ProfileTeamsType } from 'src/@fake-db/types'; // Mantener si son relevantes para AboutOverview

// Interface para la estructura completa del usuario del backend
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
  } | null; // Puede ser null
  academicUnit: {
    id: number;
    name: string;
  } | null; // Puede ser null
  profession: {
    id: number;
    name: string;
    createdAt: string;
    updatedAt: string;
  } | null; // Puede ser null
}

const ProfileTab = () => {
  const [userDataApi, setUserDataApi] = useState<UserData | null>(null); // Datos crudos de la API
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState<Partial<UserData>>({});
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false); // Estado para éxito al guardar

  const user = useUser();
  console.log(user)
  const userId = user?.id;

  const fetchUserData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      setError('User ID not available. Please log in.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const response = await axios.get<UserData>(`${baseUrl}/users/${userId}`);
      setUserDataApi(response.data); // Guardar los datos crudos
      setEditData(response.data); // Inicializar datos para edición
      setSaveSuccess(false); // Resetear el estado de éxito al cargar nuevos datos
    } catch (err) {
      setError('No se pudieron cargar los datos del usuario. Inténtalo de nuevo más tarde.');
      console.error('Error fetching user data:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]); // Dependencia del useCallback

  // Función para transformar los datos de la API al formato esperado por AboutOverivew
  const getTransformedData = (data: UserData) => {
    return {
      about: [
        { icon: 'mdi:account', property: 'Nombre Completo', value: data.fullName },
        { icon: 'mdi:identification-card', property: 'Carnet de Identidad', value: data.ci },
        {
          icon: 'mdi:calendar',
          property: 'Fecha de Ingreso',
          value: data.fecha_ingreso ? new Date(data.fecha_ingreso).toLocaleDateString('es-ES') : 'N/A', // Formato legible
        },
        { icon: 'mdi:email', property: 'Email', value: data.email || 'N/A' }, // Nuevo campo
      ],
      contacts: [
        { icon: 'mdi:account-box', property: 'Usuario', value: data.username },
        { icon: 'mdi:phone', property: 'Celular', value: data.celular || 'N/A' },
      ],
      teams: [], // Podrías poblar esto si tienes equipos relacionados al usuario
      overview: [
        { icon: 'mdi:briefcase', property: 'Cargo', value: data.position || 'N/A' },
        { icon: 'mdi:badge-account-horizontal', property: 'Tipo de Empleado', value: data.tipoEmpleado || 'N/A' }, // Nuevo campo
        { icon: 'mdi:briefcase', property: 'Profesión', value: data.profession?.name || 'N/A' }, // Acceso a .name
        { icon: 'mdi:sitemap', property: 'Rol', value: data.role },
        { icon: 'mdi:office-building', property: 'Departamento', value: data.department?.name || 'N/A' },
        { icon: 'mdi:school', property: 'Unidad Académica', value: data.academicUnit?.name || 'N/A' }, // Nuevo campo
      ],
    };
  };

  const handleOpenDialog = () => {
    setEditData(userDataApi || {}); // Asegura que los datos del diálogo sean los actuales de la API
    setEditDialogOpen(true);
  };
  const handleCloseDialog = () => setEditDialogOpen(false);

  const handleSaveChanges = async () => {
    if (!userId) return;

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const updatePayload: Partial<UserData> = {
        fullName: editData.fullName,
        celular: editData.celular,
        // Si profesión y posición son editables, necesitarías enviar sus IDs o nombres según tu API
        // Por simplicidad, aquí solo actualizamos lo que se está mostrando en los TextFields
        position: editData.position,
        // Puedes agregar más campos editables aquí
      };

      await axios.patch(`${baseUrl}/users/${userId}`, updatePayload);
      setSaveSuccess(true);
      fetchUserData(); // Volver a cargar los datos para reflejar los cambios
      handleCloseDialog();
    } catch (err) {
      setError('Error al guardar los cambios. Por favor, inténtalo de nuevo.');
      console.error('Error saving changes:', err);
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

  if (error) {
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
              <AboutOverivew
                about={transformedDisplayData.about}
                contacts={transformedDisplayData.contacts}
                teams={transformedDisplayData.teams}
                overview={transformedDisplayData.overview}
              />
              <Button variant="contained" onClick={handleOpenDialog} sx={{ mt: 3 }}>
                Editar Datos
              </Button>
              {saveSuccess && (
                <Alert severity="success" sx={{ mt: 3 }}>
                  ¡Cambios guardados con éxito!
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={editDialogOpen} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>Editar Datos del Usuario</DialogTitle>
        <DialogContent dividers> {/* `dividers` añade una línea divisoria */}
          <TextField
            fullWidth
            label="Nombre Completo"
            value={editData.fullName || ''}
            onChange={(e) => setEditData({ ...editData, fullName: e.target.value })}
            margin="normal"
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Celular"
            value={editData.celular || ''}
            onChange={(e) => setEditData({ ...editData, celular: e.target.value })}
            margin="normal"
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Posición"
            value={editData.position || ''}
            onChange={(e) => setEditData({ ...editData, position: e.target.value })}
            margin="normal"
            variant="outlined"
            sx={{ mb: 2 }}
          />
          {/* Si `profession` es editable directamente por un TextField, considera usar un `Autocomplete` o `Select`
              ya que es un objeto con `id` y `name` en el backend.
              Por ahora, solo muestro un ejemplo con texto plano, pero esto no sería ideal para guardar.
          */}
          <TextField
            fullWidth
            label="Profesión (Solo lectura si no hay un mecanismo para editar el objeto)"
            value={editData.profession?.name || ''}
            margin="normal"
            variant="outlined"
            InputProps={{
              readOnly: true, // Hacerlo de solo lectura para evitar enviar nombres incorrectos
            }}
            sx={{ mb: 2 }}
          />
          {/* Puedes añadir más campos editables aquí según sea necesario */}
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
    </>
  );
};

ProfileTab.acl = {
  action: 'read',
  subject: 'profile-tab',
};

export default ProfileTab;