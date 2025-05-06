import React, { useState } from 'react';
import {
    Box,
    TextField,
    Button,
    Typography,
    Container,
    Alert,
    CircularProgress,
    Paper,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    InputAdornment,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import {
    PersonAdd as PersonAddIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useRouter } from 'next/router';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, Controller } from 'react-hook-form';
import api from 'src/utils/axios';
import Department from 'src/interfaces/departments';


interface CreateUserForm {
    ci: string;
    fullName: string;
    fecha_ingreso: string; // Añadir este campo
    email?: string;
    celular?: string;
    profesion?: string;
    position: string;
    tipoEmpleado: string;
    role: string;
    departmentId?: number;
    username?: string;
    password?: string;
}

interface UserResponse extends Omit<CreateUserForm, 'password'> {
    id: number;
    createdAt: string;
    temporaryPassword?: string;
}

// Validación con Yup
const schema = yup.object().shape({
    ci: yup.string()
        .required('CI es requerido')
        .matches(/^\d+$/, 'CI debe contener solo números')
        .min(4, 'CI debe tener al menos 4 dígitos')
        .max(10, 'CI debe tener un maximo de 10 digitos'),
    fullName: yup.string().required('Nombre completo es requerido'),
    fecha_ingreso: yup.string()
        .required('Fecha de ingreso es requerida')
        .matches(/^\d{4}-\d{2}-\d{2}$/, 'Formato debe ser YYYY-MM-DD'),
    // ... otros campos ...
    username: yup.string()
        .nullable() // Permite null
        .transform(value => value === '' ? null : value) // Convierte string vacío a null
        .notRequired() // No es obligatorio
        .test(
            'is-email-or-empty',
            'Username debe ser un email válido o estar vacío',
            (value) => !value || /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)
        ),
    password: yup.string()
        .nullable()
        .transform(value => value === '' ? null : value)
        .notRequired(),

    email: yup.string().email('Email inválido').notRequired(),
    celular: yup.string().matches(/^\d{7,15}$/, 'Número inválido').notRequired(),
    profesion: yup.string().min(2, 'Debe tener al menos 2 caracteres').notRequired(),
    position: yup.string().notRequired(),
    tipoEmpleado: yup.string().required('Tipo requerido'),
    role: yup.string().required('Rol requerido'),
    departmentId: yup.number().nullable().notRequired(),
});

const CreateUserForm: React.FC = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showTempPassword, setShowTempPassword] = useState(false);
    const [createdUser, setCreatedUser] = useState<UserResponse | null>(null);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [deptLoading, setDeptLoading] = useState(true);

    const { control, handleSubmit, formState: { errors }, reset } = useForm<CreateUserForm>({
        resolver: yupResolver(schema),
        defaultValues: {
            role: 'USER',
            tipoEmpleado: 'ADMINISTRATIVO',
            fecha_ingreso: new Date().toISOString().split('T')[0] // Fecha actual como valor por defecto
        }
    });

    // Cargar departamentos al montar el componente
    React.useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const response = await axios.get<Department[]>(`${process.env.NEXT_PUBLIC_API_BASE_URL}/departments`);
                setDepartments(response.data);
            } catch (err) {
                console.error('Error al cargar departamentos:', err);
            } finally {
                setDeptLoading(false);
            }
        };
        fetchDepartments();
    }, []);

    const onSubmit = async (data: CreateUserForm) => {
        setLoading(true);
        setError(null);
        try {
            // Preparar datos para el envío
            const payload = {
                ...data,
                username: data.username || undefined,
                password: data.password || undefined
            };

            console.log('Datos enviados al servidor:', payload); // <-- Añade esto

            const response = await api.post<UserResponse>(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/users`,
                payload,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            console.log('Respuesta del servidor:', response.data); // <-- Añade esto

            setCreatedUser(response.data);
            setSuccess(true);
            reset();
        } catch (err: any) {
            console.error('Error completo:', err); // <-- Muestra el error completo
            console.error('Respuesta de error:', err.response?.data); // <-- Detalles del error

            const errorMessage = err.response?.data?.message ||
                err.response?.data?.error ||
                'Error al crear el usuario';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleCloseSuccessDialog = () => {
        if (createdUser?.id) {
            setSuccess(false);
            setCreatedUser(null);
            router.push(`/users/${createdUser.ci}`);
        } else {
            console.error("No se encontró el ID del usuario creado");
        }
    };
    

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonAddIcon color="primary" />
                    Crear Nuevo Usuario
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                    <Grid container spacing={3}>
                        {/* Columna izquierda */}
                        <Grid item xs={12} md={6}>
                            <Controller
                                name="ci"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="CI"
                                        fullWidth
                                        margin="normal"
                                        error={!!errors.ci}
                                        helperText={errors.ci?.message}
                                        required
                                    />
                                )}
                            />
                            <Controller
                                name="profesion"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Profesión"
                                        fullWidth
                                        margin="normal"
                                        error={!!errors.profesion}
                                        helperText={errors.profesion?.message}
                                    />
                                )}
                            />


                            <Controller
                                name="fullName"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Nombre Completo"
                                        fullWidth
                                        margin="normal"
                                        error={!!errors.fullName}
                                        helperText={errors.fullName?.message}
                                        required
                                    />
                                )}
                            />
                            <Controller
                                name="fecha_ingreso"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Fecha de Ingreso"
                                        fullWidth
                                        margin="normal"
                                        type="date"
                                        InputLabelProps={{
                                            shrink: true,
                                        }}
                                        inputProps={{
                                            max: new Date().toISOString().split("T")[0], // <-- fecha máxima hoy
                                        }}
                                        error={!!errors.fecha_ingreso}
                                        helperText={errors.fecha_ingreso?.message}
                                        required
                                    />
                                )}
                            />

                            <Controller
                                name="email"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Email"
                                        type="email"
                                        fullWidth
                                        margin="normal"
                                        error={!!errors.email}
                                        helperText={errors.email?.message}
                                    />
                                )}
                            />
                        </Grid>

                        {/* Columna derecha */}
                        <Grid item xs={12} md={6}>
                            <Controller
                                name="position"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Cargo"
                                        fullWidth
                                        margin="normal"
                                        error={!!errors.position}
                                        helperText={errors.position?.message}
                                        required
                                    />
                                )}
                            />

                            <Controller
                                name="tipoEmpleado"
                                control={control}
                                render={({ field }) => (
                                    <FormControl fullWidth margin="normal" required>
                                        <InputLabel>Tipo de Empleado</InputLabel>
                                        <Select
                                            {...field}
                                            label="Tipo de Empleado"
                                            error={!!errors.tipoEmpleado}
                                        >
                                            <MenuItem value="ADMINISTRATIVO">Administrativo</MenuItem>
                                            <MenuItem value="DOCENTE">Docente</MenuItem>
                                            <MenuItem value="AUXILIAR">Auxiliar</MenuItem>
                                        </Select>
                                    </FormControl>
                                )}
                            />

                            <Controller
                                name="role"
                                control={control}
                                render={({ field }) => (
                                    <FormControl fullWidth margin="normal" required>
                                        <InputLabel>Rol</InputLabel>
                                        <Select
                                            {...field}
                                            label="Rol"
                                            error={!!errors.role}
                                        >
                                            <MenuItem value="USER">Usuario Normal</MenuItem>
                                            <MenuItem value="ADMIN">Administrador</MenuItem>
                                            <MenuItem value="MANAGER">Gestor</MenuItem>
                                        </Select>
                                    </FormControl>
                                )}
                            />

                            <Controller
                                name="departmentId"
                                control={control}
                                render={({ field }) => (
                                    <FormControl fullWidth margin="normal">
                                        <InputLabel>Departamento</InputLabel>
                                        <Select
                                            {...field}
                                            label="Departamento"
                                            disabled={deptLoading}
                                        >
                                            {departments.map((dept) => (
                                                <MenuItem key={dept.id} value={dept.id}>
                                                    {dept.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                )}
                            />
                            <Controller
                                name="celular"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Celular"
                                        fullWidth
                                        margin="normal"
                                        error={!!errors.celular}
                                        helperText={errors.celular?.message}
                                    />
                                )}
                            />
                        </Grid>

                        {/* Campos opcionales avanzados */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle1" gutterBottom>
                                Credenciales (opcional)
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <Controller
                                        name="username"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                value={field.value || ''} // Maneja null/undefined como string vacío
                                                label="Nombre de usuario"
                                                fullWidth
                                                margin="normal"
                                                helperText="Dejar en blanco para generar automáticamente"
                                                error={!!errors.username}
                                            />
                                        )}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Controller
                                        name="password"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                value={field.value || ''}
                                                label="Contraseña"
                                                type={showPassword ? 'text' : 'password'}
                                                fullWidth
                                                margin="normal"
                                                helperText="Dejar en blanco para generar automáticamente"
                                                error={!!errors.password}
                                                InputProps={{
                                                    endAdornment: (
                                                        <InputAdornment position="end">
                                                            <IconButton
                                                                onClick={() => setShowPassword(!showPassword)}
                                                                edge="end"
                                                            >
                                                                {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                                            </IconButton>
                                                        </InputAdornment>
                                                    ),
                                                }}
                                            />
                                        )}
                                    />
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 2 }}>
                        <Button
                            variant="outlined"
                            onClick={() => router.push('/users')}
                            startIcon={<CloseIcon />}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={20} /> : <PersonAddIcon />}
                        >
                            {loading ? 'Creando...' : 'Crear Usuario'}
                        </Button>
                    </Box>
                </Box>
            </Paper>

            {/* Diálogo de éxito */}
            <Dialog open={success} onClose={handleCloseSuccessDialog}>
                <DialogTitle>Usuario creado exitosamente</DialogTitle>
                <DialogContent>
                    {createdUser?.temporaryPassword && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            <Typography variant="subtitle2">Contraseña temporal generada</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                <Typography variant="body1" component="span" sx={{ mr: 1 }}>
                                    {showTempPassword ? createdUser.temporaryPassword : '••••••••••••'}
                                </Typography>
                                <IconButton
                                    size="small"
                                    onClick={() => setShowTempPassword(!showTempPassword)}
                                >
                                    {showTempPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                                </IconButton>
                            </Box>
                            <Typography variant="caption" color="error">
                                ¡Guarde esta contraseña! No se mostrará nuevamente.
                            </Typography>
                        </Alert>
                    )}
                    <Typography>Usuario {createdUser?.fullName} ha sido registrado correctamente.</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseSuccessDialog} color="primary">
                        Aceptar
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};
// Asignar las propiedades ACL
CreateUserForm.acl = {
    action: 'create',  // Mejor usar 'create' en lugar de 'read' para este formulario
    subject: 'create-user'    // Usar 'user' en lugar de 'createUserForm' para consistencia
};
export default CreateUserForm;