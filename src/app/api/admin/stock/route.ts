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

// PUT - Update stock for a variant
export async function PUT(request: NextRequest) {
  const adminId = await verifyAdminSession();
  
  if (!adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { variantId, stock, available } = await request.json();

    if (!variantId || stock === undefined) {
      return NextResponse.json({ error: 'Variant ID and stock are required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('coffee_variants')
      .update({
        stock,
        available: available !== undefined ? available : stock > 0
      })
      .eq('id', variantId);

    if (error) {
      return NextResponse.json({ error: 'Failed to update stock' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update stock error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Bulk update stock for multiple variants
export async function POST(request: NextRequest) {
  const adminId = await verifyAdminSession();
  
  if (!adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { updates } = await request.json();

    if (!Array.isArray(updates)) {
      return NextResponse.json({ error: 'Updates must be an array' }, { status: 400 });
    }

    // Process each update
    for (const update of updates) {
      const { variantId, stock, available } = update;
      
      if (!variantId || stock === undefined) {
        continue;
      }

      await supabase
        .from('coffee_variants')
        .update({
          stock,
          available: available !== undefined ? available : stock > 0
        })
        .eq('id', variantId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Bulk update stock error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 