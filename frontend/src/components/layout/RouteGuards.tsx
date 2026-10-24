import { Loader2 } from "lucide-react";
import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "@/providers/AuthProvider";

const FullPageSpinner = () => (
  <div className="grid min-h-[60vh] place-items-center">
    <Loader2 className="size-6 animate-spin text-accent" />
  </div>
);

export function RequireAuth() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

export function RequireCustomer() {
  const { user, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (isAdmin) return <Navigate to="/admin" replace />;
  return <Outlet />;
}

export function RequireAdmin() {
  const { user, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <Outlet />;
}

export function GuestOnly() {
  const { user, isAdmin, isLoading } = useAuth();
  if (isLoading) return <FullPageSpinner />;
  if (user) return <Navigate to={isAdmin ? "/admin" : "/book"} replace />;
  return <Outlet />;
}
