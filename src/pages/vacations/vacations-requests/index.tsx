import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    Box,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    TextField,
    InputAdornment,
    IconButton,
    Chip,
    Toolbar,
    useTheme,
    MenuItem,
    TextFieldProps,
    Grid
} from '@mui/material';
import { useRouter } from 'next/router';
import useUser from 'src/hooks/useUser';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import { format } from 'date-fns';
import InformationOutlineIcon from '@mui/icons-material/InfoOutlined';
import IdentifierIcon from '@mui/icons-material/Numbers';
import AccountTieIcon from '@mui/icons-material/AccountCircle';
import CalendarCheckIcon from '@mui/icons-material/EventAvailable';
import CalendarStartIcon from '@mui/icons-material/Event';
import CalendarEndIcon from '@mui/icons-material/EventNote';
import CalendarWeekIcon from '@mui/icons-material/DateRange';
import CalendarReturnIcon from '@mui/icons-material/EventRepeat';
import StatusIcon from '@mui/icons-material/Flag';
import HumanResourcesIcon from '@mui/icons-material/People';
import AccountSupervisorIcon from '@mui/icons-material/SupervisorAccount';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import ArrowRightIcon from '@mui/icons-material/ArrowForward';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import { DatePicker, LocalizationProvider } from '@mui/lab'; // Para v5
import EditVacationDialog from '../vacations-edit';



interface VacationRequest {
    id: number;

    position: string;
    requestDate: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    status: 'PENDING' | 'AUTHORIZED' | 'DENIED' | 'SUSPENDED';
    postponedDate: string | null;
    postponedReason: string | null;
    returnDate: string;
    approvedByHR: boolean;
    approvedBySupervisor: boolean;
    ci: string;
}

interface VacationRequestsComponent extends React.FC {
    acl?: {
        action: string;
        subject: string;
    };
}

const VacationRequestList: VacationRequestsComponent = () => {
    const user = useUser();
    const [requests, setRequests] = useState<VacationRequest[]>([]);
    const [filteredRequests, setFilteredRequests] = useState<VacationRequest[]>([]);
    const [selectedRequest, setSelectedRequest] = useState<VacationRequest | null>(null);
    const [openDialog, setOpenDialog] = useState<boolean>(false);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const router = useRouter();
    const theme = useTheme();
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editData, setEditData] = useState<Partial<{
        startDate: string;
        status: 'PENDING' | 'AUTHORIZED' | 'POSTPONED' | 'DENIED' | 'SUSPENDED';
        postponedDate: string;
        postponedReason: string;
    }>>({});
    const [isEditing, setIsEditing] = useState(false);


    const translateStatus = (status: string): string => {
        const statusMap: Record<string, string> = {
            'PENDING': 'Pendiente',
            'AUTHORIZED': 'Autorizado',
            'DENIED': 'Rechazado',
            'SUSPENDED': 'Suspendido',
            'CANCELLED': 'Cancelado'
        };
        return statusMap[status] || status;
    };

    const [dateFilter, setDateFilter] = useState({
        startDate: null as Date | null,
        endDate: null as Date | null,
        filterType: 'requestDate' as 'requestDate' | 'startDate' | 'endDate'
    });
    const handleUpdate = (updatedRequest: VacationRequest) => {
        // aquí actualizas tu lista de solicitudes, por ejemplo
        console.log('Solicitud actualizada:', updatedRequest);
      };
      useEffect(() => {
        const fetchRequests = async () => {
            if (!user?.id) {
                console.error('ID de usuario no disponible.');
                return;
            }
    
            try {
                const response = await axios.get<VacationRequest[]>(
                    `${process.env.NEXT_PUBLIC_API_BASE_URL}/vacation-requests/user/${user.id}`
                );
                const sortedRequests = response.data.sort((a, b) => b.id - a.id); // Ordenar por id descendente
                setRequests(sortedRequests);
                setFilteredRequests(sortedRequests);
            } catch (error) {
                console.error('Error fetching vacation requests:', error);
            }
        };
    
        fetchRequests();
    }, [user]);
    

    useEffect(() => {
        let result = requests;
    
        if (searchTerm) {
            result = result.filter(
                (request) =>
                    request.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    request.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    request.requestDate.includes(searchTerm)
            );
        }
    
        if (statusFilter !== 'all') {
            result = result.filter((request) => request.status === statusFilter);
        }
    
        if (dateFilter.startDate || dateFilter.endDate) {
            result = result.filter((request) => {
                const dateToFilter = new Date(request[dateFilter.filterType]);
                const startDate = dateFilter.startDate ? new Date(dateFilter.startDate) : null;
                const endDate = dateFilter.endDate ? new Date(dateFilter.endDate) : null;
    
                if (startDate && endDate) {
                    return dateToFilter >= startDate && dateToFilter <= endDate;
                } else if (startDate) {
                    return dateToFilter >= startDate;
                } else if (endDate) {
                    return dateToFilter <= endDate;
                }
                return true;
            });
        }
    
        // Ordenar por la fecha de solicitud (requestDate) de forma descendente
        result = result.sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
    
        setFilteredRequests(result);
    }, [searchTerm, statusFilter, requests, dateFilter]);
    

    const handleOpenDialog = (request: VacationRequest) => {
        setSelectedRequest(request);
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedRequest(null);
    };

    const handleViewDetails = () => {
        if (selectedRequest) {
            router.push(`/vacations/vacations-requests/${selectedRequest.id}`);
        }
    };

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleRefresh = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setDateFilter({
            startDate: null,
            endDate: null,
            filterType: 'requestDate'
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'SUSPENDED':
                return 'warning';
            case 'AUTHORIZED':
                return 'success';
            case 'DENIED':
                return 'error';
            case 'PENDING':
                return 'default';
            default:
                return 'info';
        }
    };

    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), 'dd/MM/yyyy');
        } catch {
            return dateString;
        }
    };
    // Función para abrir el diálogo de edición
    const handleOpenEditDialog = (request: VacationRequest) => {
        setSelectedRequest(request);
        setEditData({
            startDate: request.startDate,
            status: request.status,
            postponedDate: request.postponedDate || '',
            postponedReason: request.postponedReason || ''
        });
        setEditDialogOpen(true);
    };

    // Función para manejar cambios en los campos de edición
    const handleEditChange = (field: keyof typeof editData, value: any) => {
        setEditData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Función para guardar los cambios
    const handleSaveChanges = async () => {
        if (!selectedRequest) return;

        setIsEditing(true);
        try {
            const response = await axios.patch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/vacation-requests/${selectedRequest.id}`,
                editData
            );

            // Actualizar la lista de solicitudes
            const updatedRequests = requests.map(req =>
                req.id === selectedRequest.id ? response.data : req
            );

            setRequests(updatedRequests);
            setFilteredRequests(updatedRequests);
            setEditDialogOpen(false);
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating vacation request:', error);
            setIsEditing(false);
        }
    };
    return (
        <Box sx={{ width: '100%' }}>
            <Paper sx={{ width: '100%', mb: 2, p: 2 }}>
                <Toolbar
                    sx={{
                        pl: { sm: 2 },
                        pr: { xs: 1, sm: 1 },
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { xs: 'flex-start', sm: 'center' },
                        justifyContent: 'space-between',
                        gap: 2
                    }}
                >
                    <Typography variant="h5" component="div">
                        Mis Solicitudes de Vacaciones
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, width: { xs: '100%', sm: 'auto' }, flexWrap: 'wrap' }}>
                        <TextField
                            select
                            size="small"
                            variant="outlined"
                            value={dateFilter.filterType}
                            onChange={(e) => setDateFilter({ ...dateFilter, filterType: e.target.value as any })}
                            sx={{ minWidth: 180 }}
                        >
                            <MenuItem value="requestDate">Fecha de solicitud</MenuItem>
                            <MenuItem value="startDate">Fecha de inicio</MenuItem>
                            <MenuItem value="endDate">Fecha de fin</MenuItem>
                        </TextField>

                        <DatePicker
                            label="Desde"
                            value={dateFilter.startDate}
                            onChange={(newValue: any) => setDateFilter({ ...dateFilter, startDate: newValue })}
                            renderInput={(params: JSX.IntrinsicAttributes & TextFieldProps) => <TextField {...params} size="small" sx={{ width: 150 }} />}
                        />

                        <DatePicker
                            label="Hasta"
                            value={dateFilter.endDate}
                            onChange={(newValue: any) => setDateFilter({ ...dateFilter, endDate: newValue })}
                            renderInput={(params: JSX.IntrinsicAttributes & TextFieldProps) => <TextField {...params} size="small" sx={{ width: 150 }} />}
                        />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, width: { xs: '100%', sm: 'auto' } }}>
                        <TextField
                            size="small"
                            variant="outlined"
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ flexGrow: { xs: 1, sm: 0 } }}
                        />

                        <TextField
                            select
                            size="small"
                            variant="outlined"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            SelectProps={{
                                native: true,
                            }}
                            sx={{ minWidth: 120 }}
                        >
                            <option value="all">Todos</option>
                            <option value="PENDING">Pendiente</option>
                            <option value="AUTHORIZED">Autorizado</option>
                            <option value="DENIED">Rechazado</option>
                            <option value="SUSPENDED">Suspendido</option>
                            <option value="CANCELLED">Cancelado</option>
                        </TextField>

                        <IconButton onClick={handleRefresh}>
                            <RefreshIcon />
                        </IconButton>
                    </Box>
                </Toolbar>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Nª</TableCell>
                                
                                <TableCell>Fecha Solicitud</TableCell>
                                <TableCell>Fecha Inicio</TableCell>
                                <TableCell>Fecha Fin</TableCell>
                                <TableCell>Días</TableCell>
                                <TableCell>Estado</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredRequests
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
                                                label={translateStatus(request.status)}
                                                color={getStatusColor(request.status)}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                onClick={() => handleOpenDialog(request)}
                                            >
                                                Detalles
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={filteredRequests.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage="Filas por página:"
                    labelDisplayedRows={({ from, to, count }) =>
                        `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
                    }
                />
            </Paper>

            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <InformationOutlineIcon color="primary" />
                    Detalles de la Solicitud
                </DialogTitle>
                <DialogContent dividers>
                    {selectedRequest && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {/** 
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <AccountTieIcon color="action" />
                            </Box>*/}

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <CalendarCheckIcon color="action" />
                                <Typography variant="body1">
                                    <strong>Fecha Solicitud:</strong> {formatDate(selectedRequest.requestDate)}
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <CalendarStartIcon color="action" />
                                <Typography variant="body1">
                                    <strong>Fecha Inicio:</strong> {formatDate(selectedRequest.startDate)}
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <CalendarEndIcon color="action" />
                                <Typography variant="body1">
                                    <strong>Fecha Fin:</strong> {formatDate(selectedRequest.endDate)}
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <CalendarWeekIcon color="action" />
                                <Typography variant="body1">
                                    <strong>Días Solicitados:</strong> {selectedRequest.totalDays}
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <CalendarReturnIcon color="action" />
                                <Typography variant="body1">
                                    <strong>Fecha Retorno:</strong> {formatDate(selectedRequest.returnDate)}
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <StatusIcon color="action" />
                                <Typography variant="body1">
                                    <strong>Estado:</strong>{' '}
                                    <Chip
                                        label={selectedRequest.status}
                                        color={getStatusColor(selectedRequest.status)}
                                        size="small"
                                    />
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <HumanResourcesIcon color="action" />
                                <Typography variant="body1">
                                    <strong>Aprobado por Dpto. Personal:</strong>{' '}
                                    {selectedRequest.approvedByHR ? (
                                        <CheckIcon color="success" fontSize="small" />
                                    ) : (
                                        <CloseIcon color="error" fontSize="small" />
                                    )}
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <AccountSupervisorIcon color="action" />
                                <Typography variant="body1">
                                    <strong>Aprobado por Supervisor:</strong>{' '}
                                    {selectedRequest.approvedBySupervisor ? (
                                        <CheckIcon color="success" fontSize="small" />
                                    ) : (
                                        <CloseIcon color="error" fontSize="small" />
                                    )}
                                </Typography>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={handleCloseDialog}
                        color="primary"
                        startIcon={<CloseIcon />}
                    >
                        Cerrar
                    </Button>
                    {/* 
                    <Button
                        onClick={() => handleOpenEditDialog(selectedRequest!)}
                        color="primary"
                        variant="outlined"
                        startIcon={<EditIcon />}
                    >
                        Editar
                    </Button>*/}

                    <Button
                        onClick={handleViewDetails}
                        color="secondary"
                        variant="contained"
                        startIcon={<ArrowRightIcon />}
                    >
                        Ver Informe
                    </Button>
                </DialogActions>
            </Dialog>
            {/* Nuevo diálogo de edición */}
            {/* Nuevo diálogo de edición */}
            {/* Aquí usas tu componente en lugar de <Dialog> */}
            <EditVacationDialog
                open={editDialogOpen}
                onClose={() => setEditDialogOpen(false)}
                request={selectedRequest}
                onUpdate={handleUpdate}
            />

        </Box>
    );
};

VacationRequestList.acl = {
    action: 'read',
    subject: 'vacation-request-list',
};

export default VacationRequestList;