import { AbilityBuilder, Ability } from '@casl/ability'

export type Subjects = string
export type Actions = 'manage' | 'create' | 'read' | 'update' | 'delete'

export type AppAbility = Ability<[Actions, Subjects]> | undefined

export const AppAbility = Ability as any
export type ACLObj = {
  action: Actions
  subject: string
}

/**
 * Please define your own Ability rules according to your app requirements.
 * We have just shown Admin and Client rules for demo purpose where
 * admin can manage everything and client can just visit ACL page
 */
const defineRulesFor = (role: string, subject: string) => {
  const { can, rules } = new AbilityBuilder(AppAbility);

  if (role === 'admin') {
    can('manage', 'all'); // Admin tiene control total sobre todas las acciones y sujetos.
    can('manage', 'search-users');
    can('manage', 'user-profile');
    can('manage', 'holiday-periods');
    can('manage', 'general-holidays');
    can('manage', 'departments');
    can('manage', 'all-licenses');
    can('manage', 'holiday-periods');
    
  } else if (role === 'client') {
    can(['read'], 'welcome-dashboard');
    can(['read'], 'welcome');
    can('create', 'vacation-request-form'); // Cambiado
    can('read', 'vacation-request-list'); // Cambiado
    can('read', 'vacation-summary');
    can('read', 'request-permission');
    can('read', 'vacation-request-details');
    can('read', 'user-licenses');
    can('read', 'user-profile'); // Agregar acceso al perfil de usuario para clientes
    can('read', 'profile-tab'); // Permitir acceso al componente ProfileTab para clientes
    can('read', 'about-overview'); 
    can('read', 'user-profile-tab'); 
    can('read', 'vacation-dashboard'); 
    can('read', 'holiday-periods');
  } else if (role === 'supervisor') {
    can(['read'], 'welcome-dashboard');
    can(['read'], 'welcome');
    can('create', 'vacation-request-form'); // Cambiado
    can('read', 'vacation-request-list'); // Cambiado
    can('read', 'vacation-summary');
    can('read', 'request-permission');
    can('read', 'employee-reports');
    can('read', 'vacation-request-details');
    can('read', 'supervisor-vacation-requests');
    can('read', 'user-licenses');
    can('read', 'department-permission');
    can('read', 'user-profile'); // Agregar acceso al perfil de usuario para clientes
    can('read', 'profile-tab'); // Permitir acceso al componente ProfileTab para clientes
    can('read', 'about-overview'); 
    can('read', 'user-profile-tab'); 
    can('read', 'vacation-dashboard'); 
    can('read', 'holiday-periods');
    
  } else {
    can(['read', 'create', 'update', 'delete'], subject);
  }

  return rules;
};



export const buildAbilityFor = (role: string, subject: string): AppAbility => {
  return new AppAbility(defineRulesFor(role, subject), {
    // https://casl.js.org/v5/en/guide/subject-type-detection
    // @ts-ignore
    detectSubjectType: object => object!.type
  })
}

export const defaultACLObj: ACLObj = {
  action: 'manage',
  subject: 'all'
}

export default defineRulesFor
