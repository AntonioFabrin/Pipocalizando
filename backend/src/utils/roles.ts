export const normalizeRole = (role?: string | null): string => {
  if (!role) return '';
  return role === 'admin' ? 'super_admin' : role;
};

export const isSellerLikeRole = (role?: string | null): boolean => {
  const normalizedRole = normalizeRole(role);
  return ['super_admin', 'seller'].includes(normalizedRole);
};
