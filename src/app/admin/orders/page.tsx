'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { 
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Package,
  Calendar,
  Phone,
  User,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  ChefHat,
  Receipt,
  Download,
  Printer,
  FileImage
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useReactToPrint } from 'react-to-print';

interface OrderItem {
  id: string;
  coffee_name: string;
  variant_size: string;
  variant_id: string;
  price: number;
  quantity: number;
  subtotal: number;
  item_notes?: string;
}

interface AdditionalFee {
  id: string;
  fee_name: string;
  fee_amount: number;
}

interface Recipe {
  id: number;
  name: string;
  description: string;
  serving_size: number;
  estimated_cost: number;
  ingredients: {
    id: number;
    ingredient_name: string;
    ingredient_unit: string;
    quantity: number;
    cost: number;
    notes?: string;
  }[];
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_notes?: string;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  payment_method: 'cash' | 'transfer';
  pickup_time?: string;
  whatsapp_sent: boolean;
  created_at: string;
  updated_at: string;
  order_items: OrderItem[];
  order_additional_fees?: AdditionalFee[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface Coffee {
  id: number;
  name: string;
  coffee_variants: {
    id: string;
    size: string;
    price: number;
    available: boolean;
  }[];
}

interface ManualOrderItem {
  coffeeId: number;
  variantId: string;
  coffeeName: string;
  variantSize: string;
  price: number;
  quantity: number;
  itemNotes?: string;
}

interface ManualAdditionalFee {
  feeName: string;
  feeAmount: number;
}

export default function OrdersPage() {
  const router = useRouter();
  const receiptRef = useRef<HTMLDivElement>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [coffees, setCoffees] = useState<Coffee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showManualOrderModal, setShowManualOrderModal] = useState(false);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showEditOrderModal, setShowEditOrderModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingReceipt, setIsGeneratingReceipt] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Filters and pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  // Status update form
  const [newStatus, setNewStatus] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');
  const [pickupTime, setPickupTime] = useState('');

  // Manual order form
  const [manualOrderForm, setManualOrderForm] = useState({
    customerName: '',
    customerPhone: '',
    customerNotes: '',
    paymentMethod: 'cash' as 'cash' | 'transfer',
    pickupTime: '',
    status: 'pending' as 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled',
    items: [] as ManualOrderItem[],
    additionalFees: [] as ManualAdditionalFee[]
  });

  // Edit order form (similar to manual order form)
  const [editOrderForm, setEditOrderForm] = useState({
    orderId: '',
    customerName: '',
    customerPhone: '',
    customerNotes: '',
    paymentMethod: 'cash' as 'cash' | 'transfer',
    pickupTime: '',
    status: 'pending' as 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled',
    items: [] as ManualOrderItem[],
    additionalFees: [] as ManualAdditionalFee[]
  });

  useEffect(() => {
    fetchOrders();
    fetchCoffees();
  }, [currentPage, statusFilter, searchQuery]);

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
      });

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      const response = await fetch(`/api/admin/orders?${params}`);
      
      if (response.status === 401) {
        router.push('/admin/login');
        return;
      }

      const data = await response.json();
      setOrders(data.orders || []);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCoffees = async () => {
    try {
      const response = await fetch('/api/admin/products');
      if (response.ok) {
        const data = await response.json();
        setCoffees(data.coffees || []);
      }
    } catch (error) {
      console.error('Error fetching coffees:', error);
    }
  };

  const openOrderModal = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const openStatusModal = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setCustomerNotes(order.customer_notes || '');
    setPaymentMethod(order.payment_method);
    setPickupTime(order.pickup_time ? new Date(order.pickup_time).toISOString().slice(0, 16) : '');
    setShowStatusModal(true);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          status: newStatus,
          customerNotes: customerNotes,
          paymentMethod: paymentMethod,
          pickupTime: pickupTime || null
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Order updated successfully!');
        setTimeout(() => {
          setShowStatusModal(false);
          fetchOrders();
          setSuccess('');
        }, 1500);
      } else {
        setError(data.error || 'Failed to update order');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/orders?id=${orderId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccess('Order deleted successfully!');
        fetchOrders();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete order');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-primary-100 text-primary-800';
      case 'preparing':
        return 'bg-orange-100 text-orange-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />;
      case 'preparing':
        return <Package className="h-4 w-4" />;
      case 'ready':
        return <CheckCircle className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number) => {
    return `Rp ${price.toLocaleString('id-ID')}`;
  };

  const openManualOrderModal = () => {
    setManualOrderForm({
      customerName: '',
      customerPhone: '',
      customerNotes: '',
      paymentMethod: 'cash',
      pickupTime: '',
      status: 'pending',
      items: [{ coffeeId: 0, variantId: '', coffeeName: '', variantSize: '', price: 0, quantity: 1 }],
      additionalFees: []
    });
    setShowManualOrderModal(true);
  };

  const openEditOrderModal = (order: Order) => {
    if (order.status === 'completed') {
      setError('Cannot edit completed orders');
      return;
    }

    setEditOrderForm({
      orderId: order.id,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      customerNotes: order.customer_notes || '',
      paymentMethod: order.payment_method,
      pickupTime: order.pickup_time ? order.pickup_time.slice(0, 16) : '',
      status: order.status,
      items: order.order_items.map(item => {
        // Find coffee ID from coffees array
        const coffee = coffees.find(c => 
          c.coffee_variants.some(v => v.id === item.variant_id)
        );
        return {
          coffeeId: coffee?.id || 0,
          variantId: item.variant_id,
          coffeeName: item.coffee_name,
          variantSize: item.variant_size,
          price: item.price,
          quantity: item.quantity,
          itemNotes: item.item_notes || ''
        };
      }),
      additionalFees: order.order_additional_fees?.map(fee => ({
        feeName: fee.fee_name,
        feeAmount: fee.fee_amount
      })) || []
    });
    setShowEditOrderModal(true);
  };

  const handleEditOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const orderData = {
        orderId: editOrderForm.orderId,
        status: editOrderForm.status,
        customerNotes: editOrderForm.customerNotes || null,
        paymentMethod: editOrderForm.paymentMethod,
        pickupTime: editOrderForm.pickupTime || null,
        items: editOrderForm.items.map(item => ({
          coffeeId: item.coffeeId,
          variantId: item.variantId,
          coffeeName: item.coffeeName,
          variantSize: item.variantSize,
          price: item.price,
          quantity: item.quantity,
          itemNotes: item.itemNotes || null
        })),
        additionalFees: editOrderForm.additionalFees,
        totalAmount: calculateEditOrderTotal()
      };

      const response = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess('Order updated successfully!');
        setShowEditOrderModal(false);
        fetchOrders();
      } else {
        setError(result.error || 'Failed to update order');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      setError('An error occurred while updating the order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateEditOrderTotal = () => {
    const itemsTotal = editOrderForm.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    const feesTotal = editOrderForm.additionalFees.reduce((total, fee) => total + fee.feeAmount, 0);
    return itemsTotal + feesTotal;
  };

  const handleSubmitManualOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const itemsTotal = manualOrderForm.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const feesTotal = manualOrderForm.additionalFees.reduce((sum, fee) => sum + fee.feeAmount, 0);
      const totalAmount = itemsTotal + feesTotal;

      const response = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName: manualOrderForm.customerName,
          customerPhone: manualOrderForm.customerPhone,
          customerNotes: manualOrderForm.customerNotes || null,
          items: manualOrderForm.items.map(item => ({
            coffeeId: item.coffeeId,
            variantId: item.variantId,
            coffeeName: item.coffeeName,
            variantSize: item.variantSize,
            price: item.price,
            quantity: item.quantity
          })),
          totalAmount,
          paymentMethod: manualOrderForm.paymentMethod,
          pickupTime: manualOrderForm.pickupTime || null,
          status: manualOrderForm.status,
          additionalFees: manualOrderForm.additionalFees.map(fee => ({
            feeName: fee.feeName,
            feeAmount: fee.feeAmount
          }))
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Order created successfully! Order Number: ${data.order.orderNumber}`);
        setTimeout(() => {
          setShowManualOrderModal(false);
          fetchOrders();
          setSuccess('');
        }, 2000);
      } else {
        setError(data.error || 'Failed to create order');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addManualOrderItem = () => {
    setManualOrderForm(prev => ({
      ...prev,
      items: [...prev.items, { 
        coffeeId: 0,
        variantId: '',
        coffeeName: '', 
        variantSize: '', 
        price: 0, 
        quantity: 1 
      }]
    }));
  };

  const removeManualOrderItem = (index: number) => {
    setManualOrderForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateManualOrderItem = (index: number, field: keyof ManualOrderItem, value: any) => {
    setManualOrderForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleCoffeeSelection = (index: number, coffeeId: number) => {
    const selectedCoffee = coffees.find(c => c.id === coffeeId);
    if (selectedCoffee) {
      setManualOrderForm(prev => ({
        ...prev,
        items: prev.items.map((item, i) => 
          i === index ? { 
            ...item, 
            coffeeId,
            coffeeName: selectedCoffee.name,
            variantId: '',
            variantSize: '',
            price: 0
          } : item
        )
      }));
    }
  };

  const handleVariantSelection = (index: number, variantId: string) => {
    const selectedCoffee = coffees.find(c => c.id === manualOrderForm.items[index].coffeeId);
    if (selectedCoffee) {
      const selectedVariant = selectedCoffee.coffee_variants.find(v => v.id === variantId);
      if (selectedVariant) {
        setManualOrderForm(prev => ({
          ...prev,
          items: prev.items.map((item, i) => 
            i === index ? { 
              ...item, 
              variantId,
              variantSize: selectedVariant.size,
              price: selectedVariant.price
            } : item
          )
        }));
      }
    }
  };

  const addAdditionalFee = () => {
    setManualOrderForm(prev => ({
      ...prev,
      additionalFees: [...prev.additionalFees, { feeName: '', feeAmount: 0 }]
    }));
  };

  const removeAdditionalFee = (index: number) => {
    setManualOrderForm(prev => ({
      ...prev,
      additionalFees: prev.additionalFees.filter((_, i) => i !== index)
    }));
  };

  const updateAdditionalFee = (index: number, field: keyof ManualAdditionalFee, value: any) => {
    setManualOrderForm(prev => ({
      ...prev,
      additionalFees: prev.additionalFees.map((fee, i) => 
        i === index ? { ...fee, [field]: value } : fee
      )
    }));
  };

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: `Receipt-${selectedOrder?.order_number}`,
    pageStyle: `
      @page {
        size: 80mm auto;
        margin: 5mm;
      }
      body {
        font-family: monospace !important;
        font-size: 12px;
        line-height: 1.3;
      }
      * {
        font-family: monospace !important;
      }
    `,
    onBeforePrint: () => {
      // Apply monospace font to all elements in the receipt
      if (receiptRef.current) {
        const elements = receiptRef.current.querySelectorAll('*');
        elements.forEach(el => {
          if (el instanceof HTMLElement) {
            el.style.fontFamily = 'monospace';
          }
        });
      }
      return Promise.resolve();
    }
  });

  const downloadAsImage = async () => {
    if (!receiptRef.current || !selectedOrder) return;

    setIsGeneratingReceipt(true);
    try {
      // Create a clone of the receipt to modify for rendering
      const receiptClone = receiptRef.current.cloneNode(true) as HTMLElement;
      receiptClone.style.position = 'absolute';
      receiptClone.style.left = '-9999px';
      receiptClone.style.fontFamily = 'monospace';
      document.body.appendChild(receiptClone);
      
      // Apply monospace font to all child elements
      const allElements = receiptClone.querySelectorAll('*');
      allElements.forEach(el => {
        if (el instanceof HTMLElement) {
          el.style.fontFamily = 'monospace';
        }
      });
      
      // Wait a moment for styles to apply
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(receiptClone, {
        width: 300,
        height: receiptClone.scrollHeight,
        background: '#ffffff',
        useCORS: true,
        allowTaint: true
      });
      
      document.body.removeChild(receiptClone);

      const link = document.createElement('a');
      link.download = `receipt-${selectedOrder.order_number}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error generating image:', error);
      setError('Failed to generate receipt image');
    } finally {
      setIsGeneratingReceipt(false);
    }
  };

  const downloadAsPDF = async () => {
    if (!receiptRef.current || !selectedOrder) return;

    setIsGeneratingReceipt(true);
    try {
      // Create a clone of the receipt to modify for rendering
      const receiptClone = receiptRef.current.cloneNode(true) as HTMLElement;
      receiptClone.style.position = 'absolute';
      receiptClone.style.left = '-9999px';
      receiptClone.style.fontFamily = 'monospace';
      document.body.appendChild(receiptClone);
      
      // Apply monospace font to all child elements
      const allElements = receiptClone.querySelectorAll('*');
      allElements.forEach(el => {
        if (el instanceof HTMLElement) {
          el.style.fontFamily = 'monospace';
        }
      });
      
      // Wait a moment for styles to apply
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(receiptClone, {
        width: 300,
        height: receiptClone.scrollHeight,
        background: '#ffffff',
        useCORS: true,
        allowTaint: true
      });
      
      document.body.removeChild(receiptClone);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, (canvas.height * 80) / canvas.width]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, 80, (canvas.height * 80) / canvas.width);
      pdf.save(`receipt-${selectedOrder.order_number}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Failed to generate PDF');
    } finally {
      setIsGeneratingReceipt(false);
    }
  };

  const fetchRecipe = async (variantId: string) => {
    try {
      const response = await fetch(`/api/admin/variants/${variantId}`);
      if (response.ok) {
        const data = await response.json();
        return data.recipe;
      }
    } catch (error) {
      console.error('Error fetching recipe:', error);
    }
    return null;
  };

  const openRecipeModal = async (item: OrderItem) => {
    console.log(item);
    setIsSubmitting(true);
    const recipe = await fetchRecipe(item.variant_id);
    if (recipe) {
      setSelectedRecipe(recipe);
      setShowRecipeModal(true);
    } else {
      setError('Recipe not found for this item');
    }
    setIsSubmitting(false);
  };

  const openReceiptModal = (order: Order) => {
    setSelectedOrder(order);
    setShowReceiptModal(true);
  };

  // Edit order form management functions
  const addEditOrderItem = () => {
    setEditOrderForm(prev => ({
      ...prev,
      items: [...prev.items, {
        coffeeId: 0,
        variantId: '',
        coffeeName: '',
        variantSize: '',
        price: 0,
        quantity: 1,
        itemNotes: ''
      }]
    }));
  };

  const removeEditOrderItem = (index: number) => {
    setEditOrderForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateEditOrderItem = (index: number, field: keyof ManualOrderItem, value: any) => {
    setEditOrderForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleEditCoffeeSelection = (index: number, coffeeId: number) => {
    const coffee = coffees.find(c => c.id === coffeeId);
    if (coffee && coffee.coffee_variants.length > 0) {
      const firstVariant = coffee.coffee_variants[0];
      setEditOrderForm(prev => ({
        ...prev,
        items: prev.items.map((item, i) => 
          i === index ? {
            ...item,
            coffeeId,
            coffeeName: coffee.name,
            variantId: firstVariant.id,
            variantSize: firstVariant.size,
            price: firstVariant.price
          } : item
        )
      }));
    }
  };

  const handleEditVariantSelection = (index: number, variantId: string) => {
    const coffee = coffees.find(c => 
      c.coffee_variants.some(v => v.id === variantId)
    );
    const variant = coffee?.coffee_variants.find(v => v.id === variantId);
    
    if (variant) {
      setEditOrderForm(prev => ({
        ...prev,
        items: prev.items.map((item, i) => 
          i === index ? {
            ...item,
            variantId: variant.id,
            variantSize: variant.size,
            price: variant.price
          } : item
        )
      }));
    }
  };

  const addEditOrderFee = () => {
    setEditOrderForm(prev => ({
      ...prev,
      additionalFees: [...prev.additionalFees, { feeName: '', feeAmount: 0 }]
    }));
  };

  const removeEditOrderFee = (index: number) => {
    setEditOrderForm(prev => ({
      ...prev,
      additionalFees: prev.additionalFees.filter((_, i) => i !== index)
    }));
  };

  const updateEditOrderFee = (index: number, field: keyof ManualAdditionalFee, value: any) => {
    setEditOrderForm(prev => ({
      ...prev,
      additionalFees: prev.additionalFees.map((fee, i) => 
        i === index ? { ...fee, [field]: value } : fee
      )
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout title="Orders">
      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
          <p className="text-green-700">{success}</p>
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search orders..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900 bg-white"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900 bg-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="text-sm text-gray-600">
            Total: {pagination.total} orders
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">
              Order Management
            </h2>
            <button
              onClick={openManualOrderModal}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Manual Order</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        #{order.order_number}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.payment_method === "cash" ? "Cash" : "Transfer"}
                      </div>
                      {order.pickup_time && (
                        <div className="text-xs text-primary-600">
                          Pickup:{" "}
                          {new Date(order.pickup_time).toLocaleString("id-ID", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {order.customer_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.customer_phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {order.order_items.length} item(s)
                    </div>
                    <div className="text-xs text-gray-500">
                      {order.order_items
                        .slice(0, 2)
                        .map(
                          (item) => `${item.coffee_name} (${item.variant_size})`
                        )
                        .join(", ")}
                      {order.order_items.length > 2 && "..."}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatPrice(order.total_amount)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => openStatusModal(order)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${getStatusColor(
                        order.status
                      )}`}
                      title="Click to update status"
                    >
                      {getStatusIcon(order.status)}
                      <span className="ml-1 capitalize">{order.status}</span>
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(order.created_at)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openOrderModal(order)}
                        className="text-primary-600 hover:text-primary-900"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openReceiptModal(order)}
                        className="text-green-600 hover:text-green-900"
                        title="View Receipt"
                      >
                        <Receipt className="h-4 w-4" />
                      </button>
                      {order.status !== 'completed' && (
                        <button
                          onClick={() => openEditOrderModal(order)}
                          className="text-orange-600 hover:text-orange-900"
                          title="Edit Order"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteOrder(order.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Order"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {(currentPage - 1) * pagination.limit + 1} to{" "}
                {Math.min(currentPage * pagination.limit, pagination.total)} of{" "}
                {pagination.total} results
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {pagination.pages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(prev + 1, pagination.pages)
                    )
                  }
                  disabled={currentPage === pagination.pages}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Order Details Modal - Enhanced with Recipe Buttons */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">
                  Order Details - #{selectedOrder.order_number}
                </h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openReceiptModal(selectedOrder)}
                    className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                    title="View Receipt"
                  >
                    <Receipt className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setShowOrderModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Customer Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium text-gray-800">
                      {selectedOrder.customer_name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium text-gray-800">
                      {selectedOrder.customer_phone}
                    </span>
                  </div>
                </div>
                {selectedOrder.customer_notes && (
                  <div className="mt-3 flex items-start space-x-2">
                    <MessageSquare className="h-4 w-4 text-gray-400 mt-1" />
                    <div>
                      <span className="text-gray-600">Notes:</span>
                      <p className="text-gray-800 mt-1">
                        {selectedOrder.customer_notes}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Order Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Order Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">Created:</span>
                    <span className="font-medium text-gray-800">
                      {formatDate(selectedOrder.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Package className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">Payment:</span>
                    <span className="font-medium capitalize text-gray-800">
                      {selectedOrder.payment_method}
                    </span>
                  </div>
                  {selectedOrder.pickup_time && (
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Pickup Time:</span>
                      <span className="font-medium text-gray-800">
                        {formatDate(selectedOrder.pickup_time)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Enhanced Order Items with Recipe Buttons */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Order Items
                </h3>
                <div className="space-y-3">
                  {selectedOrder.order_items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">
                          {item.coffee_name}
                        </div>
                        <div className="text-sm text-gray-600">
                          Size: {item.variant_size}
                        </div>
                        {item.item_notes && (
                          <div className="text-sm text-blue-600 mt-1">
                            Note: {item.item_notes}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className="font-medium text-gray-800">
                            {item.quantity} x {formatPrice(item.price)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatPrice(item.subtotal)}
                          </div>
                        </div>
                        <button
                          onClick={() => openRecipeModal(item)}
                          disabled={isSubmitting}
                          className="p-2 bg-primary-100 text-primary-600 rounded-lg hover:bg-primary-200 transition-colors disabled:opacity-50"
                          title="View Recipe"
                        >
                          <ChefHat className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-lg font-semibold">
                    <span>Total Amount:</span>
                    <span className="text-primary-600">
                      {formatPrice(selectedOrder.total_amount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Additional Fees */}
              {selectedOrder.order_additional_fees && selectedOrder.order_additional_fees.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    Additional Fees
                  </h3>
                  <div className="space-y-2">
                    {selectedOrder.order_additional_fees.map((fee) => (
                      <div
                        key={fee.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="font-medium text-gray-800">
                          {fee.fee_name}
                        </div>
                        <div className="font-medium text-gray-800">
                          {formatPrice(fee.fee_amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600">Items Subtotal:</span>
                      <span className="font-medium text-gray-800">
                        {formatPrice(
                          selectedOrder.order_items.reduce((sum, item) => sum + item.subtotal, 0)
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600">Additional Fees:</span>
                      <span className="font-medium text-gray-800">
                        {formatPrice(
                          selectedOrder.order_additional_fees.reduce((sum, fee) => sum + fee.fee_amount, 0)
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-lg font-semibold">
                      <span>Total Amount:</span>
                      <span className="text-primary-600">
                        {formatPrice(selectedOrder.total_amount)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Current Status */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Current Status
                </h3>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    selectedOrder.status
                  )}`}
                >
                  {getStatusIcon(selectedOrder.status)}
                  <span className="ml-1 capitalize">
                    {selectedOrder.status}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">
                  Update Order Status
                </h2>
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>

            <form onSubmit={handleUpdateStatus} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order Number
                </label>
                <input
                  type="text"
                  value={selectedOrder.order_number}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900 bg-white"
                  required
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="preparing">Preparing</option>
                  <option value="ready">Ready for Pickup</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) =>
                    setPaymentMethod(e.target.value as "cash" | "transfer")
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900 bg-white"
                  required
                >
                  <option value="cash">Cash</option>
                  <option value="transfer">Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pickup Time (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Notes
                </label>
                <textarea
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900 bg-white"
                  rows={3}
                  placeholder="Add notes for customer..."
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Updating...</span>
                    </div>
                  ) : (
                    "Update Status"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Order Modal */}
      {showManualOrderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">
                  Add Manual Order
                </h2>
                <button
                  onClick={() => setShowManualOrderModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmitManualOrder} className="p-6 space-y-6">
              {/* Customer Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Customer Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Customer Name
                    </label>
                    <input
                      type="text"
                      value={manualOrderForm.customerName}
                      onChange={(e) =>
                        setManualOrderForm((prev) => ({
                          ...prev,
                          customerName: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900 bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={manualOrderForm.customerPhone}
                      onChange={(e) =>
                        setManualOrderForm((prev) => ({
                          ...prev,
                          customerPhone: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900 bg-white"
                      required
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Notes (Optional)
                  </label>
                  <textarea
                    value={manualOrderForm.customerNotes}
                    onChange={(e) =>
                      setManualOrderForm((prev) => ({
                        ...prev,
                        customerNotes: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900 bg-white"
                    rows={2}
                  />
                </div>
              </div>

              {/* Order Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Order Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Method
                    </label>
                    <select
                      value={manualOrderForm.paymentMethod}
                      onChange={(e) =>
                        setManualOrderForm((prev) => ({
                          ...prev,
                          paymentMethod: e.target.value as "cash" | "transfer",
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900 bg-white"
                    >
                      <option value="cash">Cash</option>
                      <option value="transfer">Transfer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Order Status
                    </label>
                    <select
                      value={manualOrderForm.status}
                      onChange={(e) =>
                        setManualOrderForm((prev) => ({
                          ...prev,
                          status: e.target.value as any,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900 bg-white"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="preparing">Preparing</option>
                      <option value="ready">Ready for Pickup</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pickup Time (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={manualOrderForm.pickupTime}
                      onChange={(e) =>
                        setManualOrderForm((prev) => ({
                          ...prev,
                          pickupTime: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Order Items
                  </h3>
                  <button
                    type="button"
                    onClick={addManualOrderItem}
                    className="flex items-center space-x-1 px-3 py-1 bg-primary-100 text-primary-600 rounded-lg hover:bg-primary-200 transition-colors text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {manualOrderForm.items.map((item, index) => (
                    <div
                      key={index}
                      className="p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-800">
                          Item {index + 1}
                        </h4>
                        {manualOrderForm.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeManualOrderItem(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Coffee
                          </label>
                          <select
                            value={item.coffeeId}
                            onChange={(e) =>
                              handleCoffeeSelection(
                                index,
                                parseInt(e.target.value)
                              )
                            }
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                            required
                          >
                            <option value={0}>Select Coffee</option>
                            {coffees.map((coffee) => (
                              <option key={coffee.id} value={coffee.id}>
                                {coffee.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Size
                          </label>
                          <select
                            value={item.variantId}
                            onChange={(e) =>
                              handleVariantSelection(index, e.target.value)
                            }
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                            disabled={!item.coffeeId}
                            required
                          >
                            <option value="">Select Size</option>
                            {item.coffeeId &&
                              coffees
                                .find((c) => c.id === item.coffeeId)
                                ?.coffee_variants?.filter(
                                  (variant) => variant.available
                                )
                                ?.map((variant) => (
                                  <option key={variant.id} value={variant.id}>
                                    {variant.size} -{" "}
                                    {formatPrice(variant.price)}
                                  </option>
                                ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Price
                          </label>
                          <input
                            type="text"
                            value={formatPrice(item.price)}
                            disabled
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-gray-50 text-gray-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Quantity
                          </label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              updateManualOrderItem(
                                index,
                                "quantity",
                                parseInt(e.target.value) || 1
                              )
                            }
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                            min="1"
                            required
                          />
                        </div>
                      </div>

                      <div className="mt-3">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Item Notes (Optional)
                        </label>
                        <input
                          type="text"
                          value={item.itemNotes || ''}
                          onChange={(e) =>
                            updateManualOrderItem(
                              index,
                              "itemNotes",
                              e.target.value
                            )
                          }
                          placeholder="e.g., less sugar, extra hot, no whip cream..."
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                        />
                      </div>

                      <div className="mt-2 text-right">
                        <span className="text-sm font-medium text-gray-600">
                          Subtotal: {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-lg font-semibold">
                    <span>Total Amount:</span>
                    <span className="text-primary-600">
                      {formatPrice(
                        manualOrderForm.items.reduce(
                          (sum, item) => sum + item.price * item.quantity,
                          0
                        ) + manualOrderForm.additionalFees.reduce(
                          (sum, fee) => sum + fee.feeAmount,
                          0
                        )
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Additional Fees Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Additional Fees (Optional)
                  </h3>
                  <button
                    type="button"
                    onClick={addAdditionalFee}
                    className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Fee</span>
                  </button>
                </div>

                {manualOrderForm.additionalFees.length > 0 && (
                  <div className="space-y-3">
                    {manualOrderForm.additionalFees.map((fee, index) => (
                      <div
                        key={index}
                        className="p-3 border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-800 text-sm">
                            Fee {index + 1}
                          </h4>
                          <button
                            type="button"
                            onClick={() => removeAdditionalFee(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Fee Name
                            </label>
                            <input
                              type="text"
                              value={fee.feeName}
                              onChange={(e) =>
                                updateAdditionalFee(index, 'feeName', e.target.value)
                              }
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                              placeholder="e.g., Delivery Fee"
                              required={manualOrderForm.additionalFees.length > 0}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Amount
                            </label>
                            <input
                              type="number"
                              value={fee.feeAmount}
                              onChange={(e) =>
                                updateAdditionalFee(
                                  index,
                                  'feeAmount',
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                              min="0"
                              required={manualOrderForm.additionalFees.length > 0}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {manualOrderForm.additionalFees.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Items Subtotal:</span>
                      <span className="font-medium text-gray-800">
                        {formatPrice(
                          manualOrderForm.items.reduce(
                            (sum, item) => sum + item.price * item.quantity,
                            0
                          )
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-gray-600">Additional Fees:</span>
                      <span className="font-medium text-gray-800">
                        {formatPrice(
                          manualOrderForm.additionalFees.reduce(
                            (sum, fee) => sum + fee.feeAmount,
                            0
                          )
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-lg font-semibold mt-2 pt-2 border-t border-gray-200">
                      <span>Grand Total:</span>
                      <span className="text-primary-600">
                        {formatPrice(
                          manualOrderForm.items.reduce(
                            (sum, item) => sum + item.price * item.quantity,
                            0
                          ) + manualOrderForm.additionalFees.reduce(
                            (sum, fee) => sum + fee.feeAmount,
                            0
                          )
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowManualOrderModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Creating...</span>
                    </div>
                  ) : (
                    "Create Order"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recipe Modal */}
      {showRecipeModal && selectedRecipe && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800 flex items-center space-x-2">
                  <ChefHat className="h-6 w-6 text-primary-600" />
                  <span>{selectedRecipe.name}</span>
                </h2>
                <button
                  onClick={() => setShowRecipeModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Recipe Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-1">Serving Size</h4>
                  <p className="text-2xl font-bold text-blue-600">{selectedRecipe.serving_size}ml</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-green-900 mb-1">Production Cost</h4>
                  <p className="text-2xl font-bold text-green-600">{formatPrice(selectedRecipe.estimated_cost)}</p>
                </div>
              </div>

              {/* Recipe Description */}
              {selectedRecipe.description && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                  <p className="text-gray-600">{selectedRecipe.description}</p>
                </div>
              )}

              {/* Ingredients List */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Ingredients</h4>
                <div className="space-y-2">
                  {selectedRecipe.ingredients.map((ingredient) => (
                    <div
                      key={ingredient.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-gray-800">
                          {ingredient.ingredient_name}
                        </div>
                        {ingredient.notes && (
                          <div className="text-sm text-gray-500 mt-1">
                            {ingredient.notes}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-800">
                          {ingredient.quantity} {ingredient.ingredient_unit}
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatPrice(ingredient.cost)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">Receipt</h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={downloadAsImage}
                    disabled={isGeneratingReceipt}
                    className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
                    title="Download as Image"
                  >
                    <FileImage className="h-5 w-5" />
                  </button>
                  <button
                    onClick={downloadAsPDF}
                    disabled={isGeneratingReceipt}
                    className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                    title="Download as PDF"
                  >
                    <Download className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handlePrint}
                    disabled={isGeneratingReceipt}
                    className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
                    title="Print Receipt"
                  >
                    <Printer className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setShowReceiptModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* Receipt Content */}
              <div
                ref={receiptRef}
                style={{ 
                  width: '300px', 
                  margin: '0 auto',
                  backgroundColor: '#ffffff',
                  padding: '16px',
                  color: '#1f2937',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  lineHeight: '1.3'
                }}
              >
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 8px 0', fontFamily: 'monospace' }}>KOIU COFFEE</h1>
                  <p style={{ fontSize: '12px', margin: '2px 0', fontFamily: 'monospace' }}>Jl. Pendopo No.17, Sumedang Utara</p>
                  <p style={{ fontSize: '12px', margin: '2px 0', fontFamily: 'monospace' }}>Sumedang, Jawa Barat</p>
                  <p style={{ fontSize: '12px', margin: '2px 0', fontFamily: 'monospace' }}>+62 822 1730 1554</p>
                  <div style={{ borderTop: '1px dashed #9ca3af', margin: '8px 0' }}></div>
                </div>

                {/* Order Info */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontFamily: 'monospace' }}>
                    <span>Order:</span>
                    <span>#{selectedOrder.order_number}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontFamily: 'monospace' }}>
                    <span>Date:</span>
                    <span>{formatDate(selectedOrder.created_at)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontFamily: 'monospace' }}>
                    <span>Customer:</span>
                    <span>{selectedOrder.customer_name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontFamily: 'monospace' }}>
                    <span>Phone:</span>
                    <span>{selectedOrder.customer_phone}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontFamily: 'monospace' }}>
                    <span>Payment:</span>
                    <span style={{ textTransform: 'capitalize' }}>{selectedOrder.payment_method}</span>
                  </div>
                  {selectedOrder.pickup_time && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontFamily: 'monospace' }}>
                      <span>Pickup:</span>
                      <span>{formatDate(selectedOrder.pickup_time)}</span>
                    </div>
                  )}
                  <div style={{ borderTop: '1px dashed #9ca3af', margin: '8px 0' }}></div>
                </div>

                {/* Items */}
                <div style={{ marginBottom: '16px' }}>
                  {selectedOrder.order_items.map((item) => (
                    <div key={item.id} style={{ marginBottom: '8px', fontFamily: 'monospace' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ flex: 1 }}>{item.coffee_name}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span>{item.variant_size}</span>
                        <span>{item.quantity} x {formatPrice(item.price)}</span>
                        <span>{formatPrice(item.subtotal)}</span>
                      </div>
                    </div>
                  ))}
                  <div style={{ borderTop: '1px dashed #9ca3af', margin: '8px 0' }}></div>
                </div>

                {/* Additional Fees */}
                {selectedOrder.order_additional_fees && selectedOrder.order_additional_fees.length > 0 && (
                  <div style={{ marginBottom: '16px', fontFamily: 'monospace' }}>
                    {selectedOrder.order_additional_fees.map((fee) => (
                      <div key={fee.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px' }}>
                        <span>{fee.fee_name}:</span>
                        <span>{formatPrice(fee.fee_amount)}</span>
                      </div>
                    ))}
                    <div style={{ borderTop: '1px dashed #9ca3af', margin: '8px 0' }}></div>
                  </div>
                )}

                {/* Total Breakdown */}
                <div style={{ marginBottom: '16px', fontFamily: 'monospace' }}>
                  {selectedOrder.order_additional_fees && selectedOrder.order_additional_fees.length > 0 && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '4px' }}>
                        <span>Items Subtotal:</span>
                        <span>{formatPrice(selectedOrder.order_items.reduce((sum, item) => sum + item.subtotal, 0))}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
                        <span>Additional Fees:</span>
                        <span>{formatPrice(selectedOrder.order_additional_fees.reduce((sum, fee) => sum + fee.fee_amount, 0))}</span>
                      </div>
                    </>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '16px' }}>
                    <span>TOTAL:</span>
                    <span>{formatPrice(selectedOrder.total_amount)}</span>
                  </div>
                </div>

                {/* Notes */}
                {selectedOrder.customer_notes && (
                  <div style={{ marginBottom: '16px', fontFamily: 'monospace' }}>
                    <div style={{ borderTop: '1px dashed #9ca3af', margin: '8px 0' }}></div>
                    <p style={{ fontSize: '12px', margin: 0 }}>Notes: {selectedOrder.customer_notes}</p>
                  </div>
                )}

                {/* Footer */}
                <div style={{ textAlign: 'center', fontSize: '12px', marginTop: '16px', fontFamily: 'monospace' }}>
                  <div style={{ borderTop: '1px dashed #9ca3af', margin: '8px 0' }}></div>
                  <p style={{ margin: '2px 0' }}>Thank you for your order!</p>
                  <p style={{ margin: '2px 0' }}>Follow us @koiucoffee</p>
                  <p style={{ margin: '2px 0' }}>Status: <span style={{ textTransform: 'capitalize', fontWeight: '600' }}>{selectedOrder.status}</span></p>
                </div>
              </div>

              {isGeneratingReceipt && (
                <div style={{ marginTop: '16px', textAlign: 'center' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#6b7280' }}>
                    <div style={{ 
                      animation: 'spin 1s linear infinite',
                      borderRadius: '50%',
                      width: '16px',
                      height: '16px',
                      border: '2px solid transparent',
                      borderBottom: '2px solid #6366f1'
                    }}></div>
                    <span>Generating receipt...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {showEditOrderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">
                  Edit Order #{editOrderForm.orderId.slice(-8)}
                </h2>
                <button
                  onClick={() => setShowEditOrderModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>

            <form onSubmit={handleEditOrder} className="p-6 space-y-6">
              {/* Customer Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Customer Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Customer Name
                    </label>
                    <input
                      type="text"
                      value={editOrderForm.customerName}
                      onChange={(e) =>
                        setEditOrderForm((prev) => ({
                          ...prev,
                          customerName: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900 bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={editOrderForm.customerPhone}
                      onChange={(e) =>
                        setEditOrderForm((prev) => ({
                          ...prev,
                          customerPhone: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900 bg-white"
                      required
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Notes (Optional)
                  </label>
                  <textarea
                    value={editOrderForm.customerNotes}
                    onChange={(e) =>
                      setEditOrderForm((prev) => ({
                        ...prev,
                        customerNotes: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900 bg-white"
                    rows={2}
                  />
                </div>
              </div>

              {/* Order Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Order Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Method
                    </label>
                    <select
                      value={editOrderForm.paymentMethod}
                      onChange={(e) =>
                        setEditOrderForm((prev) => ({
                          ...prev,
                          paymentMethod: e.target.value as "cash" | "transfer",
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900 bg-white"
                    >
                      <option value="cash">Cash</option>
                      <option value="transfer">Transfer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Order Status
                    </label>
                    <select
                      value={editOrderForm.status}
                      onChange={(e) =>
                        setEditOrderForm((prev) => ({
                          ...prev,
                          status: e.target.value as any,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900 bg-white"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="preparing">Preparing</option>
                      <option value="ready">Ready for Pickup</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pickup Time (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={editOrderForm.pickupTime}
                      onChange={(e) =>
                        setEditOrderForm((prev) => ({
                          ...prev,
                          pickupTime: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Order Items
                  </h3>
                  <button
                    type="button"
                    onClick={addEditOrderItem}
                    className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {editOrderForm.items.map((item, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gray-50 rounded-lg space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-800">Item {index + 1}</h4>
                        <button
                          type="button"
                          onClick={() => removeEditOrderItem(index)}
                          className="p-1 text-red-600 hover:bg-red-100 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Coffee
                          </label>
                          <select
                            value={item.coffeeId}
                            onChange={(e) =>
                              handleEditCoffeeSelection(index, parseInt(e.target.value))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900 bg-white"
                            required
                          >
                            <option value={0}>Select Coffee</option>
                            {coffees.map((coffee) => (
                              <option key={coffee.id} value={coffee.id}>
                                {coffee.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Size
                          </label>
                          <select
                            value={item.variantId}
                            onChange={(e) =>
                              handleEditVariantSelection(index, e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900 bg-white"
                            required
                            disabled={!item.coffeeId}
                          >
                            <option value="">Select Size</option>
                            {item.coffeeId &&
                              coffees
                                .find((c) => c.id === item.coffeeId)
                                ?.coffee_variants.map((variant) => (
                                  <option key={variant.id} value={variant.id}>
                                    {variant.size} - {formatPrice(variant.price)}
                                  </option>
                                ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Quantity
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateEditOrderItem(index, 'quantity', parseInt(e.target.value))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900 bg-white"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Subtotal
                          </label>
                          <input
                            type="text"
                            value={formatPrice(item.price * item.quantity)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                            disabled
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Item Notes (Optional)
                        </label>
                        <input
                          type="text"
                          value={item.itemNotes || ''}
                          onChange={(e) =>
                            updateEditOrderItem(index, 'itemNotes', e.target.value)
                          }
                          placeholder="e.g., less sugar, extra hot, no whip cream..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900 bg-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {editOrderForm.items.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No items added yet. Click "Add Item" to get started.
                  </div>
                )}
              </div>

              {/* Additional Fees */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Additional Fees (Optional)
                  </h3>
                  <button
                    type="button"
                    onClick={addEditOrderFee}
                    className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Fee</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {editOrderForm.additionalFees.map((fee, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <input
                          type="text"
                          value={fee.feeName}
                          onChange={(e) =>
                            updateEditOrderFee(index, 'feeName', e.target.value)
                          }
                          placeholder="Fee name (e.g., Delivery, Service charge)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900 bg-white"
                          required
                        />
                      </div>
                      <div className="w-32">
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          value={fee.feeAmount}
                          onChange={(e) =>
                            updateEditOrderFee(index, 'feeAmount', parseInt(e.target.value) || 0)
                          }
                          placeholder="Amount"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900 bg-white"
                          required
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeEditOrderFee(index)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between text-lg font-semibold">
                  <span>Total Amount:</span>
                  <span className="text-blue-600">
                    {formatPrice(calculateEditOrderTotal())}
                  </span>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowEditOrderModal(false)}
                  className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || editOrderForm.items.length === 0}
                  className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Updating...</span>
                    </div>
                  ) : (
                    "Update Order"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
} 