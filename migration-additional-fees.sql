-- Migration: Add order additional fees table
-- Run this in your Supabase SQL Editor

-- Create order additional fees table (for delivery, service charge, etc.)
CREATE TABLE IF NOT EXISTS order_additional_fees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  fee_name VARCHAR(100) NOT NULL,
  fee_amount INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_order_additional_fees_order_id ON order_additional_fees(order_id);

-- Verify the table was created
SELECT 'Additional fees table created successfully!' as status; 