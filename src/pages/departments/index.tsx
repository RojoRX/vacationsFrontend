import React, { useState, useEffect } from 'react';
import axios from 'src/lib/axios';
import {
    Container, Typography, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, TablePagination, TextField, IconButton,
    Button, Dialog, DialogActions, DialogContent, DialogContentText,
    DialogTitle, Box, Grid, Avatar, Tooltip, Alert, Snackbar
} from '@mui/material';
import { Delete, Edit, Add, Search, Business } from '@mui/icons-material';

interface DepartmentProps {
    id: number;
    name: string;
}

const DepartmentManagement: React.FC = () => {
    const [departments, setDepartments] = useState<DepartmentProps[]>([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedDepartment, setSelectedDepartment] = useState<DepartmentProps | null>(null);
    const [newDepartment, setNewDepartment] = useState({ name: '' });
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success' as 'success' | 'error' | 'info' | 'warning'
    });

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/departments`);
            const ordered = response.data.sort((a: DepartmentProps, b: DepartmentProps) => b.id - a.id);
            setDepartments(ordered);
        } catch (error: any) {
            showSnackbar(error?.response?.data?.message || 'Error al cargar departamentos', 'error');
        }
    };

    const validateName = (name: string) => {
        const trimmed = name.trim();
        if (!trimmed) return 'El nombre no puede estar vacío.';
        if (trimmed.length < 3) return 'El nombre debe tener al menos 3 caracteres.';
        return null;
    };

    const createDepartment = async () => {
        const validation = validateName(newDepartment.name);
        if (validation) {
            showSnackbar(validation, 'warning');
            return;
        }

        try {
            await axios.post(`${API_BASE_URL}/departments`, newDepartment);
            showSnackbar('Departamento creado correctamente', 'success');
            fetchDepartments();
            setNewDepartment({ name: '' });
        } catch (error: any) {
            const message = error?.response?.data?.message || 'Error al crear departamento';
            showSnackbar(message, 'error');
        }
    };

    const updateDepartment = async (id: number) => {
        const name = selectedDepartment?.name || '';
        const validation = validateName(name);
        if (validation) {
            showSnackbar(validation, 'warning');
            return;
        }

        try {
            await axios.put(`${API_BASE_URL}/departments/${id}`, { name });
            showSnackbar('Departamento actualizado correctamente', 'success');
            fetchDepartments();
            setSelectedDepartment(null);
            setOpenDialog(false);
        } catch (error: any) {
            const message = error?.response?.data?.message || 'Error al actualizar departamento';
            showSnackbar(message, 'error');
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await axios.delete(`${API_BASE_URL}/departments/${id}`);
            showSnackbar('Departamento eliminado correctamente', 'success');
            fetchDepartments();
        } catch (error: any) {
            const message = error?.response?.data?.message || 'Error al eliminar departamento';
            showSnackbar(message, 'error');
        }
    };


    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
    };

    const handleEditClick = (department: DepartmentProps) => {
        setSelectedDepartment(department);
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedDepartment(null);
    };

    const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
        setSnackbar({
            open: true,
            message,
            severity
        });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const filteredDepartments = departments
        .filter(department =>
            department.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* Encabezado */}
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                mb: 4,
                backgroundColor: 'primary.main',
                color: 'primary.contrastText',
                p: 3,
                borderRadius: 1,
                boxShadow: 3
            }}>
                <Avatar sx={{ mr: 2, backgroundColor: 'secondary.main' }}>
                    <Business />
                </Avatar>
                <Typography variant="h4" component="h1" sx={{
                color: 'white',

            }}>
                    Gestión de Departamentos
                </Typography>
            </Box>

            {/* Formulario de creación */}
            <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom sx={{
                    fontWeight: 'bold',
                    mb: 3,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                }}>
                    <Add color="primary" /> Nuevo Departamento
                </Typography>

                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={9}>
                        <TextField
                            label="Nombre del Departamento"
                            variant="outlined"
                            value={newDepartment.name}
                            onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                            fullWidth
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={createDepartment}
                            fullWidth
                            size="large"
                            startIcon={<Add />}
                        >
                            Crear
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {/* Búsqueda y tabla */}
            <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 3
                }}>
                    <Typography variant="h6" sx={{
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                    }}>
                        <Business color="primary" /> Departamentos Registrados
                    </Typography>

                    <TextField
                        label="Buscar departamento"
                        variant="outlined"
                        value={searchTerm}
                        onChange={handleSearch}
                        size="small"
                        InputProps={{
                            startAdornment: <Search color="action" sx={{ mr: 1 }} />
                        }}
                        sx={{ width: 300 }}
                    />
                </Box>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold', width: '10%' }}>ID</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', width: '70%' }}>Nombre</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', width: '20%', textAlign: 'center' }}>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredDepartments.length > 0 ? (
                                filteredDepartments
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map((department) => (
                                        <TableRow key={department.id} hover>
                                            <TableCell>{department.id}</TableCell>
                                            <TableCell>{department.name}</TableCell>
                                            <TableCell sx={{ textAlign: 'center' }}>
                                                <Tooltip title="Editar">
                                                    <IconButton
                                                        color="primary"
                                                        onClick={() => handleEditClick(department)}
                                                        sx={{ mr: 1 }}
                                                    >
                                                        <Edit />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Eliminar">
                                                    <IconButton
                                                        color="error"
                                                        onClick={() => {
                                                            if (window.confirm('¿Estás seguro de eliminar este departamento?')) {
                                                                handleDelete(department.id);
                                                            }
                                                        }}
                                                    >
                                                        <Delete />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} sx={{ textAlign: 'center', py: 4 }}>
                                        {searchTerm ?
                                            'No se encontraron departamentos con ese nombre' :
                                            'No hay departamentos registrados'}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <TablePagination
                    rowsPerPageOptions={[10, 25, 50]}
                    component="div"
                    count={filteredDepartments.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage="Filas por página:"
                    sx={{ mt: 2 }}
                />
            </Paper>

            {/* Diálogo de edición */}
            <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
                <DialogTitle sx={{
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                }}>
                    <Edit sx={{ fontSize: 24 }} /> Editar Departamento
                </DialogTitle>
                <DialogContent sx={{ py: 3 }}>
                    <TextField
                        margin="dense"
                        label="Nombre del departamento"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={selectedDepartment?.name || ''}
                        onChange={(e) => setSelectedDepartment({
                            ...selectedDepartment,
                            name: e.target.value
                        } as DepartmentProps)}
                        required
                        sx={{ mb: 2 }}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button
                        onClick={handleCloseDialog}
                        color="inherit"
                        variant="outlined"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={() => updateDepartment(selectedDepartment?.id || 0)}
                        color="primary"
                        variant="contained"
                        startIcon={<Edit />}
                    >
                        Guardar Cambios
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Notificaciones */}
            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                    variant="filled"
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

// Configuración ACL para el componente
(DepartmentManagement as any).acl = {
    action: 'manage',
    subject: 'departments'
};
export default DepartmentManagement;