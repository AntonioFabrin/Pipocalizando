import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { Spinner } from '../ui/Spinner';
import { useAuth } from '../../contexts/AuthContext';
import { hasRole, type Role } from '../../lib/roles';

interface RequireAuthProps {
  children: ReactNode;
  allowedRoles?: Role[];
  redirectTo?: string;
}

export function RequireAuth({ children, allowedRoles, redirectTo = '/catalog' }: RequireAuthProps) {
  const location = useLocation();
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <Spinner message="Verificando sessao..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles && !hasRole(user?.role, allowedRoles)) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}
