// Importaciones
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { useEffect, useState } from 'react';
import { SelectChangeEvent } from '@mui/material';
import axios from 'axios';

// Tipado para el estado del formulario
interface FormData {
    licenseType: string;
    timeRequested: string;
    startDate: string;
    endDate: string;
}

// Componente de Solicitud de Permisos
const RequestPermission = () => {
    const [formData, setFormData] = useState<FormData>({
        licenseType: 'VACACION',
        timeRequested: 'FULL_DAY',
        startDate: '',
        endDate: ''
    });

    const [dialogOpen, setDialogOpen] = useState<boolean>(false);
    const [confirmationOpen, setConfirmationOpen] = useState<boolean>(false);
    const [dialogMessage, setDialogMessage] = useState<string>('');
    const [dialogTitle, setDialogTitle] = useState<string>('');
    const [submitted, setSubmitted] = useState<boolean>(false);
    const [status, setStatus] = useState<string | null>(null);
    const [daysCount, setDaysCount] = useState<number>(0); // Estado para total de días

    // Manejar cambios en los campos del formulario
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>
    ) => {
        const { name } = e.target;
        const value = e.target.value as string;

        setFormData({ ...formData, [name as keyof FormData]: value });
    };

    // Manejar cambios en Select
    const handleSelectChange = (event: SelectChangeEvent<string>) => {
        const { name, value } = event.target;

        // Restablecer fechas cuando se cambia el tipo de licencia o tiempo solicitado
        if (name === 'timeRequested') {
            setFormData({
                ...formData,
                [name as keyof FormData]: value,
                startDate: '',
                endDate: '' // Resetear fechas
            });
        } else {
            setFormData({ ...formData, [name as keyof FormData]: value });
        }
    };

    // Manejar la fecha de inicio y fin
    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        setFormData({ ...formData, startDate: value });

        // Si se selecciona "Día Completo" o "Medio Día", establecer la fecha de fin
        if (formData.timeRequested === 'FULL_DAY' || formData.timeRequested === 'HALF_DAY') {
            setFormData((prev) => ({
                ...prev,
                endDate: value // Establecer la fecha de fin igual a la de inicio
            }));
        }
    };

    // Manejar la fecha de fin
    const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;

        // Validar que la fecha de fin no sea anterior a la fecha de inicio
        if (new Date(value) < new Date(formData.startDate)) {
            setDialogTitle('Error');
            setDialogMessage('La fecha de fin no puede ser anterior a la fecha de inicio.');
            setDialogOpen(true);
            return;
        }

        setFormData({ ...formData, endDate: value });
    };

    // Calcular total de días
    const calculateTotalDays = (): number => {
        const startDate = new Date(formData.startDate);
        const endDate = new Date(formData.endDate);
        const timeDiff = endDate.getTime() - startDate.getTime();
        return Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 para incluir ambos días
    };

    // Manejar el envío del formulario
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Validaciones
        if (formData.timeRequested === 'MULTIPLE_DAYS' && formData.startDate === formData.endDate) {
            setDialogTitle('Error');
            setDialogMessage('Para "Varios Días", la fecha de inicio y fin no pueden ser iguales.');
            setDialogOpen(true);
            return;
        }

        if ((formData.timeRequested === 'FULL_DAY' || formData.timeRequested === 'HALF_DAY') && !formData.startDate) {
            setDialogTitle('Error');
            setDialogMessage('Por favor, seleccione una fecha de inicio.');
            setDialogOpen(true);
            return;
        }

        if (formData.timeRequested === 'FULL_DAY' || formData.timeRequested === 'HALF_DAY') {
            if (formData.startDate !== formData.endDate) {
                setDialogTitle('Error');
                setDialogMessage('Para "Día Completo" o "Medio Día", la fecha de inicio debe ser la misma que la de fin.');
                setDialogOpen(true);
                return;
            }
        }

        // Mostrar mensaje informativo para confirmación con los datos
        const totalDays = calculateTotalDays();
        setDaysCount(totalDays);

        // Actualiza la función handleSubmit para preparar el mensaje de diálogo
        const displayTotalDays = formData.timeRequested === 'HALF_DAY' ? 'medio día' : `${totalDays} día${totalDays > 1 ? 's' : ''}`;

        setDialogMessage(`
    ¿Estás seguro de que deseas enviar la solicitud?
    \nTipo de Licencia: ${formData.licenseType}
    \nTiempo Solicitado: ${formData.timeRequested === 'FULL_DAY' ? 'Día Completo' : formData.timeRequested === 'HALF_DAY' ? 'Medio Día' : 'Varios Días'}
    \nFecha de Inicio: ${formData.startDate}
    \nFecha de Fin: ${formData.endDate}
    \nTotal de Días: ${displayTotalDays}
  `);
        setConfirmationOpen(true); // Abre el diálogo de confirmación
    };

    // Confirmar envío
    const confirmSubmit = async () => {
        try {
            await axios.post('/api/permissions', {
                ...formData,
                // totalDays // No enviar totalDays a la API como indicaste
            });

            setDialogTitle('Éxito');
            setDialogMessage('Solicitud de permiso enviada con éxito.');
            setSubmitted(true);
        } catch (error: unknown) {
            setDialogTitle('Error');

            // Manejar el error de manera segura
            let errorMessage = 'Error al enviar la solicitud.'; // Mensaje por defecto
            if (axios.isAxiosError(error)) { // Verificar si es un error de Axios
                errorMessage = error.response?.data?.message || errorMessage;
            }

            setDialogMessage(errorMessage);
        } finally {
            setDialogOpen(true);
            setConfirmationOpen(false); // Cierra el diálogo de confirmación
        }
    };

    // Consultar estado de la solicitud
    const checkStatus = async () => {
        const response = await axios.get('/api/permissions/status'); // Usando axios para verificar el estado
        const data = await response.data;
        setStatus(data.status); // Suponiendo que el API retorna el estado de la solicitud
    };

    useEffect(() => {
        if (submitted) {
            checkStatus();
        }
    }, [submitted]);

    // Manejar el cierre del diálogo
    const handleDialogClose = () => {
        setDialogOpen(false);
    };

    const handleConfirmationClose = () => {
        setConfirmationOpen(false);
    };

    return (
        <Grid container spacing={6} className='match-height'>
            <Grid item xs={12} md={12}>
                <Card>
                    <CardContent>
                        <Typography variant="h5" component="div" gutterBottom>
                            Solicitud de Permisos
                        </Typography>
                        <form onSubmit={handleSubmit}>
                            <FormControl fullWidth margin="normal">
                                <InputLabel id="licenseType-label">Tipo de Licencia</InputLabel>
                                <Select
                                    labelId="licenseType-label"
                                    name="licenseType"
                                    value={formData.licenseType}
                                    onChange={handleSelectChange}
                                >
                                    <MenuItem value="VACACION">Vacación</MenuItem>
                                </Select>
                            </FormControl>

                            <FormControl fullWidth margin="normal">
                                <InputLabel id="timeRequested-label">Tiempo Solicitado</InputLabel>
                                <Select
                                    labelId="timeRequested-label"
                                    name="timeRequested"
                                    value={formData.timeRequested}
                                    onChange={handleSelectChange}
                                >
                                    <MenuItem value="FULL_DAY">Día Completo</MenuItem>
                                    <MenuItem value="HALF_DAY">Medio Día</MenuItem>
                                    <MenuItem value="MULTIPLE_DAYS">Varios Días</MenuItem>
                                </Select>
                            </FormControl>

                            <TextField
                                label="Fecha de Inicio"
                                type="date"
                                name="startDate"
                                value={formData.startDate}
                                onChange={handleStartDateChange}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                fullWidth
                                margin="normal"
                            />
                            <TextField
                                label="Fecha de Fin"
                                type="date"
                                name="endDate"
                                value={formData.endDate}
                                onChange={handleEndDateChange}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                fullWidth
                                margin="normal"
                            />

                            <Button variant="contained" color="primary" type="submit">
                                Enviar Solicitud
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </Grid>

            {/* Diálogo de Confirmación */}
            <Dialog open={confirmationOpen} onClose={handleConfirmationClose}>
                <DialogTitle>Confirmación de Solicitud</DialogTitle>
                <DialogContent>
                    <Typography variant="body1" gutterBottom>
                        ¿Estás seguro de que deseas enviar la solicitud?
                    </Typography>
                    <Typography variant="subtitle1" gutterBottom>
                        Tipo de Licencia: <strong>{formData.licenseType}</strong>
                    </Typography>
                    <Typography variant="subtitle1" gutterBottom>
                        Tiempo Solicitado: <strong>{formData.timeRequested}</strong>
                    </Typography>
                    <Typography variant="subtitle1" gutterBottom>
                        Fecha de Inicio: <strong>{formData.startDate}</strong>
                    </Typography>
                    <Typography variant="subtitle1" gutterBottom>
                        Fecha de Fin: <strong>{formData.endDate}</strong>
                    </Typography>
                    <Typography variant="subtitle1" gutterBottom>
                        Días Totales: <strong>{daysCount}</strong>
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleConfirmationClose} color="secondary">
                        Cancelar
                    </Button>
                    <Button onClick={confirmSubmit} color="primary">
                        Confirmar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Diálogo de Información */}
            <Dialog open={dialogOpen} onClose={handleDialogClose}>
                <DialogTitle>{dialogTitle}</DialogTitle>
                <DialogContent>
                    <Typography variant="body1">{dialogMessage}</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDialogClose} color="primary">
                        Cerrar
                    </Button>
                </DialogActions>
            </Dialog>
        </Grid>
    );
};
// Configurar ACL para dar acceso a empleados
RequestPermission.acl = {
    action: 'read',
    subject: 'request-permission'
};
export default RequestPermission;
