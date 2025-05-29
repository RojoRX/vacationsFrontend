import { useState, useEffect, Fragment, SyntheticEvent, ReactNode } from 'react';
import axios from 'src/lib/axios';
import { formatDistanceToNow } from 'date-fns';

// ** MUI Imports
import Box from '@mui/material/Box';
import Badge from '@mui/material/Badge';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';
import { styled, Theme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import MuiMenu, { MenuProps } from '@mui/material/Menu';
import MuiMenuItem, { MenuItemProps } from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import NotificationDialog from 'src/views/notifications/NotificationDialog'; // importar tu nuevo componente

// ** Icon Imports
import Icon from 'src/@core/components/icon';

// ** Third Party Components
import PerfectScrollbarComponent from 'react-perfect-scrollbar';

// ** Util Import
import useUser from 'src/hooks/useUser';
import { Settings } from 'src/@core/context/settingsContext';
import AllNotificationsDialog from 'src/views/notifications/AllNotificationsDialog';

export type NotificationsType = {
  id: number;
  message: string;
  createdAt: string;
  read: boolean;
  resourceType?: 'VACATION' | 'LICENSE';
  resourceId?: number;
};

interface Props {
  settings: Settings;
  notifications: NotificationsType[];
}

// Styled components
const Menu = styled(MuiMenu)<MenuProps>(({ theme }) => ({
  '& .MuiMenu-paper': {
    width: 380,
    overflow: 'hidden',
    marginTop: theme.spacing(4),
    [theme.breakpoints.down('sm')]: {
      width: '100%',
    },
  },
  '& .MuiMenu-list': {
    padding: 0,
  },
}));

const MenuItem = styled(MuiMenuItem)<MenuItemProps>(({ theme }) => ({
  paddingTop: theme.spacing(3),
  paddingBottom: theme.spacing(3),
  '&:not(:last-of-type)': {
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
}));

const PerfectScrollbar = styled(PerfectScrollbarComponent)({
  maxHeight: 344,
});

const MenuItemTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  fontSize: '0.875rem',
  marginBottom: theme.spacing(0.75),
  wordBreak: 'break-word',
  whiteSpace: 'normal',
  display: '-webkit-box',
  WebkitBoxOrient: 'vertical',
  WebkitLineClamp: 2,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}));

const MenuItemSubtitle = styled(Typography)(({ theme }) => ({
  fontSize: '0.75rem',
  color: theme.palette.text.secondary,
  wordBreak: 'break-word',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}));

const ScrollWrapper = ({ children, hidden }: { children: ReactNode; hidden: boolean }) => {
  if (hidden) {
    return <Box sx={{ maxHeight: 349, overflowY: 'auto', overflowX: 'hidden' }}>{children}</Box>;
  } else {
    return <PerfectScrollbarComponent options={{ wheelPropagation: false, suppressScrollX: true }}>{children}</PerfectScrollbarComponent>;
  }
};

const NotificationDropdown = ({ settings }: Props) => {
  const [anchorEl, setAnchorEl] = useState<(EventTarget & Element) | null>(null);
  const [notificationsData, setNotificationsData] = useState<NotificationsType[]>([]);
  const [hiddenNotifs, setHiddenNotifs] = useState<number[]>([]);
  const { direction } = settings;
  const user = useUser();
  const hidden = useMediaQuery((theme: Theme) => theme.breakpoints.down('lg'));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<NotificationsType | null>(null);
  const [allDialogOpen, setAllDialogOpen] = useState(false);

  useEffect(() => {
    if (user?.id) {
      const fetchNotifications = async () => {
        try {
          if (!user?.id) return;

          // Siempre usamos el mismo endpoint
          const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/notifications/${user.id}/unread`;

          const response = await axios.get(url);
          //console.log('Notificaciones recibidas:', response.data, 'para el usuario:', user); // <-- agrega esta línea aquí
          setNotificationsData(response.data);

          setNotificationsData(response.data);
        } catch (error) {
          console.error('Error fetching notifications:', error);
        }
      };


      fetchNotifications();
      const intervalId = setInterval(fetchNotifications, 10000); // Actualizar notificaciones cada 10 segundos
      return () => clearInterval(intervalId);
    }
  }, [user?.id, user?.role]);

  const handleDropdownClose = () => setAnchorEl(null);

  const handleMarkAsRead = async (id: number) => {
    try {
      await axios.patch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/notifications/${id}/read`);
      setHiddenNotifs((prev) => [...prev, id]);
      setTimeout(() => {
        setNotificationsData((prev) => prev.filter((n) => n.id !== id));
        setHiddenNotifs((prev) => prev.filter((i) => i !== id));
      }, 300);
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleNotificationClick = (notification: NotificationsType) => {
    setSelectedNotification(notification);
    handleDropdownClose(); // cerrar primero el dropdown
    setTimeout(() => setDialogOpen(true), 300); // dar tiempo a cerrar antes de abrir el diálogo
  };

  const handleDropdownOpen = (event: SyntheticEvent) => setAnchorEl(event.currentTarget);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-BO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };
  const beautifyNotificationMessage = (message: string): string => {
    const dateRegex = /\d{4}-\d{2}-\d{2}T[^\s]+/g;
    const matches = message.match(dateRegex);

    if (matches && matches.length >= 2) {
      const formattedStart = formatDate(matches[0]);
      const formattedEnd = formatDate(matches[1]);

      // Reemplazar las fechas originales por las formateadas
      let newMessage = message.replace(matches[0], formattedStart);
      newMessage = newMessage.replace(matches[1], formattedEnd);

      return newMessage;
    }

    return message; // Si no hay fechas, retornar el mensaje original
  };

  return (
    <Fragment>
      <IconButton color="inherit" onClick={handleDropdownOpen}>
        <Badge
          color="error"
          variant="dot"
          invisible={!notificationsData.length}
          sx={{
            '& .MuiBadge-badge': {
              top: 4,
              right: 4,
              boxShadow: (theme) => `0 0 0 2px ${theme.palette.background.paper}`,
            },
          }}
        >
          <Icon icon="mdi:bell-outline" />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleDropdownClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: direction === 'ltr' ? 'right' : 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: direction === 'ltr' ? 'right' : 'left' }}
      >
        <MenuItem
          disableRipple
          disableTouchRipple
          sx={{ cursor: 'default', userSelect: 'auto', backgroundColor: 'transparent !important' }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Typography sx={{ fontWeight: 600 }}>Notificaciones</Typography>
            <Button variant="text" size="small">
              {notificationsData.length} Nuevas
            </Button>
          </Box>
        </MenuItem>
        <ScrollWrapper hidden={hidden}>
          {notificationsData.map((notification) => (
            <Collapse key={notification.id} in={!hiddenNotifs.includes(notification.id)}>
              <MenuItem>
                <Box
                  onClick={() => handleNotificationClick(notification)}
                  sx={{ width: '100%', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                >
                  <Box sx={{ mx: 4, flex: '1 1', display: 'flex', flexDirection: 'column' }}>
                    <MenuItemTitle>{beautifyNotificationMessage(notification.message)}</MenuItemTitle>

                    <MenuItemSubtitle variant="body2">
                      {formatDistanceToNow(new Date(notification.createdAt))} ago
                    </MenuItemSubtitle>
                  </Box>
                  <IconButton
                    size="small"
                    color="primary"
                    sx={{ ml: 1 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkAsRead(notification.id);
                    }}
                  >
                    <Icon icon="mdi:check" fontSize="1.125rem" />
                  </IconButton>
                </Box>
              </MenuItem>
            </Collapse>
          ))}
        </ScrollWrapper>
        <MenuItem
          disableRipple
          disableTouchRipple
          sx={{
            py: 3.5,
            borderBottom: 0,
            cursor: 'default',
            userSelect: 'auto',
            backgroundColor: 'transparent !important',
            borderTop: (theme) => `1px solid ${theme.palette.divider}`,
          }}
        >
          <Button fullWidth variant="contained" onClick={() => {
            handleDropdownClose();
            setTimeout(() => setAllDialogOpen(true), 300);
          }} >
            LEER NOTIFICACIONES
          </Button>
        </MenuItem>
      </Menu>

      <NotificationDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        notification={selectedNotification}
      />
      <AllNotificationsDialog
        open={allDialogOpen}
        onClose={() => setAllDialogOpen(false)}
      />
    </Fragment>
  );
};

export default NotificationDropdown;
