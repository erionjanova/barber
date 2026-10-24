import { useEffect } from "react";
import { Outlet, useLocation } from "react-router";
import { Footer } from "./Footer";
import { Navbar } from "./Navbar";

export function RootLayout() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
