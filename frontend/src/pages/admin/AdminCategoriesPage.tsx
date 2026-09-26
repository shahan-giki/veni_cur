import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import {
  createAdminCategory,
  listAdminCategories,
  updateAdminCategory,
  type AdminCategory,
} from "../../api/admin/catalog";
import { formatApiValidationError } from "../../api/client";
import { Button } from "../../components/ui/Button";
import { LoadingGrid } from "../../components/ui/LoadingGrid";
import { StatePanel } from "../../components/ui/StatePanel";

export function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const categoriesQuery = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: listAdminCategories,
  });
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    sort_order: 0,
    is_active: true,
    is_visible: true,
  });
  const [error, setError] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing) {
        return updateAdminCategory(editing.id, form);
      }
      return createAdminCategory(form);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      setEditing(null);
      setForm({
        name: "",
        slug: "",
        sort_order: 0,
        is_active: true,
        is_visible: true,
      });
      setError(null);
    },
    onError: (err) => setError(formatApiValidationError(err)),
  });

  function startEdit(cat: AdminCategory) {
    setEditing(cat);
    setForm({
      name: cat.name,
      slug: cat.slug,
      sort_order: cat.sort_order,
      is_active: cat.is_active,
      is_visible: cat.is_visible,
    });
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    saveMutation.mutate();
  }

  if (categoriesQuery.isLoading) return <LoadingGrid count={3} />;
  if (categoriesQuery.isError) {
    return (
      <StatePanel
        title="Could not load categories"
        message={formatApiValidationError(categoriesQuery.error)}
      />
    );
  }

  const categories = categoriesQuery.data?.results ?? [];

  return (
    <section aria-labelledby="admin-categories-heading">
      <h1 id="admin-categories-heading" className="admin-page-title">
        Categories
      </h1>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Sort</th>
              <th>Active</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id}>
                <td>{cat.name}</td>
                <td>{cat.slug}</td>
                <td>{cat.sort_order}</td>
                <td>{cat.is_active ? "Yes" : "No"}</td>
                <td>
                  <button type="button" className="btn btn-secondary" onClick={() => startEdit(cat)}>
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="admin-card">
        <h2>{editing ? "Edit category" : "New category"}</h2>
        <form className="admin-form-grid" onSubmit={(e) => void onSubmit(e)}>
          <label>
            Name
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </label>
          <label>
            Slug
            <input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              required
            />
          </label>
          <label>
            Sort order
            <input
              type="number"
              value={form.sort_order}
              onChange={(e) =>
                setForm({ ...form, sort_order: Number.parseInt(e.target.value, 10) || 0 })
              }
            />
          </label>
          <label>
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />{" "}
            Active
          </label>
          <label>
            <input
              type="checkbox"
              checked={form.is_visible}
              onChange={(e) => setForm({ ...form, is_visible: e.target.checked })}
            />{" "}
            Visible
          </label>
          {error ? (
            <p className="auth-form__error" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" variant="primary" disabled={saveMutation.isPending}>
            {editing ? "Save changes" : "Create category"}
          </Button>
        </form>
      </div>
    </section>
  );
}
