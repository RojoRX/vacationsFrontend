import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, MenuItem, Grid,
    FormControl,
    InputLabel,
    Select
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { TipoEmpleadoEnum } from 'src/utils/enums/typeEmployees';
import Department from 'src/interfaces/departments';
import axios from 'axios';

export interface UpdateUserDto {
    id: number;
    ci: string;
    username?: string;
    fullName: string;
    celular?: string;
    email?: string;
    profesion?: string;
    fecha_ingreso: string;
    position?: string;
    tipoEmpleado?: TipoEmpleadoEnum;
    departmentId?: number;
}

interface Props {
    open: boolean;
    onClose: () => void;
    onSave: (data: UpdateUserDto) => void;
    initialData: UpdateUserDto & { department?: { id: number; name: string } };
}

const schema = yup.object().shape({
    ci: yup.string()
        .required('CI es requerido')
        .matches(/^\d+$/, 'CI debe contener solo números')
        .min(4, 'CI debe tener al menos 4 dígitos')
        .max(10, 'CI debe tener un máximo de 10 dígitos'),
    fullName: yup.string().required('Nombre completo es requerido'),
    fecha_ingreso: yup.string()
        .required('Fecha de ingreso es requerida')
        .matches(/^\d{4}-\d{2}-\d{2}$/, 'Formato debe ser YYYY-MM-DD'),
    username: yup.string()
        .nullable()
        .transform(value => value === '' ? null : value)
        .notRequired()
        .test(
            'is-valid-username',
            'El nombre de usuario debe ser válido y tener al menos 3 caracteres',
            (value) => {
                if (!value) return true;
                return value.length >= 3;
            }
        ),
    email: yup.string().email('Email inválido').notRequired().nullable(),
    celular: yup.string().matches(/^\d{7,15}$/, 'Número inválido').notRequired().nullable(),
    profesion: yup.string().min(2, 'Debe tener al menos 2 caracteres').notRequired(),
    position: yup.string().notRequired(),
    tipoEmpleado: yup.string().required('Tipo requerido'),
    departmentId: yup.number().nullable().notRequired(),
});

const EditUserForm: React.FC<Props> = ({ open, onClose, onSave, initialData }) => {
    const {
        control,
        handleSubmit,
        formState: { errors }
    } = useForm<UpdateUserDto>({
        defaultValues: {
            ...initialData,
            departmentId: initialData.department?.id// Inicializa con el departamento actual
        },// Esto asegura que los datos iniciales se pasen al formulario
        resolver: yupResolver(schema)
    });

    const [departments, setDepartments] = useState<Department[]>([]);
    const [deptLoading, setDeptLoading] = useState(true);

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

    const handleFormSubmit = async (data: UpdateUserDto) => {
        try {
            const response = await axios.put(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/${initialData.id}`, data);
            onSave(response.data);
            onClose();
        } catch (error) {
            console.error('Error al actualizar usuario:', error);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Editar Información del Usuario</DialogTitle>
            <DialogContent dividers>
                <Grid container spacing={2}>
                    <Grid item xs={6}>
                        <Controller
                            name="ci"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="CI"
                                    fullWidth
                                    error={!!errors.ci}
                                    helperText={errors.ci?.message} // Aquí mostramos el mensaje de error
                                />
                            )}
                        />
                    </Grid>

                    <Grid item xs={6}>
                        <Controller
                            name="username"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Usuario"
                                    fullWidth
                                    error={!!errors.username} // Mostramos si hay error
                                    helperText={errors.username?.message} // Mostramos el mensaje de error
                                />
                            )}
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <Controller
                            name="fullName"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Nombre completo"
                                    fullWidth
                                    error={!!errors.fullName}
                                    helperText={errors.fullName?.message} // Aquí mostramos el mensaje de error
                                />
                            )}
                        />
                    </Grid>

                    <Grid item xs={6}>
                        <Controller
                            name="celular"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Celular"
                                    fullWidth
                                    error={!!errors.celular}
                                    helperText={errors.celular?.message}
                                />
                            )}
                        />
                    </Grid>

                    <Grid item xs={6}>
                        <Controller
                            name="email"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Correo"
                                    fullWidth
                                    error={!!errors.email}
                                    helperText={errors.email?.message}
                                />
                            )}
                        />
                    </Grid>

                    <Grid item xs={6}>
                        <Controller
                            name="profesion"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Profesión"
                                    fullWidth
                                    error={!!errors.profesion}
                                    helperText={errors.profesion?.message}
                                />
                            )}
                        />
                    </Grid>

                    <Grid item xs={6}>
                        <Controller
                            name="position"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Posición"
                                    fullWidth
                                    error={!!errors.position}
                                    helperText={errors.position?.message}
                                />
                            )}
                        />
                    </Grid>

                    <Grid item xs={6}>
                        <Controller
                            name="fecha_ingreso"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    type="date"
                                    label="Fecha de ingreso"
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    error={!!errors.fecha_ingreso}
                                    helperText={errors.fecha_ingreso?.message}
                                />
                            )}
                        />
                    </Grid>

                    <Grid item xs={6}>
                        <Controller
                            name="tipoEmpleado"
                            control={control}
                            render={({ field }) => (
                                <TextField {...field} label="Tipo de empleado" select fullWidth>
                                    <MenuItem value={TipoEmpleadoEnum.ADMINISTRATIVO}>Administrativo</MenuItem>
                                    <MenuItem value={TipoEmpleadoEnum.DOCENTE}>Docente</MenuItem>
                                </TextField>
                            )}
                        />
                    </Grid>

                    <Grid item xs={6}>
                        <Controller
                            name="departmentId"
                            control={control}
                            render={({ field }) => (
                                <FormControl fullWidth>
                                    <InputLabel>Departamento</InputLabel>
                                    <Select
                                        {...field}
                                        label="Departamento"
                                        value={field.value || ''}
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
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} color="secondary">Cancelar</Button>
                <Button onClick={handleSubmit(handleFormSubmit)} variant="contained">Guardar</Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditUserForm;
