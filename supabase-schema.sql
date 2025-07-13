-- Create tables for KOIU Coffee

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Config table
CREATE TABLE IF NOT EXISTS config (
  id SERIAL PRIMARY KEY,
  admin_whatsapp VARCHAR(20) NOT NULL,
  store_name VARCHAR(100) NOT NULL,
  currency VARCHAR(10) NOT NULL,
  pickup_address TEXT NOT NULL,
  pickup_coordinates VARCHAR(100) NOT NULL,
  pickup_map_link TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Coffee products table
CREATE TABLE IF NOT EXISTS coffees (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  image VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  best_seller BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Coffee variants table (for different sizes and prices)
CREATE TABLE IF NOT EXISTS coffee_variants (
  id VARCHAR(100) PRIMARY KEY,
  coffee_id INTEGER REFERENCES coffees(id) ON DELETE CASCADE,
  size VARCHAR(50) NOT NULL,
  price INTEGER NOT NULL,
  original_price INTEGER NOT NULL,
  stock INTEGER DEFAULT 0,
  available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(20) UNIQUE NOT NULL,
  customer_name VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_notes TEXT,
  total_amount INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled')),
  payment_method VARCHAR(20) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'transfer')),
  pickup_time TIMESTAMP WITH TIME ZONE,
  whatsapp_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  coffee_id INTEGER REFERENCES coffees(id),
  variant_id VARCHAR(100) REFERENCES coffee_variants(id),
  coffee_name VARCHAR(100) NOT NULL,
  variant_size VARCHAR(50) NOT NULL,
  price INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  subtotal INTEGER NOT NULL,
  item_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order additional fees table (for delivery, service charge, etc.)
CREATE TABLE IF NOT EXISTS order_additional_fees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  fee_name VARCHAR(100) NOT NULL,
  fee_amount INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_coffee_variants_coffee_id ON coffee_variants(coffee_id);
CREATE INDEX IF NOT EXISTS idx_coffees_category ON coffees(category);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_additional_fees_order_id ON order_additional_fees(order_id);

-- Insert initial config data
INSERT INTO config (admin_whatsapp, store_name, currency, pickup_address, pickup_coordinates, pickup_map_link)
VALUES (
  '6282217301554',
  'KOIU Coffee',
  'Rp',
  'LKP YANI 43 (Belakang Kantor Kecamatan Sumedang Utara), Jl. Pendopo No.17, RT.02/RW.07, Talun, Sumedang Utara',
  '-6.849631952797085, 107.92745780720186',
  'https://maps.app.goo.gl/gwGSq9k86R3sPJJH7'
) ON CONFLICT DO NOTHING;

-- Insert sample coffee data
INSERT INTO coffees (id, name, description, image, category, best_seller) VALUES
(1, 'Cafe Latte', 'Espresso dengan susu steamed yang creamy dan lembut', '/images/koiu-latte.png', 'Coffee', false),
(2, 'Palm Sugar', 'Kopi dengan gula aren asli yang memberikan rasa manis alami', '/images/koiu-palm-sugar.png', 'Coffee', true),
(3, 'Pandan', 'Kopi dengan aroma pandan yang harum dan rasa yang unik', '/images/koiu-pandan.png', 'Coffee', false),
(4, 'Caramel', 'Kopi dengan sirup caramel yang manis dan creamy', '/images/koiu-caramel.png', 'Coffee', false),
(5, 'Hazelnut', 'Kopi dengan rasa hazelnut yang kaya dan aromatic', '/images/koiu-hazelnut.png', 'Coffee', false),
(6, 'Butterscotch', 'Kopi dengan rasa butterscotch yang manis dan buttery', '/images/koiu-butterscotch.png', 'Coffee', false)
ON CONFLICT (id) DO NOTHING;

-- Insert coffee variants with stock information
INSERT INTO coffee_variants (id, coffee_id, size, price, original_price, stock, available) VALUES
('1-250ml', 1, '250ml', 13000, 13000, 50, true),
('1-1l', 1, '1 Liter', 50000, 50000, 20, true),
('2-250ml', 2, '250ml', 13000, 13000, 45, true),
('2-1l', 2, '1 Liter', 50000, 50000, 15, true),
('3-250ml', 3, '250ml', 13000, 13000, 30, true),
('3-1l', 3, '1 Liter', 50000, 50000, 10, true),
('4-250ml', 4, '250ml', 13000, 13000, 0, false),
('4-1l', 4, '1 Liter', 50000, 50000, 0, false),
('5-250ml', 5, '250ml', 13000, 13000, 0, false),
('5-1l', 5, '1 Liter', 50000, 50000, 0, false),
('6-250ml', 6, '250ml', 13000, 13000, 0, false),
('6-1l', 6, '1 Liter', 50000, 50000, 0, false)
ON CONFLICT (id) DO NOTHING;

-- Insert default admin user (password: admin123456)
INSERT INTO admin_users (email, password_hash) 
VALUES ('admin@koiucoffee.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYjP7ZsQJgB5K9a');

-- Create function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    counter INTEGER;
    today_prefix TEXT;
    existing_number TEXT;
BEGIN
    -- Get today's date in YYYYMMDD format
    SELECT TO_CHAR(NOW(), 'YYYYMMDD') INTO today_prefix;
    
    -- Find the highest existing number for today
    SELECT order_number INTO existing_number
    FROM orders 
    WHERE order_number LIKE today_prefix || '-%'
    ORDER BY order_number DESC
    LIMIT 1;
    
    -- If no orders exist for today, start with 001
    IF existing_number IS NULL THEN
        counter := 1;
    ELSE
        -- Extract the counter from the existing number and increment
        counter := (SPLIT_PART(existing_number, '-', 2))::INTEGER + 1;
    END IF;
    
    -- Format: YYYYMMDD-XXX (e.g., 20241201-001)
    new_number := today_prefix || '-' || LPAD(counter::TEXT, 3, '0');
    
    -- Check if this number already exists (safety check)
    WHILE EXISTS (SELECT 1 FROM orders WHERE order_number = new_number) LOOP
        counter := counter + 1;
        new_number := today_prefix || '-' || LPAD(counter::TEXT, 3, '0');
    END LOOP;
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate order numbers
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL THEN
        NEW.order_number := generate_order_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_order_number
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION set_order_number();

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables
CREATE TRIGGER update_config_updated_at BEFORE UPDATE ON config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_coffees_updated_at BEFORE UPDATE ON coffees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_coffee_variants_updated_at BEFORE UPDATE ON coffee_variants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 