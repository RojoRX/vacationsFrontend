import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  Alert,
  IconButton,
  InputAdornment,
  Typography,
  DialogContentText,
  Dialog as ConfirmDialog
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useState } from 'react';
import axios from 'src/lib/axios';

interface ChangePasswordDialogProps {
  open: boolean;
  onClose: () => void;
  ci: string; // Carnet de identidad del usuario
}

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const ChangePasswordDialog: React.FC<ChangePasswordDialogProps> = ({ open, onClose, ci }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

  const handleClose = () => {
    setPassword('');
    setShowPassword(false);
    setResult(null);
    setError(null);
    setConfirmOpen(false);
    onClose();
  };

  const handleConfirm = async () => {
    setConfirmOpen(false);
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await axios.patch(`${API_URL}/users/${ci}/password`, {
        password: password || undefined,
      });

      const mensaje = password
        ? 'Contraseña actualizada correctamente.'
        : `Contraseña generada automáticamente: ${response.data.temporaryPassword}`;
      setResult(mensaje);
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || err.message || 'Error inesperado');
      } else {
        setError('Ocurrió un error inesperado');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>Cambiar contraseña</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Puedes ingresar una nueva contraseña manualmente o dejar el campo en blanco para generar una contraseña automática.
          </Typography>

          <TextField
            label="Nueva contraseña"
            type={showPassword ? 'text' : 'password'}
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Opcional"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={togglePasswordVisibility} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {loading && <CircularProgress sx={{ mt: 2 }} />}
          {result && (
            <Alert severity="success" sx={{ mt: 2 }}>
              {result}
            </Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>Cerrar</Button>
          <Button onClick={() => setConfirmOpen(true)} disabled={loading} variant="contained">
            Cambiar contraseña
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmación */}
      <ConfirmDialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>¿Confirmar cambio de contraseña?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Esta acción reemplazará la contraseña actual del usuario. ¿Deseas continuar?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={loading}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={loading} color="error" variant="contained">
            Sí, cambiar
          </Button>
        </DialogActions>
      </ConfirmDialog>
    </>
  );
};
