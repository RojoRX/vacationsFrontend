import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    CircularProgress,
    IconButton,
    MenuItem,
    Alert,
    Typography,
    Divider
} from '@mui/material';
import { useEffect, useState } from 'react';
import axios from 'src/lib/axios';
import CloseIcon from '@mui/icons-material/Close';

interface EmployeeContractHistoryDialogProps {
    open: boolean;
    onClose: () => void;
    userId: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function EmployeeContractHistoryDialog({
    open,
    onClose,
    userId,
}: EmployeeContractHistoryDialogProps) {

    // ================================
    // Estados
    // ================================
    const [contracts, setContracts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const emptyForm = {
        id: null as number | null,
        startDate: '',
        endDate: '',
        contractType: 'OTRO',
    };

    const [form, setForm] = useState(emptyForm);
    const isEditing = form.id !== null;

    // ================================
    // Tipos de contrato
    // ================================
    const contractTypes = [
        { value: 'OTRO', label: 'OTRO' },
    ];

    // ================================
    // Cargar contratos del usuario
    // ================================
    const fetchContracts = async () => {
        if (!userId) return;
        setLoading(true);
        setError(null);

        try {
            const res = await axios.get(`${API_URL}/employee-contract-history/user/${userId}`);
            setContracts(res.data);
        } catch (err) {
            console.error(err);
            setError('Error al cargar los contratos.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            setForm(emptyForm);
            fetchContracts();
        }
    }, [open]);

    // ================================
    // Handlers
    // ================================
    const handleChange = (field: string, value: any) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (!form.startDate) return;

        setSaving(true);
        setError(null);
        setMessage(null);

        try {
            if (isEditing) {
                await axios.put(`${API_URL}/employee-contract-history/${form.id}`, {
                    startDate: form.startDate,
                    endDate: form.endDate || undefined,
                    contractType: form.contractType,
                });
                setMessage('Contrato actualizado correctamente.');
            } else {
                await axios.post(`${API_URL}/employee-contract-history`, {
                    userId,
                    startDate: form.startDate,
                    endDate: form.endDate || undefined,
                    contractType: form.contractType,
                });
                setMessage('Contrato creado correctamente.');
            }

            await fetchContracts();
            setForm(emptyForm);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al guardar el contrato.');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (contract: any) => {
        setForm({
            id: contract.id,
            startDate: contract.startDate,
            endDate: contract.endDate || '',
            contractType: contract.contractType,
        });
        setError(null);
        setMessage(null);
    };

    const handleDelete = async (id: number) => {
        setSaving(true);
        setError(null);
        setMessage(null);

        try {
            await axios.delete(`${API_URL}/employee-contract-history/${id}`);
            setMessage('Contrato eliminado correctamente.');
            await fetchContracts();
            setForm(emptyForm);
        } catch (err) {
            console.error(err);
            setError('Error al eliminar contrato.');
        } finally {
            setSaving(false);
        }
    };

    // ================================
    // RENDER
    // ================================
    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle>
                Historial de Contratos
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{ position: 'absolute', right: 8, top: 8 }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers>

                {loading ? (
                    <Box display="flex" justifyContent="center" my={3}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Box display="flex" flexDirection="column" gap={2}>
                        {error && <Alert severity="error">{error}</Alert>}
                        {message && <Alert severity="success">{message}</Alert>}

                        {/* FORM */}
                        <Typography variant="h6">
                            {isEditing ? 'Editar contrato' : 'Nuevo contrato'}
                        </Typography>

                        <Box display="flex" flexWrap="wrap" gap={2}>
                            <TextField
                                label="Fecha de inicio"
                                type="date"
                                InputLabelProps={{ shrink: true }}
                                value={form.startDate}
                                onChange={(e) => handleChange('startDate', e.target.value)}
                                fullWidth
                                required
                            />

                            <TextField
                                label="Fecha de fin"
                                type="date"
                                InputLabelProps={{ shrink: true }}
                                value={form.endDate}
                                onChange={(e) => handleChange('endDate', e.target.value)}
                                fullWidth
                            />

                            <TextField
                                select
                                label="Tipo de contrato"
                                value={form.contractType}
                                onChange={(e) => handleChange('contractType', e.target.value)}
                                fullWidth
                            >
                                {contractTypes.map((t) => (
                                    <MenuItem key={t.value} value={t.value}>
                                        {t.label}
                                    </MenuItem>
                                ))}
                            </TextField>

                            <Button
                                variant="contained"
                                onClick={handleSave}
                                disabled={saving || !form.startDate}
                            >
                                {saving ? <CircularProgress size={20} /> : 'Guardar'}
                            </Button>

                            {isEditing && (
                                <Button
                                    color="error"
                                    onClick={() => handleDelete(form.id!)}
                                    disabled={saving}
                                >
                                    Eliminar
                                </Button>
                            )}
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        {/* LISTA */}
                        <Typography variant="h6">Contratos existentes</Typography>

                        {contracts.length === 0 ? (
                            <Alert severity="info">No hay contratos registrados.</Alert>
                        ) : (
                            <Box display="flex" flexDirection="column" gap={1}>
                                {contracts.map((c) => (
                                    <Box
                                        key={c.id}
                                        p={2}
                                        border="1px solid #ddd"
                                        borderRadius={2}
                                        display="flex"
                                        justifyContent="space-between"
                                        alignItems="center"
                                    >
                                        <Box>
                                            <Typography><strong>Inicio:</strong> {c.startDate}</Typography>
                                            <Typography><strong>Fin:</strong> {c.endDate || '—'}</Typography>
                                            <Typography><strong>Tipo:</strong> {c.contractType}</Typography>
                                        </Box>

                                        <Button variant="outlined" onClick={() => handleEdit(c)}>
                                            Editar
                                        </Button>
                                    </Box>
                                ))}
                            </Box>
                        )}
                    </Box>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} disabled={saving}>
                    Cerrar
                </Button>
            </DialogActions>
        </Dialog>
    );
}
