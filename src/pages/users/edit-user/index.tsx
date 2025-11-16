import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, MenuItem, Grid,
    FormControl,
    InputLabel,
    Select
} from '@mui/material';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { TipoEmpleadoEnum } from 'src/utils/enums/typeEmployees';
import Department from 'src/interfaces/departments';
import axios from 'src/lib/axios';
import { useRouter } from 'next/router';

export interface UpdateUserDto {
    id: number;
    ci: string;
    username?: string;
    fullName: string;
    celular?: string;
    email?: string | null;
    fecha_ingreso: string;
    position?: string;
    tipoEmpleado?: TipoEmpleadoEnum;
    departmentId?: number | null;
    professionId?: number | null;
    academicUnitId?: number | null;
}

interface Props {
    open: boolean;
    onClose: () => void;
    onSave: (data: UpdateUserDto) => void;
    initialData: UpdateUserDto & {
        department?: { id: number; name: string };
        profession?: { id: number; name: string };
        academicUnit?: { id: number; name: string };
    };
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
    email: yup.string().email('Email inválido').notRequired().nullable(),
    celular: yup.string().matches(/^\d{7,15}$/, 'Número inválido').notRequired().nullable(),
    professionId: yup.number().nullable().notRequired(),
    academicUnitId: yup.number().nullable().notRequired(),
    position: yup.string().notRequired().nullable(),
    tipoEmpleado: yup.string().required('Tipo requerido'),
    departmentId: yup.number().nullable().notRequired(),
});

const EditUserForm: React.FC<Props> = ({ open, onClose, onSave, initialData }) => {

    const {
        control,
        handleSubmit,
        setValue,
        formState: { errors }
    } = useForm<UpdateUserDto>({
        defaultValues: {
            ...initialData,
            departmentId: initialData.department?.id || null,
            professionId: initialData.profession?.id || null,
            academicUnitId: initialData.academicUnit?.id || null,
        },
        resolver: yupResolver(schema)
    });

    const tipoEmpleado = useWatch({ control, name: "tipoEmpleado" });

    const [departments, setDepartments] = useState<Department[]>([]);
    const [profesiones, setProfesiones] = useState([]);
    const [academicUnits, setAcademicUnits] = useState([]);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const router = useRouter();

    React.useEffect(() => {
        const fetchExtraData = async () => {
            try {
                const [profRes, unitRes] = await Promise.all([
                    axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/professions`),
                    axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/academic-units`)
                ]);
                setProfesiones(profRes.data);
                setAcademicUnits(unitRes.data);
            } catch (error) {
                console.error('Error cargando profesiones o unidades académicas', error);
            }
        };
        fetchExtraData();
    }, []);

    React.useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const response = await axios.get<Department[]>(`${process.env.NEXT_PUBLIC_API_BASE_URL}/departments`);
                setDepartments(response.data);
            } catch (err) {
                console.error('Error al cargar departamentos:', err);
            }
        };
        fetchDepartments();
    }, []);

    // Limpia valores incompatibles según tipoEmpleado
    React.useEffect(() => {
        if (!tipoEmpleado) return;

        if (tipoEmpleado === TipoEmpleadoEnum.DOCENTE) {
            setValue("departmentId", null);
        }

        if (tipoEmpleado === TipoEmpleadoEnum.ADMINISTRATIVO) {
            setValue("academicUnitId", null);
        }
    }, [tipoEmpleado, setValue]);



    const handleFormSubmit = async (data: UpdateUserDto) => {
        try {
            setSubmitError(null);

            // Sanitización antes de enviar
            if (data.tipoEmpleado === TipoEmpleadoEnum.DOCENTE) {
                data.departmentId = null;
            } else if (data.tipoEmpleado === TipoEmpleadoEnum.ADMINISTRATIVO) {
                data.academicUnitId = null;
            }

            const response = await axios.put(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/users/${initialData.id}`,
                data
            );

            onSave(response.data);
            onClose();

            if (data.ci !== initialData.ci) {
                router.push(`/users/${data.ci}`);
            }

        } catch (error: any) {
            console.error('Error al actualizar usuario:', error);
            if (axios.isAxiosError(error) && error.response) {
                const mensaje = error.response.data?.message || 'Error desconocido en el servidor.';
                setSubmitError(`Error al actualizar: ${mensaje}`);
            } else {
                setSubmitError('Ocurrió un error al intentar actualizar el usuario.');
            }
        }
    };

    const convertToNull = (v: any) =>
        v === "" || v === undefined ? null : Number(v);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Editar Información del Usuario</DialogTitle>
            <DialogContent dividers>
                <Grid container spacing={2}>

                    {/* CI */}
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
                                    helperText={errors.ci?.message}
                                />
                            )}
                        />
                    </Grid>

                    {/* Usuario */}
                    <Grid item xs={6}>
                        <TextField
                            label="Usuario"
                            value={initialData.username || ''}
                            fullWidth
                            disabled
                        />
                    </Grid>

                    {/* Nombre */}
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
                                    helperText={errors.fullName?.message}
                                />
                            )}
                        />
                    </Grid>

                    {/* Celular */}
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

                    {/* Email */}
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

                    {/* Profesión */}
                    <Grid item xs={6}>
                        <Controller
                            name="professionId"
                            control={control}
                            render={({ field }) => (
                                <FormControl fullWidth>
                                    <InputLabel>Profesión</InputLabel>
                                    <Select
                                        {...field}
                                        label="Profesión"
                                        value={field.value ?? ""}
                                        onChange={(e) =>
                                            field.onChange(convertToNull(e.target.value))
                                        }
                                    >
                                        <MenuItem value="">Ninguno</MenuItem>
                                        {profesiones.map((prof: any) => (
                                            <MenuItem key={prof.id} value={prof.id}>
                                                {prof.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}
                        />
                    </Grid>

                    {/* Unidad Académica */}
                    <Grid item xs={6}>
                        <Controller
                            name="academicUnitId"
                            control={control}
                            render={({ field }) => (
                                <FormControl
                                    fullWidth
                                    disabled={tipoEmpleado !== TipoEmpleadoEnum.DOCENTE}
                                >
                                    <InputLabel>Unidad Académica</InputLabel>
                                    <Select
                                        {...field}
                                        label="Unidad Académica"
                                        value={field.value ?? ""}
                                        onChange={(e) =>
                                            field.onChange(convertToNull(e.target.value))
                                        }
                                    >
                                        <MenuItem value="">Ninguno</MenuItem>
                                        {academicUnits.map((unit: any) => (
                                            <MenuItem key={unit.id} value={unit.id}>
                                                {unit.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}
                        />
                    </Grid>

                    {/* Posición */}
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

                    {/* Fecha ingreso */}
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

                    {/* Tipo empleado */}
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

                    {/* Departamento */}
                    <Grid item xs={6}>
                        <Controller
                            name="departmentId"
                            control={control}
                            render={({ field }) => (
                                <FormControl
                                    fullWidth
                                    disabled={tipoEmpleado !== TipoEmpleadoEnum.ADMINISTRATIVO}
                                >
                                    <InputLabel>Departamento</InputLabel>
                                    <Select
                                        {...field}
                                        label="Departamento"
                                        value={field.value ?? ""}
                                        onChange={(e) =>
                                            field.onChange(convertToNull(e.target.value))
                                        }
                                    >
                                        <MenuItem value="">Ninguno</MenuItem>
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

                {submitError && (
                    <div style={{ color: 'red', marginTop: '1rem' }}>
                        {submitError}
                    </div>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} color="secondary">Cancelar</Button>
                <Button onClick={handleSubmit(handleFormSubmit)} variant="contained">Guardar</Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditUserForm;
