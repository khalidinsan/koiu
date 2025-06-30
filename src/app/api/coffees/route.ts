import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface CoffeeVariantDB {
  id: string;
  size: string;
  price: number;
  original_price: number;
  stock: number;
  available: boolean;
}

interface CoffeeDB {
  id: number;
  name: string;
  description: string;
  image: string;
  category: string;
  best_seller: boolean;
  coffee_variants: CoffeeVariantDB[];
}

export async function GET() {
  try {
    // Fetch config
    const { data: config, error: configError } = await supabase
      .from('config')
      .select('*')
      .single();

    if (configError) {
      console.error('Config error:', configError);
      return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 });
    }

    // Fetch coffees with their variants
    const { data: coffees, error: coffeesError } = await supabase
      .from('coffees')
      .select(`
        *,
        coffee_variants (*)
      `)
      .order('id');

    if (coffeesError) {
      console.error('Coffees error:', coffeesError);
      return NextResponse.json({ error: 'Failed to fetch coffees' }, { status: 500 });
    }

    // Transform data to match frontend interface
    const transformedCoffees = (coffees as CoffeeDB[]).map(coffee => ({
      id: coffee.id,
      name: coffee.name,
      description: coffee.description,
      image: coffee.image,
      available: coffee.coffee_variants.some((variant: CoffeeVariantDB) => variant.available && variant.stock > 0),
      category: coffee.category,
      bestSeller: coffee.best_seller,
      variants: coffee.coffee_variants.map((variant: CoffeeVariantDB) => ({
        id: variant.id,
        size: variant.size,
        price: variant.price,
        originalPrice: variant.original_price,
        stock: variant.stock,
        available: variant.available && variant.stock > 0
      }))
    }));

    const transformedConfig = {
      adminWhatsApp: config.admin_whatsapp,
      storeName: config.store_name,
      currency: config.currency,
      pickupLocation: {
        address: config.pickup_address,
        coordinates: config.pickup_coordinates,
        mapLink: config.pickup_map_link
      }
    };

    return NextResponse.json({
      config: transformedConfig,
      coffees: transformedCoffees
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 