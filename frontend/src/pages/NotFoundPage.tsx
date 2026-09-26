import { Link } from "react-router-dom";
import { StatePanel } from "../components/ui/StatePanel";

export function NotFoundPage() {
  return (
    <StatePanel
      title="Page not found"
      message="The page you requested does not exist."
      actions={
        <Link to="/" className="btn btn-primary">
          Go home
        </Link>
      }
    />
  );
}
