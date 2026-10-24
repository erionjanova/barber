import { Loader2 } from "lucide-react";
import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router";
import { RootLayout } from "@/components/layout/RootLayout";
import { GuestOnly, RequireAdmin, RequireAuth, RequireCustomer } from "@/components/layout/RouteGuards";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import BookPage from "@/pages/BookPage";
import HomePage from "@/pages/HomePage";
import MyAppointmentsPage from "@/pages/MyAppointmentsPage";
import NotFoundPage from "@/pages/NotFoundPage";
import ProfilePage from "@/pages/ProfilePage";

const AdminLayout = lazy(() => import("@/pages/admin/AdminLayout"));
const AdminDashboardPage = lazy(() => import("@/pages/admin/AdminDashboardPage"));
const AdminAppointmentsPage = lazy(() => import("@/pages/admin/AdminAppointmentsPage"));
const AdminServicesPage = lazy(() => import("@/pages/admin/AdminServicesPage"));
const AdminSchedulePage = lazy(() => import("@/pages/admin/AdminSchedulePage"));

const PageLoader = () => (
  <div className="grid min-h-[50vh] place-items-center">
    <Loader2 className="size-6 animate-spin text-accent" />
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<RootLayout />}>
            <Route index element={<HomePage />} />

            <Route element={<GuestOnly />}>
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
            </Route>

            <Route element={<RequireCustomer />}>
              <Route path="book" element={<BookPage />} />
              <Route path="appointments" element={<MyAppointmentsPage />} />
            </Route>

            <Route element={<RequireAuth />}>
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            <Route element={<RequireAdmin />}>
              <Route path="admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboardPage />} />
                <Route path="appointments" element={<AdminAppointmentsPage />} />
                <Route path="services" element={<AdminServicesPage />} />
                <Route path="schedule" element={<AdminSchedulePage />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
