-- Schema tambahan untuk sistem resep dan bahan baku KOIU Coffee
-- Untuk menghitung HPP (Harga Pokok Penjualan) per varian

-- Tabel bahan baku/ingredient
CREATE TABLE IF NOT EXISTS ingredients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  unit VARCHAR(20) NOT NULL, -- gram, ml, piece, etc.
  cost_per_unit DECIMAL(10,2) NOT NULL, -- harga per unit
  supplier VARCHAR(100),
  minimum_stock INTEGER DEFAULT 0,
  current_stock DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  -- Package calculation fields
  package_size DECIMAL(10,2), -- ukuran kemasan (untuk auto calculate)
  package_price DECIMAL(10,2), -- harga kemasan (untuk auto calculate)
  last_package_update TIMESTAMP WITH TIME ZONE, -- kapan terakhir dihitung dari package
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel resep per varian kopi
CREATE TABLE IF NOT EXISTS variant_recipes (
  id SERIAL PRIMARY KEY,
  variant_id VARCHAR(100) REFERENCES coffee_variants(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  serving_size DECIMAL(8,2) NOT NULL, -- ukuran sajian dalam ml
  estimated_cost DECIMAL(10,2) DEFAULT 0, -- HPP total (calculated)
  profit_margin DECIMAL(5,2) DEFAULT 0, -- target margin %
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel kategori bahan baku
CREATE TABLE IF NOT EXISTS ingredient_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(7) DEFAULT '#6B7280', -- hex color for UI
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tambahkan foreign key ke tabel ingredients
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES ingredient_categories(id);

-- Tabel detail bahan dalam resep
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id SERIAL PRIMARY KEY,
  recipe_id INTEGER REFERENCES variant_recipes(id) ON DELETE CASCADE,
  ingredient_id INTEGER REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity DECIMAL(8,2) NOT NULL, -- jumlah yang digunakan
  cost DECIMAL(10,2) DEFAULT 0, -- biaya untuk quantity ini (calculated)
  notes TEXT, -- catatan khusus untuk bahan ini
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel riwayat perubahan harga bahan
CREATE TABLE IF NOT EXISTS ingredient_price_history (
  id SERIAL PRIMARY KEY,
  ingredient_id INTEGER REFERENCES ingredients(id) ON DELETE CASCADE,
  old_price DECIMAL(10,2) NOT NULL,
  new_price DECIMAL(10,2) NOT NULL,
  change_reason VARCHAR(200),
  changed_by INTEGER, -- bisa ditambahkan references ke admin_users(id) nanti
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tambah kolom HPP ke tabel coffee_variants yang sudah ada
ALTER TABLE coffee_variants ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,2) DEFAULT 0;
ALTER TABLE coffee_variants ADD COLUMN IF NOT EXISTS profit_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE coffee_variants ADD COLUMN IF NOT EXISTS profit_percentage DECIMAL(5,2) DEFAULT 0;

-- Tambah kolom package calculation ke tabel ingredients yang sudah ada
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS package_size DECIMAL(10,2);
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS package_price DECIMAL(10,2);
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS last_package_update TIMESTAMP WITH TIME ZONE;

-- Insert data kategori bahan baku
INSERT INTO ingredient_categories (name, description, color) VALUES
('Coffee Beans', 'Biji kopi dan espresso shot', '#8B4513'),
('Milk & Dairy', 'Susu dan produk olahan susu', '#F5F5DC'),
('Syrups & Sweeteners', 'Sirup dan pemanis', '#FFD700'),
('Spices & Flavors', 'Rempah-rempah dan perasa', '#CD853F'),
('Packaging', 'Kemasan dan wadah', '#D3D3D3'),
('Other', 'Bahan lainnya', '#6B7280')
ON CONFLICT (name) DO NOTHING;

-- Insert sample ingredients
INSERT INTO ingredients (name, description, unit, cost_per_unit, supplier, category_id, minimum_stock, current_stock, is_active) VALUES
-- Coffee Beans Category (id: 1)
('Espresso Shot', 'Single espresso shot arabica blend', 'shot', 5000, 'Local Coffee Roaster', 1, 50, 200, true),
('Double Espresso Shot', 'Double espresso shot for stronger drinks', 'shot', 8000, 'Local Coffee Roaster', 1, 30, 150, true),

-- Milk & Dairy Category (id: 2)  
('Fresh Milk', 'Full cream fresh milk for steaming', 'ml', 15, 'Dairy Farm Co.', 2, 2000, 5000, true),
('Coconut Milk', 'Alternative milk for vegan options', 'ml', 25, 'Coconut Supplier', 2, 1000, 2000, true),
('Oat Milk', 'Premium oat milk alternative', 'ml', 35, 'Oat Milk Brand', 2, 500, 1200, true),

-- Syrups & Sweeteners Category (id: 3)
('Palm Sugar Syrup', 'Traditional palm sugar syrup', 'ml', 20, 'Sugar Mill Ltd.', 3, 500, 1500, true),
('Vanilla Syrup', 'Premium vanilla flavoring syrup', 'ml', 30, 'Flavor House', 3, 300, 800, true),
('Brown Sugar Syrup', 'Rich brown sugar syrup', 'ml', 18, 'Sugar Mill Ltd.', 3, 500, 1200, true),
('Honey', 'Pure natural honey', 'ml', 50, 'Bee Farm', 3, 200, 500, true),

-- Spices & Flavors Category (id: 4)
('Cinnamon Powder', 'Ground cinnamon for flavoring', 'gram', 100, 'Spice Trader', 4, 50, 200, true),
('Cocoa Powder', 'Pure unsweetened cocoa powder', 'gram', 150, 'Chocolate Co.', 4, 100, 300, true),
('Matcha Powder', 'Premium grade matcha powder', 'gram', 500, 'Tea Master', 4, 50, 100, true),

-- Packaging Category (id: 5)
('Cup 250ml', 'Disposable paper cup 250ml', 'piece', 500, 'Packaging Supplier', 5, 200, 1000, true),
('Cup 350ml', 'Disposable paper cup 350ml', 'piece', 600, 'Packaging Supplier', 5, 200, 800, true),
('Cup 500ml', 'Disposable paper cup 500ml', 'piece', 700, 'Packaging Supplier', 5, 150, 600, true),
('Lid Small', 'Plastic lid for 250ml cup', 'piece', 200, 'Packaging Supplier', 5, 300, 1200, true),
('Lid Medium', 'Plastic lid for 350ml cup', 'piece', 250, 'Packaging Supplier', 5, 300, 1000, true),
('Lid Large', 'Plastic lid for 500ml cup', 'piece', 300, 'Packaging Supplier', 5, 200, 800, true),
('Straw', 'Biodegradable paper straw', 'piece', 100, 'Eco Packaging', 5, 500, 2000, true),

-- Other Category (id: 6)
('Ice Cubes', 'Filtered water ice cubes', 'piece', 50, 'Ice Factory', 6, 1000, 5000, true),
('Whipped Cream', 'Fresh whipped cream topping', 'ml', 40, 'Dairy Farm Co.', 6, 200, 800, true)
ON CONFLICT (name) DO NOTHING;

-- Function untuk auto-calculate cost di recipe_ingredients
CREATE OR REPLACE FUNCTION calculate_recipe_ingredient_cost()
RETURNS TRIGGER AS $$
BEGIN
  -- Update cost berdasarkan quantity × cost_per_unit
  UPDATE recipe_ingredients 
  SET cost = NEW.quantity * (
    SELECT cost_per_unit 
    FROM ingredients 
    WHERE id = NEW.ingredient_id
  ),
  updated_at = NOW()
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger untuk auto-calculate cost saat insert/update recipe_ingredients
DROP TRIGGER IF EXISTS trigger_calculate_recipe_cost ON recipe_ingredients;
CREATE TRIGGER trigger_calculate_recipe_cost
  AFTER INSERT OR UPDATE OF quantity, ingredient_id ON recipe_ingredients
  FOR EACH ROW
  EXECUTE FUNCTION calculate_recipe_ingredient_cost();

-- Function untuk auto-calculate total estimated_cost di variant_recipes
CREATE OR REPLACE FUNCTION calculate_recipe_total_cost()
RETURNS TRIGGER AS $$
BEGIN
  -- Update estimated_cost dengan sum dari semua recipe_ingredients
  UPDATE variant_recipes 
  SET estimated_cost = (
    SELECT COALESCE(SUM(cost), 0)
    FROM recipe_ingredients 
    WHERE recipe_id = NEW.recipe_id
  ),
  updated_at = NOW()
  WHERE id = NEW.recipe_id;
  
  -- Update coffee_variants cost info
  UPDATE coffee_variants 
  SET 
    cost_price = (
      SELECT estimated_cost 
      FROM variant_recipes 
      WHERE variant_id = coffee_variants.id 
      LIMIT 1
    ),
    profit_amount = price - (
      SELECT COALESCE(estimated_cost, 0) 
      FROM variant_recipes 
      WHERE variant_id = coffee_variants.id 
      LIMIT 1
    ),
    profit_percentage = CASE 
      WHEN price > 0 THEN 
        ((price - (
          SELECT COALESCE(estimated_cost, 0) 
          FROM variant_recipes 
          WHERE variant_id = coffee_variants.id 
          LIMIT 1
        )) / price) * 100
      ELSE 0 
    END
  WHERE id = (
    SELECT variant_id 
    FROM variant_recipes 
    WHERE id = NEW.recipe_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger untuk auto-calculate total cost saat recipe_ingredients berubah
DROP TRIGGER IF EXISTS trigger_calculate_total_cost ON recipe_ingredients;
CREATE TRIGGER trigger_calculate_total_cost
  AFTER INSERT OR UPDATE OR DELETE ON recipe_ingredients
  FOR EACH ROW
  EXECUTE FUNCTION calculate_recipe_total_cost();

-- Function untuk update cost saat harga ingredient berubah
CREATE OR REPLACE FUNCTION update_costs_on_ingredient_price_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Jika harga berubah, recalculate semua recipe yang menggunakan ingredient ini
  IF OLD.cost_per_unit != NEW.cost_per_unit THEN
    -- Update cost di recipe_ingredients
    UPDATE recipe_ingredients 
    SET cost = quantity * NEW.cost_per_unit,
        updated_at = NOW()
    WHERE ingredient_id = NEW.id;
    
    -- Log price change
    INSERT INTO ingredient_price_history (
      ingredient_id, 
      old_price, 
      new_price, 
      change_reason
    ) VALUES (
      NEW.id, 
      OLD.cost_per_unit, 
      NEW.cost_per_unit, 
      'Price updated via admin panel'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger untuk update costs saat ingredient price berubah
DROP TRIGGER IF EXISTS trigger_ingredient_price_change ON ingredients;
CREATE TRIGGER trigger_ingredient_price_change
  AFTER UPDATE OF cost_per_unit ON ingredients
  FOR EACH ROW
  EXECUTE FUNCTION update_costs_on_ingredient_price_change();

-- Index untuk performance
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_ingredient_id ON recipe_ingredients(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_variant_recipes_variant_id ON variant_recipes(variant_id);
CREATE INDEX IF NOT EXISTS idx_ingredients_category_id ON ingredients(category_id);
CREATE INDEX IF NOT EXISTS idx_ingredients_name ON ingredients(name);
CREATE INDEX IF NOT EXISTS idx_ingredient_price_history_ingredient_id ON ingredient_price_history(ingredient_id);

-- Comments untuk dokumentasi
COMMENT ON TABLE ingredients IS 'Master data bahan baku dengan harga per unit';
COMMENT ON TABLE ingredient_categories IS 'Kategori untuk mengelompokkan bahan baku';
COMMENT ON TABLE variant_recipes IS 'Resep untuk setiap varian kopi';
COMMENT ON TABLE recipe_ingredients IS 'Detail bahan yang digunakan dalam setiap resep';
COMMENT ON TABLE ingredient_price_history IS 'Riwayat perubahan harga bahan baku';

COMMENT ON COLUMN ingredients.cost_per_unit IS 'Harga per unit dalam Rupiah';
COMMENT ON COLUMN variant_recipes.estimated_cost IS 'HPP total yang dihitung otomatis';
COMMENT ON COLUMN recipe_ingredients.cost IS 'Biaya untuk quantity ini (quantity × cost_per_unit)';
COMMENT ON COLUMN coffee_variants.cost_price IS 'Harga Pokok Penjualan (HPP)';
COMMENT ON COLUMN coffee_variants.profit_amount IS 'Keuntungan dalam rupiah';
COMMENT ON COLUMN coffee_variants.profit_percentage IS 'Persentase keuntungan'; 