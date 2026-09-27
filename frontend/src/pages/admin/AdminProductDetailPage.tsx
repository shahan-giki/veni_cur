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
  updateAdminVariant,
  type AdminVariant,
} from "../../api/admin/catalog";
import { formatApiValidationError } from "../../api/client";
import { Button } from "../../components/ui/Button";
import { LoadingGrid } from "../../components/ui/LoadingGrid";
import { getColorFromAttributes, mergeColorAttributes } from "../../lib/variantDisplay";

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
    label: "",
    inventory_count: 0,
    color: "",
    color_hex: "#8b7355",
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
    mutationFn: () => {
      const color = variantForm.color.trim();
      const attributes = mergeColorAttributes({}, color, variantForm.color_hex);
      const existing = variantsQuery.data?.results ?? [];
      return createAdminVariant({
        product: productId,
        sku: variantForm.sku,
        label: variantForm.label.trim() || color || "Default",
        inventory_count: variantForm.inventory_count,
        attributes,
        is_default: existing.length === 0,
        is_active: true,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "variants", productId] });
      setVariantForm({
        sku: "",
        label: "",
        inventory_count: 0,
        color: "",
        color_hex: "#8b7355",
      });
      setError(null);
    },
    onError: (err) => setError(formatApiValidationError(err)),
  });

  const saveVariantColor = useMutation({
    mutationFn: (payload: {
      id: number;
      color: string;
      color_hex: string;
      label: string;
      inventory_count: number;
      existingAttributes: Record<string, unknown>;
    }) => {
      const color = payload.color.trim();
      return updateAdminVariant(payload.id, {
        label: payload.label.trim() || color || "Default",
        inventory_count: payload.inventory_count,
        attributes: mergeColorAttributes(
          payload.existingAttributes,
          color,
          payload.color_hex
        ),
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "variants", productId] });
      setError(null);
    },
    onError: (err) => setError(formatApiValidationError(err)),
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
          <div className="admin-card" id="admin-product-colors">
            <h2>Colors &amp; variants</h2>
            <p className="admin-hint">
              Each color is its own Product variant. Add Taupe, Navy, etc. with a swatch — Customers
              see circular color dots on the product page. Leave color blank for size/volume-only
              variants.
            </p>
            <ul className="admin-variant-list">
              {(variantsQuery.data?.results ?? []).map((v) => (
                <AdminVariantColorRow
                  key={v.id}
                  variant={v}
                  busy={saveVariantColor.isPending}
                  onSave={(payload) => saveVariantColor.mutate(payload)}
                />
              ))}
            </ul>
            {(variantsQuery.data?.results ?? []).length === 0 ? (
              <p className="admin-hint">No variants yet. Add the first color below.</p>
            ) : null}
            <h3 className="admin-card__subtitle">Add color</h3>
            <form
              className="admin-form-grid"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                addVariant.mutate();
              }}
            >
              <label>
                Color name (for color dots)
                <input
                  value={variantForm.color}
                  onChange={(e) => setVariantForm({ ...variantForm, color: e.target.value })}
                  placeholder="e.g. Taupe, Navy — optional for non-color products"
                  list="admin-color-presets"
                />
                <datalist id="admin-color-presets">
                  <option value="Taupe" />
                  <option value="Navy" />
                  <option value="White" />
                  <option value="Grey" />
                  <option value="Black" />
                  <option value="Beige" />
                  <option value="Cream" />
                  <option value="Maroon" />
                  <option value="Olive" />
                </datalist>
              </label>
              <label className="admin-color-picker">
                Color swatch
                <span className="admin-color-picker__row">
                  <input
                    type="color"
                    value={
                      /^#[0-9A-Fa-f]{6}$/.test(variantForm.color_hex)
                        ? variantForm.color_hex
                        : "#8b7355"
                    }
                    onChange={(e) =>
                      setVariantForm({ ...variantForm, color_hex: e.target.value })
                    }
                    aria-label="Pick color hex"
                  />
                  <input
                    type="text"
                    value={variantForm.color_hex}
                    onChange={(e) =>
                      setVariantForm({ ...variantForm, color_hex: e.target.value })
                    }
                    placeholder="#8b7355"
                  />
                </span>
              </label>
              <label>
                SKU
                <input
                  value={variantForm.sku}
                  onChange={(e) => setVariantForm({ ...variantForm, sku: e.target.value })}
                  required
                  placeholder="e.g. SHAWL-TAUPE"
                />
              </label>
              <label>
                Label (optional)
                <input
                  value={variantForm.label}
                  onChange={(e) => setVariantForm({ ...variantForm, label: e.target.value })}
                  placeholder="Defaults to color name"
                />
              </label>
              <label>
                Inventory
                <input
                  type="number"
                  min={0}
                  value={variantForm.inventory_count}
                  onChange={(e) =>
                    setVariantForm({
                      ...variantForm,
                      inventory_count: Number.parseInt(e.target.value, 10) || 0,
                    })
                  }
                />
              </label>
              <Button type="submit" variant="primary" disabled={addVariant.isPending}>
                {addVariant.isPending ? "Adding…" : "Add color"}
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

function AdminVariantColorRow({
  variant,
  busy,
  onSave,
}: {
  variant: AdminVariant;
  busy: boolean;
  onSave: (payload: {
    id: number;
    color: string;
    color_hex: string;
    label: string;
    inventory_count: number;
    existingAttributes: Record<string, unknown>;
  }) => void;
}) {
  const parsed = getColorFromAttributes(variant.attributes);
  const [color, setColor] = useState(parsed?.name ?? "");
  const [colorHex, setColorHex] = useState(parsed?.hex ?? "#78716c");
  const [label, setLabel] = useState(variant.label);
  const [inventory, setInventory] = useState(variant.inventory_count);

  useEffect(() => {
    const next = getColorFromAttributes(variant.attributes);
    setColor(next?.name ?? "");
    setColorHex(next?.hex ?? "#78716c");
    setLabel(variant.label);
    setInventory(variant.inventory_count);
  }, [variant]);

  const hexForPicker = /^#[0-9A-Fa-f]{6}$/.test(colorHex) ? colorHex : "#78716c";

  return (
    <li className="admin-variant-list__item admin-variant-list__item--edit">
      <span
        className="admin-color-dot"
        style={{ backgroundColor: color ? hexForPicker : "transparent" }}
        aria-hidden="true"
      />
      <div className="admin-variant-edit">
        <label>
          Color
          <input value={color} onChange={(e) => setColor(e.target.value)} />
        </label>
        <label className="admin-color-picker">
          Swatch
          <span className="admin-color-picker__row">
            <input
              type="color"
              value={hexForPicker}
              onChange={(e) => setColorHex(e.target.value)}
              aria-label={`Color for ${variant.sku}`}
            />
            <input value={colorHex} onChange={(e) => setColorHex(e.target.value)} />
          </span>
        </label>
        <label>
          Label
          <input value={label} onChange={(e) => setLabel(e.target.value)} />
        </label>
        <label>
          Stock
          <input
            type="number"
            min={0}
            value={inventory}
            onChange={(e) => setInventory(Number.parseInt(e.target.value, 10) || 0)}
          />
        </label>
        <p className="admin-variant-edit__sku">SKU {variant.sku}</p>
        <Button
          type="button"
          variant="secondary"
          disabled={busy}
          onClick={() =>
            onSave({
              id: variant.id,
              color,
              color_hex: colorHex,
              label,
              inventory_count: inventory,
              existingAttributes: variant.attributes ?? {},
            })
          }
        >
          Save color
        </Button>
      </div>
    </li>
  );
}
