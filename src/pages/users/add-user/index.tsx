import React, { useState, useEffect } from 'react';
import {
    Box, TextField, Button, Typography, Container, Alert, Paper,
    FormControl, InputLabel, Select, MenuItem, Grid,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Slide
} from '@mui/material';
import { CheckCircle, PersonAdd, PersonAdd as PersonAddIcon } from '@mui/icons-material';
import axios from 'src/lib/axios';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useRouter } from 'next/router';
import api from 'src/utils/axios';
import Department from 'src/interfaces/departments';
import { Profession, AcademicUnit } from 'src/interfaces/user.interface';
import { TransitionProps } from '@mui/material/transitions';
import { ErrorOutline } from '@mui/icons-material';
import { CreateCredentialsDialog } from 'src/pages/credentials/userCredentials';
// Transition para el diálogo
interface CreateUserForm {
    ci: string;
    fullName: string;
    fechaIngreso: string;
    email?: string;
    celular?: string;
    profession?: { id: number };
    position?: string;
    tipoEmpleado: string;
    role: string;
    department?: { id: number };
    academicUnit?: { id: number };
    username?: string;
    password?: string;
}
interface UserResponse extends Omit<CreateUserForm, 'password'> {
    id: number;
    createdAt: string;
    temporaryPassword?: string;
}
const schema = yup.object().shape({
    ci: yup.string()
        .required('CI es requerido')
        .matches(/^\d+$/, 'CI debe contener solo números')
        .min(6, 'CI debe tener al menos 6 dígitos')
        .max(10, 'CI debe tener un máximo de 10 dígitos'),
    fullName: yup.string().required('Nombre completo es requerido'),
    fechaIngreso: yup.string()
        .required('Fecha de ingreso es requerida')
        .matches(/^\d{4}-\d{2}-\d{2}$/, 'Formato debe ser YYYY-MM-DD'),
    email: yup.string().email('Email inválido').notRequired(),

    profession: yup.object().shape({
        id: yup.number().required('Profesión es requerida')
    }).required('Profesión es requerida'),

    celular: yup.string().matches(/^\d{7,15}$/, 'Número inválido').notRequired(),
    position: yup.string().notRequired(),
    tipoEmpleado: yup.string().required('Tipo requerido'),

});
const CreateUserForm: React.FC = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [professions, setProfessions] = useState<Profession[]>([]);
    const [academicUnits, setAcademicUnits] = useState<AcademicUnit[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string }>({
        success: false,
        message: ''
    });
    const [credentialsDialogOpen, setCredentialsDialogOpen] = useState(false);

    const [createdUser, setCreatedUser] = useState<UserResponse | null>(null);
    const { control, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<CreateUserForm>({
        resolver: yupResolver(schema),
        defaultValues: {
            tipoEmpleado: 'DOCENTE',
            fechaIngreso: new Date().toISOString().split('T')[0],
            profession: { id: undefined },
        },
    });
    const [unidadError, setUnidadError] = useState(false);
    const tipoEmpleado = watch("tipoEmpleado");
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [profRes, unitRes, deptRes] = await Promise.all([
                    axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/professions`),
                    axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/academic-units`),
                    axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/departments`),
                ]);
                setProfessions(profRes.data);
                setAcademicUnits(unitRes.data);
                setDepartments(deptRes.data);
            } catch (err) {
                console.error('Error cargando datos:', err);
            }
        };
        fetchInitialData();
    }, []);
    // Este se ejecuta cada vez que cambia tipoEmpleado
    useEffect(() => {
        if (tipoEmpleado === 'DOCENTE') {
            setValue('department.id', null as unknown as number);
        } else if (tipoEmpleado === 'ADMINISTRATIVO') {
            setValue('academicUnit.id', null as unknown as number);
        }
    }, [tipoEmpleado, setValue]);

    const [submitting, setSubmitting] = useState(false);
    const onSubmit = async (data: CreateUserForm) => {
        const academicId = data.academicUnit?.id;
        const departmentId = data.department?.id;

        // Validación adicional: debe haber al menos uno
        if (!academicId && !departmentId) {
            setUnidadError(true);
            return;
        } else {
            setUnidadError(false);
        }
        setSubmitting(true);
        try {
            const payload = {
                ci: data.ci,
                fullName: data.fullName,
                fecha_ingreso: data.fechaIngreso,
                email: data.email || null,
                celular: data.celular || null,
                professionId: data.profession?.id,
                academicUnitId: data.academicUnit?.id,
                departmentId: data.department?.id,
                position: data.position,
                tipoEmpleado: data.tipoEmpleado,
            };
            console.log(payload)
            const response = await api.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users`, payload);
            const createdUser = response.data;

            // Guardamos el usuario creado en el estado
            setCreatedUser(createdUser);
            setResult({
                success: true,
                message: 'El usuario ha sido registrado exitosamente.'
            });

            setDialogOpen(true);
            reset();

        } catch (err: any) {
            console.log(error)
            setResult({
                success: false,
                message: err.response?.data?.message || 'Ocurrió un error al registrar el usuario.'
            });
            setDialogOpen(true);
        } finally {
            setSubmitting(false);
        }
    };

    const handleRedirect = () => {
        if (createdUser) {
            router.push(`/users/${createdUser.ci}`);
        }
    };
    const handleCloseDialogsAndRedirect = () => {
        setDialogOpen(false);
        setCredentialsDialogOpen(false);
        handleRedirect(); // Navega al perfil del usuario
    };
    const Transition = React.forwardRef(function Transition(
        props: TransitionProps & { children: React.ReactElement<any, any> },
        ref: React.Ref<unknown>,
    ) {
        return <Slide direction="up" ref={ref} {...props} />;
    });

    const ResultDialog = ({
        open,
        success,
        message,
        onClose,
        onRedirect
    }: {
        open: boolean;
        success: boolean;
        message: string;
        onClose: () => void;
        onRedirect: () => void;
    }) => {
        return (
            <Dialog
                open={open}
                TransitionComponent={Transition}
                keepMounted
                onClose={onClose}
                aria-describedby="alert-dialog-slide-description"
                PaperProps={{
                    sx: {
                        minWidth: '400px',
                        textAlign: 'center',
                        p: 3
                    }
                }}
            >
                {success ? (
                    <>
                        <CheckCircle color="success" sx={{ fontSize: 80, mb: 2 }} />
                        <DialogTitle variant="h5" sx={{ fontWeight: 'bold' }}>
                            ¡Registro Exitoso!
                        </DialogTitle>
                    </>
                ) : (
                    <>
                        <ErrorOutline color="error" sx={{ fontSize: 80, mb: 2 }} />
                        {/* O si prefieres: <Error color="error" sx={{ fontSize: 80, mb: 2 }} /> */}
                        <DialogTitle variant="h5" sx={{ fontWeight: 'bold' }}>
                            Error en el Registro
                        </DialogTitle>
                    </>
                )}

                <DialogContent>
                    <DialogContentText id="alert-dialog-slide-description" sx={{ mb: 2 }}>
                        {message}
                    </DialogContentText>
                </DialogContent>

                <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 0 }}>
                    {success ? (
                        <>
                            <Button
                                variant="outlined"
                                color="primary"
                                onClick={() => {
                                    onClose(); // Oculta este diálogo
                                    setCredentialsDialogOpen(true); // Abre el diálogo de credenciales
                                }}
                                sx={{ borderRadius: 2, px: 3 }}
                            >
                                Crear Credenciales
                            </Button>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={onRedirect}
                                startIcon={<PersonAdd />}
                                sx={{ borderRadius: 2, px: 3 }}
                            >
                                Ver Usuario
                            </Button>
                        </>
                    ) : (
                        <Button
                            variant="outlined"
                            color="primary"
                            onClick={onClose}
                            sx={{ borderRadius: 2, px: 4, py: 1 }}
                        >
                            Entendido
                        </Button>
                    )}
                </DialogActions>

            </Dialog>
        );
    };

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Paper sx={{
                p: 4,
                borderRadius: 2,
                boxShadow: 3
            }}>
                <Typography variant="h4" gutterBottom sx={{
                    mb: 4,
                    display: 'flex',
                    alignItems: 'center',
                    color: 'primary.main'
                }}>
                    <PersonAddIcon sx={{ mr: 2, fontSize: '2rem' }} />
                    Registrar Personal
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}
                {success && (
                    <Alert severity="success" sx={{ mb: 3 }}>
                        Usuario creado exitosamente. Redirigiendo...
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                    <Grid container spacing={3}>
                        {/* Columna izquierda */}
                        <Grid item xs={12} md={6}>
                            <Box sx={{ mb: 3 }}>
                                <Controller
                                    name="ci"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="CI"
                                            fullWidth
                                            variant="outlined"
                                            size="small"
                                            error={!!errors.ci}
                                            helperText={errors.ci?.message}
                                            sx={{ mb: 2 }}
                                        />
                                    )}
                                />
                            </Box>

                            <Box sx={{ mb: 3 }}>
                                <Controller
                                    name="fullName"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Nombre Completo"
                                            fullWidth
                                            variant="outlined"
                                            size="small"
                                            error={!!errors.fullName}
                                            helperText={errors.fullName?.message}
                                            sx={{ mb: 2 }}
                                        />
                                    )}
                                />
                            </Box>

                            <Box sx={{ mb: 3 }}>
                                <Controller
                                    name="fechaIngreso"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            type="date"
                                            label="Fecha de Ingreso"
                                            fullWidth
                                            variant="outlined"
                                            size="small"
                                            InputLabelProps={{ shrink: true }}
                                            error={!!errors.fechaIngreso}
                                            helperText={errors.fechaIngreso?.message}
                                            sx={{ mb: 2 }}
                                        />
                                    )}
                                />
                            </Box>

                            <Box sx={{ mb: 3 }}>
                                <Controller
                                    name="email"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            type="email"
                                            label="Email"
                                            fullWidth
                                            variant="outlined"
                                            size="small"
                                            error={!!errors.email}
                                            helperText={errors.email?.message}
                                            sx={{ mb: 2 }}
                                        />
                                    )}
                                />
                            </Box>

                            <Box sx={{ mb: 3 }}>
                                <Controller
                                    name="celular"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Celular"
                                            fullWidth
                                            variant="outlined"
                                            size="small"
                                            error={!!errors.celular}
                                            helperText={errors.celular?.message}
                                            sx={{ mb: 2 }}
                                        />
                                    )}
                                />
                            </Box>
                        </Grid>

                        {/* Columna derecha */}
                        <Grid item xs={12} md={6}>
                            {/* Reset de campos no usados al cambiar tipoEmpleado */}
                            {/* Profesión */}
                            <Box sx={{ mb: 3 }}>
                                <Controller
                                    name="profession"
                                    control={control}
                                    rules={{ required: true }}
                                    render={({ field, fieldState }) => (
                                        <FormControl fullWidth size="small" error={!!fieldState.error}>
                                            <InputLabel>Profesión *</InputLabel>
                                            <Select
                                                {...field}
                                                label="Profesión *"
                                                variant="outlined"
                                                onChange={(e) => field.onChange({ id: e.target.value })}
                                                value={field.value?.id || ''}
                                                sx={{ mb: 2 }}
                                            >
                                                <MenuItem value="" disabled>
                                                    Seleccione una profesión
                                                </MenuItem>
                                                {professions.map((p) => (
                                                    <MenuItem key={p.id} value={p.id}>
                                                        {p.name}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                            {fieldState.error && (
                                                <Typography variant="caption" color="error">
                                                    {fieldState.error.message}
                                                </Typography>
                                            )}
                                        </FormControl>
                                    )}
                                />
                            </Box>

                            {/* Unidad Académica o Departamento */}
                            {/* Unidad Académica o Departamento + leyenda de validación */}
                            <Box sx={{ mb: 3 }}>
                                {tipoEmpleado === 'DOCENTE' && (
                                    <Controller
                                        name="academicUnit.id"
                                        control={control}
                                        render={({ field, fieldState }) => (
                                            <FormControl fullWidth size="small" error={!!fieldState.error}>
                                                <InputLabel>Unidad Académica (Docentes)</InputLabel>
                                                <Select
                                                    {...field}
                                                    label="Unidad Académica"
                                                    value={field.value ?? ''}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        field.onChange(value === '' ? undefined : Number(value));
                                                    }}
                                                    sx={{ mb: 2 }}
                                                >
                                                    <MenuItem value="" disabled>
                                                        Seleccione una unidad académica
                                                    </MenuItem>
                                                    {academicUnits.map((unit) => (
                                                        <MenuItem key={unit.id} value={unit.id}>
                                                            {unit.name}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                                {fieldState.error && (
                                                    <Typography variant="caption" color="error">
                                                        {fieldState.error.message}
                                                    </Typography>
                                                )}
                                            </FormControl>
                                        )}
                                    />
                                )}

                                {tipoEmpleado === 'ADMINISTRATIVO' && (
                                    <Controller
                                        name="department.id"
                                        control={control}
                                        render={({ field, fieldState }) => (
                                            <FormControl fullWidth size="small" error={!!fieldState.error}>
                                                <InputLabel>Departamento (Administrativos)</InputLabel>
                                                <Select
                                                    {...field}
                                                    label="Departamento"
                                                    value={field.value ?? ''}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        field.onChange(value === '' ? undefined : Number(value));
                                                    }}
                                                    sx={{ mb: 2 }}
                                                >
                                                    <MenuItem value="" disabled>
                                                        Seleccione un departamento
                                                    </MenuItem>
                                                    {departments.map((dept) => (
                                                        <MenuItem key={dept.id} value={dept.id}>
                                                            {dept.name}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                                {fieldState.error && (
                                                    <Typography variant="caption" color="error">
                                                        {fieldState.error.message}
                                                    </Typography>
                                                )}
                                            </FormControl>
                                        )}
                                    />
                                )}

                                {unidadError && (
                                    <Typography variant="body2" color="error" sx={{ mt: 1, ml:1 }}>
                                        Debe seleccionar una Unidad Académica o un Departamento.
                                    </Typography>
                                )}
                            </Box>

                            {/* Cargo */}
                            <Box sx={{ mb: 3 }}>
                                <Controller
                                    name="position"
                                    control={control}

                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Cargo"
                                            fullWidth
                                            variant="outlined"
                                            size="small"
                                        />
                                    )}
                                />
                            </Box>

                            {/* Tipo de Empleado */}
                            <Box sx={{ mb: 3 }}>
                                <Controller
                                    name="tipoEmpleado"
                                    control={control}
                                    render={({ field }) => (
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Tipo de Empleado</InputLabel>
                                            <Select
                                                {...field}
                                                label="Tipo de Empleado"
                                                variant="outlined"
                                                error={!!errors.tipoEmpleado}
                                                sx={{ mb: 2 }}
                                            >
                                                <MenuItem value="ADMINISTRATIVO">Administrativo</MenuItem>
                                                <MenuItem value="DOCENTE">Docente</MenuItem>
                                            </Select>
                                            {errors.tipoEmpleado && (
                                                <Typography variant="caption" color="error">
                                                    {errors.tipoEmpleado.message}
                                                </Typography>
                                            )}
                                        </FormControl>
                                    )}
                                />
                            </Box>
                        </Grid>

                    </Grid>

                    <Box mt={4} display="flex" justifyContent="flex-end">

                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            disabled={loading}
                            startIcon={<PersonAddIcon />}
                            sx={{
                                px: 4,
                                py: 1,
                                fontSize: '1rem',
                                textTransform: 'none',
                                borderRadius: 1
                            }}
                        >
                            {loading ? 'Creando...' : 'Registrar Personal'}
                        </Button>
                        {/* Diálogo de resultados */}
                        <ResultDialog
                            open={dialogOpen}
                            success={result.success}
                            message={result.message}
                            onClose={() => setDialogOpen(false)}
                            onRedirect={handleRedirect}
                        />

                        {createdUser && (
                            <CreateCredentialsDialog
                                open={credentialsDialogOpen}
                                onClose={handleCloseDialogsAndRedirect}
                                ci={createdUser.ci}
                            />
                        )}

                    </Box>
                </Box>
            </Paper>
        </Container>
    );
};
CreateUserForm.acl = {
    action: 'create',
    subject: 'create-user'
};

export default CreateUserForm;