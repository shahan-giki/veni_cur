import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  confirmAdminProductImage,
  createAdminProduct,
  createAdminVariant,
  deleteAdminProductImage,
  getAdminProduct,
  listAdminCategories,
  listAdminProductImages,
  listAdminVariants,
  presignAdminProductImage,
  updateAdminProduct,
} from "../../api/admin/catalog";
import { formatApiValidationError } from "../../api/client";
import { Button } from "../../components/ui/Button";
import { LoadingGrid } from "../../components/ui/LoadingGrid";

export function AdminProductDetailPage() {
  const { id = "" } = useParams();
  const isNew = id === "new";
  const productId = isNew ? 0 : Number.parseInt(id, 10);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const categoriesQuery = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: listAdminCategories,
  });

  const productQuery = useQuery({
    queryKey: ["admin", "product", productId],
    queryFn: () => getAdminProduct(productId),
    enabled: !isNew && productId > 0,
  });

  const variantsQuery = useQuery({
    queryKey: ["admin", "variants", productId],
    queryFn: () => listAdminVariants(productId),
    enabled: !isNew && productId > 0,
  });

  const imagesQuery = useQuery({
    queryKey: ["admin", "images", productId],
    queryFn: () => listAdminProductImages(productId),
    enabled: !isNew && productId > 0,
  });

  const [form, setForm] = useState({
    name: "",
    slug: "",
    category: 0,
    description: "",
    base_price: "0.00",
    status: "DRAFT",
    is_active: false,
  });
  const [variantForm, setVariantForm] = useState({
    sku: "",
    label: "Default",
    inventory_count: 0,
  });
  const [error, setError] = useState<string | null>(null);

  const saveProduct = useMutation({
    mutationFn: async () => {
      const body = { ...form, sale_price: null, sku: "" };
      if (isNew) return createAdminProduct(body);
      return updateAdminProduct(productId, body);
    },
    onSuccess: (product) => {
      if (isNew) void navigate(`/admin/products/${product.id}`);
      else void queryClient.invalidateQueries({ queryKey: ["admin", "product", productId] });
      setError(null);
    },
    onError: (err) => setError(formatApiValidationError(err)),
  });

  const addVariant = useMutation({
    mutationFn: () =>
      createAdminVariant({
        product: productId,
        sku: variantForm.sku,
        label: variantForm.label,
        inventory_count: variantForm.inventory_count,
        is_default: true,
        is_active: true,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "variants", productId] });
    },
  });

  async function onImageUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !productId) return;
    try {
      const presign = await presignAdminProductImage(productId, file.type, file.size);
      if (!presign.upload_url.includes("fake-s3")) {
        const fd = new FormData();
        for (const [k, v] of Object.entries(presign.fields)) fd.append(k, v);
        fd.append("file", file);
        const up = await fetch(presign.upload_url, { method: "POST", body: fd });
        if (!up.ok) throw new Error("Upload failed");
      }
      await confirmAdminProductImage(productId, presign.s3_key, form.name);
      void queryClient.invalidateQueries({ queryKey: ["admin", "images", productId] });
    } catch (err) {
      setError(formatApiValidationError(err));
    }
  }

  useEffect(() => {
    if (!productQuery.data) return;
    const p = productQuery.data;
    setForm({
      name: p.name,
      slug: p.slug,
      category: p.category,
      description: p.description,
      base_price: p.base_price,
      status: p.status,
      is_active: p.is_active,
    });
  }, [productQuery.data]);

  if (!isNew && (productQuery.isLoading || !Number.isFinite(productId))) {
    return <LoadingGrid count={3} />;
  }

  const categories = categoriesQuery.data?.results ?? [];

  return (
    <section aria-labelledby="admin-product-heading">
      <p>
        <Link to="/admin/products">← Products</Link>
      </p>
      <h1 id="admin-product-heading" className="admin-page-title">
        {isNew ? "New product" : `Product: ${productQuery.data?.name ?? ""}`}
      </h1>
      <form
        className="admin-form-grid"
        onSubmit={(e) => {
          e.preventDefault();
          saveProduct.mutate();
        }}
      >
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
          Category
          <select
            value={form.category || ""}
            onChange={(e) => setForm({ ...form, category: Number(e.target.value) })}
            required
          >
            <option value="">Select…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Base price
          <input
            value={form.base_price}
            onChange={(e) => setForm({ ...form, base_price: e.target.value })}
          />
        </label>
        <label>
          Status
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
          </select>
        </label>
        <label>
          Description
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </label>
        {error ? (
          <p className="auth-form__error" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" variant="primary" disabled={saveProduct.isPending}>
          Save product
        </Button>
      </form>

      {!isNew && productId > 0 ? (
        <>
          <div className="admin-card">
            <h2>Variants</h2>
            <ul>
              {(variantsQuery.data?.results ?? []).map((v) => (
                <li key={v.id}>
                  {v.label} · SKU {v.sku} · Stock {v.inventory_count}
                </li>
              ))}
            </ul>
            <form
              className="admin-form-grid"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                addVariant.mutate();
              }}
            >
              <label>
                SKU
                <input
                  value={variantForm.sku}
                  onChange={(e) => setVariantForm({ ...variantForm, sku: e.target.value })}
                />
              </label>
              <label>
                Label
                <input
                  value={variantForm.label}
                  onChange={(e) => setVariantForm({ ...variantForm, label: e.target.value })}
                />
              </label>
              <label>
                Inventory
                <input
                  type="number"
                  value={variantForm.inventory_count}
                  onChange={(e) =>
                    setVariantForm({
                      ...variantForm,
                      inventory_count: Number.parseInt(e.target.value, 10) || 0,
                    })
                  }
                />
              </label>
              <Button type="submit" variant="secondary">
                Add variant
              </Button>
            </form>
          </div>
          <div className="admin-card">
            <h2>Images</h2>
            <input type="file" accept="image/*" onChange={(e) => void onImageUpload(e)} />
            <ul>
              {(imagesQuery.data ?? []).map((img) => (
                <li key={img.id}>
                  {img.read_url ? (
                    <img src={img.read_url} alt={img.alt_text} width={120} />
                  ) : null}
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() =>
                      void deleteAdminProductImage(productId, img.id).then(() =>
                        queryClient.invalidateQueries({
                          queryKey: ["admin", "images", productId],
                        })
                      )
                    }
                  >
                    Delete
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : null}
    </section>
  );
}
