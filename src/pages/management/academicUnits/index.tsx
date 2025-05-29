import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
    IconButton,
    Tooltip,
    CircularProgress,
    Snackbar,
    Alert,
    Pagination
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Check as CheckIcon,
    Close as CloseIcon,
    School as SchoolIcon
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { AxiosError } from 'axios';
import axios from 'src/lib/axios'
import api from 'src/utils/axios';
import { API_BASE_URL } from 'src/lib/api';

const schema = yup.object().shape({
    name: yup.string()
        .required('El nombre es requerido')
        .min(3, 'El nombre debe tener al menos 3 caracteres')
        .max(100, 'El nombre no puede exceder los 100 caracteres')
});

interface AcademicUnit {
    id: number;
    name: string;
}

const AcademicUnitManager: React.FC = () => {
    const [units, setUnits] = useState<AcademicUnit[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [currentUnit, setCurrentUnit] = useState<AcademicUnit | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [unitToDelete, setUnitToDelete] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const { control, handleSubmit, reset, formState: { errors } } = useForm<{ name: string }>({
        resolver: yupResolver(schema),
        defaultValues: { name: '' }
    });

    const fetchUnits = async (search = '') => {
        try {
            setLoading(true); // <- Asegurate de inicializar esto
            let response;

            if (search.trim() !== '') {
                response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/academic-units/search`, {
                    params: { name: search }
                });
            } else {
                response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/academic-units`);
            }

            setUnits(response.data); // ← Verifica si `data` es un array directamente o necesitas .items
        } catch (error) {
            console.error('Error al cargar unidades académicas:', error);
            setSnackbar({
                open: true,
                message: 'Error al cargar unidades académicas',
                severity: 'error'
            });
        } finally {
            setLoading(false); // <- Finaliza loading
        }
    };





    useEffect(() => {
        fetchUnits(searchTerm);
    }, [page]);

    const handleDialogOpen = (unit: AcademicUnit | null = null) => {
        setCurrentUnit(unit);
        reset({ name: unit?.name || '' });
        setDialogOpen(true);
    };

    const handleDialogClose = () => {
        setDialogOpen(false);
        setCurrentUnit(null);
    };

    const onSubmit = async (data: { name: string }) => {
        setIsSubmitting(true);
        try {
            if (currentUnit) {
                await axios.put(`${API_BASE_URL}/academic-units/${currentUnit.id}`, data);
                setSnackbar({ open: true, message: 'Unidad académica actualizada con éxito', severity: 'success' });
            } else {
                await axios.post(`${API_BASE_URL}/academic-units`, data);
                setSnackbar({ open: true, message: 'Unidad académica creada con éxito', severity: 'success' });
            }
            fetchUnits(searchTerm);
            handleDialogClose();
        } catch (error) {
            let message = 'Error al guardar unidad académica';
            if (error instanceof AxiosError && error.response?.data?.message) {
                message = error.response.data.message;
            }
            setSnackbar({ open: true, message, severity: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        setUnitToDelete(id);
        setDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        try {
            await axios.delete(`${API_BASE_URL}/academic-units/${unitToDelete}`);
            setSnackbar({ open: true, message: 'Unidad académica eliminada con éxito', severity: 'success' });
            fetchUnits(searchTerm);
        } catch (error) {
            let message = 'Error al eliminar unidad académica';
            if (error instanceof AxiosError && error.response?.data?.message) {
                message = error.response.data.message;
            }
            setSnackbar({ open: true, message, severity: 'error' });
        } finally {
            setDeleteConfirmOpen(false);
            setUnitToDelete(null);
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const handleSearchSubmit = () => {
        setPage(1);
        fetchUnits(searchTerm);
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Paper sx={{ p: 4, borderRadius: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                    <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center' }}>
                        <SchoolIcon sx={{ mr: 2, fontSize: '2rem' }} />
                        Gestión de Unidades Académicas
                    </Typography>
                    <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => handleDialogOpen()} sx={{ borderRadius: 2 }}>
                        Nueva Unidad
                    </Button>
                </Box>

                <Box display="flex" alignItems="center" mb={2} gap={2}>
                    <TextField
                        label="Buscar por nombre"
                        variant="outlined"
                        size="small"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}
                    />
                    <Button variant="outlined" onClick={handleSearchSubmit}>Buscar</Button>
                </Box>

                {loading ? (
                    <Box display="flex" justifyContent="center" py={4}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        <TableContainer component={Paper} elevation={3}>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: 'primary.main' }}>
                                        <TableCell sx={{ color: 'primary.contrastText' }}>ID</TableCell>
                                        <TableCell sx={{ color: 'primary.contrastText' }}>Nombre</TableCell>
                                        <TableCell sx={{ color: 'primary.contrastText', width: '150px' }}>Acciones</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {units.map((unit) => (
                                        <TableRow key={unit.id} hover>
                                            <TableCell>{unit.id}</TableCell>
                                            <TableCell>{unit.name}</TableCell>
                                            <TableCell>
                                                <Tooltip title="Editar">
                                                    <IconButton color="primary" onClick={() => handleDialogOpen(unit)} sx={{ mr: 1 }}>
                                                        <EditIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Eliminar">
                                                    <IconButton color="error" onClick={() => handleDelete(unit.id)}>
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {units.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                                                <Typography variant="body1" color="textSecondary">
                                                    No se encontraron unidades académicas
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <Box display="flex" justifyContent="center" mt={2}>
                            <Pagination
                                count={totalPages}
                                page={page}
                                onChange={(e, value) => setPage(value)}
                                color="primary"
                                shape="rounded"
                            />
                        </Box>
                    </>
                )}

                {/* Diálogo para crear/editar */}
                <Dialog
                    open={dialogOpen}
                    onClose={handleDialogClose}
                    maxWidth="sm"
                    fullWidth
                    PaperProps={{ sx: { borderRadius: 2 } }}
                >
                    <DialogTitle sx={{ backgroundColor: 'primary.main', color: 'white' }}>
                        <Box display="flex" alignItems="center">
                            <SchoolIcon sx={{ mr: 1 }} />
                            {currentUnit ? 'Editar Unidad Académica' : 'Nueva Unidad Académica'}
                        </Box>
                    </DialogTitle>
                    <DialogContent sx={{ pt: 3 }}>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Controller
                                        name="name"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                label="Nombre de la unidad académica"
                                                variant="outlined"
                                                fullWidth
                                                error={!!errors.name}
                                                helperText={errors.name?.message}
                                                size="small"
                                            />
                                        )}
                                    />
                                </Grid>
                            </Grid>
                            <DialogActions sx={{ mt: 2, justifyContent: 'flex-end' }}>
                                <Button
                                    onClick={handleDialogClose}
                                    variant="outlined"
                                    color="inherit"
                                    startIcon={<CloseIcon />}
                                    sx={{ mr: 1 }}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    startIcon={isSubmitting ? <CircularProgress size={20} /> : <CheckIcon />}
                                    disabled={isSubmitting}
                                >
                                    {currentUnit ? 'Actualizar' : 'Crear'}
                                </Button>
                            </DialogActions>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Diálogo de confirmación para eliminar */}
                <Dialog
                    open={deleteConfirmOpen}
                    onClose={() => setDeleteConfirmOpen(false)}
                    maxWidth="xs"
                    PaperProps={{ sx: { borderRadius: 2 } }}
                >
                    <DialogTitle>Confirmar Eliminación</DialogTitle>
                    <DialogContent>
                        <Typography>
                            ¿Estás seguro que deseas eliminar esta unidad académica? Esta acción no se puede deshacer.
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button
                            onClick={() => setDeleteConfirmOpen(false)}
                            variant="outlined"
                            color="inherit"
                            startIcon={<CloseIcon />}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={confirmDelete}
                            variant="contained"
                            color="error"
                            startIcon={<DeleteIcon />}
                        >
                            Eliminar
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Snackbar para notificaciones */}
                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={6000}
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                    <Alert
                        onClose={() => setSnackbar({ ...snackbar, open: false })}
                        severity={snackbar.severity}
                        sx={{ width: '100%' }}
                    >
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Paper>
        </Container>
    );
};
AcademicUnitManager.acl = {
    action: 'manage',
    subject: 'AcademicUnitManager'
};

export default AcademicUnitManager;