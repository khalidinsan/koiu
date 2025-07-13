-- Migration: Add item notes to order items
-- Run this in your Supabase SQL Editor

-- Add item_notes column to order_items table
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS item_notes TEXT;

-- Test the migration
SELECT 'Item notes column added successfully!' as status; 