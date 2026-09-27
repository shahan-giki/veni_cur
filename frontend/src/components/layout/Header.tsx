import { useQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { listCategories } from "../../api/catalog";
import { catalogKeys } from "../../app/queryClient";
import { Drawer } from "../ui/Drawer";
import { HeaderCartLink } from "./HeaderCartLink";
import { ThemeToggle } from "./ThemeToggle";

function scrollToPageStart() {
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg
      className="veni-menu-icon"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function Header() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [trayOpen, setTrayOpen] = useState(false);

  const categoriesQuery = useQuery({
    queryKey: catalogKeys.categories,
    queryFn: listCategories,
    enabled: trayOpen,
  });

  function onSearchSubmit(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    setTrayOpen(false);
    navigate(q ? `/products?q=${encodeURIComponent(q)}` : "/products");
    scrollToPageStart();
  }

  function goToAllProducts() {
    setTrayOpen(false);
    navigate("/products");
    scrollToPageStart();
  }

  const categories =
    categoriesQuery.data
      ?.filter((c) => c.parent === null)
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order) ?? [];

  const traySearch = (
    <form className="tray-search" role="search" onSubmit={onSearchSubmit}>
      <label htmlFor="tray-search" className="visually-hidden">
        Search products
      </label>
      <input
        id="tray-search"
        type="search"
        name="q"
        placeholder="Search products"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoComplete="off"
      />
      <button type="submit" className="tray-search__submit" aria-label="Search">
        <SearchIcon />
      </button>
    </form>
  );

  return (
    <>
      <header className="veni-header" data-sticky="true">
        <div className="veni-header__main">
          <div className="veni-header__side">
            <button
              type="button"
              className="veni-tray-toggle veni-tray-toggle--menu"
              aria-label="Menu"
              aria-expanded={trayOpen}
              aria-haspopup="dialog"
              onClick={() => setTrayOpen(true)}
            >
              <MenuIcon />
            </button>
          </div>

          <Link to="/" className="veni-logo">
            Veni
          </Link>

          <nav className="veni-header__side veni-header__side--end" aria-label="Primary">
            <ThemeToggle />
            <HeaderCartLink />
          </nav>
        </div>
      </header>

      <Drawer
        open={trayOpen}
        onClose={() => setTrayOpen(false)}
        title="Categories"
        showTitle={false}
        headerContent={traySearch}
        side="left"
      >
        <nav className="tray-nav" aria-label="Categories">
          <NavLink to="/" end className="tray-link" onClick={() => setTrayOpen(false)}>
            Home
          </NavLink>
          <button type="button" className="tray-link tray-link--button" onClick={goToAllProducts}>
            All products
          </button>
          <hr className="tray-rule" />
          {categoriesQuery.isLoading ? (
            <p className="tray-note" aria-busy="true">
              Loading categories…
            </p>
          ) : categoriesQuery.isError ? (
            <p className="tray-note">Could not load categories.</p>
          ) : !categories.length ? (
            <p className="tray-note">No categories yet.</p>
          ) : (
            categories.map((cat) => (
              <NavLink
                key={cat.id}
                to={`/categories/${cat.slug}`}
                className="tray-link"
                onClick={() => setTrayOpen(false)}
              >
                {cat.name}
              </NavLink>
            ))
          )}
        </nav>
      </Drawer>
    </>
  );
}
