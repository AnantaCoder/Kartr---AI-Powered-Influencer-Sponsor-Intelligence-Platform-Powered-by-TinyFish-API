/**
 * useRoleGuard Hook
 * Protects routes based on user role
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { selectUser, selectIsAuthenticated, selectAuthInitialized } from '../store/slices/authSlice';

type UserRole = 'admin' | 'sponsor' | 'influencer';

interface UseRoleGuardOptions {
  allowedRoles: UserRole[];
  redirectTo?: string;
}

/**
 * Hook to guard routes based on user role
 * @param options - Configuration for role guard
 * @returns Object with user and loading state
 */
export const useRoleGuard = ({ allowedRoles, redirectTo = '/login' }: UseRoleGuardOptions) => {
  const navigate = useNavigate();
  const user = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isInitialized = useAppSelector(selectAuthInitialized);

  useEffect(() => {
    if (!isInitialized) return; // Wait for auth to initialize

    if (!isAuthenticated) {
      navigate(redirectTo, { replace: true });
      return;
    }

    if (user && !allowedRoles.includes(user.user_type as UserRole)) {
      // Redirect to appropriate dashboard based on role
      const roleRedirects: Record<UserRole, string> = {
        admin: '/admin',
        sponsor: '/sponsor',
        influencer: '/influencer',
      };
      navigate(roleRedirects[user.user_type as UserRole] || '/', { replace: true });
    }
  }, [isAuthenticated, isInitialized, user, allowedRoles, redirectTo, navigate]);

  return {
    user,
    isLoading: !isInitialized,
    isAuthorized: user ? allowedRoles.includes(user.user_type as UserRole) : false,
  };
};

/**
 * Convenience hooks for specific roles
 */
export const useAdminGuard = (redirectTo?: string) =>
  useRoleGuard({ allowedRoles: ['admin'], redirectTo });

export const useSponsorGuard = (redirectTo?: string) =>
  useRoleGuard({ allowedRoles: ['sponsor'], redirectTo });

export const useInfluencerGuard = (redirectTo?: string) =>
  useRoleGuard({ allowedRoles: ['influencer'], redirectTo });

export const useSponsorOrAdminGuard = (redirectTo?: string) =>
  useRoleGuard({ allowedRoles: ['sponsor', 'admin'], redirectTo });

export default useRoleGuard;
