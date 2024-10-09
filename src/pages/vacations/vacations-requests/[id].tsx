import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import { Typography, Card, CardContent, CircularProgress, Box, Button } from '@mui/material';

// (Definiciones de tipos actualizadas aquí...)
interface AuthorizedVacationRequest {
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
    managementPeriodStart: string;
    managementPeriodEnd: string;
}

interface VacationRequest {
    requestId: number;
    userName: string;
    requestDate: string;
    department: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    status: string;
    returnDate: string;
    postponedDate: string | null;
    postponedReason: string | null;
    approvedByHR: boolean;
    approvedBySupervisor: boolean;
    managementPeriodStart: string;
    managementPeriodEnd: string;
    fechaIngreso: string;
    antiguedadEnAnios: number;
    diasDeVacacion: number;
    diasDeVacacionRestantes: number;
    recesos: any[]; // Asegúrate de definir correctamente el tipo para los recesos si es necesario.
    licenciasAutorizadas: {
        totalAuthorizedDays: number;
        requests: any[]; // Cambia esto si tienes una definición específica para las solicitudes de licencias autorizadas.
    };
    solicitudesDeVacacionAutorizadas: {
        totalAuthorizedVacationDays: number;
        requests: AuthorizedVacationRequest[];
    };
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
        const fetchRequestDetails = async () => {
            if (!id) return;

            try {
                const response = await axios.get<VacationRequest>(
                    `${process.env.NEXT_PUBLIC_API_BASE_URL}/vacation-requests/${id}/details`
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
                    Universidad Autónoma Tomás Frías
                </Typography>
                <Typography variant="h5" gutterBottom>
                    Departamento de Personal
                </Typography>
                <Typography variant="h6" gutterBottom>
                    Formulario de Solicitud y Concesión de Vacaciones
                </Typography>

                <Typography variant="h6" mt={2}>Datos de Solicitante</Typography>
                <Typography variant="body1"><strong>Nombre de Usuario:</strong> {request.userName}</Typography>
                <Typography variant="body1"><strong>ID de Solicitud:</strong> {request.requestId}</Typography>
                {/* <Typography variant="body1"><strong>Carnet de Identidad:</strong> {request.fechaIngreso}</Typography> */}
                <Typography variant="body1"><strong>Fecha de Ingreso:</strong> {request.fechaIngreso}</Typography>
                <Typography variant="body1"><strong>Departamento:</strong> {request.department || 'No especificado'}</Typography>

                <Typography variant="h6" mt={2}>Informe del departamento de Personal</Typography>
                <Typography variant="body1"><strong>Vacacion correspondiente a las gestion(es):</strong> {request.managementPeriodStart} - {request.managementPeriodEnd}</Typography>
                <Typography variant="body1"><strong>Años de Antigüedad:</strong> {request.antiguedadEnAnios}</Typography>
                <Typography variant="body1"><strong>Días de Vacación por Antigüedad:</strong> {request.diasDeVacacion}</Typography>
                <Typography variant="body1">
                    <strong>Días de Licencia Autorizados cuenta Vacacion:</strong> {request.licenciasAutorizadas.totalAuthorizedDays !== undefined && request.licenciasAutorizadas.totalAuthorizedDays !== null ? request.licenciasAutorizadas.totalAuthorizedDays : 'No disponibles'}
                </Typography>
                <Typography variant="body1"><strong>Descanso pedagogico de Invierno:</strong> </Typography>
                <Typography variant="body1"><strong>Descanso de Fin de Año:</strong> </Typography>
                <Typography variant="body1"><strong>Días de Vacación Restantes:</strong> {request.diasDeVacacionRestantes}</Typography>


                <Typography variant="h6" mt={2}>Autorizacion del jefe inmediato Superior</Typography>
                
                <Typography variant="body1"><strong>Estado:</strong> {request.status}</Typography>
                <Typography variant="body1"><strong>Fecha de Inicio:</strong> {request.startDate}</Typography>
                <Typography variant="body1"><strong>Fecha de Autorizacion:</strong> </Typography>
                <Typography variant="body1"><strong>Postergado hasta:</strong>{request.postponedDate} </Typography>
                <Typography variant="body1"><strong>Justificacion de la postergacion:</strong> {request.postponedReason}</Typography>

                
                <Typography variant="h6" mt={2}>Decreto del Departamento de Personal</Typography>

                <Typography variant="body1">Se autoriza el uso de la vacacion por Decreto NO: </Typography>
                <Typography variant="body1"><strong>Fecha de Inicio:</strong> {request.startDate}</Typography>
                <Typography variant="body1"><strong>Fecha de Retorno:</strong> {request.returnDate}</Typography>


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
