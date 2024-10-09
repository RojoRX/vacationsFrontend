import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import { Typography, Card, CardContent, CircularProgress, Box, Button } from '@mui/material';

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

// Interfaz que extiende React.FC para incluir la propiedad acl
interface VacationRequestDetailsProps extends React.FC {
    acl?: {
        action: string;
        subject: string;
    };
}

const VacationRequestDetails: VacationRequestDetailsProps = () => {
    const router = useRouter();
    const { id } = router.query; // Obtener el ID de la URL
    const [request, setRequest] = useState<VacationRequest | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null); // Estado para manejar errores

    useEffect(() => {
        // Fetch vacation request details by ID
        const fetchRequestDetails = async () => {
            if (!id) return;

            try {
                const response = await axios.get<VacationRequest>(
                    `${process.env.NEXT_PUBLIC_API_BASE_URL}/vacation-requests/${id}`
                );
                setRequest(response.data);
            } catch (error) {
                console.error('Error fetching vacation request details:', error);
                setError('Error al obtener los detalles de la solicitud.');
            } finally {
                setLoading(false);
            }
        };

        fetchRequestDetails();
    }, [id]);

    if (loading) {
        return <CircularProgress />;
    }

    if (error) {
        return <Typography variant="h6" color="error">{error}</Typography>;
    }

    if (!request) {
        return <Typography variant="h6">No se encontró la solicitud.</Typography>;
    }

    return (
        <Card>
            <CardContent>
                <Typography variant="h4" gutterBottom>
                    Detalles de la Solicitud
                </Typography>
                <Typography variant="body1"><strong>Posición:</strong> {request.position}</Typography>
                <Typography variant="body1"><strong>Fecha de Solicitud:</strong> {request.requestDate}</Typography>
                <Typography variant="body1"><strong>Fecha de Inicio:</strong> {request.startDate}</Typography>
                <Typography variant="body1"><strong>Fecha de Fin:</strong> {request.endDate}</Typography>
                <Typography variant="body1"><strong>Días Totales:</strong> {request.totalDays}</Typography>
                <Typography variant="body1"><strong>Estado:</strong> {request.status}</Typography>
                <Typography variant="body1"><strong>Regreso:</strong> {request.returnDate}</Typography>
                {request.postponedDate && (
                    <Typography variant="body1"><strong>Fecha de Postergación:</strong> {request.postponedDate}</Typography>
                )}
                {request.postponedReason && (
                    <Typography variant="body1"><strong>Razón de Postergación:</strong> {request.postponedReason}</Typography>
                )}
                {/* Agrega más detalles según sea necesario */}
                <Box mt={2}>
                    <Button variant="contained" color="primary" onClick={() => router.push('/vacations/vacations-requests')}>
                        Volver a la lista
                    </Button>
                </Box>
            </CardContent>
        </Card>
    );
};

// Configurar ACL para dar acceso según el rol
VacationRequestDetails.acl = {
    action: 'read',
    subject: 'vacation-request-details',
};

export default VacationRequestDetails;
