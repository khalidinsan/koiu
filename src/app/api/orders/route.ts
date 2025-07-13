import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface OrderItem {
  coffeeId: number;
  variantId: string;
  coffeeName: string;
  variantSize: string;
  price: number;
  quantity: number;
  itemNotes?: string;
}

interface OrderData {
  customerName: string;
  customerPhone: string;
  customerNotes?: string;
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: 'cash' | 'transfer';
  pickupTime?: string;
}

// POST - Create new order
export async function POST(request: NextRequest) {
  try {
    const body: OrderData = await request.json();
    const {
      customerName,
      customerPhone,
      customerNotes,
      items,
      totalAmount,
      paymentMethod,
      pickupTime
    } = body;

    // Validate required fields
    if (!customerName || !customerPhone || !items || items.length === 0 || !totalAmount) {
      return NextResponse.json({ 
        error: 'Missing required fields: customerName, customerPhone, items, totalAmount' 
      }, { status: 400 });
    }

    // Validate phone number format (basic validation)
    if (!/^\d{10,15}$/.test(customerPhone.replace(/\D/g, ''))) {
      return NextResponse.json({ 
        error: 'Invalid phone number format' 
      }, { status: 400 });
    }

    // Start a transaction
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_notes: customerNotes || null,
        total_amount: totalAmount,
        payment_method: paymentMethod,
        pickup_time: pickupTime ? new Date(pickupTime).toISOString() : null,
        status: 'pending',
        whatsapp_sent: false
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    // Insert order items
    const orderItems = items.map(item => ({
      order_id: order.id,
      coffee_id: item.coffeeId,
      variant_id: item.variantId,
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
      console.error('Order items creation error:', itemsError);
      // Rollback: delete the order if items creation fails
      await supabase.from('orders').delete().eq('id', order.id);
      return NextResponse.json({ error: 'Failed to create order items' }, { status: 500 });
    }

    // Mark order as WhatsApp sent (will be handled by frontend)
    await supabase
      .from('orders')
      .update({ whatsapp_sent: true })
      .eq('id', order.id);

    return NextResponse.json({ 
      success: true,
      message: 'Order created successfully',
      order: {
        id: order.id,
        orderNumber: order.order_number,
        customerName: order.customer_name,
        customerPhone: order.customer_phone,
        totalAmount: order.total_amount,
        status: order.status,
        createdAt: order.created_at
      }
    });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 