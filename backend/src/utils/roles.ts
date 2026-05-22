export type Role = 'super_admin' | 'manager' | 'seller' | 'customer';

export const SUPER_ADMIN_ROLES: Role[] = ['super_admin'];
export const ADMIN_ROLES: Role[] = ['super_admin', 'manager'];
export const STAFF_ROLES: Role[] = ['super_admin', 'manager', 'seller'];

const LEGACY_ROLE_ALIASES: Record<string, Role> = {
  admin: 'super_admin',
};

export const normalizeRole = (role?: string | null): Role => {
  if (!role) return 'customer';
  return LEGACY_ROLE_ALIASES[role] ?? (role as Role);
};

export const hasRole = (role: string | null | undefined, allowedRoles: Role[]): boolean =>
  allowedRoles.includes(normalizeRole(role));

export const isSellerLikeRole = (role?: string | null): boolean =>
  hasRole(role, ['super_admin', 'seller'] as Role[]);

export const isStaffRole = (role?: string | null): boolean =>
  hasRole(role, STAFF_ROLES);

export const isAdminRole = (role?: string | null): boolean =>
  hasRole(role, ADMIN_ROLES);
