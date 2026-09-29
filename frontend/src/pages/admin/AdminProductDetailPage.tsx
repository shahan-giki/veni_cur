import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  activateAdminProduct,
  confirmAdminProductImage,
  createAdminProduct,
  createAdminVariant,
  deactivateAdminProduct,
  deleteAdminProductImage,
  deleteAdminVariant,
  getAdminProduct,
  listAdminCategories,
  listAdminProductImages,
  listAdminVariantOptions,
  listAdminVariants,
  presignAdminProductImage,
  updateAdminProduct,
  updateAdminVariant,
  type AdminVariant,
  type AdminVariantOption,
} from "../../api/admin/catalog";
import { formatApiValidationError } from "../../api/client";
import { Button } from "../../components/ui/Button";
import { LoadingGrid } from "../../components/ui/LoadingGrid";
import {
  buildAttributesFromSelections,
  defaultSelectedKeys,
  emptySelectionsForKeys,
  getOptionDef,
  labelFromSelections,
  poolOptionsNotYetSelected,
  selectionsFromAttributes,
  suggestedOptionKeys,
  type OptionSelection,
  type VariantOptionDef,
} from "../../lib/variantOptionPool";

function toPool(rows: AdminVariantOption[]): VariantOptionDef[] {
  return rows.map((r) => ({
    key: r.key,
    label: r.label,
    kind: r.kind,
    placeholder: r.placeholder,
    suggestions: r.suggestions,
    recommended: r.recommended,
    sort_order: r.sort_order,
  }));
}

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
    is_active: true,
  });
  const [variantSku, setVariantSku] = useState("");
  const [variantLabel, setVariantLabel] = useState("");
  const [variantInventory, setVariantInventory] = useState(0);
  const [variantSelections, setVariantSelections] = useState<OptionSelection[]>([]);
  const [error, setError] = useState<string | null>(null);

  const categoryId = form.category || productQuery.data?.category || 0;

  const optionsQuery = useQuery({
    queryKey: ["admin", "variant-options", categoryId || "all"],
    queryFn: () =>
      listAdminVariantOptions(categoryId ? { categoryId } : undefined),
    enabled: !isNew && productId > 0,
  });

  const pool = useMemo(
    () => toPool(optionsQuery.data ?? []),
    [optionsQuery.data]
  );

  useEffect(() => {
    if (pool.length === 0) return;
    setVariantSelections(emptySelectionsForKeys(defaultSelectedKeys(pool), pool));
  }, [pool]);

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

  const toggleActive = useMutation({
    mutationFn: async (nextActive: boolean) => {
      const product = nextActive
        ? await activateAdminProduct(productId)
        : await deactivateAdminProduct(productId);
      // Keep Published when activating so the product actually shows on the storefront.
      if (nextActive && product.status !== "PUBLISHED") {
        return updateAdminProduct(productId, {
          status: "PUBLISHED",
          is_active: true,
        });
      }
      return product;
    },
    onSuccess: (product) => {
      setForm((prev) => ({
        ...prev,
        is_active: product.is_active,
        status: product.status,
      }));
      void queryClient.invalidateQueries({ queryKey: ["admin", "product", productId] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      setError(null);
    },
    onError: (err) => setError(formatApiValidationError(err)),
  });

  const addVariant = useMutation({
    mutationFn: () => {
      const attributes = buildAttributesFromSelections(variantSelections);
      const existing = variantsQuery.data?.results ?? [];
      const autoLabel = labelFromSelections(variantSelections);
      return createAdminVariant({
        product: productId,
        sku: variantSku,
        label: variantLabel.trim() || autoLabel,
        inventory_count: variantInventory,
        attributes,
        is_default: existing.length === 0,
        is_active: true,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "variants", productId] });
      setVariantSku("");
      setVariantLabel("");
      setVariantInventory(0);
      setVariantSelections(emptySelectionsForKeys(defaultSelectedKeys(pool), pool));
      setError(null);
    },
    onError: (err) => setError(formatApiValidationError(err)),
  });

  const saveVariant = useMutation({
    mutationFn: (payload: {
      id: number;
      label: string;
      inventory_count: number;
      selections: OptionSelection[];
    }) => {
      const attributes = buildAttributesFromSelections(payload.selections);
      const autoLabel = labelFromSelections(payload.selections);
      return updateAdminVariant(payload.id, {
        label: payload.label.trim() || autoLabel,
        inventory_count: payload.inventory_count,
        attributes,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "variants", productId] });
      setError(null);
    },
    onError: (err) => setError(formatApiValidationError(err)),
  });

  const deleteVariant = useMutation({
    mutationFn: (variantId: number) => deleteAdminVariant(variantId),
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

  function addOptionKey(key: string) {
    if (variantSelections.some((s) => s.key === key)) return;
    const def = getOptionDef(key, pool);
    setVariantSelections((prev) => [
      ...prev,
      def?.kind === "color"
        ? { key, value: "", colorHex: "#8b7355" }
        : { key, value: "" },
    ]);
  }

  function removeOptionKey(key: string) {
    setVariantSelections((prev) => prev.filter((s) => s.key !== key));
  }

  function updateSelection(key: string, patch: Partial<OptionSelection>) {
    setVariantSelections((prev) =>
      prev.map((s) => (s.key === key ? { ...s, ...patch } : s))
    );
  }

  if (!isNew && (productQuery.isLoading || !Number.isFinite(productId))) {
    return <LoadingGrid count={3} />;
  }

  const categories = categoriesQuery.data?.results ?? [];
  const suggestedKeys = suggestedOptionKeys(pool);
  const availableToAdd = poolOptionsNotYetSelected(
    pool,
    variantSelections.map((s) => s.key)
  );

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
            onChange={(e) => {
              const status = e.target.value;
              setForm({
                ...form,
                status,
                // Publishing implies storefront-visible; drafts stay inactive unless toggled.
                is_active: status === "PUBLISHED" ? true : form.is_active,
              });
            }}
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
        <fieldset className="admin-active-field">
          <legend>Storefront visibility</legend>
          <p className="admin-hint">
            Status must be <strong>Published</strong> and Active must be on for the product
            to appear in the shop.
          </p>
          <label className="admin-check">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            Active
          </label>
        </fieldset>
        {error ? (
          <p className="auth-form__error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="admin-form-actions">
          <Button type="submit" variant="primary" disabled={saveProduct.isPending}>
            Save product
          </Button>
          {!isNew && productId > 0 ? (
            <Button
              type="button"
              variant={form.is_active ? "outline" : "primary"}
              disabled={toggleActive.isPending || saveProduct.isPending}
              onClick={() => toggleActive.mutate(!form.is_active)}
            >
              {form.is_active ? "Deactivate" : "Make active"}
            </Button>
          ) : null}
        </div>
      </form>

      {!isNew && productId > 0 ? (
        <>
          <div className="admin-card" id="admin-product-variants">
            <h2>Options &amp; variants</h2>
            <p className="admin-hint">
              Option definitions are stored in Postgres (Neon). Pick options, type values, then
              save — each row is a Product variant; values map to{" "}
              <code>attributes</code> JSONB on the variant.
            </p>
            {optionsQuery.isLoading ? <LoadingGrid count={2} /> : null}
            {optionsQuery.isError ? (
              <p className="auth-form__error" role="alert">
                Could not load option pool from the database. Run{" "}
                <code>python manage.py seed_categories</code>.
              </p>
            ) : null}

            <ul className="admin-variant-list">
              {(variantsQuery.data?.results ?? []).map((v) => (
                <AdminVariantOptionsRow
                  key={v.id}
                  variant={v}
                  pool={pool}
                  busy={saveVariant.isPending || deleteVariant.isPending}
                  onSave={(payload) => saveVariant.mutate(payload)}
                  onDelete={(variantId) => {
                    if (
                      window.confirm(
                        `Delete variant ${v.sku}? This cannot be undone.`
                      )
                    ) {
                      deleteVariant.mutate(variantId);
                    }
                  }}
                />
              ))}
            </ul>
            {(variantsQuery.data?.results ?? []).length === 0 ? (
              <p className="admin-hint">No variants yet. Add the first one below.</p>
            ) : null}

            <h3 className="admin-card__subtitle">Add variant</h3>
            <OptionPoolPicker
              pool={pool}
              selectedKeys={variantSelections.map((s) => s.key)}
              suggestedKeys={suggestedKeys}
              available={availableToAdd}
              onAdd={addOptionKey}
              onRemove={removeOptionKey}
            />
            <form
              className="admin-form-grid"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                addVariant.mutate();
              }}
            >
              <OptionValueFields
                pool={pool}
                selections={variantSelections}
                onChange={updateSelection}
              />
              <label>
                SKU
                <input
                  value={variantSku}
                  onChange={(e) => setVariantSku(e.target.value)}
                  required
                  placeholder="e.g. SHAWL-TAUPE-M"
                />
              </label>
              <label>
                Label (optional)
                <input
                  value={variantLabel}
                  onChange={(e) => setVariantLabel(e.target.value)}
                  placeholder="Auto from option values if blank"
                />
              </label>
              <label>
                Inventory
                <input
                  type="number"
                  min={0}
                  value={variantInventory}
                  onChange={(e) =>
                    setVariantInventory(Number.parseInt(e.target.value, 10) || 0)
                  }
                />
              </label>
              <Button
                type="submit"
                variant="primary"
                disabled={addVariant.isPending || pool.length === 0}
              >
                {addVariant.isPending ? "Adding…" : "Add variant"}
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

function OptionPoolPicker({
  pool,
  selectedKeys,
  suggestedKeys,
  available,
  onAdd,
  onRemove,
}: {
  pool: VariantOptionDef[];
  selectedKeys: string[];
  suggestedKeys: string[];
  available: VariantOptionDef[];
  onAdd: (key: string) => void;
  onRemove: (key: string) => void;
}) {
  const suggestedAvailable = available.filter((o) => suggestedKeys.includes(o.key));
  const otherAvailable = available.filter((o) => !suggestedKeys.includes(o.key));

  return (
    <div className="admin-option-pool">
      <p className="admin-option-pool__label">Active options</p>
      <div className="admin-option-pool__chips">
        {selectedKeys.length === 0 ? (
          <span className="admin-hint">No options yet — add from the pool below.</span>
        ) : (
          selectedKeys.map((key) => {
            const def = getOptionDef(key, pool);
            return (
              <button
                key={key}
                type="button"
                className="admin-option-chip admin-option-chip--active"
                onClick={() => onRemove(key)}
                title="Remove option"
              >
                {def?.label ?? key} ×
              </button>
            );
          })
        )}
      </div>
      {suggestedAvailable.length > 0 ? (
        <>
          <p className="admin-option-pool__label">Suggested for this category</p>
          <div className="admin-option-pool__chips">
            {suggestedAvailable.map((o) => (
              <button
                key={o.key}
                type="button"
                className="admin-option-chip"
                onClick={() => onAdd(o.key)}
              >
                + {o.label}
              </button>
            ))}
          </div>
        </>
      ) : null}
      {otherAvailable.length > 0 ? (
        <label className="admin-option-pool__add">
          Add from full pool
          <select
            defaultValue=""
            onChange={(e) => {
              const key = e.target.value;
              if (key) onAdd(key);
              e.target.value = "";
            }}
          >
            <option value="">Choose an option…</option>
            {otherAvailable.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}
    </div>
  );
}

function OptionValueFields({
  pool,
  selections,
  onChange,
}: {
  pool: VariantOptionDef[];
  selections: OptionSelection[];
  onChange: (key: string, patch: Partial<OptionSelection>) => void;
}) {
  if (selections.length === 0) return null;
  return (
    <>
      {selections.map((sel) => {
        const def = getOptionDef(sel.key, pool);
        const label = def?.label ?? sel.key;
        const placeholder = def?.placeholder;
        const suggestions = def?.suggestions ?? [];
        if (def?.kind === "color" || sel.key === "color") {
          const hex =
            sel.colorHex && /^#[0-9A-Fa-f]{6}$/.test(sel.colorHex)
              ? sel.colorHex
              : "#8b7355";
          return (
            <div key={sel.key} className="admin-option-value-block">
              <label>
                {label}
                <input
                  value={sel.value}
                  onChange={(e) => onChange(sel.key, { value: e.target.value })}
                  placeholder={placeholder}
                  list={`opt-suggest-${sel.key}`}
                />
              </label>
              <label className="admin-color-picker">
                Color swatch
                <span className="admin-color-picker__row">
                  <input
                    type="color"
                    value={hex}
                    onChange={(e) => onChange(sel.key, { colorHex: e.target.value })}
                    aria-label={`${label} swatch`}
                  />
                  <input
                    type="text"
                    value={sel.colorHex ?? ""}
                    onChange={(e) => onChange(sel.key, { colorHex: e.target.value })}
                    placeholder="#8b7355"
                  />
                </span>
              </label>
              {suggestions.length > 0 ? (
                <datalist id={`opt-suggest-${sel.key}`}>
                  {suggestions.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              ) : null}
            </div>
          );
        }
        return (
          <label key={sel.key}>
            {label}
            <input
              value={sel.value}
              onChange={(e) => onChange(sel.key, { value: e.target.value })}
              placeholder={placeholder}
              list={`opt-suggest-${sel.key}`}
            />
            {suggestions.length > 0 ? (
              <datalist id={`opt-suggest-${sel.key}`}>
                {suggestions.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            ) : null}
          </label>
        );
      })}
    </>
  );
}

function AdminVariantOptionsRow({
  variant,
  pool,
  busy,
  onSave,
  onDelete,
}: {
  variant: AdminVariant;
  pool: VariantOptionDef[];
  busy: boolean;
  onSave: (payload: {
    id: number;
    label: string;
    inventory_count: number;
    selections: OptionSelection[];
  }) => void;
  onDelete: (variantId: number) => void;
}) {
  const [selections, setSelections] = useState(() =>
    selectionsFromAttributes(variant.attributes, pool, defaultSelectedKeys(pool))
  );
  const [label, setLabel] = useState(variant.label);
  const [inventory, setInventory] = useState(variant.inventory_count);

  useEffect(() => {
    setSelections(
      selectionsFromAttributes(variant.attributes, pool, defaultSelectedKeys(pool))
    );
    setLabel(variant.label);
    setInventory(variant.inventory_count);
  }, [variant, pool]);

  const available = poolOptionsNotYetSelected(
    pool,
    selections.map((s) => s.key)
  );
  const suggested = suggestedOptionKeys(pool);

  return (
    <li className="admin-variant-list__item admin-variant-list__item--edit">
      <div className="admin-variant-edit admin-variant-edit--options">
        <p className="admin-variant-edit__sku">SKU {variant.sku}</p>
        <OptionPoolPicker
          pool={pool}
          selectedKeys={selections.map((s) => s.key)}
          suggestedKeys={suggested}
          available={available}
          onAdd={(key) => {
            const def = getOptionDef(key, pool);
            setSelections((prev) => [
              ...prev,
              def?.kind === "color"
                ? { key, value: "", colorHex: "#8b7355" }
                : { key, value: "" },
            ]);
          }}
          onRemove={(key) => setSelections((prev) => prev.filter((s) => s.key !== key))}
        />
        <OptionValueFields
          pool={pool}
          selections={selections}
          onChange={(key, patch) =>
            setSelections((prev) =>
              prev.map((s) => (s.key === key ? { ...s, ...patch } : s))
            )
          }
        />
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
        <div className="admin-form-actions">
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={() =>
              onSave({
                id: variant.id,
                label,
                inventory_count: inventory,
                selections,
              })
            }
          >
            Save variant
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={busy}
            onClick={() => onDelete(variant.id)}
          >
            Delete variant
          </Button>
        </div>
      </div>
    </li>
  );
}
