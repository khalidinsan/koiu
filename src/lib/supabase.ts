import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database
export interface Coffee {
  id: number;
  name: string;
  description: string;
  image: string;
  category: string;
  best_seller: boolean;
  created_at: string;
  updated_at: string;
}

export interface CoffeeVariant {
  id: string;
  coffee_id: number;
  size: string;
  price: number;
  original_price: number;
  stock: number;
  available: boolean;
  created_at: string;
  updated_at: string;
}

export interface Config {
  id: number;
  admin_whatsapp: string;
  store_name: string;
  currency: string;
  pickup_address: string;
  pickup_coordinates: string;
  pickup_map_link: string;
  created_at: string;
  updated_at: string;
} 