import React, { useState } from 'react';
import axios from 'src/lib/axios';
import useUser from 'src/hooks/useUser';
import { TextField, Button, Typography } from '@mui/material';

// Aceptar onRequestUpdate como prop
const PostponeVacationRequestForm: React.FC<{
  requestId: number;
  onRequestUpdate: (updatedRequest: any) => void;
}> = ({ requestId, onRequestUpdate }) => {
  const user = useUser(); // Obtener el usuario actual
  const [postponedDate, setPostponedDate] = useState<string>('');
  const [postponedReason, setPostponedReason] = useState<string>('');
  const [error, setError] = useState<string | null>(null); // Para manejar errores

  const handlePostpone = async () => {
    if (!postponedDate || !postponedReason) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    if (!user) {
      setError('Usuario no autenticado.');
      return;
    }

    try {
      const response = await axios.patch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/vacation-requests/${requestId}/postpone`,
        {
          postponedDate,
          postponedReason,
          supervisorId: user.id, // ID del supervisor
        }
      );

      console.log('Solicitud de vacaciones pospuesta', response.data);

      // Aquí llamamos a onRequestUpdate con la respuesta actualizada
      onRequestUpdate(response.data); // Asumiendo que response.data contiene la información actualizada

      // Limpiar los campos después de la actualización
      setPostponedDate('');
      setPostponedReason('');
      setError(null); // Reiniciar el mensaje de error
    } catch (error) {
      console.error('Error al posponer la solicitud', error);
      setError('Error al posponer la solicitud.'); // Manejar error
    }
  };

  return (
    <div>
      {user && (user.role === 'admin' || user.role === 'supervisor') ? (
        <div>
          <Typography variant="h6">Postergar Solicitud de Vacaciones</Typography>
          <TextField
            label="Postergado hasta la Fecha"
            type="date"
            value={postponedDate}
            onChange={e => setPostponedDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
            style={{ marginTop: '10px' }}
          />
          <TextField
            label="Razón para Postergar"
            value={postponedReason}
            onChange={e => setPostponedReason(e.target.value)}
            fullWidth
            style={{ marginTop: '10px' }}
          />
          <Button
            onClick={handlePostpone}
            variant="contained"
            color="primary"
            style={{ marginTop: '10px' }}
          >
            Postergar Solicitud
          </Button>
          {error && <Typography color="error">{error}</Typography>} {/* Mostrar mensaje de error si existe */}
        </div>
      ) : (
        <Typography variant="body1" color="error">
          No tienes permisos para postergar esta solicitud.
        </Typography>
      )}
    </div>
  );
};

export default PostponeVacationRequestForm;
