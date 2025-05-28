// src/views/pages/dashboard/SupervisorPendingRequestsCard.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, Typography, CircularProgress, Alert, Button, Box } from '@mui/material';
import Icon from 'src/@core/components/icon'; // Assuming you have this icon component
import { useRouter } from 'next/router';

// ** Custom Hooks
import useUser from 'src/hooks/useUser';

const SupervisorPendingRequestsCard = () => {
  const user = useUser(); // Hook para obtener la información del usuario logueado
  const router = useRouter();

  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPendingRequests = async () => {
      if (!user?.id) {
        // No fetch if user ID is not available (e.g., user not logged in or data not loaded yet)
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        // Fetch the count using the new endpoint
        const response = await axios.get(
          `${baseUrl}/vacation-requests/pending-count/supervisor/${user.id}`
        );
        setPendingCount(response.data.pendingRequestsCount);
      } catch (err: any) {
        console.error('Error fetching pending vacation requests count:', err);
        const errorMessage = err.response?.data?.message || 'No se pudo cargar el conteo de solicitudes pendientes.';
        setError(errorMessage);
        setPendingCount(0); // Set to 0 or handle as needed on error
      } finally {
        setLoading(false);
      }
    };

    // Fetch data when the user ID becomes available or changes
    fetchPendingRequests();
  }, [user?.id]); // Dependency array: re-run effect if user.id changes

  const handleGoToRequests = () => {
    // Navigate to the page where the supervisor can manage vacation requests
    router.push('/vacations/vacations-supervisor'); // Adjust this path to your actual requests management page
  };

  // Only render if the user is a supervisor (or has the necessary role)
  // You might have a `user.role` or similar property to check
  // For now, let's assume if user.id is present, we try to show it.
  // In a real app, you'd check `if (user?.role === 'supervisor')`.
  if (user?.role !== 'supervisor') { // Assuming your user object has a 'role' property
    return null; // Don't render the card if the user is not a supervisor
  }

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Solicitudes Pendientes
          </Typography>
          <Icon icon="mdi:bell-badge-outline" fontSize={28} color="warning.main" />
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
        ) : (
          <>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              {pendingCount !== null ? pendingCount : '-'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {pendingCount === 0 ? 'No tienes solicitudes de vacaciones pendientes.' : 'Solicitudes de vacaciones que requieren tu revisión.'}
            </Typography>
            {pendingCount !== null && pendingCount > 0 && (
              <Button
                variant="contained"
                fullWidth
                onClick={handleGoToRequests}
                startIcon={<Icon icon="mdi:arrow-right-circle" />}
              >
                Revisar Ahora
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SupervisorPendingRequestsCard;