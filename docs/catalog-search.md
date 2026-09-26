# Catalog search (Phase 3)

Veni uses **PostgreSQL** `icontains` filters on the product queryset — no Elasticsearch/OpenSearch.

## Public `GET /api/v1/products/`

| Parameter | Behavior |
|-----------|----------|
| `q` | Case-insensitive match on **product name**, **description**, **product.sku**, or any **variant SKU** (`distinct()` applied) |
| `category` | Filter by category **slug** |
| `ordering` | `name`, `-name`, `created_at`, `-created_at`, `base_price`, `-base_price` (default `name`) |
| `page`, `page_size` | Page-number pagination (max 100) |

Only **published**, **active** products in **active, visible** categories are returned.

Future phases may swap the backend filter implementation without changing query parameter names.
