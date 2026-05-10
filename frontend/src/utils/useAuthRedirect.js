import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function getDashboardPath() {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  if (!isAuthenticated) return null;

  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  const role = localStorage.getItem('userRole');
  return isAdmin || role === 'admin' ? '/dashboard_admin' : '/home';
}

export function useAuthRedirect() {
  const navigate = useNavigate();

  const redirectIfAuthenticated = useCallback(() => {
    const dashboardPath = getDashboardPath();
    if (dashboardPath) {
      navigate(dashboardPath, { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    redirectIfAuthenticated();

    const handlePageShow = () => {
      redirectIfAuthenticated();
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [redirectIfAuthenticated]);
}
