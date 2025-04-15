import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Box,
} from '@mui/material';
import Icon from 'src/@core/components/icon';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { useTheme } from '@mui/material/styles';
import useUser from 'src/hooks/useUser';

interface Notification {
  id: number;
  message: string;
  createdAt: string;
  read: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

const AllNotificationsDialog = ({ open, onClose }: Props) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useUser();
  const theme = useTheme();

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user?.id) return;

      setLoading(true);
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/notifications/${user.id}`);
        setNotifications(res.data);
      } catch (error) {
        console.error('Error loading notifications', error);
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchNotifications();
    }
  }, [open, user?.id]);

  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={onClose} scroll="paper">
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: theme.palette.background.default,
        }}
      >
        <Typography variant="h6">Todas las notificaciones</Typography>
        <IconButton edge="end" onClick={onClose}>
          <Icon icon="mdi:close" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : notifications.length === 0 ? (
          <Typography variant="body2" color="textSecondary" align="center">
            No tienes notificaciones.
          </Typography>
        ) : (
          <List disablePadding>
            {notifications.map((notif) => (
              <ListItem
                key={notif.id}
                divider
                sx={{
                  alignItems: 'flex-start',
                  backgroundColor: notif.read ? 'inherit' : theme.palette.action.hover,
                }}
              >
                <ListItemText
                  primary={<Typography sx={{ fontWeight: 600 }}>{notif.message}</Typography>}
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {formatDistanceToNow(new Date(notif.createdAt))} ago
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AllNotificationsDialog;
