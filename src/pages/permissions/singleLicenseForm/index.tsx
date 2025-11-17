import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Grid,
    IconButton,
    Typography,
    useTheme,
    Alert,
    Snackbar,
    MenuItem,
    CircularProgress,
    List,
    ListItem,
    ListItemText,
    Divider
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Close as CloseIcon,
    Event as EventIcon,
    Search as SearchIcon
} from '@mui/icons-material';
import axios from 'src/lib/axios';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import esLocale from 'date-fns/locale/es';
import getBusinessDays from 'src/utils/businessDays';
import { useDebounce } from 'src/hooks/useDebounce';

interface LicenseFormData {
    timeRequested: string;
    startDate: Date | null;
    endDate: Date | null;
}

interface User {
    id: number;
    fullName: string;
    email?: string;
    ci?: string;
}

const SingleLicenseForm: React.FC = () => {
    const theme = useTheme();
    const [open, setOpen] = useState(false);

    // --- búsqueda de usuario ---
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 500);
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [searching, setSearching] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    // --- formulario de licencias ---
    const [licenses, setLicenses] = useState<LicenseFormData[]>([
        { timeRequested: 'Día Completo', startDate: null, endDate: null }
    ]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Record<number, string>>({});

    // Buscar usuarios
    useEffect(() => {
        if (!debouncedSearch) {
            setSearchResults([]);
            
return;
        }
        const fetchUsers = async () => {
            try {
                setSearching(true);
                const res = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/search?term=${debouncedSearch}`);
                setSearchResults(res.data || []);
            } catch (err) {
                console.error('Error buscando usuarios:', err);
            } finally {
                setSearching(false);
            }
        };
        fetchUsers();
    }, [debouncedSearch]);

    const handleAddLicense = () => {
        setLicenses([...licenses, { timeRequested: 'Día Completo', startDate: null, endDate: null }]);
    };

    const handleRemoveLicense = (index: number) => {
        const newLicenses = [...licenses];
        newLicenses.splice(index, 1);
        setLicenses(newLicenses);
        const newErrors = { ...validationErrors };
        delete newErrors[index];
        setValidationErrors(newErrors);
    };

    const handleLicenseChange = (index: number, field: keyof LicenseFormData, value: any) => {
        const newLicenses = [...licenses];
        newLicenses[index][field] = value;
        if (
            (field === 'timeRequested' || field === 'startDate') &&
            (newLicenses[index].timeRequested === 'Día Completo' || newLicenses[index].timeRequested === 'Medio Día')
        ) {
            newLicenses[index].endDate = field === 'startDate' ? value : newLicenses[index].startDate;
        }
        setLicenses(newLicenses);
        if (validationErrors[index]) {
            const newErrors = { ...validationErrors };
            delete newErrors[index];
            setValidationErrors(newErrors);
        }
    };

    const validateLicenses = (): boolean => {
        const errors: Record<number, string> = {};
        let isValid = true;
        licenses.forEach((license, index) => {
            if (!license.startDate) {
                errors[index] = 'Fecha de inicio requerida';
                isValid = false;
            } else if (license.timeRequested === 'Varios Días' && !license.endDate) {
                errors[index] = 'Fecha de fin requerida';
                isValid = false;
            } else if (license.timeRequested === 'Varios Días' && license.startDate && license.endDate && license.startDate > license.endDate) {
                errors[index] = 'La fecha de fin no puede ser anterior a la de inicio';
                isValid = false;
            }
        });
        setValidationErrors(errors);
        
return isValid;
    };

    const handleSubmit = async () => {
        if (!selectedUser) {
            setError('Debe seleccionar un usuario antes de registrar licencias.');
            
return;
        }
        if (!validateLicenses()) return;

        try {
            setLoading(true);
            setError(null);

            const licensesData = licenses.map(l => ({
                licenseType: 'VACACION',
                timeRequested: l.timeRequested,
                startDate: l.startDate?.toISOString().split('T')[0],
                endDate: l.endDate?.toISOString().split('T')[0]
            }));

            await axios.post(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/licenses/user/${selectedUser.id}/multiple`,
                licensesData
            );

            setSuccess(true);
            setOpen(false);
            setSelectedUser(null);
            setSearchTerm('');
            setLicenses([{ timeRequested: 'Día Completo', startDate: null, endDate: null }]);
        } catch (err: any) {
            console.error('Error al registrar licencias:', err);
            setError(err.response?.data?.message || 'Error al registrar las licencias');
        } finally {
            setLoading(false);
        }
    };

    const handleCloseSnackbar = () => {
        setSuccess(false);
        setError(null);
    };

    return (
        <>
            <Button variant="contained" startIcon={<EventIcon />} onClick={() => setOpen(true)}>
                Registrar Licencias
            </Button>

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <EventIcon sx={{ mr: 1 }} />
                        <Typography variant="h6">Registrar licencias de vacaciones</Typography>
                    </Box>
                    <IconButton onClick={() => setOpen(false)}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent dividers>
                    {/* Búsqueda de usuario */}
                    <TextField
                        fullWidth
                        variant="outlined"
                        label="Buscar usuario (nombre o CI)"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setSelectedUser(null);
                        }}
                        InputProps={{
                            endAdornment: searching ? <CircularProgress size={20} /> : <SearchIcon />
                        }}
                        sx={{ mb: 2 }}
                    />

                    {/* Resultados de búsqueda */}
                    {debouncedSearch && !searching && searchResults.length === 0 && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            No se encontraron usuarios con ese criterio de búsqueda.
                        </Alert>
                    )}

                    {searchResults.length > 0 && !selectedUser && (
                        <List sx={{ mb: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
                            {searchResults.map((user) => (
                                <React.Fragment key={user.id}>
                                    <ListItem button onClick={() => setSelectedUser(user)}>
                                        <ListItemText
                                            primary={`${user.fullName} ${user.ci ? `(CI: ${user.ci})` : ''}`}
                                            secondary={user.email || 'Sin email registrado'}
                                        />
                                    </ListItem>
                                    <Divider />
                                </React.Fragment>
                            ))}
                        </List>
                    )}

                    {/* Usuario seleccionado */}
                    {selectedUser && (
                        <Alert severity="info" sx={{ mb: 3 }}>
                            Usuario seleccionado:
                            <strong> {selectedUser.fullName}</strong>
                            {selectedUser.ci ? ` (CI: ${selectedUser.ci})` : ''}
                            {selectedUser.email ? ` | Email: ${selectedUser.email}` : ' | sin email'}
                        </Alert>
                    )}


                    {/* Formulario solo si hay usuario */}
                    {selectedUser && (
                        <>
                            <Typography variant="body1" sx={{ mb: 3 }}>
                                Complete las fechas para cada licencia:
                            </Typography>

                            {licenses.map((license, index) => (
                                <Box
                                    key={index}
                                    sx={{
                                        mb: 3,
                                        p: 2,
                                        border: `1px solid ${theme.palette.divider}`,
                                        borderRadius: 1,
                                        position: 'relative'
                                    }}
                                >
                                    {licenses.length > 1 && (
                                        <IconButton
                                            sx={{ position: 'absolute', top: 8, right: 8 }}
                                            onClick={() => handleRemoveLicense(index)}
                                            color="error"
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    )}

                                    <Typography variant="subtitle1" sx={{ mb: 1 }}>
                                        Licencia #{index + 1}
                                    </Typography>

                                    {validationErrors[index] && (
                                        <Alert severity="error" sx={{ mb: 1 }}>
                                            {validationErrors[index]}
                                        </Alert>
                                    )}

                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                select
                                                fullWidth
                                                label="Tiempo solicitado"
                                                value={license.timeRequested}
                                                onChange={(e) => handleLicenseChange(index, 'timeRequested', e.target.value)}
                                            >
                                                <MenuItem value="Día Completo">Día completo</MenuItem>
                                                <MenuItem value="Medio Día">Medio día</MenuItem>
                                                <MenuItem value="Varios Días">Varios días</MenuItem>
                                            </TextField>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={esLocale}>
                                                <DatePicker
                                                    label="Fecha de inicio"
                                                    value={license.startDate}
                                                    onChange={(date) => handleLicenseChange(index, 'startDate', date)}
                                                    slotProps={{
                                                        textField: { fullWidth: true, error: !!validationErrors[index] }
                                                    }}
                                                />
                                            </LocalizationProvider>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={esLocale}>
                                                <DatePicker
                                                    label="Fecha de fin"
                                                    value={license.endDate}
                                                    onChange={(date) => {
                                                        if (license.timeRequested === 'Varios Días') {
                                                            handleLicenseChange(index, 'endDate', date);
                                                        }
                                                    }}
                                                    slotProps={{
                                                        textField: {
                                                            fullWidth: true,
                                                            disabled: license.timeRequested !== 'Varios Días',
                                                            error: !!validationErrors[index]
                                                        }
                                                    }}
                                                    minDate={license.startDate || undefined}
                                                    disabled={license.timeRequested !== 'Varios Días'}
                                                />
                                                {license.startDate && license.endDate && (
                                                    <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                                                        Días hábiles: {getBusinessDays(license.startDate, license.endDate)}
                                                    </Typography>
                                                )}
                                            </LocalizationProvider>
                                        </Grid>
                                    </Grid>
                                </Box>
                            ))}

                            <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddLicense} sx={{ mt: 1 }}>
                                Agregar otra licencia
                            </Button>
                        </>
                    )}
                </DialogContent>

                <DialogActions>
                    <Button onClick={() => setOpen(false)} color="secondary" disabled={loading}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} variant="contained" disabled={loading || !selectedUser}>
                        {loading ? 'Registrando...' : 'Registrar Licencias'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={success} autoHideDuration={6000} onClose={handleCloseSnackbar}>
                <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
                    Licencias registradas exitosamente!
                </Alert>
            </Snackbar>

            <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseSnackbar}>
                <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
                    {error}
                </Alert>
            </Snackbar>
        </>
    );
};

export default SingleLicenseForm;
