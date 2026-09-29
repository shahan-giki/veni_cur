"""Realistic sample catalog for seed_full_catalog (names, prices, variant attrs)."""

from __future__ import annotations

from decimal import Decimal

# Per category_slug: list of products.
# Each product: name, slug, description, base_price, variants[]
# Each variant: sku, label, inventory_count, attributes (JSONB keys match option pool)

CATALOG_SEED: dict[str, list[dict]] = {
    "skincare": [
        {
            "name": "Rosehip Glow Face Oil",
            "slug": "rosehip-glow-face-oil",
            "description": (
                "Lightweight cold-pressed rosehip oil that softens dry patches and "
                "leaves skin looking fresh after cleansing."
            ),
            "base_price": Decimal("1890.00"),
            "variants": [
                {
                    "sku": "SKIN-ROSEHIP-15",
                    "label": "15ml · All skin types · Oil",
                    "inventory_count": 40,
                    "attributes": {
                        "volume": "15ml",
                        "skin_type": "All skin types",
                        "texture": "Oil",
                    },
                },
                {
                    "sku": "SKIN-ROSEHIP-30",
                    "label": "30ml · All skin types · Oil",
                    "inventory_count": 55,
                    "attributes": {
                        "volume": "30ml",
                        "skin_type": "All skin types",
                        "texture": "Oil",
                    },
                },
            ],
        },
        {
            "name": "Niacinamide Daily Serum",
            "slug": "niacinamide-daily-serum",
            "description": (
                "A water-light niacinamide serum for oily and combination skin — "
                "helps even tone without a sticky finish."
            ),
            "base_price": Decimal("2450.00"),
            "variants": [
                {
                    "sku": "SKIN-NIAC-30",
                    "label": "30ml · Oily · Serum",
                    "inventory_count": 60,
                    "attributes": {
                        "volume": "30ml",
                        "skin_type": "Oily",
                        "texture": "Serum",
                    },
                },
                {
                    "sku": "SKIN-NIAC-50",
                    "label": "50ml · Combination · Serum",
                    "inventory_count": 35,
                    "attributes": {
                        "volume": "50ml",
                        "skin_type": "Combination",
                        "texture": "Serum",
                    },
                },
            ],
        },
        {
            "name": "Barrier Repair Cream SPF 30",
            "slug": "barrier-repair-cream-spf-30",
            "description": (
                "Day cream with SPF 30 for sensitive skin. Soft cream texture that "
                "locks in moisture under makeup."
            ),
            "base_price": Decimal("3200.00"),
            "variants": [
                {
                    "sku": "SKIN-BARRIER-50",
                    "label": "50ml · Sensitive · Cream · SPF 30",
                    "inventory_count": 28,
                    "attributes": {
                        "volume": "50ml",
                        "skin_type": "Sensitive",
                        "texture": "Cream",
                        "spf": "SPF 30",
                    },
                },
                {
                    "sku": "SKIN-BARRIER-100",
                    "label": "100ml · Sensitive · Cream · SPF 30",
                    "inventory_count": 18,
                    "attributes": {
                        "volume": "100ml",
                        "skin_type": "Sensitive",
                        "texture": "Cream",
                        "spf": "SPF 30",
                    },
                },
            ],
        },
    ],
    "oral-care": [
        {
            "name": "Herbal Miswak Toothpaste",
            "slug": "herbal-miswak-toothpaste",
            "description": (
                "Fluoride-free herbal paste with miswak extract — fresh breath "
                "without a harsh mint burn."
            ),
            "base_price": Decimal("450.00"),
            "variants": [
                {
                    "sku": "ORAL-MISWAK-MINT",
                    "label": "Mint · Single",
                    "inventory_count": 80,
                    "attributes": {"flavor": "Mint", "pack_size": "Single"},
                },
                {
                    "sku": "ORAL-MISWAK-CLOVE",
                    "label": "Clove · Single",
                    "inventory_count": 64,
                    "attributes": {"flavor": "Clove", "pack_size": "Single"},
                },
                {
                    "sku": "ORAL-MISWAK-DUO",
                    "label": "Mint · Duo",
                    "inventory_count": 40,
                    "attributes": {"flavor": "Mint", "pack_size": "Duo"},
                },
            ],
        },
        {
            "name": "Soft Bamboo Toothbrush",
            "slug": "soft-bamboo-toothbrush",
            "description": (
                "Plant-based handle with soft tapered bristles — gentle on gums, "
                "sold as singles or family packs."
            ),
            "base_price": Decimal("320.00"),
            "variants": [
                {
                    "sku": "ORAL-BAMBOO-SOFT-1",
                    "label": "Soft · 1",
                    "inventory_count": 100,
                    "attributes": {
                        "bristle_firmness": "Soft",
                        "count": "1",
                        "pack_size": "Single",
                    },
                },
                {
                    "sku": "ORAL-BAMBOO-SOFT-4",
                    "label": "Soft · Pack of 4",
                    "inventory_count": 45,
                    "attributes": {
                        "bristle_firmness": "Soft",
                        "count": "4",
                        "pack_size": "Pack of 4",
                    },
                },
                {
                    "sku": "ORAL-BAMBOO-MED-1",
                    "label": "Medium · 1",
                    "inventory_count": 70,
                    "attributes": {
                        "bristle_firmness": "Medium",
                        "count": "1",
                        "pack_size": "Single",
                    },
                },
            ],
        },
        {
            "name": "Charcoal Whitening Powder",
            "slug": "charcoal-whitening-powder",
            "description": (
                "Activated charcoal polish for occasional brightening. Use sparingly "
                "with a soft brush."
            ),
            "base_price": Decimal("890.00"),
            "variants": [
                {
                    "sku": "ORAL-CHAR-30",
                    "label": "30ml · Charcoal · Single",
                    "inventory_count": 50,
                    "attributes": {
                        "volume": "30ml",
                        "flavor": "Charcoal",
                        "pack_size": "Single",
                    },
                },
                {
                    "sku": "ORAL-CHAR-50",
                    "label": "50ml · Charcoal · Single",
                    "inventory_count": 30,
                    "attributes": {
                        "volume": "50ml",
                        "flavor": "Charcoal",
                        "pack_size": "Single",
                    },
                },
            ],
        },
    ],
    "perfumes-fragrances": [
        {
            "name": "Oud Wood Attar",
            "slug": "oud-wood-attar",
            "description": (
                "Concentrated perfume oil with deep oud and sandalwood. Dab on "
                "pulse points — long wear without alcohol burn."
            ),
            "base_price": Decimal("4200.00"),
            "variants": [
                {
                    "sku": "PERF-OUD-6",
                    "label": "6ml · Attar · Oud · Oud",
                    "inventory_count": 25,
                    "attributes": {
                        "volume": "6ml",
                        "concentration": "Attar",
                        "scent_family": "Oud",
                        "scent_note": "Oud",
                    },
                },
                {
                    "sku": "PERF-OUD-12",
                    "label": "12ml · Attar · Oud · Sandalwood",
                    "inventory_count": 18,
                    "attributes": {
                        "volume": "12ml",
                        "concentration": "Attar",
                        "scent_family": "Oud",
                        "scent_note": "Sandalwood",
                    },
                },
            ],
        },
        {
            "name": "Damask Rose EDP",
            "slug": "damask-rose-edp",
            "description": (
                "Eau de Parfum built around Damask rose with a soft musk dry-down. "
                "Ideal for evening and cooler weather."
            ),
            "base_price": Decimal("6500.00"),
            "variants": [
                {
                    "sku": "PERF-ROSE-50",
                    "label": "50ml · EDP · Floral · Rose",
                    "inventory_count": 22,
                    "attributes": {
                        "volume": "50ml",
                        "concentration": "EDP",
                        "scent_family": "Floral",
                        "scent_note": "Rose",
                    },
                },
                {
                    "sku": "PERF-ROSE-100",
                    "label": "100ml · EDP · Floral · Rose",
                    "inventory_count": 14,
                    "attributes": {
                        "volume": "100ml",
                        "concentration": "EDP",
                        "scent_family": "Floral",
                        "scent_note": "Rose",
                    },
                },
            ],
        },
        {
            "name": "Citrus Musk Body Mist",
            "slug": "citrus-musk-body-mist",
            "description": (
                "Light body mist for daily refresh — bright citrus opening over "
                "clean musk. Easy to layer."
            ),
            "base_price": Decimal("1800.00"),
            "variants": [
                {
                    "sku": "PERF-CITRUS-50",
                    "label": "50ml · Body mist · Citrus · Musk",
                    "inventory_count": 48,
                    "attributes": {
                        "volume": "50ml",
                        "concentration": "Body mist",
                        "scent_family": "Citrus",
                        "scent_note": "Musk",
                    },
                },
                {
                    "sku": "PERF-CITRUS-100",
                    "label": "100ml · Body mist · Fresh · Musk",
                    "inventory_count": 36,
                    "attributes": {
                        "volume": "100ml",
                        "concentration": "Body mist",
                        "scent_family": "Fresh",
                        "scent_note": "Musk",
                    },
                },
            ],
        },
    ],
    "shawls": [
        {
            "name": "Pashmina Border Shawl",
            "slug": "pashmina-border-shawl",
            "description": (
                "Fine pashmina with a contrasting woven border. Soft drape for "
                "formal wear and cooler evenings."
            ),
            "base_price": Decimal("8900.00"),
            "variants": [
                {
                    "sku": "SHAWL-PASH-IVORY-OS",
                    "label": "Ivory · One size",
                    "inventory_count": 12,
                    "attributes": {
                        "color": "Ivory",
                        "color_hex": "#fffff0",
                        "size": "One size",
                        "material": "Pashmina",
                        "dimensions": "70×200 cm",
                    },
                },
                {
                    "sku": "SHAWL-PASH-MAROON-OS",
                    "label": "Maroon · One size",
                    "inventory_count": 10,
                    "attributes": {
                        "color": "Maroon",
                        "color_hex": "#800000",
                        "size": "One size",
                        "material": "Pashmina",
                        "dimensions": "70×200 cm",
                    },
                },
                {
                    "sku": "SHAWL-PASH-NAVY-OS",
                    "label": "Navy · One size",
                    "inventory_count": 9,
                    "attributes": {
                        "color": "Navy",
                        "color_hex": "#1e3a5f",
                        "size": "One size",
                        "material": "Pashmina",
                        "dimensions": "100×200 cm",
                    },
                },
            ],
        },
        {
            "name": "Handwoven Wool Wrap",
            "slug": "handwoven-wool-wrap",
            "description": (
                "Thick handwoven wool wrap with a plain finish — warm enough for "
                "winter travel, large enough to wear as a throw."
            ),
            "base_price": Decimal("5400.00"),
            "variants": [
                {
                    "sku": "SHAWL-WOOL-GREY-OS",
                    "label": "Grey · One size · Handwoven",
                    "inventory_count": 15,
                    "attributes": {
                        "color": "Grey",
                        "color_hex": "#6b7280",
                        "size": "One size",
                        "material": "Wool",
                        "weave": "Handwoven",
                        "dimensions": "110×220 cm",
                    },
                },
                {
                    "sku": "SHAWL-WOOL-OLIVE-OS",
                    "label": "Olive · One size · Handwoven",
                    "inventory_count": 11,
                    "attributes": {
                        "color": "Olive",
                        "color_hex": "#556b2f",
                        "size": "One size",
                        "material": "Wool",
                        "weave": "Handwoven",
                        "dimensions": "110×220 cm",
                    },
                },
            ],
        },
        {
            "name": "Embroidered Cotton Dupatta",
            "slug": "embroidered-cotton-dupatta",
            "description": (
                "Lightweight cotton dupatta with delicate embroidery along the "
                "edges — everyday wear with lawn and linen."
            ),
            "base_price": Decimal("2100.00"),
            "variants": [
                {
                    "sku": "SHAWL-COT-WHITE-OS",
                    "label": "White · One size · Embroidered",
                    "inventory_count": 30,
                    "attributes": {
                        "color": "White",
                        "color_hex": "#ffffff",
                        "size": "One size",
                        "material": "Cotton",
                        "weave": "Embroidered",
                        "dimensions": "70×200 cm",
                    },
                },
                {
                    "sku": "SHAWL-COT-CREAM-OS",
                    "label": "Cream · One size · Embroidered",
                    "inventory_count": 26,
                    "attributes": {
                        "color": "Cream",
                        "color_hex": "#fffdd0",
                        "size": "One size",
                        "material": "Cotton",
                        "weave": "Embroidered",
                        "dimensions": "70×200 cm",
                    },
                },
                {
                    "sku": "SHAWL-COT-GOLD-OS",
                    "label": "Gold · One size · Embroidered",
                    "inventory_count": 20,
                    "attributes": {
                        "color": "Gold",
                        "color_hex": "#c9a227",
                        "size": "One size",
                        "material": "Cotton",
                        "weave": "Embroidered",
                        "dimensions": "70×200 cm",
                    },
                },
            ],
        },
    ],
    "peshawari-chappals": [
        {
            "name": "Classic Kaptaan Chappal",
            "slug": "classic-kaptaan-chappal",
            "description": (
                "Traditional Peshawari kaptaan style in full grain leather with a "
                "durable single sole — office and everyday wear."
            ),
            "base_price": Decimal("4800.00"),
            "variants": [
                {
                    "sku": "CHAP-KAPT-BRN-40",
                    "label": "Brown · 40 · Leather",
                    "inventory_count": 8,
                    "attributes": {
                        "color": "Brown",
                        "color_hex": "#8b4513",
                        "footwear_size": "40",
                        "upper": "Leather",
                        "sole": "Single sole",
                        "finish": "Natural",
                    },
                },
                {
                    "sku": "CHAP-KAPT-BRN-41",
                    "label": "Brown · 41 · Leather",
                    "inventory_count": 10,
                    "attributes": {
                        "color": "Brown",
                        "color_hex": "#8b4513",
                        "footwear_size": "41",
                        "upper": "Leather",
                        "sole": "Single sole",
                        "finish": "Natural",
                    },
                },
                {
                    "sku": "CHAP-KAPT-BRN-42",
                    "label": "Brown · 42 · Leather",
                    "inventory_count": 12,
                    "attributes": {
                        "color": "Brown",
                        "color_hex": "#8b4513",
                        "footwear_size": "42",
                        "upper": "Leather",
                        "sole": "Single sole",
                        "finish": "Natural",
                    },
                },
                {
                    "sku": "CHAP-KAPT-BRN-43",
                    "label": "Brown · 43 · Leather",
                    "inventory_count": 9,
                    "attributes": {
                        "color": "Brown",
                        "color_hex": "#8b4513",
                        "footwear_size": "43",
                        "upper": "Leather",
                        "sole": "Single sole",
                        "finish": "Natural",
                    },
                },
            ],
        },
        {
            "name": "Suede Zalmi Chappal",
            "slug": "suede-zalmi-chappal",
            "description": (
                "Soft suede Zalmi pattern with double sole cushioning. Matte finish "
                "that pairs with casual shalwar kameez."
            ),
            "base_price": Decimal("5200.00"),
            "variants": [
                {
                    "sku": "CHAP-ZAL-TAUPE-41",
                    "label": "Taupe · 41 · Suede",
                    "inventory_count": 7,
                    "attributes": {
                        "color": "Taupe",
                        "color_hex": "#8b7355",
                        "footwear_size": "41",
                        "upper": "Suede",
                        "sole": "Double sole",
                        "finish": "Matte",
                    },
                },
                {
                    "sku": "CHAP-ZAL-TAUPE-42",
                    "label": "Taupe · 42 · Suede",
                    "inventory_count": 11,
                    "attributes": {
                        "color": "Taupe",
                        "color_hex": "#8b7355",
                        "footwear_size": "42",
                        "upper": "Suede",
                        "sole": "Double sole",
                        "finish": "Matte",
                    },
                },
                {
                    "sku": "CHAP-ZAL-TAUPE-43",
                    "label": "Taupe · 43 · Suede",
                    "inventory_count": 8,
                    "attributes": {
                        "color": "Taupe",
                        "color_hex": "#8b7355",
                        "footwear_size": "43",
                        "upper": "Suede",
                        "sole": "Double sole",
                        "finish": "Matte",
                    },
                },
            ],
        },
        {
            "name": "Black Formal Norozi",
            "slug": "black-formal-norozi",
            "description": (
                "Polished black Norozi chappal with leather sole — sharp enough for "
                "events and Friday prayer."
            ),
            "base_price": Decimal("5600.00"),
            "variants": [
                {
                    "sku": "CHAP-NOR-BLK-40",
                    "label": "Black · 40 · Leather",
                    "inventory_count": 6,
                    "attributes": {
                        "color": "Black",
                        "color_hex": "#111111",
                        "footwear_size": "40",
                        "upper": "Leather",
                        "sole": "Leather sole",
                        "finish": "Polished",
                    },
                },
                {
                    "sku": "CHAP-NOR-BLK-42",
                    "label": "Black · 42 · Leather",
                    "inventory_count": 10,
                    "attributes": {
                        "color": "Black",
                        "color_hex": "#111111",
                        "footwear_size": "42",
                        "upper": "Leather",
                        "sole": "Leather sole",
                        "finish": "Polished",
                    },
                },
                {
                    "sku": "CHAP-NOR-BLK-44",
                    "label": "Black · 44 · Leather",
                    "inventory_count": 5,
                    "attributes": {
                        "color": "Black",
                        "color_hex": "#111111",
                        "footwear_size": "44",
                        "upper": "Leather",
                        "sole": "Leather sole",
                        "finish": "Polished",
                    },
                },
            ],
        },
    ],
}
