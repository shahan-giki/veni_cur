import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="veni-footer">
      <div className="veni-footer__inner">
        <p>© {new Date().getFullYear()} Veni. Premium multi-category shopping.</p>
        <nav aria-label="Footer">
          <Link to="/products">All products</Link>
        </nav>
      </div>
    </footer>
  );
}
