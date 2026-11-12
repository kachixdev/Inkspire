import { Navigate, Outlet } from 'react-router-dom';
import { getCurrentUser } from '../../utils/api';

function AdminRoute() {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    return <Navigate to="/signin" replace />;
  }

  if (currentUser.role !== 'admin') {
    return <Navigate to="/feed" replace />;
  }

  return <Outlet />;
}

export default AdminRoute;
