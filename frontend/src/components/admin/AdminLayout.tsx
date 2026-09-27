import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { Button } from "../ui/Button";
import "../../styles/admin.css";

const navItems = [
  { to: "/admin/dashboard", label: "Dashboard" },
  { to: "/admin/orders", label: "Orders" },
  { to: "/admin/products", label: "Products" },
  { to: "/admin/categories", label: "Categories" },
  { to: "/admin/customers", label: "Customers" },
];

export function AdminLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar" aria-label="Admin navigation">
        <Link to="/admin/dashboard" className="admin-sidebar__brand">
          Veni Admin
        </Link>
        <nav aria-label="Admin sections">
          <ul className="admin-sidebar__nav">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === "/admin/dashboard"}
                  aria-current={undefined}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <Link to="/" className="admin-header__meta">
          View storefront
        </Link>
      </aside>
      <div className="admin-main">
        <header className="admin-header">
          <span className="admin-header__meta">Signed in as {user?.email}</span>
          <Button type="button" variant="secondary" onClick={() => void logout()}>
            Log out
          </Button>
        </header>
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
