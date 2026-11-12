import { Navigate, Outlet } from 'react-router-dom';
import { getCurrentUser } from '../../utils/api';

function ProtectedRoute() {
  if (!getCurrentUser()) {
    return <Navigate to="/signin" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
