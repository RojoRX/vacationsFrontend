import { useState, useEffect } from 'react';

// ** MUI Components
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

// ** Third Party Imports
import axios from 'axios';

// ** Icon Imports
import Icon from 'src/@core/components/icon';

// ** Hook Imports
import useUser from 'src/hooks/useUser';

// ** Styled Component
const ProfilePicture = styled('img')(({ theme }) => ({
  width: 120,
  height: 120,
  borderRadius: theme.shape.borderRadius,
  border: `5px solid ${theme.palette.common.white}`,
  [theme.breakpoints.down('md')]: {
    marginBottom: theme.spacing(4),
  },
}));

const UserProfileHeader = () => {
  // ** States
  const [data, setData] = useState<{
    username: string;
    profileImg: string;
    coverImg: string;
    role: string;
    fecha_ingreso: string;
  } | null>(null);
  const [loading, setLoading] = useState(true); // Estado de carga
  const [error, setError] = useState<string | null>(null); // Estado de error

  // ** Hooks
  const user = useUser();
  const userId = user?.id;

  // Esperar a que el userId esté disponible antes de realizar la solicitud
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) {
        setError('User ID is not available.');
        setLoading(false);
        return;
      }

      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        const response = await axios.get(`${baseUrl}/users/${userId}`);
        setData(response.data);
      } catch (err) {
        setError('Failed to fetch user data.');
        console.error('Error fetching user data:', err);
      } finally {
        setLoading(false);
      }
    };

    // Solo ejecutar la función fetchUserData si el userId ya está disponible
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  if (loading) {
    return (
      <Typography variant="h6" align="center" sx={{ mt: 4 }}>
        Loading user profile...
      </Typography>
    );
  }

  if (error) {
    return (
      <Typography variant="h6" align="center" color="error" sx={{ mt: 4 }}>
        {error}
      </Typography>
    );
  }

  return data ? (
    <Card>
      <CardMedia
        component="img"
        alt="profile-header"
        image="/images/banners/banner-4.jpg"  
        sx={{
          height: { xs: 150, md: 250 },
        }}
      />
      <CardContent
        sx={{
          pt: 0,
          mt: -8,
          display: 'flex',
          alignItems: 'flex-end',
          flexWrap: { xs: 'wrap', md: 'nowrap' },
          justifyContent: { xs: 'center', md: 'flex-start' },
        }}
      >
        <ProfilePicture src={"/images/avatars/1.png"} alt="profile-picture" />
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            ml: { xs: 0, md: 6 },
            alignItems: 'flex-end',
            flexWrap: ['wrap', 'nowrap'],
            justifyContent: ['center', 'space-between'],
          }}
        >
          <Box
            sx={{
              mb: [6, 0],
              display: 'flex',
              flexDirection: 'column',
              alignItems: ['center', 'flex-start'],
            }}
          >
            <Typography variant="h5" sx={{ mb: 4, fontSize: '1.375rem' }}>
              {data.username}
            </Typography>
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: ['center', 'flex-start'],
              }}
            >
              <Box
                sx={{
                  mr: 4,
                  display: 'flex',
                  alignItems: 'center',
                  '& svg': { mr: 1, color: 'text.secondary' },
                }}
              >
                <Icon icon="mdi:briefcase-outline" />
                <Typography sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Rol: {data.role}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  '& svg': { mr: 1, color: 'text.secondary' },
                }}
              >
                <Icon icon="mdi:calendar-blank-outline" />
                <Typography sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Fecha De Ingreso {data.fecha_ingreso}
                </Typography>
              </Box>
            </Box>
          </Box>
          <Button variant="contained" startIcon={<Icon icon="mdi:account-check-outline" fontSize={20} />}>
            Connected
          </Button>
        </Box>
      </CardContent>
    </Card>
  ) : null;
};

export default UserProfileHeader;
