import { Outlet } from "react-router-dom";
import { Footer } from "./Footer";
import { Header } from "./Header";

export function Layout() {
  return (
    <div className="veni-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Header />
      <main className="veni-main" id="main-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
