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

export async function GET(request: NextRequest) {
  try {
    const adminId = await verifyAdminSession();
    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0];

    // Convert dates to proper format for SQL queries
    const startDateTime = `${startDate} 00:00:00`;
    const endDateTime = `${endDate} 23:59:59`;

    // Get basic order stats - fixed column names to match schema
    const { data: orderStats } = await supabase
      .from('orders')
      .select('id, total_amount, payment_method, status, created_at, customer_name, customer_phone')
      .gte('created_at', startDateTime)
      .lte('created_at', endDateTime);

    if (!orderStats) {
      throw new Error('Failed to fetch order stats');
    }

    // Calculate key metrics - using correct column name
    const totalRevenue = orderStats.reduce((sum, order) => sum + order.total_amount, 0);
    const totalOrders = orderStats.length;
    // Use customer_phone as unique identifier since there's no customer_email
    const uniqueCustomers = new Set(orderStats.map(order => order.customer_phone)).size;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Get order items for product analysis
    const orderIds = orderStats.map(order => order.id);
    let topProducts: any[] = [];
    
    if (orderIds.length > 0) {
      const { data: orderItems } = await supabase
        .from('order_items')
        .select(`
          *,
          coffee:coffees(name)
        `)
        .in('order_id', orderIds);

      if (orderItems) {
        // Aggregate products
        const productMap = new Map();
        
        orderItems.forEach(item => {
          const productName = item.coffee?.name || 'Unknown Product';
          const existing = productMap.get(productName) || { quantity: 0, revenue: 0 };
          productMap.set(productName, {
            name: productName,
            quantity: existing.quantity + item.quantity,
            revenue: existing.revenue + (item.price * item.quantity)
          });
        });

        topProducts = Array.from(productMap.values())
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);
      }
    }

    // Daily sales breakdown - using correct column name
    const dailySalesMap = new Map();
    orderStats.forEach(order => {
      const date = order.created_at.split('T')[0];
      const existing = dailySalesMap.get(date) || { revenue: 0, orders: 0 };
      dailySalesMap.set(date, {
        date,
        revenue: existing.revenue + order.total_amount,
        orders: existing.orders + 1
      });
    });

    const dailySales = Array.from(dailySalesMap.values())
      .sort((a, b) => a.date.localeCompare(b.date));

    // Status breakdown
    const statusMap = new Map();
    orderStats.forEach(order => {
      const status = order.status;
      statusMap.set(status, (statusMap.get(status) || 0) + 1);
    });

    const statusBreakdown = Array.from(statusMap.entries()).map(([status, count]) => ({
      status,
      count,
      percentage: totalOrders > 0 ? (count / totalOrders) * 100 : 0
    }));

    // Payment method breakdown - using correct column name
    const paymentMap = new Map();
    orderStats.forEach(order => {
      const method = order.payment_method || 'cash';
      const existing = paymentMap.get(method) || { count: 0, revenue: 0 };
      paymentMap.set(method, {
        count: existing.count + 1,
        revenue: existing.revenue + order.total_amount
      });
    });

    const paymentMethodBreakdown = Array.from(paymentMap.entries()).map(([method, data]) => ({
      method,
      count: data.count,
      revenue: data.revenue,
      percentage: totalOrders > 0 ? (data.count / totalOrders) * 100 : 0
    }));

    // Hourly sales pattern - using correct column name
    const hourlyMap = new Map();
    orderStats.forEach(order => {
      const hour = new Date(order.created_at).getHours();
      const existing = hourlyMap.get(hour) || { orders: 0, revenue: 0 };
      hourlyMap.set(hour, {
        orders: existing.orders + 1,
        revenue: existing.revenue + order.total_amount
      });
    });

    const hourlySales = Array.from(hourlyMap.entries()).map(([hour, data]) => ({
      hour,
      orders: data.orders,
      revenue: data.revenue
    })).sort((a, b) => a.hour - b.hour);

    const salesData = {
      totalRevenue,
      totalOrders,
      totalCustomers: uniqueCustomers,
      averageOrderValue,
      topProducts,
      dailySales,
      statusBreakdown,
      paymentMethodBreakdown,
      hourlySales
    };

    return NextResponse.json(salesData);

  } catch (error) {
    console.error('Reports API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 