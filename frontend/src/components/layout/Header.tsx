import { useState, type FormEvent } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { Button } from "../ui/Button";
import { HeaderCartLink } from "./HeaderCartLink";

export function Header() {
  const { status, user, logout } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [navOpen, setNavOpen] = useState(false);

  function onSearchSubmit(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) {
      navigate("/products");
      return;
    }
    navigate(`/products?q=${encodeURIComponent(q)}`);
    setNavOpen(false);
  }

  return (
    <header className="veni-header">
      <div className="veni-header__inner">
        <Link to="/" className="veni-logo" onClick={() => setNavOpen(false)}>
          Veni
        </Link>
        <Button
          variant="ghost"
          className="mobile-nav-toggle"
          aria-expanded={navOpen}
          aria-controls="veni-primary-nav"
          onClick={() => setNavOpen((o) => !o)}
        >
          Menu
        </Button>
        <nav
          id="veni-primary-nav"
          className={`veni-nav veni-nav--collapsible${navOpen ? " is-open" : ""}`}
          aria-label="Primary"
        >
          <NavLink to="/" end onClick={() => setNavOpen(false)}>
            Home
          </NavLink>
          <NavLink to="/products" onClick={() => setNavOpen(false)}>
            Products
          </NavLink>
          <a href="/#shop-by-category" onClick={() => setNavOpen(false)}>
            Categories
          </a>
          <HeaderCartLink />
          {status === "loading" ? (
            <span aria-live="polite">…</span>
          ) : user ? (
            <>
              <NavLink to="/account" onClick={() => setNavOpen(false)}>
                Account
              </NavLink>
              <button
                type="button"
                className="veni-nav-link-btn"
                onClick={() => {
                  void logout().then(() => {
                    setNavOpen(false);
                    navigate("/");
                  });
                }}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" onClick={() => setNavOpen(false)}>
                Sign in
              </NavLink>
              <NavLink to="/register" onClick={() => setNavOpen(false)}>
                Register
              </NavLink>
            </>
          )}
        </nav>
        <form className="veni-header-search" role="search" onSubmit={onSearchSubmit}>
          <label className="visually-hidden" htmlFor="header-search">
            Search products
          </label>
          <input
            id="header-search"
            type="search"
            name="q"
            placeholder="Search products…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
          <Button type="submit" variant="primary">
            Search
          </Button>
        </form>
      </div>
    </header>
  );
}
