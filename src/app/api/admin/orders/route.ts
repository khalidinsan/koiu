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

// GET - Fetch all orders with pagination and filtering
export async function GET(request: NextRequest) {
  const adminId = await verifyAdminSession();
  
  if (!adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          variant_id,
          coffee_name,
          variant_size,
          price,
          quantity,
          subtotal,
          item_notes
        ),
        order_additional_fees (
          id,
          fee_name,
          fee_amount
        )
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%,order_number.ilike.%${search}%`);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: orders, error, count } = await query;

    if (error) {
      console.error('Orders fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    if (status && status !== 'all') {
      countQuery = countQuery.eq('status', status);
    }

    if (search) {
      countQuery = countQuery.or(`customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%,order_number.ilike.%${search}%`);
    }

    const { count: totalCount } = await countQuery;

    return NextResponse.json({ 
      orders: orders || [],
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        pages: Math.ceil((totalCount || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create manual order (admin only)
export async function POST(request: NextRequest) {
  const adminId = await verifyAdminSession();
  
  if (!adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { 
      customerName, 
      customerPhone, 
      customerNotes, 
      items, 
      additionalFees = [],
      totalAmount, 
      paymentMethod = 'cash',
      pickupTime,
      status = 'pending'
    } = body;

    // Validate required fields
    if (!customerName || !customerPhone || !items || !Array.isArray(items) || items.length === 0 || !totalAmount) {
      return NextResponse.json({ 
        error: 'Missing required fields: customerName, customerPhone, items, totalAmount' 
      }, { status: 400 });
    }

    // Validate payment method
    const validPaymentMethods = ['cash', 'transfer'];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return NextResponse.json({ 
        error: 'Invalid payment method. Must be cash or transfer' 
      }, { status: 400 });
    }

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') 
      }, { status: 400 });
    }

    // Validate additional fees if provided
    if (additionalFees && Array.isArray(additionalFees)) {
      for (const fee of additionalFees) {
        if (!fee.feeName || typeof fee.feeAmount !== 'number' || fee.feeAmount < 0) {
          return NextResponse.json({ 
            error: 'Invalid additional fee. Each fee must have feeName (string) and feeAmount (positive number)' 
          }, { status: 400 });
        }
      }
    }

    // Create order
    const orderData: any = {
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_notes: customerNotes || null,
      total_amount: totalAmount,
      status,
      payment_method: paymentMethod,
      whatsapp_sent: false // Manual orders are not sent via WhatsApp by default
    };

    if (pickupTime) {
      orderData.pickup_time = new Date(pickupTime).toISOString();
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    // Create order items
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      coffee_id: item.coffeeId || null,
      variant_id: item.variantId || null,
      coffee_name: item.coffeeName,
      variant_size: item.variantSize,
      price: item.price,
      quantity: item.quantity,
      subtotal: item.price * item.quantity,
      item_notes: item.itemNotes || null
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      // Rollback order creation
      await supabase.from('orders').delete().eq('id', order.id);
      console.error('Order items creation error:', itemsError);
      return NextResponse.json({ error: 'Failed to create order items' }, { status: 500 });
    }

    // Create additional fees if provided
    if (additionalFees && additionalFees.length > 0) {
      const orderFees = additionalFees.map((fee: any) => ({
        order_id: order.id,
        fee_name: fee.feeName,
        fee_amount: fee.feeAmount
      }));

      const { error: feesError } = await supabase
        .from('order_additional_fees')
        .insert(orderFees);

      if (feesError) {
        // Rollback order and items creation
        await supabase.from('orders').delete().eq('id', order.id);
        console.error('Order additional fees creation error:', feesError);
        return NextResponse.json({ error: 'Failed to create additional fees' }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Order created successfully',
      order: {
        ...order,
        orderNumber: order.order_number
      }
    });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update order status, payment method, pickup time, and items for non-completed orders
export async function PUT(request: NextRequest) {
  const adminId = await verifyAdminSession();
  
  if (!adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { 
      orderId, 
      status, 
      customerNotes, 
      paymentMethod, 
      pickupTime, 
      items, 
      additionalFees,
      totalAmount 
    } = body;

    // Validate required fields
    if (!orderId) {
      return NextResponse.json({ 
        error: 'Missing required field: orderId' 
      }, { status: 400 });
    }

    // Check if order exists and get current status
    const { data: currentOrder, error: fetchError } = await supabase
      .from('orders')
      .select('status')
      .eq('id', orderId)
      .single();

    if (fetchError || !currentOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if items update is requested and order is not completed
    if (items && currentOrder.status === 'completed') {
      return NextResponse.json({ 
        error: 'Cannot edit items for completed orders' 
      }, { status: 400 });
    }

    // Validate status if provided
    if (status) {
      const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ 
          error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') 
        }, { status: 400 });
      }
    }

    // Validate payment method if provided
    if (paymentMethod) {
      const validPaymentMethods = ['cash', 'transfer'];
      if (!validPaymentMethods.includes(paymentMethod)) {
        return NextResponse.json({ 
          error: 'Invalid payment method. Must be cash or transfer' 
        }, { status: 400 });
      }
    }

    // Build update data for order
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (status !== undefined) {
      updateData.status = status;
    }

    if (customerNotes !== undefined) {
      updateData.customer_notes = customerNotes;
    }

    if (paymentMethod !== undefined) {
      updateData.payment_method = paymentMethod;
    }

    if (pickupTime !== undefined) {
      updateData.pickup_time = pickupTime ? new Date(pickupTime).toISOString() : null;
    }

    if (totalAmount !== undefined) {
      updateData.total_amount = totalAmount;
    }

    // Update order
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) {
      console.error('Order update error:', updateError);
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }

    // Update items if provided and order is not completed
    if (items && currentOrder.status !== 'completed') {
      // Delete existing items
      const { error: deleteItemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderId);

      if (deleteItemsError) {
        console.error('Error deleting existing items:', deleteItemsError);
        return NextResponse.json({ error: 'Failed to update order items' }, { status: 500 });
      }

      // Insert new items
      const orderItems = items.map((item: any) => ({
        order_id: orderId,
        coffee_id: item.coffeeId || null,
        variant_id: item.variantId || null,
        coffee_name: item.coffeeName,
        variant_size: item.variantSize,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity,
        item_notes: item.itemNotes || null
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Error inserting new items:', itemsError);
        return NextResponse.json({ error: 'Failed to update order items' }, { status: 500 });
      }
    }

    // Update additional fees if provided
    if (additionalFees !== undefined) {
      // Delete existing fees
      const { error: deleteFeesError } = await supabase
        .from('order_additional_fees')
        .delete()
        .eq('order_id', orderId);

      if (deleteFeesError) {
        console.error('Error deleting existing fees:', deleteFeesError);
        return NextResponse.json({ error: 'Failed to update additional fees' }, { status: 500 });
      }

      // Insert new fees if any
      if (additionalFees.length > 0) {
        const orderFees = additionalFees.map((fee: any) => ({
          order_id: orderId,
          fee_name: fee.feeName,
          fee_amount: fee.feeAmount
        }));

        const { error: feesError } = await supabase
          .from('order_additional_fees')
          .insert(orderFees);

        if (feesError) {
          console.error('Error inserting new fees:', feesError);
          return NextResponse.json({ error: 'Failed to update additional fees' }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Order updated successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Update order error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete order (admin only, for cancellations)
export async function DELETE(request: NextRequest) {
  const adminId = await verifyAdminSession();
  
  if (!adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('id');

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Delete order (will cascade to order_items)
    const { error: deleteError } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);

    if (deleteError) {
      console.error('Order deletion error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    console.error('Delete order error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 