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
          meta: { 
            description: 'Formulario para solicitar vacaciones',
            keywords: ['vacaciones', 'solicitar', 'nuevo', 'formulario']
          },
        },
        {
          title: 'Resumen',
          path: '/vacations/vacations-dashboard',
          action: 'read',
          subject: 'vacation-dashboard',
          meta: { 
            description: 'Resumen de tus vacaciones',
            keywords: ['vacaciones', 'resumen', 'historial', 'estado']
          },
        },
        {
          title: 'Mis Solicitudes',
          path: '/vacations/vacations-requests',
          action: 'read',
          subject: 'vacation-request-list',
          meta: { 
            description: 'Ver tus solicitudes de vacaciones',
            keywords: ['vacaciones', 'solicitudes', 'historial', 'usuario']
          },
        },
        {
          title: 'Solicitudes del Personal',
          path: '/vacations/vacations-supervisor',
          action: 'read',
          subject: 'supervisor-vacation-requests',
          meta: { 
            description: 'Gestionar solicitudes del personal a tu cargo',
            keywords: ['vacaciones', 'supervisor', 'personal', 'gestionar']
          },
        },
        {
          title: 'Todas las Solicitudes',
          path: '/vacations/vacations-admin',
          action: 'read',
          meta: { 
            description: 'Administración de todas las solicitudes de vacaciones',
            keywords: ['vacaciones', 'administrar', 'todas', 'solicitudes']
          },
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
          meta: { 
            description: 'Formulario para solicitar permisos',
            keywords: ['permiso', 'solicitar', 'nuevo', 'formulario']
          },
        },
        {
          title: 'Mis Permisos',
          path: '/permissions/user-licenses',
          action: 'read',
          subject: 'user-licenses',
          meta: { 
            description: 'Ver tus permisos activos',
            keywords: ['permiso', 'mis', 'usuario', 'historial']
          },
        },
        {
          title: 'Solicitudes Pendientes del Personal',
          path: '/permissions/department-permission',
          action: 'read',
          subject: 'department-permission',
          meta: { 
            description: 'Gestionar permisos pendientes del personal',
            keywords: ['permiso', 'supervisor', 'personal', 'pendiente']
          },
        },
        {
          title: 'Gestión de Permisos',
          path: '/permissions/adminlicenses',
          action: 'read',
          subject: 'adminlicenses',
          meta: { 
            description: 'Administrar todos los permisos',
            keywords: ['permiso', 'administrar', 'todos', 'licencias']
          },
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
          meta: { 
            description: 'Ver los recesos generales',
            keywords: ['receso', 'general', 'feriado', 'calendario']
          },
        },
        {
          title: 'Mis Recesos',
          icon: 'mdi:calendar-account',
          path: '/holidayPeriods/personalHolidayPeriods',
          action: 'read',
          subject: 'personal-holiday-periods',
          meta: { 
            description: 'Ver tus recesos personales',
            keywords: ['receso', 'personal', 'usuario', 'calendario']
          },
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
          meta: { 
            description: 'Buscar y consultar usuarios',
            keywords: ['usuario', 'buscar', 'consultar', 'lista']
          },
        },
        {
          title: 'Agregar Usuario',
          path: '/users/add-user',
          action: 'create',
          meta: { 
            description: 'Registrar un nuevo usuario',
            keywords: ['usuario', 'agregar', 'nuevo', 'registrar']
          },
        },
        {
          title: 'Usuarios Eliminados',
          path: '/users/restore-users',
          action: 'update',
          meta: { 
            description: 'Restaurar usuarios eliminados',
            keywords: ['usuario', 'restaurar', 'eliminado', 'historial']
          },
        },
        {
          title: 'Modificar Roles',
          path: '/users/role-users',
          action: 'update',
          meta: { 
            description: 'Modificar roles de los usuarios',
            keywords: ['usuario', 'rol', 'modificar', 'permisos']
          },
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
          meta: { 
            description: 'Administrar recesos generales',
            keywords: ['receso', 'general', 'administrar']
          },
        },
        {
          title: 'Recesos Administrativos',
          icon: 'mdi:calendar-blank-outline',
          path: '/recesos/admin-management',
          action: 'manage',
          meta: { 
            description: 'Administrar recesos administrativos',
            keywords: ['receso', 'administrativo', 'gestión']
          },
        },
        {
          title: 'Departamentos',
          icon: 'mdi:office-building',
          path: '/departments',
          action: 'manage',
          meta: { 
            description: 'Administrar departamentos',
            keywords: ['departamento', 'administrar', 'unidad']
          },
        },
        {
          title: 'Unidades Académicas',
          icon: 'mdi:school-outline',
          path: '/management/academicUnits',
          action: 'manage',
          meta: { 
            description: 'Administrar unidades académicas',
            keywords: ['unidad', 'académica', 'administrar']
          },
        },
        {
          title: 'Feriados',
          icon: 'mdi:office-building',
          path: '/nonholidays',
          action: 'manage',
          meta: { 
            description: 'Administrar feriados',
            keywords: ['feriado', 'administrar', 'día no laborable']
          },
        },
        {
          title: 'Políticas de Vacaciones',
          icon: 'mdi:beach',
          path: '/vacations/vacations-policy',
          action: 'manage',
          meta: { 
            description: 'Definir políticas de vacaciones',
            keywords: ['vacaciones', 'política', 'regla', 'administrar']
          },
        },
        {
          title: 'Profesiones',
          icon: 'mdi:briefcase-outline',
          path: '/management/profession',
          action: 'manage',
          meta: { 
            description: 'Administrar profesiones',
            keywords: ['profesión', 'cargo', 'administrar']
          },
        },
      ],
    },
  ]
}

export default navigation
