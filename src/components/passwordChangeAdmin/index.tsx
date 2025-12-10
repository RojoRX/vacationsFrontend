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
import { jsPDF } from 'jspdf';


interface ChangePasswordDialogProps {
  open: boolean;
  onClose: () => void;
  ci: string; // Carnet de identidad del usuario
}

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;


const generateAndOpenPdf = (ci: string, password: string) => {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text('Credenciales de Acceso - Sistema de Vacaciones', 20, 20);

  doc.setFontSize(12);
  doc.text(`Usuario: ${ci} (CI)`, 20, 40);
  doc.text(`Contraseña: ${password}`, 20, 50);

  doc.setFontSize(11);
  doc.text(
    'También puedes ingresar con tu número de CI como nombre de usuario.',
    20,
    70,
    { maxWidth: 170 }
  );
  doc.text(
    'Te recomendamos guardar esta información en un lugar seguro.',
    20,
    80,
    { maxWidth: 170 }
  );

  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
};

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
    if (password && password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      setConfirmOpen(false);
      return;
    }
    setConfirmOpen(false);
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await axios.patch(`${API_URL}/users/${ci}/password`, {
        password: password || undefined,
      });

      const finalPassword = password || response.data.temporaryPassword;
      const mensaje = password
        ? 'Contraseña actualizada correctamente.'
        : `Contraseña generada automáticamente: ${finalPassword}`;

      setResult(mensaje);

      // ⬅️ Generar PDF con CI como usuario y la contraseña final
      generateAndOpenPdf(ci, finalPassword);
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
          <Button
            onClick={() => {
              if (password && password.length < 8) {
                setError("La contraseña debe tener al menos 8 caracteres.");
                return;
              }
              setError(null);
              setConfirmOpen(true);
            }}
            disabled={loading}
            variant="contained"
          >
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
