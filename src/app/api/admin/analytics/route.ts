import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { startOfDay, endOfDay, format, subDays, subMonths, subYears } from 'date-fns';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const period = searchParams.get('period') || 'daily'; // daily, monthly, yearly

    // Set default date range if not provided
    let fromDate: Date;
    let toDate: Date = new Date();

    if (startDate && endDate) {
      fromDate = new Date(startDate);
      toDate = new Date(endDate);
    } else {
      // Default to last 30 days
      fromDate = subDays(toDate, 30);
    }

    // Get orders data with variants for the date range
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        total_amount,
        status,
        created_at,
        order_items!inner(
          quantity,
          price,
          coffee_variants!inner(
            id,
            size,
            cost_price,
            profit_amount,
            profit_percentage,
            coffees!inner(name)
          )
        )
      `)
      .gte('created_at', startOfDay(fromDate).toISOString())
      .lte('created_at', endOfDay(toDate).toISOString())
      .order('created_at', { ascending: true });

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return NextResponse.json(
        { error: 'Failed to fetch orders data' },
        { status: 500 }
      );
    }

    // Get coffee variants with recipe costs for profitability analysis
    const { data: variants, error: variantsError } = await supabase
      .from('coffee_variants')
      .select(`
        id,
        size,
        price,
        cost_price,
        profit_amount,
        profit_percentage,
        coffees!inner(name)
      `);

    if (variantsError) {
      console.error('Error fetching variants:', variantsError);
      return NextResponse.json(
        { error: 'Failed to fetch variants data' },
        { status: 500 }
      );
    }

    // Process data based on period
    const chartData = processChartData(orders || [], period, fromDate, toDate);
    
    // Calculate summary statistics
    const completedOrders = (orders || []).filter(order => order.status === 'completed');
    const totalRevenue = completedOrders.reduce((sum, order) => sum + order.total_amount, 0);
    
    // Calculate total profit from completed orders
    let totalProfit = 0;
    let totalCost = 0;
    
    completedOrders.forEach(order => {
      order.order_items.forEach((item: any) => {
        const itemRevenue = item.quantity * item.price;
        const itemCost = item.quantity * (item.coffee_variants.cost_price || 0);
        totalCost += itemCost;
        totalProfit += (itemRevenue - itemCost);
      });
    });

    // Product profitability analysis
    const productProfitability = calculateProductProfitability(variants || []);

    // Top selling products
    const topProducts = calculateTopProducts(completedOrders);

    // Daily comparison (today vs yesterday)
    const today = new Date();
    const yesterday = subDays(today, 1);
    
    const todayOrders = completedOrders.filter(order => 
      format(new Date(order.created_at), 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
    );
    
    const yesterdayOrders = completedOrders.filter(order => 
      format(new Date(order.created_at), 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')
    );

    const todayRevenue = todayOrders.reduce((sum, order) => sum + order.total_amount, 0);
    const yesterdayRevenue = yesterdayOrders.reduce((sum, order) => sum + order.total_amount, 0);
    
    const revenueGrowth = yesterdayRevenue > 0 
      ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 
      : 0;

    return NextResponse.json({
      summary: {
        totalOrders: completedOrders.length,
        totalRevenue,
        totalProfit,
        totalCost,
        profitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
        averageOrderValue: completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0,
        todayOrders: todayOrders.length,
        todayRevenue,
        revenueGrowth
      },
      chartData,
      productProfitability,
      topProducts,
      period,
      dateRange: {
        from: format(fromDate, 'yyyy-MM-dd'),
        to: format(toDate, 'yyyy-MM-dd')
      }
    });
  } catch (error) {
    console.error('Error in analytics API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function processChartData(orders: any[], period: string, fromDate: Date, toDate: Date) {
  const data: { [key: string]: { date: string, revenue: number, profit: number, orders: number, cost: number } } = {};

  // Initialize data structure based on period
  let currentDate = new Date(fromDate);
  while (currentDate <= toDate) {
    let dateKey: string;
    
    switch (period) {
      case 'yearly':
        dateKey = format(currentDate, 'yyyy');
        currentDate = new Date(currentDate.getFullYear() + 1, 0, 1);
        break;
      case 'monthly':
        dateKey = format(currentDate, 'yyyy-MM');
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
        break;
      default: // daily
        dateKey = format(currentDate, 'yyyy-MM-dd');
        currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
        break;
    }

    if (!data[dateKey]) {
      data[dateKey] = {
        date: dateKey,
        revenue: 0,
        profit: 0,
        orders: 0,
        cost: 0
      };
    }
  }

  // Process completed orders only
  const completedOrders = orders.filter(order => order.status === 'completed');
  
  completedOrders.forEach(order => {
    const orderDate = new Date(order.created_at);
    let dateKey: string;
    
    switch (period) {
      case 'yearly':
        dateKey = format(orderDate, 'yyyy');
        break;
      case 'monthly':
        dateKey = format(orderDate, 'yyyy-MM');
        break;
      default: // daily
        dateKey = format(orderDate, 'yyyy-MM-dd');
        break;
    }

    if (data[dateKey]) {
      data[dateKey].revenue += order.total_amount;
      data[dateKey].orders += 1;

      // Calculate profit from order items
      order.order_items.forEach((item: any) => {
        const itemCost = item.quantity * (item.coffee_variants.cost_price || 0);
        const itemRevenue = item.quantity * item.price;
        data[dateKey].cost += itemCost;
        data[dateKey].profit += (itemRevenue - itemCost);
      });
    }
  });

  return Object.values(data).sort((a, b) => a.date.localeCompare(b.date));
}

function calculateProductProfitability(variants: any[]) {
  return variants
    .map(variant => ({
      id: variant.id,
      name: `${variant.coffees.name} - ${variant.size}`,
      price: variant.price,
      costPrice: variant.cost_price || 0,
      profitAmount: variant.profit_amount || 0,
      profitPercentage: variant.profit_percentage || 0,
      status: variant.profit_percentage > 30 ? 'excellent' : 
              variant.profit_percentage > 20 ? 'good' : 
              variant.profit_percentage > 10 ? 'average' : 
              variant.profit_percentage > 0 ? 'poor' : 'loss'
    }))
    .sort((a, b) => b.profitPercentage - a.profitPercentage);
}

function calculateTopProducts(orders: any[]) {
  const productSales: { [key: string]: { name: string, quantity: number, revenue: number } } = {};

  orders.forEach(order => {
    order.order_items.forEach((item: any) => {
      const productKey = `${item.coffee_variants.coffees.name} - ${item.coffee_variants.size}`;
      
      if (!productSales[productKey]) {
        productSales[productKey] = {
          name: productKey,
          quantity: 0,
          revenue: 0
        };
      }
      
      productSales[productKey].quantity += item.quantity;
      productSales[productKey].revenue += item.quantity * item.price;
    });
  });

  return Object.values(productSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);
} 