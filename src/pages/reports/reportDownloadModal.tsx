import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Snackbar,
  Alert
} from '@mui/material';
import { Download, Close } from '@mui/icons-material';
import MonthlyReportForm from './reportTypes/monthlyReportForm';
import reportService from 'src/services/report.service';

interface ReportDownloadModalProps {
  open: boolean;
  onClose: () => void;
}

const ReportDownloadModal: React.FC<ReportDownloadModalProps> = ({ open, onClose }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleDownload = async (params: any) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await reportService.downloadReport({
        year: params.year,
        month: params.month,
        employeeType: params.employeeType
      });
      onClose();
    } catch (err) {
      console.error('Error al descargar:', err);
      setError('Error al descargar el reporte. Por favor intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseError = () => {
    setError(null);
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center">
              <Download sx={{ mr: 1 }} />
              Generar Reporte
            </Box>
            <IconButton onClick={onClose} disabled={isLoading}>
              <Close />
            </IconButton>
          </Box>
          <Tabs value={activeTab} onChange={handleTabChange} sx={{ mt: 2 }}>
            <Tab label="Mensual/Año" disabled={isLoading} />
          </Tabs>
        </DialogTitle>
        <DialogContent dividers>
          {activeTab === 0 && (
            <MonthlyReportForm onSubmit={handleDownload} loading={isLoading} />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit" disabled={isLoading}>
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ReportDownloadModal;