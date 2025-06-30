# Sistem Resep dan Bahan Baku KOIU Coffee

## Overview
Sistem ini dirancang untuk menghitung **HPP (Harga Pokok Penjualan)** secara otomatis per varian kopi, sehingga dapat mengetahui margin keuntungan yang akurat untuk setiap produk.

## Struktur Database

### Tabel Utama

#### 1. `ingredient_categories`
Kategori untuk mengelompokkan bahan baku.

```sql
- id: SERIAL PRIMARY KEY
- name: VARCHAR(50) NOT NULL UNIQUE
- description: TEXT
- color: VARCHAR(7) DEFAULT '#6B7280' -- hex color untuk UI
- created_at: TIMESTAMP
```

**Kategori Default:**
- Coffee Beans (Biji kopi dan espresso)
- Milk & Dairy (Susu dan produk olahan susu)
- Syrups & Sweeteners (Sirup dan pemanis)
- Spices & Flavors (Rempah dan perasa)
- Packaging (Kemasan dan wadah)
- Other (Bahan lainnya)

#### 2. `ingredients`
Master data bahan baku dengan harga per unit.

```sql
- id: SERIAL PRIMARY KEY
- name: VARCHAR(100) NOT NULL UNIQUE
- description: TEXT
- unit: VARCHAR(20) NOT NULL -- gram, ml, piece, etc.
- cost_per_unit: DECIMAL(10,2) NOT NULL -- harga per unit
- supplier: VARCHAR(100)
- category_id: INTEGER REFERENCES ingredient_categories(id)
- minimum_stock: INTEGER DEFAULT 0
- current_stock: DECIMAL(10,2) DEFAULT 0
- is_active: BOOLEAN DEFAULT TRUE
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

**Contoh Data:**
- Espresso Shot: Rp 5,000 per shot
- Steamed Milk: Rp 15 per ml
- Palm Sugar Syrup: Rp 20 per ml
- Cup 250ml: Rp 500 per piece
- Lid: Rp 200 per piece

#### 3. `variant_recipes`
Resep untuk setiap varian kopi (per size).

```sql
- id: SERIAL PRIMARY KEY
- variant_id: VARCHAR(100) REFERENCES coffee_variants(id)
- name: VARCHAR(100) NOT NULL
- description: TEXT
- serving_size: DECIMAL(8,2) NOT NULL -- ukuran sajian
- estimated_cost: DECIMAL(10,2) DEFAULT 0 -- HPP (dihitung otomatis)
- profit_margin: DECIMAL(5,2) DEFAULT 0 -- margin target %
- is_active: BOOLEAN DEFAULT TRUE
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 4. `recipe_ingredients`
Detail bahan yang digunakan dalam setiap resep.

```sql
- id: SERIAL PRIMARY KEY
- recipe_id: INTEGER REFERENCES variant_recipes(id)
- ingredient_id: INTEGER REFERENCES ingredients(id)
- quantity: DECIMAL(8,2) NOT NULL -- jumlah yang digunakan
- cost: DECIMAL(10,2) DEFAULT 0 -- biaya (dihitung otomatis)
- notes: TEXT -- catatan khusus
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 5. `ingredient_price_history`
Riwayat perubahan harga bahan baku.

```sql
- id: SERIAL PRIMARY KEY
- ingredient_id: INTEGER REFERENCES ingredients(id)
- old_price: DECIMAL(10,2) NOT NULL
- new_price: DECIMAL(10,2) NOT NULL
- change_reason: VARCHAR(200)
- changed_by: INTEGER REFERENCES admin_users(id)
- created_at: TIMESTAMP
```

### Modifikasi Tabel Existing

#### `coffee_variants` (tambahan kolom)
```sql
- cost_price: DECIMAL(10,2) DEFAULT 0 -- HPP
- profit_amount: DECIMAL(10,2) DEFAULT 0 -- keuntungan dalam rupiah
- profit_percentage: DECIMAL(5,2) DEFAULT 0 -- persentase keuntungan
```

## Sistem Kalkulasi Otomatis

### 1. Trigger untuk Menghitung Cost
Setiap perubahan quantity atau harga bahan akan memicu kalkulasi ulang:

```sql
-- Menghitung cost per ingredient dalam resep
cost = quantity × cost_per_unit

-- Menghitung total estimated_cost per resep
estimated_cost = SUM(cost) dari semua recipe_ingredients

-- Update HPP di coffee_variants
cost_price = estimated_cost
profit_amount = price - cost_price
profit_percentage = (profit_amount / price) × 100
```

### 2. Flow Kalkulasi
1. **Input Resep:** Admin memasukkan bahan dan quantity
2. **Auto Calculate:** Sistem menghitung cost per bahan
3. **Sum Total:** Total HPP resep dihitung otomatis
4. **Update Variant:** HPP dan margin profit diupdate di tabel variant
5. **History Log:** Perubahan harga bahan dicatat secara otomatis

## Contoh Implementasi

### Resep Cafe Latte 250ml
```
Bahan:
- 2 shot Espresso × Rp 5,000 = Rp 10,000
- 200ml Steamed Milk × Rp 15 = Rp 3,000
- 1 Cup 250ml × Rp 500 = Rp 500
- 1 Lid × Rp 200 = Rp 200

Total HPP = Rp 13,700
Harga Jual = Rp 13,000
Profit = Rp 13,000 - Rp 13,700 = -Rp 700 (RUGI!)
Margin = -5.38%
```

### Resep Palm Sugar 250ml
```
Bahan:
- 2 shot Espresso × Rp 5,000 = Rp 10,000
- 150ml Steamed Milk × Rp 15 = Rp 2,250
- 50ml Palm Sugar Syrup × Rp 20 = Rp 1,000
- 1 Cup 250ml × Rp 500 = Rp 500
- 1 Lid × Rp 200 = Rp 200

Total HPP = Rp 13,950
Harga Jual = Rp 13,000
Profit = -Rp 950 (RUGI!)
Margin = -7.31%
```

## Fitur Admin Panel yang Perlu Ditambahkan

### 1. Manajemen Bahan Baku
- **Daftar Ingredients:** CRUD bahan baku dengan kategori
- **Update Harga:** Form untuk update harga dengan alasan
- **Stock Tracking:** Monitor stock minimum dan current
- **Price History:** Riwayat perubahan harga

### 2. Manajemen Resep
- **Recipe Builder:** Interface untuk membuat resep per varian
- **Drag & Drop:** Tambah/kurang bahan dengan mudah
- **Live Calculation:** HPP terhitung real-time saat input
- **Recipe Templates:** Template resep untuk varian serupa

### 3. Analisis Profitabilitas
- **Profit Analysis:** Tabel semua varian dengan HPP dan margin
- **Cost Breakdown:** Detail komposisi biaya per bahan
- **Price Recommendations:** Saran harga jual berdasarkan target margin
- **Variant Comparison:** Perbandingan profitabilitas antar varian

### 4. Laporan
- **Cost Report:** Laporan HPP per periode
- **Ingredient Usage:** Bahan yang paling banyak digunakan
- **Price Trend:** Trend harga bahan baku
- **Profitability Trend:** Trend margin keuntungan

## API Endpoints yang Perlu Dibuat

### Ingredients Management
```
GET /api/admin/ingredients - List all ingredients
POST /api/admin/ingredients - Create new ingredient
PUT /api/admin/ingredients/:id - Update ingredient
DELETE /api/admin/ingredients/:id - Delete ingredient
GET /api/admin/ingredients/categories - Get categories
```

### Recipe Management
```
GET /api/admin/recipes - List all recipes
GET /api/admin/recipes/variant/:variantId - Get recipe by variant
POST /api/admin/recipes - Create new recipe
PUT /api/admin/recipes/:id - Update recipe
DELETE /api/admin/recipes/:id - Delete recipe
```

### Analysis & Reports
```
GET /api/admin/analysis/profitability - Get profit analysis
GET /api/admin/analysis/costs - Get cost breakdown
GET /api/admin/reports/ingredient-usage - Usage reports
GET /api/admin/reports/price-history - Price history
```

## Manfaat Sistem

### 1. Akurasi HPP
- **Real-time Calculation:** HPP selalu akurat sesuai harga terkini
- **Detailed Breakdown:** Tahu persis komponen biaya terbesar
- **Historical Tracking:** Dapat melihat trend biaya dari waktu ke waktu

### 2. Optimasi Pricing
- **Margin Visibility:** Tahu margin keuntungan setiap varian
- **Price Adjustment:** Dapat menyesuaikan harga berdasarkan HPP
- **Target Profit:** Set target margin untuk setiap produk

### 3. Inventory Management
- **Stock Control:** Monitor stock bahan baku
- **Reorder Point:** Alert ketika stock mencapai minimum
- **Supplier Management:** Track supplier per bahan

### 4. Business Intelligence
- **Profitability Analysis:** Identifikasi produk paling/kurang menguntungkan
- **Cost Optimization:** Identifikasi bahan dengan biaya tertinggi
- **Menu Engineering:** Optimasi menu berdasarkan profitabilitas

## Implementasi Phase

### Phase 1: Basic Recipe System
1. Setup database tables
2. Create ingredient management interface
3. Build basic recipe builder
4. Implement auto-calculation

### Phase 2: Advanced Features
1. Cost analysis dashboard
2. Price recommendation system
3. Advanced reporting
4. Historical trend analysis

### Phase 3: Optimization
1. Mobile-friendly interface
2. Bulk operations
3. Integration with ordering system
4. Automated alerts and notifications

## Kesimpulan

Sistem ini akan memberikan visibilitas penuh terhadap struktur biaya dan profitabilitas setiap varian kopi. Dengan implementasi yang tepat, KOIU Coffee dapat:

1. **Optimasi Harga:** Menyesuaikan harga jual berdasarkan HPP real
2. **Kontrol Biaya:** Identifikasi dan kontrol komponen biaya terbesar
3. **Profitabilitas:** Fokus pada varian dengan margin terbaik
4. **Efisiensi Operasional:** Streamline management bahan baku dan resep

Data sample menunjukkan bahwa beberapa varian saat ini **berpotensi rugi**, sehingga sistem ini sangat penting untuk keberlanjutan bisnis. 