import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';

// ** Demo Components
import AboutOverivew from 'src/views/pages/user-profile/profile/AboutOverivew';

// ** Hooks
import useUser from 'src/hooks/useUser';

// ** Tipos
import { ProfileTabCommonType, ProfileTeamsType } from 'src/@fake-db/types';

interface UserData {
  id: number;
  ci: string;
  fecha_ingreso: string;
  username: string;
  fullName: string;
  celular: string | null;
  profesion: string | null;
  position: string | null;
  role: string;
  department: {
    id: number;
    name: string;
    isCareer: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

const ProfileTab = () => {
  const [data, setData] = useState<{
    about: ProfileTabCommonType[];
    contacts: ProfileTabCommonType[];
    teams: ProfileTeamsType[];
    overview: ProfileTabCommonType[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false); // Estado para el diálogo
  const [editData, setEditData] = useState<Partial<UserData>>({}); // Datos editables

  const user = useUser();
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;

    const fetchUserData = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        const response = await axios.get<UserData>(`${baseUrl}/users/${userId}`);
        const userData = response.data;

        const transformedData = {
          about: [
            { icon: 'mdi:account', property: 'Nombre Completo', value: userData.fullName },
            { icon: 'mdi:identification-card', property: 'Carnet de Identidad', value: userData.ci },
            { icon: 'mdi:calendar', property: 'Fecha de Ingreso', value: userData.fecha_ingreso },
          ],
          contacts: [
            { icon: 'mdi:email', property: 'Usuario', value: userData.username },
            { icon: 'mdi:phone', property: 'Celular', value: userData.celular || 'N/A' },
          ],
          teams: [],
          overview: [
            { icon: 'mdi:badge-account-horizontal', property: 'Rol', value: userData.role },
            { icon: 'mdi:building', property: 'Department', value: userData.department.name || 'N/A' },
            { icon: 'mdi:briefcase', property: 'Profesion', value: userData.profesion || 'N/A' },
            { icon: 'mdi:office-chair', property: 'Position', value: userData.position || 'N/A' },
          ],
        };

        setEditData(userData); // Establecer los datos iniciales para la edición
        setData(transformedData);
      } catch (err) {
        setError('Failed to fetch user data.');
        console.error('Error fetching user data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  const handleOpenDialog = () => setEditDialogOpen(true);
  const handleCloseDialog = () => setEditDialogOpen(false);

  const handleSaveChanges = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      await axios.patch(`${baseUrl}/users/${userId}`, editData); // Actualizar en la API

      // Actualizar la vista de datos localmente
      setData((prevData) =>
        prevData
          ? {
            ...prevData,
            about: prevData.about.map((item) =>
              item.property === 'Nombre Completo'
                ? { ...item, value: editData.fullName || item.value }
                : item
            ),
            overview: prevData.overview.map((item) =>
              item.property === 'Profesion'
                ? { ...item, value: editData.profesion || item.value }
                : item
            ),
          }
          : null
      );

      handleCloseDialog();
    } catch (err) {
      console.error('Error saving changes:', err);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <>
      <Grid container spacing={6}>
        <Grid item xl={8} md={8} xs={12}>
          {data && (
            <>
              <AboutOverivew
                about={data.about}
                contacts={data.contacts}
                teams={data.teams}
                overview={data.overview}
              />
              <Button variant="contained" onClick={handleOpenDialog}>
                Editar Datos
              </Button>
            </>
          )}
        </Grid>
      </Grid>


      <Dialog open={editDialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>Editar Datos del Usuario</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nombre Completo"
            value={editData.fullName || ''}
            onChange={(e) => setEditData({ ...editData, fullName: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Celular"
            value={editData.celular || ''}
            onChange={(e) => setEditData({ ...editData, celular: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Profesión"
            value={editData.profesion || ''}
            onChange={(e) => setEditData({ ...editData, profesion: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Posición"
            value={editData.position || ''}
            onChange={(e) => setEditData({ ...editData, position: e.target.value })}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveChanges}>
            Guardar
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
