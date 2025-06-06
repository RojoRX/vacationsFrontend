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
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useState } from 'react';
import axios from 'src/lib/axios';
import jsPDF from 'jspdf';

interface CreateCredentialsDialogProps {
    open: boolean;
    onClose: () => void;
    ci: string; // Carnet de identidad del usuario
}

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const generateAndOpenPdf = (username: string, password: string) => {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text('Credenciales de Acceso - Sistema de Vacaciones', 20, 20);

    doc.setFontSize(12);
    doc.text(`Usuario: ${username}`, 20, 40);
    doc.text(`Contraseña: ${password}`, 20, 50);

    // Texto adicional
    doc.setFontSize(11);
    doc.text(
        'Nota: También puedes acceder al sistema utilizando tu número de CI como nombre de usuario.',
        20,
        70,
        { maxWidth: 170 } // Para evitar que se corte en pantallas más pequeñas
    );

    doc.text(
        'Te recomendamos guardar esta información en un lugar seguro.',
        20,
        80,
        { maxWidth: 170 }
    );

    // Abrir el PDF en una nueva ventana
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
};


export const CreateCredentialsDialog: React.FC<CreateCredentialsDialogProps> = ({ open, onClose, ci }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false); // 👈 nuevo estado
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ username: string; temporaryPassword?: string } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            const response = await axios.post(`${API_URL}/users/${ci}/credentials`, {
                username: username || undefined,
                password: password || undefined,
            });

            setResult(response.data);
            // Extraer valores y generar PDF
            const finalUsername = username || response.data.username;
            const finalPassword = password || response.data.temporaryPassword || 'No proporcionada';
            generateAndOpenPdf(finalUsername, finalPassword);
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

    const handleClose = () => {
        setUsername('');
        setPassword('');
        setResult(null);
        setError(null);
        setShowPassword(false);
        onClose();
    };

    const togglePasswordVisibility = () => setShowPassword((prev) => !prev); // 👈 función para alternar

    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
            <DialogTitle>Asignar credenciales</DialogTitle>
            <DialogContent>
                <Alert severity="info" sx={{ mb: 2 }}>
                    Puedes ingresar un nombre de usuario y una contraseña personalizados, o dejar los campos en blanco para que se generen automáticamente.
                </Alert>

                <TextField
                    label="Nombre de usuario"
                    fullWidth
                    margin="normal"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Opcional (se generará si no se proporciona)"
                />
                <TextField
                    label="Contraseña"
                    type={showPassword ? 'text' : 'password'}
                    fullWidth
                    margin="normal"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Opcional (se generará si no se proporciona)"
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
                        Credenciales creadas: <br />
                        <strong>Usuario:</strong> {username || result.username} <br />
                        <strong>Contraseña:</strong>{' '}
                        {password || result.temporaryPassword || '(no proporcionada por el servidor)'}
                    </Alert>
                )}

                {error && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {error}
                    </Alert>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={loading}>
                    Cerrar
                </Button>
                <Button onClick={handleSubmit} disabled={loading} variant="contained">
                    Crear credenciales
                </Button>
            </DialogActions>
        </Dialog>
    );
};
