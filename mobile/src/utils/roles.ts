export type Role = 'super_admin' | 'manager' | 'seller' | 'customer';

export const SUPER_ADMIN_ROLES: Role[] = ['super_admin'];
export const ADMIN_ROLES: Role[] = ['super_admin', 'manager'];
export const STAFF_ROLES: Role[] = ['super_admin', 'manager', 'seller'];

const LEGACY_ROLE_ALIASES: Record<string, Role> = {
  admin: 'super_admin',
};

export function normalizeRole(role?: string | null): Role {
  if (!role) return 'customer';
  return LEGACY_ROLE_ALIASES[role] ?? (role as Role) ?? 'customer';
}

export function hasRole(role: string | null | undefined, allowedRoles: Role[]) {
  return allowedRoles.includes(normalizeRole(role));
}
