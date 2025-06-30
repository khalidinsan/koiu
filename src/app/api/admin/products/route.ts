import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';

// Helper function to verify admin session
async function verifyAdminSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('admin_session');
  
  if (!sessionToken) {
    return null;
  }

  try {
    const decoded = Buffer.from(sessionToken.value, 'base64').toString();
    const [adminId] = decoded.split(':');
    return parseInt(adminId);
  } catch {
    return null;
  }
}

// GET - Fetch all products for admin
export async function GET() {
  const adminId = await verifyAdminSession();
  
  if (!adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: coffees, error } = await supabase
      .from('coffees')
      .select(`
        *,
        coffee_variants (*)
      `)
      .order('id');

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }

    return NextResponse.json({ coffees });
  } catch (error) {
    console.error('Get products error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new product
export async function POST(request: NextRequest) {
  const adminId = await verifyAdminSession();
  
  if (!adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, description, image, category, bestSeller, variants } = await request.json();

    // Insert coffee
    const { data: coffee, error: coffeeError } = await supabase
      .from('coffees')
      .insert({
        name,
        description,
        image,
        category,
        best_seller: bestSeller
      })
      .select()
      .single();

    if (coffeeError) {
      return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    }

    // Insert variants with generated IDs
    const variantData = variants.map((variant: any) => ({
      id: variant.id || `${coffee.id}-${variant.size.toLowerCase().replace(/\s+/g, '')}`,
      coffee_id: coffee.id,
      size: variant.size,
      price: variant.price,
      original_price: variant.originalPrice,
      stock: variant.stock || 0,
      available: variant.available
    }));

    const { error: variantError } = await supabase
      .from('coffee_variants')
      .insert(variantData);

    if (variantError) {
      return NextResponse.json({ error: 'Failed to create variants' }, { status: 500 });
    }

    return NextResponse.json({ success: true, coffee });
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update product
export async function PUT(request: NextRequest) {
  const adminId = await verifyAdminSession();
  
  if (!adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, name, description, image, category, bestSeller, variants } = await request.json();

    // Update coffee
    const { error: coffeeError } = await supabase
      .from('coffees')
      .update({
        name,
        description,
        image,
        category,
        best_seller: bestSeller
      })
      .eq('id', id);

    if (coffeeError) {
      return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
    }

    // Delete existing variants
    await supabase
      .from('coffee_variants')
      .delete()
      .eq('coffee_id', id);

    // Insert new variants with proper IDs
    const variantData = variants.map((variant: any) => ({
      id: variant.id || `${id}-${variant.size.toLowerCase().replace(/\s+/g, '')}`,
      coffee_id: id,
      size: variant.size,
      price: variant.price,
      original_price: variant.originalPrice,
      stock: variant.stock || 0,
      available: variant.available
    }));

    const { error: variantError } = await supabase
      .from('coffee_variants')
      .insert(variantData);

    if (variantError) {
      return NextResponse.json({ error: 'Failed to update variants' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update product error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete product
export async function DELETE(request: NextRequest) {
  const adminId = await verifyAdminSession();
  
  if (!adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('coffees')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 