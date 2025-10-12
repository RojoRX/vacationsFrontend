import React, { useEffect, useState } from 'react';
import axios from 'src/lib/axios'
import { AxiosError } from 'axios';
import {
    Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField,
    Table, TableBody, TableCell, TableHead, TableRow, CircularProgress, Snackbar, Alert,
    AlertColor, TablePagination, Box
} from '@mui/material';

interface Profession {
    id: number;
    name: string;
}
interface ErrorResponse {
    message?: string;
    [key: string]: any;
}

const ProfessionManager: React.FC = () => {
    const [professions, setProfessions] = useState<Profession[]>([]);
    const [loading, setLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [currentProfession, setCurrentProfession] = useState<Profession | null>(null);
    const [name, setName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [professionToDelete, setProfessionToDelete] = useState<number | null>(null);

    const API_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/professions`;
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: AlertColor;
    }>({
        open: false,
        message: '',
        severity: 'info',
    });

    const fetchProfessions = async (nameSearch = '') => {
        try {
            setLoading(true);
            const url = nameSearch
                ? `${API_URL}/search?name=${encodeURIComponent(nameSearch)}`
                : API_URL;
            const response = await axios.get(url);
            setProfessions(response.data);
        } catch (error) {
            console.error(error);
            setSnackbar({ open: true, message: 'Error al cargar profesiones', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfessions();
    }, []);

    const handleDialogOpen = (profession: Profession | null = null) => {
        setCurrentProfession(profession);
        setName(profession?.name || '');
        setDialogOpen(true);
    };

    const handleDialogClose = () => {
        setCurrentProfession(null);
        setName('');
        setDialogOpen(false);
    };

    const handleSubmit = async () => {
        try {
            if (currentProfession) {
                await axios.put(`${API_URL}/${currentProfession.id}`, { name });
                setSnackbar({ open: true, message: 'Profesión actualizada con éxito', severity: 'success' });
            } else {
                await axios.post(API_URL, { name });
                setSnackbar({ open: true, message: 'Profesión creada con éxito', severity: 'success' });
            }
            fetchProfessions(searchTerm);
            handleDialogClose();
        } catch (error) {
            const err = error as AxiosError;
            const message = (err.response?.data as ErrorResponse)?.message || 'Error al guardar profesión';
            setSnackbar({ open: true, message, severity: 'error' });
        }
    };


    const handleDelete = async (id: number) => {
        setProfessionToDelete(id);
        setDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!professionToDelete) return;
        try {
            await axios.delete(`${API_URL}/${professionToDelete}`);
            setSnackbar({ open: true, message: 'Profesión eliminada con éxito', severity: 'success' });
            fetchProfessions(searchTerm);
        } catch (error) {
            const err = error as AxiosError;
            const message = (err.response?.data as ErrorResponse)?.message || 'Error al eliminar profesión';
            setSnackbar({ open: true, message, severity: 'error' });
        } finally {
            setDeleteConfirmOpen(false);
            setProfessionToDelete(null);
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        fetchProfessions(value);
    };

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const paginatedProfessions = professions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return (
        <Box p={2}>
            <h2>Gestión de Profesiones</h2>

            <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
                <TextField
                    label="Buscar profesión"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    variant="outlined"
                    size="small"
                />
                <Button variant="contained" onClick={() => handleDialogOpen()}>
                    Agregar Profesión
                </Button>
            </Box>

            {loading ? (
                <CircularProgress />
            ) : (
                <>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Nombre</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedProfessions.map((profession) => (
                                <TableRow key={profession.id}>
                                    <TableCell>{profession.id}</TableCell>
                                    <TableCell>{profession.name}</TableCell>
                                    <TableCell>
                                        <Button onClick={() => handleDialogOpen(profession)}>Editar</Button>
                                        <Button color="error" onClick={() => handleDelete(profession.id)}>Eliminar</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <TablePagination
                        component="div"
                        count={professions.length}
                        page={page}
                        onPageChange={handleChangePage}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        rowsPerPageOptions={[5, 10, 25]}
                    />
                </>
            )}

            {/* Diálogo de creación/edición */}
            <Dialog open={dialogOpen} onClose={handleDialogClose}>
                <DialogTitle>{currentProfession ? 'Editar Profesión' : 'Nueva Profesión'}</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Nombre"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        fullWidth
                        autoFocus
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDialogClose}>Cancelar</Button>
                    <Button onClick={handleSubmit} variant="contained" color="primary">
                        {currentProfession ? 'Actualizar' : 'Crear'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar de mensajes */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default ProfessionManager;
