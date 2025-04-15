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
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import useUser from 'src/hooks/useUser';

export type NotificationsType = {
  id: number;
  message: string;
  createdAt: string;
  read: boolean;
};

interface Props {
  open: boolean;
  onClose: () => void;
  notification?: NotificationsType | null; // ✅ Agregado para mostrar una sola notificación opcional
}

const NotificationDialog = ({ open, onClose, notification }: Props) => {
  const [notifications, setNotifications] = useState<NotificationsType[]>([]);
  const user = useUser();

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
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
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


  const renderNotification = (n: NotificationsType) => (
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
      {!n.read && (
        <Button
          size="small"
          variant="outlined"
          onClick={() => handleMarkAsRead(n.id)}
          sx={{ mt: 1 }}
        >
          Marcar como leída
        </Button>
      )}
    </Box>
  );

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
    </Dialog>
  );
};

export default NotificationDialog;
