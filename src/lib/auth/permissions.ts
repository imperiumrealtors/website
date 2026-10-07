import type { Role } from '../types';

export type Permission =
  | 'dashboard:view'
  | 'layouts:read' | 'layouts:write'
  | 'plots:read' | 'plots:write'
  | 'leads:read' | 'leads:write'
  | 'visits:read' | 'visits:write'
  | 'media:read' | 'media:write'
  | 'users:read' | 'users:write'
  | 'settings:read' | 'settings:write'
  | 'audit:read';

const SALES: Permission[] = [
  'dashboard:view',
  'leads:read', 'leads:write',
  'visits:read', 'visits:write',
  'layouts:read', 'plots:read',
];

const MANAGER: Permission[] = [
  ...SALES,
  'layouts:write',
  'plots:write',
  'media:read', 'media:write',
];

const ADMIN: Permission[] = [
  ...MANAGER,
  'users:read', 'users:write',
  'settings:read', 'settings:write',
  'audit:read',
];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  customer: [],
  sales: SALES,
  manager: MANAGER,
  admin: ADMIN,
};

export const ROLES: Role[] = ['admin', 'manager', 'sales', 'customer'];

export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/** Roles allowed into the portal at all. */
export function canAccessPortal(role: Role): boolean {
  return ROLE_PERMISSIONS[role].length > 0;
}
