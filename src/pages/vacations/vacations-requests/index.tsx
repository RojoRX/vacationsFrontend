
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
    const [requests, setRequests] = useState<VacationRequest[]>([]); // Arreglo de solicitudes
    const [selectedRequest, setSelectedRequest] = useState<VacationRequest | null>(null); // Solicitud seleccionada
    const [openDialog, setOpenDialog] = useState<boolean>(false); // Estado del diálogo

    useEffect(() => {
        // Fetch vacation requests from the API
        const fetchRequests = async () => {
            try {
                const response = await axios.get<VacationRequest[]>(`${process.env.NEXT_PUBLIC_API_BASE_URL}/vacation-requests/user/1`); // Cambia la URL por tu endpoint real
                setRequests(response.data);
            } catch (error) {
                console.error('Error fetching vacation requests:', error);
            }
        };

        fetchRequests();
    }, []);

    const handleOpenDialog = (request: VacationRequest) => {
        setSelectedRequest(request);
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedRequest(null);
    };

    return (
        <Grid container spacing={4}>
            {/* Lista de solicitudes de vacaciones */}
            <Grid item xs={12}>
                <Typography variant="h5" gutterBottom>
                    Mis Solicitudes de Vacaciones
                </Typography>
            </Grid>
            {/* Mapa las solicitudes de vacaciones y crea un Grid item para cada una */}
            {requests.map((request) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={request.id}> {/* Ajusta el tamaño según el breakpoint */}
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
                            <Typography variant="body1"><strong>Fecha de Inicio:</strong> {selectedRequest.startDate}</Typography>
                            <Typography variant="body1"><strong>Fecha de Fin:</strong> {selectedRequest.endDate}</Typography>
                            <Typography variant="body1"><strong>Días Totales:</strong> {selectedRequest.totalDays}</Typography>
                            <Typography variant="body1"><strong>Estado:</strong> {selectedRequest.status}</Typography>
                            <Typography variant="body1"><strong>Regreso:</strong> {selectedRequest.returnDate}</Typography>
                            {selectedRequest.postponedDate && (
                                <Typography variant="body1"><strong>Fecha de Postergación:</strong> {selectedRequest.postponedDate}</Typography>
                            )}
                            {selectedRequest.postponedReason && (
                                <Typography variant="body1"><strong>Razón de Postergación:</strong> {selectedRequest.postponedReason}</Typography>
                            )}
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} color="primary">
                        Cerrar
                    </Button>
                </DialogActions>
            </Dialog>
        </Grid>
    );
};

// Configurar ACL para dar acceso según el rol
VacationRequestList.acl = {
    action: 'read',
    subject: 'vacation-request-list', // Cambié 'vacation-request' a 'vacation-request-list'
};

export default VacationRequestList;
