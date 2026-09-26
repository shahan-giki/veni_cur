import { Outlet } from "react-router-dom";
import { Footer } from "./Footer";
import { Header } from "./Header";

export function Layout() {
  return (
    <div className="veni-shell">
      <Header />
      <main className="veni-main" id="main-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
