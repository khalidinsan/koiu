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

function convertToCSV(data: any[], headers: string[]): string {
  const csvHeaders = headers.join(',');
  const csvRows = data.map(row => 
    headers.map(header => {
      const value = row[header];
      // Escape quotes and wrap in quotes if contains comma
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  );
  return [csvHeaders, ...csvRows].join('\n');
}

export async function POST(request: NextRequest) {
  try {
    const adminId = await verifyAdminSession();
    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { startDate, endDate, format } = await request.json();

    if (format !== 'csv') {
      return NextResponse.json({ error: 'Only CSV format is supported' }, { status: 400 });
    }

    // Convert dates to proper format for SQL queries
    const startDateTime = `${startDate} 00:00:00`;
    const endDateTime = `${endDate} 23:59:59`;

    // Get detailed orders data for export - fixed column names
    const { data: orders } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        customer_name,
        customer_phone,
        customer_notes,
        total_amount,
        payment_method,
        status,
        created_at,
        order_items (
          id,
          quantity,
          price,
          item_notes,
          coffee_name,
          variant_size
        )
      `)
      .gte('created_at', startDateTime)
      .lte('created_at', endDateTime)
      .order('created_at', { ascending: false });

    if (!orders) {
      throw new Error('Failed to fetch orders for export');
    }

    // Prepare CSV data - flatten order items
    const csvData: any[] = [];
    
    orders.forEach(order => {
      if (order.order_items && order.order_items.length > 0) {
        order.order_items.forEach((item: any) => {
          csvData.push({
            order_id: order.id,
            order_number: order.order_number,
            order_date: new Date(order.created_at).toLocaleString('id-ID'),
            customer_name: order.customer_name || '',
            customer_phone: order.customer_phone || '',
            product_name: item.coffee_name || 'Unknown',
            variant_size: item.variant_size || '',
            quantity: item.quantity,
            unit_price: item.price,
            item_total: item.quantity * item.price,
            item_notes: item.item_notes || '',
            order_total: order.total_amount,
            payment_method: order.payment_method || 'cash',
            status: order.status,
            order_notes: order.customer_notes || ''
          });
        });
      } else {
        // Order without items
        csvData.push({
          order_id: order.id,
          order_number: order.order_number,
          order_date: new Date(order.created_at).toLocaleString('id-ID'),
          customer_name: order.customer_name || '',
          customer_phone: order.customer_phone || '',
          product_name: '',
          variant_size: '',
          quantity: 0,
          unit_price: 0,
          item_total: 0,
          item_notes: '',
          order_total: order.total_amount,
          payment_method: order.payment_method || 'cash',
          status: order.status,
          order_notes: order.customer_notes || ''
        });
      }
    });

    const headers = [
      'order_id',
      'order_number', 
      'order_date',
      'customer_name',
      'customer_phone',
      'product_name',
      'variant_size',
      'quantity',
      'unit_price',
      'item_total',
      'item_notes',
      'order_total',
      'payment_method',
      'status',
      'order_notes'
    ];

    const csvContent = convertToCSV(csvData, headers);

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=sales-report-${startDate}-to-${endDate}.csv`,
      },
    });

  } catch (error) {
    console.error('Export API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 