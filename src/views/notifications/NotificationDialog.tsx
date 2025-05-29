import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  IconButton,
  Box,
  Stack
} from '@mui/material';
import { useEffect, useState } from 'react';
import Icon from 'src/@core/components/icon';
import axios from 'src/lib/axios';
import { formatDistanceToNow } from 'date-fns';
import useUser from 'src/hooks/useUser';
import { useRouter } from 'next/router';
import LicenseDetailDialog from 'src/pages/permissions/detail-dialog';

export type NotificationsType = {
  id: number;
  message: string;
  createdAt: string;
  read: boolean;
  resourceType?: 'VACATION' | 'LICENSE' | string;
  resourceId?: number;
};

interface Props {
  open: boolean;
  onClose: () => void;
  notification?: NotificationsType | null;
}

const NotificationDialog = ({ open, onClose, notification }: Props) => {
  const [notifications, setNotifications] = useState<NotificationsType[]>([]);
  const [selectedLicense, setSelectedLicense] = useState<any | null>(null);
  const [licenseUserDetails, setLicenseUserDetails] = useState<any>({});
  const [licenseDialogOpen, setLicenseDialogOpen] = useState(false);

  const user = useUser();
  const router = useRouter();

  const fetchNotifications = async () => {

    if (!user?.id) return;
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/notifications/${user.id}`);
      setNotifications(res.data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await axios.patch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleNotificationRedirect = async (notification: NotificationsType) => {
    if (notification.resourceType === 'LICENSE' && notification.resourceId) {
      try {
        const licenseRes = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/licenses/${notification.resourceId}`);
        const licenseData = licenseRes.data;

        const userRes = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/${licenseData.userId}`);
        const userData = userRes.data;

        const formattedUserDetails = {
          [userData.id]: {
            name: userData.fullName,
            ci: userData.ci,
            celular: userData.celular,
            department: userData.department?.name || userData.academicUnit?.name || 'N/A'
          }
        };

        setSelectedLicense(licenseData);
        setLicenseUserDetails(formattedUserDetails);
        setLicenseDialogOpen(true);
      } catch (error) {
        console.error('Error al cargar licencia y usuario:', error);
      }
    } else if (notification.resourceType === 'VACATION' && notification.resourceId) {
      onClose();
      setTimeout(() => {
        router.push(`/vacations/vacations-requests/${notification.resourceId}`);
      }, 200);
    }
  };

  useEffect(() => {
    if (open && !notification) fetchNotifications();
  }, [open, notification]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-BO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(date);
  };

  const beautifyNotificationMessage = (message: string): string => {
    const dateRegex = /\d{4}-\d{2}-\d{2}T[^\s]+/g;
    const matches = message.match(dateRegex);

    if (matches && matches.length >= 2) {
      const formattedStart = formatDate(matches[0]);
      const formattedEnd = formatDate(matches[1]);

      let newMessage = message.replace(matches[0], formattedStart);
      newMessage = newMessage.replace(matches[1], formattedEnd);

      return newMessage;
    }

    return message;
  };

  const renderNotification = (n: NotificationsType) => {
    console.log('Notificación:', n); // ✅ ahora sí podés depurar

    return (
      <Box
        key={n.id}
        p={2}
        border={1}
        borderRadius={2}
        borderColor="divider"
        bgcolor={n.read ? 'background.default' : 'action.hover'}
      >
        <Typography fontWeight={600}>{beautifyNotificationMessage(n.message)}</Typography>

        <Typography variant="body2" color="text.secondary">
          {formatDistanceToNow(new Date(n.createdAt))} atrás
        </Typography>

        <Stack direction="row" spacing={1} mt={2}>
          {!n.read && (
            <Button
              size="small"
              variant="outlined"
              onClick={() => handleMarkAsRead(n.id)}
            >
              Marcar como leída
            </Button>
          )}

          <Button
            size="small"
            variant="contained"
            disabled={!n.resourceType || !n.resourceId}
            onClick={() => handleNotificationRedirect(n)}
          >
            Ver detalle
          </Button>
        </Stack>
      </Box>
    );
  };

  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={onClose}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between' }}>
        Notificaciones
        <IconButton onClick={onClose}>
          <Icon icon="mdi:close" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {notification ? (
          renderNotification(notification)
        ) : notifications.length === 0 ? (
          <Typography variant="body2" color="textSecondary">
            No hay notificaciones aún.
          </Typography>
        ) : (
          <Stack spacing={3} mt={1}>
            {notifications.map(renderNotification)}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>

      {selectedLicense && (
        <LicenseDetailDialog
          open={licenseDialogOpen}
          onClose={() => setLicenseDialogOpen(false)}
          license={selectedLicense}
          userDetails={licenseUserDetails}
          currentUser={user}
          onLicenseUpdate={updated => setSelectedLicense(updated)}
        />
      )}
    </Dialog>
  );
};

export default NotificationDialog;
