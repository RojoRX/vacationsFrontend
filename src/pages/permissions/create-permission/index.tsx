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
import useUser from 'src/hooks/useUser';

// Tipado para el estado del formulario
interface FormData {
    licenseType: string;
    timeRequested: string;
    startDate: string;
    endDate: string;
}

// Componente de Solicitud de Permisos
const RequestPermission = () => {
    const user = useUser();
    const [formData, setFormData] = useState<FormData>({
        licenseType: 'VACACION',
        timeRequested: '',
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
        if (formData.timeRequested === 'Día Completo' || formData.timeRequested === 'Medio Día') {
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
        if (formData.timeRequested === 'Varios Días' && formData.startDate === formData.endDate) {
            setDialogTitle('Error');
            setDialogMessage('Para "Varios Días", la fecha de inicio y fin no pueden ser iguales.');
            setDialogOpen(true);
            return;
        }

        if ((formData.timeRequested === 'Día Completo' || formData.timeRequested === 'Medio Día') && !formData.startDate) {
            setDialogTitle('Error');
            setDialogMessage('Por favor, seleccione una fecha de inicio.');
            setDialogOpen(true);
            return;
        }

        if (formData.timeRequested === 'Día Completo' || formData.timeRequested === 'Medio Día') {
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
        const displayTotalDays = formData.timeRequested === 'Medio Día' ? 'medio día' : `${totalDays} día${totalDays > 1 ? 's' : ''}`;

        setDialogMessage(`
        ¿Estás seguro de que deseas enviar la solicitud?
        \nTipo de Licencia: ${formData.licenseType}
        \nTiempo Solicitado: ${formData.timeRequested}
        \nFecha de Inicio: ${formData.startDate}
        \nFecha de Fin: ${formData.endDate}
        \nTotal de Días: ${displayTotalDays}
      `);
        setConfirmationOpen(true); // Abre el diálogo de confirmación
    };

    // Confirmar envío
    const confirmSubmit = async () => {
        if (!user) {
            setDialogTitle('Error');
            setDialogMessage('Usuario no autenticado.');
            setDialogOpen(true);
            return;
        }
    
        // Verificación de formato de fechas
        const { startDate, endDate } = formData;
        const formattedStartDate = new Date(startDate).toISOString().split('T')[0];
        const formattedEndDate = new Date(endDate).toISOString().split('T')[0];
    
        try {
            await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/licenses/${user.id}`, {
                licenseType: formData.licenseType,
                timeRequested: formData.timeRequested,
                startDate: formattedStartDate, // Asegúrate de que se envíen en el formato correcto
                endDate: formattedEndDate
            });
    
            setDialogTitle('Éxito');
            setDialogMessage('Solicitud de permiso enviada con éxito.');
            setSubmitted(true);
        } catch (error: unknown) {
            setDialogTitle('Error');
            let errorMessage = 'Error al enviar la solicitud.';
            if (axios.isAxiosError(error)) {
                errorMessage = error.response?.data?.message || errorMessage;
            }
            setDialogMessage(errorMessage);
        } finally {
            setDialogOpen(true);
            setConfirmationOpen(false);
        }
    };
    
    // // Consultar estado de la solicitud
    // const checkStatus = async () => {
    //     const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/licenses/status`); // Usando axios para verificar el estado
    //     const data = await response.data;
    //     setStatus(data.status); // Suponiendo que el API retorna el estado de la solicitud
    // };

    // useEffect(() => {
    //     if (submitted) {
    //         checkStatus();
    //     }
    // }, [submitted]);

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
                                    <MenuItem value="Medio Día">Medio Día</MenuItem>
                                    <MenuItem value="Día Completo">Día Completo</MenuItem>
                                    <MenuItem value="Varios Días">Varios Días</MenuItem>
                                </Select>
                            </FormControl>

                            {formData.timeRequested !== 'Varios Días' && (
                                <TextField
                                    label="Fecha de Inicio"
                                    type="date"
                                    name="startDate"
                                    value={formData.startDate}
                                    onChange={handleStartDateChange}
                                    fullWidth
                                    margin="normal"
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                />
                            )}

                            {formData.timeRequested === 'Varios Días' && (
                                <>
                                    <TextField
                                        label="Fecha de Inicio"
                                        type="date"
                                        name="startDate"
                                        value={formData.startDate}
                                        onChange={handleStartDateChange}
                                        fullWidth
                                        margin="normal"
                                        InputLabelProps={{
                                            shrink: true,
                                        }}
                                    />
                                    <TextField
                                        label="Fecha de Fin"
                                        type="date"
                                        name="endDate"
                                        value={formData.endDate}
                                        onChange={handleEndDateChange}
                                        fullWidth
                                        margin="normal"
                                        InputLabelProps={{
                                            shrink: true,
                                        }}
                                    />
                                </>
                            )}

                            <Button type="submit" variant="contained" color="primary">
                                Enviar Solicitud
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </Grid>

            {/* Diálogo para mostrar mensajes de estado */}
            <Dialog open={dialogOpen} onClose={handleDialogClose}>
                <DialogTitle>{dialogTitle}</DialogTitle>
                <DialogContent>
                    <Typography>{dialogMessage}</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDialogClose} color="primary">Cerrar</Button>
                </DialogActions>
            </Dialog>

            {/* Diálogo de confirmación */}
            <Dialog open={confirmationOpen} onClose={handleConfirmationClose}>
                <DialogTitle>Confirmación de Solicitud</DialogTitle>
                <DialogContent>
                    <Typography>{dialogMessage}</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleConfirmationClose} color="primary">Cancelar</Button>
                    <Button onClick={confirmSubmit} color="secondary">Confirmar</Button>
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
