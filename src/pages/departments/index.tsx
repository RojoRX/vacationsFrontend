import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Container, Typography, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, TablePagination, TextField, IconButton,
    Button, Dialog, DialogActions, DialogContent, DialogContentText,
    DialogTitle,
    Box
} from '@mui/material';
import { Delete, Edit } from '@mui/icons-material';

// Tipado de los datos que devuelve la API para un departamento
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

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

    // Obtener departamentos al cargar el componente
    useEffect(() => {
        fetchDepartments();
    }, []);

    // Función para obtener todos los departamentos
    const fetchDepartments = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/departments`);
            setDepartments(response.data);
        } catch (error) {
            console.error('Error fetching departments:', error);
        }
    };

    // Función para eliminar un departamento
    const handleDelete = async (id: number) => {
        try {
            await axios.delete(`${API_BASE_URL}/departments/${id}`);
            fetchDepartments(); // Refrescar la lista después de eliminar
        } catch (error) {
            console.error('Error deleting department:', error);
        }
    };

    // Función para crear un departamento
    const createDepartment = async () => {
        if (newDepartment.name.trim() === '') {
            alert('El nombre del departamento no puede estar vacío.');
            return;
        }

        try {
            await axios.post(`${API_BASE_URL}/departments`, newDepartment);
            fetchDepartments();
            setNewDepartment({ name: '' }); // Limpiar formulario
        } catch (error) {
            console.error('Error creating department:', error);
        }
    };

    // Función para actualizar un departamento
    const updateDepartment = async (id: number) => {
        if (!selectedDepartment || selectedDepartment.name.trim() === '') {
            alert('El nombre del departamento no puede estar vacío.');
            return;
        }

        try {
            await axios.put(`${API_BASE_URL}/departments/${id}`, selectedDepartment);
            fetchDepartments();
            setSelectedDepartment(null); // Limpiar la selección después de actualizar
            setOpenDialog(false);
        } catch (error) {
            console.error('Error updating department:', error);
        }
    };

    // Control de paginación
    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Control de búsqueda
    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
    };

    // Función para abrir el diálogo de edición
    const handleEditClick = (department: DepartmentProps) => {
        setSelectedDepartment(department);
        setOpenDialog(true);
    };

    // Función para cerrar el diálogo de edición
    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedDepartment(null);
    };

    // Filtrado de departamentos para la búsqueda
    const filteredDepartments = departments.filter(department =>
        department.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Container>
            <Typography variant="h4" gutterBottom>
                Gestión de Departamentos
            </Typography>

            {/* Formulario para crear un nuevo departamento */}
            <Paper elevation={3} style={{ padding: '20px', marginBottom: '30px' }}>
                <Typography variant="h5" gutterBottom style={{ fontWeight: 'bold', textAlign: 'center' }}>
                    Crear Nuevo Departamento o Unidad
                </Typography>

                <Box component="form" noValidate autoComplete="off" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                    <TextField
                        label="Nombre del Departamento"
                        variant="outlined"
                        value={newDepartment.name}
                        onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                        fullWidth
                    />

                    <Button
                        variant="contained"
                        color="primary"
                        onClick={createDepartment}
                        style={{ marginTop: '15px', width: '50%' }}
                    >
                        Crear Departamento
                    </Button>
                </Box>
            </Paper>

            {/* Campo de búsqueda */}
            <TextField
                label="Buscar departamento"
                variant="outlined"
                value={searchTerm}
                onChange={handleSearch}
                fullWidth
                margin="normal"
            />

            <Paper elevation={3} style={{ padding: '20px', marginTop: '30px' }}>
                <Typography variant="h5" gutterBottom style={{ fontWeight: 'bold', textAlign: 'center' }}>
                    Departamentos Registrados
                </Typography>

                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell style={{ fontWeight: 'bold', textAlign: 'center' }}>ID</TableCell>
                                <TableCell style={{ fontWeight: 'bold', textAlign: 'center' }}>Nombre del Departamento</TableCell>
                                <TableCell style={{ fontWeight: 'bold', textAlign: 'center' }}>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredDepartments.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((department) => (
                                <TableRow key={department.id}>
                                    <TableCell style={{ textAlign: 'center' }}>{department.id}</TableCell>
                                    <TableCell style={{ textAlign: 'center' }}>{department.name}</TableCell>
                                    <TableCell style={{ textAlign: 'center' }}>
                                        <IconButton aria-label="edit" color="primary" onClick={() => handleEditClick(department)}>
                                            <Edit />
                                        </IconButton>
                                        <IconButton aria-label="delete" color="secondary" onClick={() => handleDelete(department.id)}>
                                            <Delete />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    <TablePagination
                        rowsPerPageOptions={[10, 25, 50]}
                        component="div"
                        count={filteredDepartments.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                </TableContainer>
            </Paper>


            {/* Diálogo de edición de departamentos */}
            <Dialog open={openDialog} onClose={handleCloseDialog}>
                <DialogTitle>Editar Departamento</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Modifica la información del departamento seleccionado.
                    </DialogContentText>
                    <TextField
                        margin="dense"
                        label="Nombre"
                        type="text"
                        fullWidth
                        value={selectedDepartment?.name || ''}
                        onChange={(e) => setSelectedDepartment({ ...selectedDepartment, name: e.target.value } as DepartmentProps)}
                        required
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} color="secondary">
                        Cancelar
                    </Button>
                    <Button onClick={() => updateDepartment(selectedDepartment?.id || 0)} color="primary">
                        Guardar Cambios
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default DepartmentManagement;
