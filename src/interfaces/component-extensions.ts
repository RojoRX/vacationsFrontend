import React from 'react';

declare module 'react' {
  interface FunctionComponent<P = {}> {
    acl?: {
      action: string;
      subject: string;
      fallback?: React.ReactNode; // Opcional: para mostrar cuando no hay permisos
    };
  }

  interface ComponentClass<P = {}, S = ComponentState> {
    acl?: {
      action: string;
      subject: string;
      fallback?: React.ReactNode;
    };
  }
}

// Versión alternativa como interfaz explícita (opcional)
export interface ComponentWithAclProps {
  acl?: {
    action: 'create' | 'read' | 'update' | 'delete' | 'manage'; // Tipado literal
    subject: string;
    fallback?: React.ReactNode;
  };
}

// Helper type para componentes con ACL
export type ComponentWithAcl<T = {}> = React.FC<T> & {
  acl?: ComponentWithAclProps['acl'];
};