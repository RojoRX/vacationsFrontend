// ** Type import
import { VerticalNavItemsType } from 'src/@core/layouts/types'

const navigation = (): VerticalNavItemsType => {
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
          meta: { description: 'Formulario para solicitar vacaciones' },
        },
        {
          title: 'Resumen',
          path: '/vacations/vacations-dashboard',
          action: 'read',
          subject: 'vacation-dashboard',
          meta: { description: 'Resumen de tus vacaciones' },
        },
        {
          title: 'Mis Solicitudes',
          path: '/vacations/vacations-requests',
          action: 'read',
          subject: 'vacation-request-list',
          meta: { description: 'Ver tus solicitudes de vacaciones' },
        },
        {
          title: 'Solicitudes del Personal',
          path: '/vacations/vacations-supervisor',
          action: 'read',
          subject: 'supervisor-vacation-requests',
          meta: { description: 'Gestionar solicitudes del personal a tu cargo' },
        },
        {
          title: 'Todas las Solicitudes',
          path: '/vacations/vacations-admin',
          action: 'read',
          meta: { description: 'Administración de todas las solicitudes de vacaciones' },
        },
      ],
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
          meta: { description: 'Formulario para solicitar permisos' },
        },
        {
          title: 'Mis Permisos',
          path: '/permissions/user-licenses',
          action: 'read',
          subject: 'user-licenses',
          meta: { description: 'Ver tus permisos activos' },
        },
        {
          title: 'Solicitudes Pendientes del Personal',
          path: '/permissions/department-permission',
          action: 'read',
          subject: 'department-permission',
          meta: { description: 'Gestionar permisos pendientes del personal' },
        },
        {
          title: 'Gestión de Permisos',
          path: '/permissions/adminlicenses',
          action: 'read',
          subject: 'adminlicenses',
          meta: { description: 'Administrar todos los permisos' },
        },
      ],
    },
    {
      title: 'Recesos',
      icon: 'mdi:calendar-blank-outline',
      children: [
        {
          title: 'Recesos Generales',
          icon: 'mdi:calendar-multiple',
          path: '/holidayPeriods/generalHoliday',
          action: 'read',
          subject: 'holiday-periods',
          meta: { description: 'Ver los recesos generales' },
        },
        {
          title: 'Mis Recesos',
          icon: 'mdi:calendar-account',
          path: '/holidayPeriods/personalHolidayPeriods',
          action: 'read',
          subject: 'personal-holiday-periods',
          meta: { description: 'Ver tus recesos personales' },
        },
      ],
    },
    {
      title: 'Usuarios',
      icon: 'mdi:account-multiple',
      children: [
        {
          title: 'Buscar Usuarios',
          path: '/users/search-users',
          action: 'read',
          meta: { description: 'Buscar y consultar usuarios' },
        },
        {
          title: 'Agregar Usuario',
          path: '/users/add-user',
          action: 'create',
          meta: { description: 'Registrar un nuevo usuario' },
        },
        {
          title: 'Usuarios Eliminados',
          path: '/users/restore-users',
          action: 'update',
          meta: { description: 'Restaurar usuarios eliminados' },
        },
        {
          title: 'Modificar Roles',
          path: '/users/role-users',
          action: 'update',
          meta: { description: 'Modificar roles de los usuarios' },
        },
      ],
    },
    {
      title: 'Gestión Organizacional',
      icon: 'mdi:settings',
      children: [
        {
          title: 'Recesos Generales',
          icon: 'mdi:calendar-blank-outline',
          path: '/recesos/management',
          action: 'manage',
          meta: { description: 'Administrar recesos generales' },
        },
        {
          title: 'Recesos Administrativos',
          icon: 'mdi:calendar-blank-outline',
          path: '/recesos/admin-management',
          action: 'manage',
          meta: { description: 'Administrar recesos administrativos' },
        },
        {
          title: 'Departamentos',
          icon: 'mdi:office-building',
          path: '/departments',
          action: 'manage',
          meta: { description: 'Administrar departamentos' },
        },
        {
          title: 'Unidades Académicas',
          icon: 'mdi:school-outline',
          path: '/management/academicUnits',
          action: 'manage',
          meta: { description: 'Administrar unidades académicas' },
        },
        {
          title: 'Feriados',
          icon: 'mdi:office-building',
          path: '/nonholidays',
          action: 'manage',
          meta: { description: 'Administrar feriados' },
        },
        {
          title: 'Políticas de Vacaciones',
          icon: 'mdi:beach',
          path: '/vacations/vacations-policy',
          action: 'manage',
          meta: { description: 'Definir políticas de vacaciones' },
        },
        {
          title: 'Profesiones',
          icon: 'mdi:briefcase-outline',
          path: '/management/profession',
          action: 'manage',
          meta: { description: 'Administrar profesiones' },
        },
      ],
    },
  ]
}

export default navigation
