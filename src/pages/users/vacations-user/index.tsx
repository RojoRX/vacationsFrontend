import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'src/lib/axios';
import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Typography,
    useTheme,
    Alert,
    DialogActions
} from '@mui/material';
import ArrowRightIcon from '@mui/icons-material/ArrowForward';
import {
    Info as InfoIcon,
    Visibility as VisibilityIcon,
    Edit as EditIcon,
    Check as CheckIcon,
    Close as CloseIcon,
    CalendarToday as CalendarIcon,
    AccountCircle as AccountIcon,
    Work as WorkIcon,
    EventAvailable as EventAvailableIcon,
    EventBusy as EventBusyIcon,
    Today as TodayIcon,
    DateRange as DateRangeIcon,
    HowToReg as ApprovedIcon,
    SupervisorAccount as SupervisorIcon
} from '@mui/icons-material';
import SuspendVacationDialog from 'src/pages/vacations/vacations-suspend';
import { VacationRequest } from 'src/interfaces/vacationRequests';
import { Delete as DeleteIcon } from '@mui/icons-material';
import useUser from 'src/hooks/useUser';
import { formatDate } from 'src/utils/dateUtils';
import EditVacationDialog from 'src/pages/vacations/vacations-edit';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';


const statusMap = {
    AUTHORIZED: { label: 'Autorizado', color: 'success' },
    SUSPENDED: { label: 'Suspendido', color: 'warning' },
    PENDING: { label: 'Pendiente', color: 'info' },
    POSTPONED: { label: 'Pospuesto', color: 'error' },
    DENIED: { label: 'Denegado', color: 'default' }
};

const getStatusColor = (status: string) => {
    return statusMap[status as keyof typeof statusMap]?.color || 'default';
};

interface VacationRequestsTableProps {
    userId: number;
    reloadRequests: boolean;
}

const VacationRequestsTable: React.FC<VacationRequestsTableProps> = ({ userId, reloadRequests }) => {
    const currentUser = useUser();
    const router = useRouter();
    const theme = useTheme();
    const [requests, setRequests] = useState<VacationRequest[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState<number>(0);
    const [rowsPerPage, setRowsPerPage] = useState<number>(10);
    const [openDetailDialog, setOpenDetailDialog] = useState<boolean>(false);
    const [selectedRequest, setSelectedRequest] = useState<VacationRequest | null>(null);
    const [openSuspendDialog, setOpenSuspendDialog] = useState(false);

    // Nuevos estados agregados:
    const [openDeleteConfirmDialog, setOpenDeleteConfirmDialog] = useState(false);
    const [requestToDelete, setRequestToDelete] = useState<VacationRequest | null>(null);
    const [deleteSuccess, setDeleteSuccess] = useState(false);

    // En el componente, agregar este estado:
    const [openEditDialog, setOpenEditDialog] = useState(false);
    useEffect(() => {
        const fetchRequests = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await axios.get(`${API_BASE_URL}/vacation-requests/user/${userId}`);
                setRequests(response.data);
            } catch (err) {
                setError('Error al cargar las solicitudes de vacaciones');
                console.error('Error fetching vacation requests:', err);
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            fetchRequests();
        }
    }, [userId, reloadRequests]); // Asegúrate de que reloadRequests esté en las dependencias

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleOpenDetailDialog = (request: VacationRequest) => {
        setSelectedRequest(request);
        setOpenDetailDialog(true);
    };

    const handleCloseDetailDialog = () => {
        setOpenDetailDialog(false);
    };

    // Agregar estos métodos en el componente
    const handleEditRequest = (request: VacationRequest) => {
        setSelectedRequest(request);
        setOpenEditDialog(true);
    };


    const handleSuspendSuccess = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/vacation-requests`);
            setRequests(response.data);
            setOpenDetailDialog(false);
            setOpenSuspendDialog(false);
        } catch (error) {
            console.error('Error al actualizar las solicitudes:', error);
        }
    };

    // Nuevo método para eliminar solicitud
    const handleForceDelete = async () => {
        if (!requestToDelete) return;

        try {
            await axios.delete(`${API_BASE_URL}/vacation-requests/${requestToDelete.id}/force`);
            setDeleteSuccess(true);
            setOpenDeleteConfirmDialog(false);
            setOpenDetailDialog(false);

            // Recargar las solicitudes
            const response = await axios.get(`${API_BASE_URL}/vacation-requests/user/${userId}`);
            const updatedRequests = response.data;

            // Ajustar la página si es necesario
            const maxPage = Math.ceil(updatedRequests.length / rowsPerPage) - 1;
            setPage((prevPage) => Math.min(prevPage, maxPage));

            setRequests(updatedRequests);
        } catch (err) {
            console.error('Error al eliminar la solicitud:', err);
        }
    };

    const handleUpdateSuccess = (updatedRequest: VacationRequest) => {
        setRequests(prev =>
            prev
                .map(req => (req.id === updatedRequest.id ? updatedRequest : req))
                .filter(req => !req.deleted) // <- filtra las eliminadas
        );
        setOpenEditDialog(false);
        setOpenDetailDialog(false); // Cerrar también el diálogo de detalles si está abierto
    };


    if (loading) return <Typography>Cargando solicitudes...</Typography>;
    if (error) return <Typography color="error">{error}</Typography>;

    return (
        <Box sx={{ width: '100%' }}>
            <Paper sx={{ width: '100%', mb: 2 }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Fecha Solicitud</TableCell>
                                <TableCell>Fecha Inicio</TableCell>
                                <TableCell>Fecha Fin</TableCell>
                                <TableCell>Días</TableCell>
                                <TableCell>Estado</TableCell>
                                <TableCell>Aprobaciones</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {requests
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((request) => (
                                    <TableRow key={request.id}>
                                        <TableCell>{request.id}</TableCell>
                                        <TableCell>{formatDate(request.requestDate)}</TableCell>
                                        <TableCell>{formatDate(request.startDate)}</TableCell>
                                        <TableCell>{formatDate(request.endDate)}</TableCell>
                                        <TableCell>{request.totalDays}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={statusMap[request.status as keyof typeof statusMap]?.label || 'Desconocido'}
                                                color={getStatusColor(request.status) as any}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                {request.approvedByHR ? (
                                                    <CheckIcon color="success" fontSize="small" />
                                                ) : (
                                                    <CloseIcon color="error" fontSize="small" />
                                                )}
                                                {request.approvedBySupervisor ? (
                                                    <CheckIcon color="success" fontSize="small" />
                                                ) : (
                                                    <CloseIcon color="error" fontSize="small" />
                                                )}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleEditRequest(request)}
                                                    color="primary"
                                                    title="Editar solicitud"
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleOpenDetailDialog(request)}
                                                    color="info"
                                                    title="Ver detalles"
                                                >
                                                    <VisibilityIcon />
                                                </IconButton>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={requests.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage="Solicitudes por página"
                />
            </Paper>

            {/* Diálogo de detalles */}
            <Dialog open={openDetailDialog} onClose={handleCloseDetailDialog} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <InfoIcon color="primary" />
                    Detalles de la Solicitud #{selectedRequest?.id}
                </DialogTitle>
                <DialogContent dividers>
                    {selectedRequest && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <AccountIcon color="action" />
                                <Typography variant="body1">
                                    <strong>C.I.:</strong> {selectedRequest.ci}
                                </Typography>
                            </Box>

                            {selectedRequest.position && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <WorkIcon color="action" />
                                    <Typography variant="body1">
                                        <strong>Posición:</strong> {selectedRequest.position}
                                    </Typography>
                                </Box>
                            )}

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <CalendarIcon color="action" />
                                <Typography variant="body1">
                                    <strong>Fecha Solicitud:</strong> {formatDate(selectedRequest.requestDate)}
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <EventAvailableIcon color="action" />
                                <Typography variant="body1">
                                    <strong>Fecha Inicio:</strong> {formatDate(selectedRequest.startDate)}
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <EventBusyIcon color="action" />
                                <Typography variant="body1">
                                    <strong>Fecha Fin:</strong> {formatDate(selectedRequest.endDate)}
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <TodayIcon color="action" />
                                <Typography variant="body1">
                                    <strong>Días Solicitados:</strong> {selectedRequest.totalDays}
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <DateRangeIcon color="action" />
                                <Typography variant="body1">
                                    <strong>Fecha Retorno:</strong> {formatDate(selectedRequest.returnDate || "")}
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography variant="body1">
                                    <strong>Estado:</strong>{' '}
                                    <Chip
                                        label={statusMap[selectedRequest.status as keyof typeof statusMap]?.label || 'Desconocido'}
                                        color={getStatusColor(selectedRequest.status) as any}
                                        size="small"
                                    />
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <ApprovedIcon color="action" />
                                <Typography variant="body1">
                                    <strong>Aprobado por Personal:</strong>{' '}
                                    {selectedRequest.approvedByHR ? (
                                        <CheckIcon color="success" fontSize="small" />
                                    ) : (
                                        <CloseIcon color="error" fontSize="small" />
                                    )}
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <SupervisorIcon color="action" />
                                <Typography variant="body1">
                                    <strong>Aprobado por Jefe Superior:</strong>{' '}
                                    {selectedRequest.approvedBySupervisor ? (
                                        <CheckIcon color="success" fontSize="small" />
                                    ) : (
                                        <CloseIcon color="error" fontSize="small" />
                                    )}
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <CalendarIcon color="action" />
                                <Typography variant="body1">
                                    <strong>Periodo de Gestión:</strong> {formatDate(selectedRequest.managementPeriodStart)} - {formatDate(selectedRequest.managementPeriodEnd)}
                                </Typography>
                            </Box>

                            {selectedRequest.postponedReason && (
                                <Box sx={{
                                    p: 2,
                                    backgroundColor: theme.palette.warning.light,
                                    borderRadius: 1
                                }}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        <strong>Motivo de postergación:</strong> {selectedRequest.postponedReason}
                                    </Typography>
                                </Box>
                            )}
                            {/* Botón para suspender */}
                            {selectedRequest.status !== 'SUSPENDED' && (

                                <Button
                                    variant="contained"
                                    color="warning"
                                    startIcon={<EditIcon />}
                                    onClick={() => setOpenSuspendDialog(true)}
                                >
                                    Suspender Solicitud
                                </Button>

                            )}
                            <Button
                                onClick={() => {
                                    if (selectedRequest) {
                                        router.push(`/vacations/vacations-requests/${selectedRequest.id}`);
                                    }
                                }}
                                color="secondary"
                                variant="contained"
                                fullWidth
                                startIcon={<ArrowRightIcon />}
                            >
                                Ver solicitud completa
                            </Button>
                        </Box>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={openDeleteConfirmDialog} onClose={() => setOpenDeleteConfirmDialog(false)}>
                <DialogTitle>Confirmar eliminación</DialogTitle>
                <DialogContent>
                    <Typography>
                        ¿Estás seguro de que deseas eliminar la solicitud #{requestToDelete?.id}? Esta acción no se puede deshacer.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDeleteConfirmDialog(false)} color="inherit">
                        Cancelar
                    </Button>
                    <Button onClick={handleForceDelete} color="error" variant="contained">
                        Eliminar
                    </Button>
                </DialogActions>
            </Dialog>
            {/* Diálogo de suspensión (componente reutilizable) */}
            <SuspendVacationDialog
                open={openSuspendDialog}
                onClose={() => setOpenSuspendDialog(false)}
                request={selectedRequest as unknown as (Omit<VacationRequest, "managementPeriodStart" | "managementPeriodEnd" | "reviewDate">)}
                onSuccess={handleSuspendSuccess}
            />

            <EditVacationDialog
                open={openEditDialog}
                onClose={() => setOpenEditDialog(false)}
                request={selectedRequest}
                onUpdate={handleUpdateSuccess}
            />

        </Box>
    );
};

export default VacationRequestsTable;