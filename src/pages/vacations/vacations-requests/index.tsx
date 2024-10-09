import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    Card,
    CardContent,
    Grid,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import { useRouter } from 'next/router';
import useUser from 'src/hooks/useUser';

// Definición de tipos para las solicitudes de vacaciones
interface VacationRequest {
    id: number;
    position: string;
    requestDate: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    status: string;
    postponedDate: string | null;
    postponedReason: string | null;
    returnDate: string;
    approvedByHR: boolean;
    approvedBySupervisor: boolean;
    ci: string;
}

// Definición de tipo para el componente que incluye la propiedad acl
interface VacationRequestsComponent extends React.FC {
    acl?: {
        action: string;
        subject: string;
    };
}

const VacationRequestList: VacationRequestsComponent = () => {
    const user = useUser(); // Obtener el usuario usando el hook
    const [requests, setRequests] = useState<VacationRequest[]>([]); // Arreglo de solicitudes
    const [selectedRequest, setSelectedRequest] = useState<VacationRequest | null>(null); // Solicitud seleccionada
    const [openDialog, setOpenDialog] = useState<boolean>(false); // Estado del diálogo
    const router = useRouter(); // Para redireccionar

    useEffect(() => {
        // Fetch vacation requests from the API
        const fetchRequests = async () => {
            if (!user || !user.id) {
                console.error('ID de usuario no disponible.');
                return;
            }

            try {
                const response = await axios.get<VacationRequest[]>(`${process.env.NEXT_PUBLIC_API_BASE_URL}/vacation-requests/user/${user.id}`); // Usar el ID del usuario
                setRequests(response.data);
            } catch (error) {
                console.error('Error fetching vacation requests:', error);
            }
        };

        fetchRequests();
    }, [user]);

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
            router.push(`/vacations/vacations-requests/${selectedRequest.id}`); // Redirigir al componente de detalles
            
        }
    };

    return (
        <Grid container spacing={4}>
            <Grid item xs={12}>
                <Typography variant="h5" gutterBottom>
                    Mis Solicitudes de Vacaciones
                </Typography>
            </Grid>

            {requests.map((request) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={request.id}>
                    <Card style={{ marginBottom: '16px' }}>
                        <CardContent>
                            <Typography variant="h6">{request.position}</Typography>
                            <Typography variant="body2">Fecha de Solicitud: {request.requestDate}</Typography>
                            <Typography variant="body2">Estado: {request.status}</Typography>
                            <Button variant="outlined" onClick={() => handleOpenDialog(request)}>
                                Ver Detalles
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>
            ))}

            {/* Diálogo de detalles de la solicitud */}
            <Dialog open={openDialog} onClose={handleCloseDialog}>
                <DialogTitle>Detalles de la Solicitud</DialogTitle>
                <DialogContent>
                    {selectedRequest && (
                        <>
                            <Typography variant="body1"><strong>Posición:</strong> {selectedRequest.position}</Typography>
                            <Typography variant="body1"><strong>Fecha de Solicitud:</strong> {selectedRequest.requestDate}</Typography>
                            <Typography variant="body1"><strong>Estado:</strong> {selectedRequest.status}</Typography>
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} color="primary">
                        Cerrar
                    </Button>
                    <Button onClick={handleViewDetails} color="secondary">
                        Ver Todos los Detalles
                    </Button>
                </DialogActions>
            </Dialog>
        </Grid>
    );
};

// Configurar ACL para dar acceso según el rol
VacationRequestList.acl = {
    action: 'read',
    subject: 'vacation-request-list',
};

export default VacationRequestList;
