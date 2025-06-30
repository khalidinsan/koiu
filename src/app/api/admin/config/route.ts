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

// GET - Fetch configuration
export async function GET() {
  const adminId = await verifyAdminSession();
  
  if (!adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: config, error } = await supabase
      .from('config')
      .select('*')
      .single();

    if (error) {
      console.error('Config fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch configuration' }, { status: 500 });
    }

    return NextResponse.json({ config });
  } catch (error) {
    console.error('Get config error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update configuration
export async function PUT(request: NextRequest) {
  const adminId = await verifyAdminSession();
  
  if (!adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      admin_whatsapp,
      store_name,
      currency,
      pickup_address,
      pickup_coordinates,
      pickup_map_link
    } = body;

    // Validate required fields
    if (!admin_whatsapp || !store_name || !currency || !pickup_address || !pickup_coordinates || !pickup_map_link) {
      return NextResponse.json({ 
        error: 'All configuration fields are required' 
      }, { status: 400 });
    }

    // Validate WhatsApp number format (basic validation)
    if (!/^\d{10,15}$/.test(admin_whatsapp)) {
      return NextResponse.json({ 
        error: 'WhatsApp number must be 10-15 digits without country code prefix' 
      }, { status: 400 });
    }

    // Validate coordinates format (basic validation)
    if (!/^-?\d+\.?\d*,\s*-?\d+\.?\d*$/.test(pickup_coordinates)) {
      return NextResponse.json({ 
        error: 'Coordinates must be in format: latitude, longitude' 
      }, { status: 400 });
    }

    // Validate map link
    if (!pickup_map_link.startsWith('http')) {
      return NextResponse.json({ 
        error: 'Map link must be a valid URL' 
      }, { status: 400 });
    }

    // Update configuration
    const { data: updatedConfig, error: updateError } = await supabase
      .from('config')
      .update({
        admin_whatsapp,
        store_name,
        currency,
        pickup_address,
        pickup_coordinates,
        pickup_map_link,
        updated_at: new Date().toISOString()
      })
      .eq('id', 1) // Assuming single config record with id 1
      .select()
      .single();

    if (updateError) {
      console.error('Config update error:', updateError);
      return NextResponse.json({ error: 'Failed to update configuration' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Configuration updated successfully',
      config: updatedConfig
    });
  } catch (error) {
    console.error('Update config error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 