import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TablePagination,
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid, // <-- Importar Grid
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import {PictureAsPdf as PictureAsPdfIcon}  from '@mui/icons-material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; // Ícono de aprobado
import CancelIcon from '@mui/icons-material/Cancel'; // Ícono de rechazado
import EventIcon from '@mui/icons-material/Event'; // Ícono de fecha
import HolidayVillageIcon from '@mui/icons-material/HolidayVillage'; // Ícono para VACACION
import MedicalServicesIcon from '@mui/icons-material/MedicalServices'; // Ícono para LICENCIA_MEDICA (ejemplo)
import WorkOffIcon from '@mui/icons-material/WorkOff'; // Ícono para AUSENCIA (ejemplo)
import PaidIcon from '@mui/icons-material/Paid'; // Ícono para PERMISO_REMUNERADO (ejemplo)
import CheckCircle from '@mui/icons-material/CheckCircle'; // Ícono de aprobación (para Chips de estado en diálogo)
import Cancel from '@mui/icons-material/Cancel';       // Ícono de rechazo (para Chips de estado en diálogo)


import axios from 'src/lib/axios';
import { format, isValid, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatDate } from 'src/utils/dateUtils'; // Asumo que esto funciona bien
import { generateLicensePdf } from 'src/utils/licensePdfGenerator';

interface License {
  id: number;
  licenseType: string;
  timeRequested: string;
  startDate: string;
  endDate: string;
  issuedDate: string;
  immediateSupervisorApproval: boolean;
  personalDepartmentApproval: boolean;
  totalDays: string;
  userId: number;
  deleted: boolean;
  reason?: string;
  user?: { // Esto es si la licencia ya viene con el usuario anidado (lo cual es posible)
    id: number;
    fullName: string;
  };
  department?: {
    name: string;
  };
}

// --- NUEVA INTERFAZ PARA DETALLES DE USUARIO ---
interface UserDetail {
  id: number;
  ci: string;
  fecha_ingreso: string;
  email: string | null;
  username: string;
  fullName: string;
  celular: string;
  position: string;
  tipoEmpleado: string;
  role: string;
  department: { name: string } | null;
  academicUnit: { id: number; name: string } | null;
  profession: { id: number; name: string; createdAt: string; updatedAt: string } | null;
  config: any | null;
  createdAt: string;
  updatedAt: string;
}

interface UserLicenseListProps {
  userId: number;
}

const UserLicenseList: React.FC<UserLicenseListProps> = ({ userId }) => {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Estados para filtros avanzados
  const [filterDate, setFilterDate] = useState<string>(''); // Un solo campo de fecha para el filtro
  const [filterSupervisorApproval, setFilterSupervisorApproval] = useState<string>('all'); // 'all', 'true', 'false'
  const [filterDepartmentApproval, setFilterDepartmentApproval] = useState<string>('all'); // 'all', 'true', 'false'
  const [filteredLicenses, setFilteredLicenses] = useState<License[]>([]);

  // --- Lógica del diálogo de detalles y acciones ---
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [selectedLicenseId, setSelectedLicenseId] = useState<number | null>(null);
  const [dialogLicenseDetails, setDialogLicenseDetails] = useState<License | null>(null);
  const [dialogUserDetails, setDialogUserDetails] = useState<UserDetail | null>(null); // <-- NUEVO ESTADO para detalles del usuario
  const [dialogLoadingDetails, setDialogLoadingDetails] = useState(false); // <-- Estado de carga para los detalles del diálogo
  const [dialogDetailsError, setDialogDetailsError] = useState<string | null>(null); // <-- Estado de error para los detalles del diálogo
  const [dialogSuccess, setDialogSuccess] = useState<string | null>(null);


  // --- Función para cargar las licencias (reutilizable) ---
  const fetchLicenses = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get<License[]>(`${process.env.NEXT_PUBLIC_API_BASE_URL}/licenses/user/${userId}`);
      setLicenses(response.data);
      setError(null);
    } catch (err: any) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setLicenses([]);
        setError(null);
      } else {
        console.error('Error fetching licenses:', err);
        setError('Error al cargar las licencias desde el servidor');
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchLicenses();
    }
  }, [userId, fetchLicenses]);

  // --- Lógica de filtrado ---
  useEffect(() => {
    let currentFiltered = licenses;

    // Filtro por fecha (coincidencia en startDate o endDate, por fecha completa o solo por año)
    if (filterDate) {
      const lowercasedFilterDate = filterDate.toLowerCase(); // '2024-05-15' o '2024'
      currentFiltered = currentFiltered.filter(license => {
        // Formatear fechas de licencia a un formato comparable (ej. '2024-05-15')
        const formattedStartDate = format(parseISO(license.startDate), 'yyyy-MM-dd').toLowerCase();
        const formattedEndDate = format(parseISO(license.endDate), 'yyyy-MM-dd').toLowerCase();

        // Comprobar si la fecha de filtro coincide con la fecha completa de inicio/fin
        const matchesFullDate = formattedStartDate.includes(lowercasedFilterDate) || formattedEndDate.includes(lowercasedFilterDate);

        // Si la fecha de filtro es solo un año, comprobar si coincide con el año de inicio/fin
        const matchesYear = (lowercasedFilterDate.length === 4 && (formattedStartDate.startsWith(lowercasedFilterDate) || formattedEndDate.startsWith(lowercasedFilterDate)));

        return matchesFullDate || matchesYear;
      });
    }

    // Filtro por aprobación de supervisor
    if (filterSupervisorApproval !== 'all') {
      const approvalStatus = filterSupervisorApproval === 'true';
      currentFiltered = currentFiltered.filter(license => license.immediateSupervisorApproval === approvalStatus);
    }

    // Filtro por aprobación de departamento
    if (filterDepartmentApproval !== 'all') {
      const approvalStatus = filterDepartmentApproval === 'true';
      currentFiltered = currentFiltered.filter(license => license.personalDepartmentApproval === approvalStatus);
    }

    setFilteredLicenses(currentFiltered);
    setPage(0); // Reiniciar a la primera página cuando se filtra
  }, [licenses, filterDate, filterSupervisorApproval, filterDepartmentApproval]);


  // Función para resetear todos los filtros
  const resetFilters = () => {
    setFilterDate(''); // Resetear el único campo de fecha
    setFilterSupervisorApproval('all');
    setFilterDepartmentApproval('all');
  };

  // --- Lógica de paginación ---
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const currentLicenses = filteredLicenses.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const getStatusColor = (approved: boolean) => {
    return approved ? 'success' : 'error';
  };

  // --- handleOpenDetailsDialog: Carga la licencia y luego el usuario ---
  const handleOpenDetailsDialog = async (licenseId: number) => {
    setSelectedLicenseId(licenseId);
    setOpenDetailsDialog(true);
    setDialogLoadingDetails(true); // Usamos un estado de carga específico para el diálogo
    setDialogDetailsError(null);   // Limpiar errores previos del diálogo
    setDialogSuccess(null);        // Limpiar mensajes de éxito previos
    setDialogLicenseDetails(null); // Limpiar detalles de licencia previos
    setDialogUserDetails(null);    // Limpiar detalles de usuario previos

    try {
      const licenseResponse = await axios.get<License>(`${process.env.NEXT_PUBLIC_API_BASE_URL}/licenses/${licenseId}`);
      setDialogLicenseDetails(licenseResponse.data);

      const userIdFromLicense = licenseResponse.data.userId;
      if (userIdFromLicense) {
        const userResponse = await axios.get<UserDetail>(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/${userIdFromLicense}`);
        setDialogUserDetails(userResponse.data);
      } else {
        setDialogDetailsError('ID de usuario no encontrado para esta licencia.');
      }
    } catch (err: any) {
      console.error('Error fetching details for dialog:', err);
      setDialogDetailsError('Error al cargar los detalles de la licencia o del usuario.');
      setDialogLicenseDetails(null);
      setDialogUserDetails(null);
    } finally {
      setDialogLoadingDetails(false);
    }
  };

  const handleCloseDetailsDialog = () => {
    setOpenDetailsDialog(false);
    setSelectedLicenseId(null);
    setDialogLicenseDetails(null);
    setDialogUserDetails(null);       // Limpiar al cerrar
    setDialogDetailsError(null);      // Limpiar al cerrar
    setDialogSuccess(null);           // Limpiar al cerrar
  };

  // --- Lógica para eliminar licencia ---
  const handleDeleteLicense = async () => {
    if (!selectedLicenseId) return;

    setDialogLoadingDetails(true); // Usamos el estado de carga del diálogo
    setDialogDetailsError(null);
    setDialogSuccess(null);

    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_BASE_URL}/licenses/${selectedLicenseId}/admin-remove`);
      setDialogSuccess('Licencia eliminada correctamente.');
      // Después de eliminar, recargar la tabla de licencias
      // y cerrar el diálogo después de un breve retraso para que el usuario vea el mensaje
      setTimeout(() => {
        handleCloseDetailsDialog();
        fetchLicenses(); // Recargar la lista principal
      }, 1500); // Dar 1.5 segundos para ver el mensaje de éxito
    } catch (err: any) {
      console.error('Error deleting license:', err);
      if (axios.isAxiosError(err) && err.response) {
        setDialogDetailsError(`Error al eliminar: ${err.response.data.message || 'Error desconocido'}`);
      } else {
        setDialogDetailsError('Error de red o desconocido al eliminar la licencia.');
      }
    } finally {
      setDialogLoadingDetails(false);
    }
  };

  // --- Función para obtener el icono según el tipo de licencia ---
  const getLicenseTypeIcon = (licenseType: string) => {
    switch (licenseType) {
      case 'VACACION':
        return <HolidayVillageIcon color="primary" sx={{ mr: 0.5 }} />;
      case 'LICENCIA_MEDICA':
        return <MedicalServicesIcon color="error" sx={{ mr: 0.5 }} />;
      case 'AUSENCIA_INJUSTIFICADA':
        return <WorkOffIcon color="warning" sx={{ mr: 0.5 }} />;
      case 'PERMISO_REMUNERADO':
        return <PaidIcon color="info" sx={{ mr: 0.5 }} />;
      default:
        return null;
    }
  };
  // --- Función para generar PDF ---
  const handleDownloadPDF = () => {
    // Usar dialogUserDetails para el PDF si ya está cargado
    if (!dialogLicenseDetails || !dialogUserDetails) { // Usamos dialogLicenseDetails y dialogUserDetails del estado del diálogo
      setDialogDetailsError('Detalles de la licencia o del usuario no disponibles para generar el PDF.');
      return;
    }

    const pdf = generateLicensePdf(dialogLicenseDetails, { // Pasamos dialogLicenseDetails
      user: {
        fullName: dialogUserDetails.fullName,
        ci: dialogUserDetails.ci
      }
    });

    pdf.save(`licencia_${dialogLicenseDetails.id}_${dialogUserDetails.fullName.replace(/\s+/g, '_')}.pdf`);
    setDialogSuccess('PDF generado correctamente.');
    setTimeout(() => setDialogSuccess(null), 3000); // Limpiar mensaje de éxito después de 3 segundos
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        {error}
      </Alert>
    );
  }

  const noLicensesFound = licenses.length === 0 && !error;
  const noFilteredResults = filteredLicenses.length === 0 && (filterDate || filterSupervisorApproval !== 'all' || filterDepartmentApproval !== 'all');

  return (
    <Box sx={{ mt: 2 }}>
      {/* Filtros */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          label="Filtrar por Fecha (YYYY-MM-DD o YYYY)"
          variant="outlined"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <EventIcon />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 280, flexGrow: 1 }}
        />
        <FormControl variant="outlined" sx={{ minWidth: 180 }}>
          <InputLabel>Aprobación Supervisor</InputLabel>
          <Select
            value={filterSupervisorApproval}
            onChange={(e) => setFilterSupervisorApproval(e.target.value as string)}
            label="Aprobación Supervisor"
          >
            <MenuItem value="all">Todas</MenuItem>
            <MenuItem value="true">Aprobado</MenuItem>
            <MenuItem value="false">Rechazado</MenuItem>
          </Select>
        </FormControl>
        <FormControl variant="outlined" sx={{ minWidth: 180 }}>
          <InputLabel>Aprobación Depto. Personal</InputLabel>
          <Select
            value={filterDepartmentApproval}
            onChange={(e) => setFilterDepartmentApproval(e.target.value as string)}
            label="Aprobación Depto. Personal"
          >
            <MenuItem value="all">Todas</MenuItem>
            <MenuItem value="true">Aprobado</MenuItem>
            <MenuItem value="false">Rechazado</MenuItem>
          </Select>
        </FormControl>
        <Button variant="outlined" onClick={resetFilters} sx={{ height: '56px' }}>
          Limpiar Filtros
        </Button>
      </Box>

      {noLicensesFound ? (
        <Typography variant="body1" sx={{ py: 4, textAlign: 'center' }}>
          El usuario no tiene licencias registradas.
        </Typography>
      ) : noFilteredResults ? (
        <Typography variant="body1" sx={{ py: 4, textAlign: 'center' }}>
          No se encontraron licencias que coincidan con los filtros aplicados.
        </Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tipo</TableCell>
                <TableCell>Duración</TableCell>
                <TableCell>Fecha Inicio</TableCell>
                <TableCell>Fecha Fin</TableCell>
                <TableCell>Dias</TableCell>
                <TableCell>Estado Supervisor</TableCell>
                <TableCell>Estado Departamento</TableCell>
                <TableCell>Registrado</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {currentLicenses.map((license) => (
                <TableRow key={license.id}>
                  <TableCell>{license.licenseType}</TableCell>
                  <TableCell>{license.timeRequested}</TableCell>
                  <TableCell>{formatDate(license.startDate)}</TableCell>
                  <TableCell>{formatDate(license.endDate)}</TableCell>
                  <TableCell>{license.totalDays}</TableCell>
                  <TableCell>
                    <Chip
                      label={license.immediateSupervisorApproval ? 'Aprobado' : 'Rechazado'}
                      color={getStatusColor(license.immediateSupervisorApproval)}
                      size="small"
                      icon={license.immediateSupervisorApproval ? <CheckCircleIcon /> : <CancelIcon />}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={license.personalDepartmentApproval ? 'Aprobado' : 'Rechazado'}
                      color={getStatusColor(license.personalDepartmentApproval)}
                      size="small"
                      icon={license.personalDepartmentApproval ? <CheckCircleIcon /> : <CancelIcon />}
                    />
                  </TableCell>
                  <TableCell>{formatDate(license.issuedDate)}</TableCell>
                  <TableCell>
                    <IconButton
                      aria-label="acciones"
                      onClick={() => handleOpenDetailsDialog(license.id)}
                      size="small"
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Paginación */}
      {!noLicensesFound && !noFilteredResults && (
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredLicenses.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
          }
        />
      )}

      {/* --- Diálogo de Detalles y Acciones --- */}
      <Dialog open={openDetailsDialog} onClose={handleCloseDetailsDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Detalles de Licencia
          <IconButton
            aria-label="close"
            onClick={handleCloseDetailsDialog}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {dialogLoadingDetails ? ( // Usamos el nuevo estado de carga para el diálogo
            <Box display="flex" justifyContent="center" py={2}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {dialogDetailsError && <Alert severity="error" sx={{ mb: 2 }}>{dialogDetailsError}</Alert>}
              {dialogSuccess && <Alert severity="success" sx={{ mb: 2 }}>{dialogSuccess}</Alert>}

              {dialogLicenseDetails && dialogUserDetails ? ( // Asegúrate de que ambos objetos existan
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle1" gutterBottom><strong>Información de la Licencia</strong></Typography>
                    <Typography sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography component="span" fontWeight="bold" mr={0.5}>ID:</Typography> {dialogLicenseDetails.id}
                    </Typography>
                    <Typography sx={{ display: 'flex', alignItems: 'center' }}>
                      {getLicenseTypeIcon(dialogLicenseDetails.licenseType)}
                      <Typography component="span" fontWeight="bold" mr={0.5}>Tipo:</Typography> {dialogLicenseDetails.licenseType}
                    </Typography>
                    <Typography sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography component="span" fontWeight="bold" mr={0.5}>Duración:</Typography> {dialogLicenseDetails.timeRequested}
                    </Typography>
                    <Typography sx={{ display: 'flex', alignItems: 'center' }}>
                      <EventIcon sx={{ mr: 0.5 }} />
                      <Typography component="span" fontWeight="bold" mr={0.5}>Inicio:</Typography> {formatDate(dialogLicenseDetails.startDate)}
                    </Typography>
                    <Typography sx={{ display: 'flex', alignItems: 'center' }}>
                      <EventIcon sx={{ mr: 0.5 }} />
                      <Typography component="span" fontWeight="bold" mr={0.5}>Fin:</Typography> {formatDate(dialogLicenseDetails.endDate)}
                    </Typography>
                    <Typography sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography component="span" fontWeight="bold" mr={0.5}>Días Totales:</Typography> {dialogLicenseDetails.totalDays}
                    </Typography>
                    <Typography sx={{ display: 'flex', alignItems: 'center' }}>
                      <EventIcon sx={{ mr: 0.5 }} />
                      <Typography component="span" fontWeight="bold" mr={0.5}>Emisión:</Typography> {formatDate(dialogLicenseDetails.issuedDate)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle1" gutterBottom><strong>Información del Solicitante</strong></Typography>
                    <Typography><strong>Nombre:</strong> {dialogUserDetails.fullName || 'N/A'}</Typography>
                    <Typography><strong>CI:</strong> {dialogUserDetails.ci || 'N/A'}</Typography>
                    <Typography><strong>Celular:</strong> {dialogUserDetails.celular || 'N/A'}</Typography>
                    <Typography><strong>Posición:</strong> {dialogUserDetails.position || 'N/A'}</Typography>
                    <Typography><strong>Unidad Académica:</strong> {dialogUserDetails.academicUnit?.name || 'N/A'}</Typography>
                    <Typography><strong>Departamento:</strong> {dialogUserDetails.department?.name || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Box display="flex" justifyContent="space-around" mt={2} p={2} borderRadius={1}>
                      <Box textAlign="center">
                        <Typography variant="body2"><strong>Aprobación Jefe Superior</strong></Typography>
                        <Chip
                          label={dialogLicenseDetails.immediateSupervisorApproval ? 'Aprobado' : 'Pendiente'}
                          color={dialogLicenseDetails.immediateSupervisorApproval ? 'primary' : 'default'}
                          icon={dialogLicenseDetails.immediateSupervisorApproval ? <CheckCircle /> : <Cancel />}
                        />
                      </Box>
                      <Box textAlign="center">
                        <Typography variant="body2"><strong>Aprobación Dpto. Personal</strong></Typography>
                        <Chip
                          label={dialogLicenseDetails.personalDepartmentApproval ? 'Aprobado' : 'Pendiente'}
                          color={dialogLicenseDetails.personalDepartmentApproval ? 'primary' : 'default'}
                          icon={dialogLicenseDetails.personalDepartmentApproval ? <CheckCircle /> : <Cancel />}
                        />
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              ) : (
                // Mostrar un mensaje si no se pudieron cargar los detalles completos
                !dialogDetailsError && <Typography variant="body2">No se pudieron cargar los detalles completos de la licencia o del usuario.</Typography>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleDownloadPDF} // <-- Llama a la función de descarga de PDF
            color="info" // Un color distintivo para el PDF
            startIcon={<PictureAsPdfIcon />} // <-- Ícono de PDF
            disabled={dialogLoadingDetails || !dialogLicenseDetails || !dialogUserDetails} // Deshabilitar si está cargando o faltan datos
            sx={{ mr: 'auto' }} // Para empujar el botón a la izquierda
          >
            Generar PDF
          </Button>
          <Button
            onClick={handleDeleteLicense}
            color="error"
            startIcon={<DeleteIcon />}
            disabled={dialogLoadingDetails || dialogSuccess !== null}
          >
            Eliminar Licencia
          </Button>
          <Button onClick={handleCloseDetailsDialog} color="primary" disabled={dialogLoadingDetails}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserLicenseList;