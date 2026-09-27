import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "../../api/client";
import { formatApiValidationError } from "../../api/client";
import { LoadingGrid } from "../../components/ui/LoadingGrid";
import { StatePanel } from "../../components/ui/StatePanel";
import { DocumentTitle } from "../../components/seo/DocumentTitle";

type CustomerRow = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  order_count: number;
  date_joined: string;
  is_active: boolean;
};

type Paginated = {
  count: number;
  results: CustomerRow[];
};

export function AdminCustomersPage() {
  const query = useQuery({
    queryKey: ["admin", "customers"],
    queryFn: () => fetchJson<Paginated>("/admin/customers/"),
  });

  if (query.isLoading) return <LoadingGrid count={4} />;
  if (query.isError) {
    return (
      <StatePanel
        title="Could not load customers"
        message={formatApiValidationError(query.error)}
      />
    );
  }

  const rows = query.data!.results;

  return (
    <section aria-labelledby="admin-customers-heading">
      <DocumentTitle title="Customers" />
      <h1 id="admin-customers-heading" className="admin-page-title">
        Customers
      </h1>
      <p className="cart-summary__note">{query.data!.count} customers</p>
      {rows.length === 0 ? (
        <StatePanel title="No customers yet" />
      ) : (
        <ul className="admin-table-list">
          {rows.map((c) => (
            <li key={c.id}>
              <strong>{c.email}</strong>
              {" · "}
              {[c.first_name, c.last_name].filter(Boolean).join(" ") || "—"}
              {" · "}
              {c.order_count} orders
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
