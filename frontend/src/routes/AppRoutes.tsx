import { Navigate, Route, Routes } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { HomePage } from '../pages/HomePage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { LoginPage } from '../features/auth/LoginPage';
import { SignupFlow } from '../features/auth/SignupFlow';
import { AppLayout } from '../features/app/AppLayout';
import { ProfilePage } from '../features/app/ProfilePage';
import { DriverHome } from '../features/driver/DriverHome';
import { DriverTask } from '../features/driver/DriverTask';
import { DriverDocuments } from '../features/driver/DriverDocuments';
import { DriverAlerts } from '../features/driver/DriverAlerts';
import { FleetHome } from '../features/fleet/FleetHome';
import { FleetAddVehicle } from '../features/fleet/FleetAddVehicle';
import { FindDrivers } from '../features/fleet/FindDrivers';
import { AdminLayout } from '../features/admin/AdminLayout';
import { AdminAddDriverPage, AdminDriversPage, AdminLoginPage } from '../features/admin/AdminPages';
import { AdminDriverDetail } from '../features/admin/AdminDriverDetail';
import { AdminFleetOwnerDetail, AdminFleetOwnersPage } from '../features/admin/AdminFleet';
import { homePathFor, useAuthStore } from '../store/authStore';

/* Old sprint-1 links (/dashboard, /register, ...) go to the right place */
const RoleHome = () => {
  const user = useAuthStore((s) => s.user);
  return <Navigate to={user ? homePathFor(user.role) : '/login'} replace />;
};

export const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/signup" element={<SignupFlow />} />
    <Route path="/signup/:step" element={<SignupFlow />} />

    <Route element={<AppLayout role="DRIVER" />}>
      <Route path="/driver" element={<DriverHome />} />
      <Route path="/driver/documents" element={<DriverDocuments />} />
      <Route path="/driver/alerts" element={<DriverAlerts />} />
      <Route path="/driver/profile" element={<ProfilePage />} />
      <Route path="/driver/task/:task" element={<DriverTask />} />
    </Route>

    <Route element={<AppLayout role="FLEET_OWNER" />}>
      <Route path="/fleet" element={<FleetHome />} />
      <Route path="/fleet/drivers" element={<FindDrivers />} />
      <Route path="/fleet/vehicles/new" element={<FleetAddVehicle />} />
      <Route path="/fleet/profile" element={<ProfilePage />} />
    </Route>

    {/* Admin */}
    <Route path="/admin/login" element={<AdminLoginPage />} />
    <Route element={<AdminLayout />}>
      <Route path="/admin/drivers" element={<AdminDriversPage />} />
      <Route path="/admin/drivers/new" element={<AdminAddDriverPage />} />
      <Route path="/admin/drivers/:id" element={<AdminDriverDetail />} />
      <Route path="/admin/fleet-owners" element={<AdminFleetOwnersPage />} />
      <Route path="/admin/fleet-owners/:id" element={<AdminFleetOwnerDetail />} />
    </Route>
    <Route path="/admin" element={<Navigate to="/admin/drivers?bucket=completed" replace />} />

    <Route path="/register" element={<Navigate to="/signup" replace />} />
    <Route path="/dashboard" element={<RoleHome />} />
    <Route path="/app" element={<RoleHome />} />

    {/* Public website home on the web; the installed app opens straight to the app */}
    <Route path="/" element={Capacitor.isNativePlatform() ? <RoleHome /> : <HomePage />} />
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);
