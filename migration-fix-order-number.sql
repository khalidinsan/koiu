-- Migration: Fix order number generation function
-- Run this in your Supabase SQL Editor

-- Drop and recreate the function to handle gaps in order numbers
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

-- Test the function
SELECT 'Order number generation function updated successfully!' as status;
SELECT generate_order_number() as next_order_number; 