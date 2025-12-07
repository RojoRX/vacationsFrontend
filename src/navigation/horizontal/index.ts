// ** Type import
import { HorizontalNavItemsType } from 'src/@core/layouts/types'

const navigation = (): HorizontalNavItemsType => {
  return [
    {
      title: 'Vacaciones',
      icon: 'mdi:beach',
      children: [
        {
          title: 'Solicitar Vacaciones',
          path: '/welcome',
          action: 'read',
          subject: 'welcome-dashboard',
          meta: { description: 'Formulario para solicitar vacaciones' }
        },
        {
          title: 'Resumen',
          path: '/vacations/vacations-dashboard',
          action: 'read',
          subject: 'vacation-dashboard',
          meta: { description: 'Resumen de tus vacaciones' }
        },
        {
          title: 'Mis Solicitudes',
          path: '/vacations/vacations-requests',
          action: 'read',
          subject: 'vacation-request-list',
          meta: { description: 'Ver tus solicitudes de vacaciones' }
        },
        {
          title: 'Solicitudes del Personal',
          path: '/vacations/vacations-supervisor',
          action: 'read',
          subject: 'supervisor-vacation-requests',
          meta: { description: 'Gestionar solicitudes del personal a tu cargo' }
        },
        {
          title: 'Todas las Solicitudes',
          path: '/vacations/vacations-admin',
          action: 'read',
          meta: { description: 'Administración de todas las solicitudes de vacaciones' }
        }
      ]
    },
    {
      title: 'Permisos',
      icon: 'mdi:clipboard-text',
      children: [
        {
          title: 'Solicitar Permiso',
          path: '/welcome',
          action: 'read',
          subject: 'welcome-dashboard',
          meta: { description: 'Formulario para solicitar permisos' }
        },
        {
          title: 'Mis Permisos',
          path: '/permissions/user-licenses',
          action: 'read',
          subject: 'user-licenses',
          meta: { description: 'Ver tus permisos activos' }
        },
        {
          title: 'Solicitudes Pendientes del Personal',
          path: '/permissions/department-permission',
          action: 'read',
          subject: 'department-permission',
          meta: { description: 'Gestionar permisos pendientes del personal' }
        },
        {
          title: 'Gestión de Permisos',
          path: '/permissions/adminlicenses',
          action: 'read',
          subject: 'adminlicenses',
          meta: { description: 'Administrar todos los permisos' }
        }
      ]
    },
    {
      title: 'Usuarios',
      icon: 'mdi:account-multiple',
      children: [
        {
          title: 'Buscar Usuarios',
          path: '/users/search-users',
          action: 'read',
          meta: { description: 'Buscar y consultar usuarios' }
        },
        {
          title: 'Agregar Usuario',
          path: '/users/add-user',
          action: 'create',
          meta: { description: 'Registrar un nuevo usuario' }
        },
        {
          title: 'Usuarios Eliminados',
          path: '/users/restore-users',
          action: 'update',
          meta: { description: 'Restaurar usuarios eliminados' }
        },
        {
          title: 'Modificar Roles',
          path: '/users/role-users',
          action: 'update',
          meta: { description: 'Modificar roles de los usuarios' }
        }
      ]
    }
  ]
}

export default navigation
