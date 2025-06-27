'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Minus, Trash2, MessageCircle, User, Phone } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';

interface CartItem {
  coffeeId: number;
  variantId: string;
  name: string;
  size: string;
  price: number;
  originalPrice: number;
  image: string;
  quantity: number;
}

interface Config {
  adminWhatsApp: string;
  storeName: string;
  currency: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [config, setConfig] = useState<Config>({ adminWhatsApp: '', storeName: '', currency: '' });
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load config
    fetch('/coffee-data.json')
      .then(response => response.json())
      .then(data => {
        setConfig(data.config);
      })
      .catch(error => console.error('Error loading config:', error));

    // Load cart from localStorage or URL params
    const savedCart = localStorage.getItem('coffee-cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  const updateQuantity = (coffeeId: number, variantId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(coffeeId, variantId);
      return;
    }

    setCart(prevCart => {
      const updatedCart = prevCart.map(item =>
        item.coffeeId === coffeeId && item.variantId === variantId 
          ? { ...item, quantity: newQuantity } 
          : item
      );
      localStorage.setItem('coffee-cart', JSON.stringify(updatedCart));
      return updatedCart;
    });
  };

  const removeFromCart = (coffeeId: number, variantId: string) => {
    setCart(prevCart => {
      const updatedCart = prevCart.filter(item => 
        !(item.coffeeId === coffeeId && item.variantId === variantId)
      );
      localStorage.setItem('coffee-cart', JSON.stringify(updatedCart));
      return updatedCart;
    });
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const formatPrice = (price: number) => {
    return `${config.currency} ${price.toLocaleString('id-ID')}`;
  };

  const hasDiscount = (item: CartItem) => {
    return item.originalPrice > item.price;
  };

  const sendWhatsAppOrder = async () => {
    if (cart.length === 0 || !customerName || !customerPhone) return;

    setIsLoading(true);

    let message = `*Pesanan Baru dari ${config.storeName}*\n\n`;
    message += `*Data Pemesan:*\n`;
    message += `Nama: ${customerName}\n`;
    message += `No. HP: ${customerPhone}\n\n`;
    message += `*Detail Pesanan:*\n`;
    
    cart.forEach(item => {
      message += `• ${item.name} (${item.size}) x${item.quantity} - ${formatPrice(item.price * item.quantity)}\n`;
    });
    
    message += `\n*Total: ${formatPrice(getTotalPrice())}*`;
    message += `\n\nTerima kasih atas pesanannya! 🙏`;

    const whatsappUrl = `https://wa.me/${config.adminWhatsApp}?text=${encodeURIComponent(message)}`;
    
    // Clear cart after successful order
    localStorage.removeItem('coffee-cart');
    
    window.open(whatsappUrl, '_blank');
    
    setTimeout(() => {
      setIsLoading(false);
      router.push('/');
    }, 1000);
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Keranjang Kosong</h2>
          <p className="text-gray-600 mb-6">Silakan pilih kopi favorit Anda terlebih dahulu</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
          >
            Kembali Belanja
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
        <div className="flex items-center px-4 py-4">
          <button
            onClick={() => router.push('/')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors mr-3"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-800">Konfirmasi Pesanan</h1>
        </div>
      </header>

      <div className="p-4 pb-32">
        {/* Order Summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6">
          <div className="p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Ringkasan Pesanan</h2>
            <div className="space-y-6">
              {cart.map(item => (
                <div key={`${item.coffeeId}-${item.variantId}`} className="flex items-start space-x-4">
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 text-lg mb-1">{item.name}</h3>
                    <p className="text-sm text-blue-600 font-medium mb-2">{item.size}</p>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-blue-600">
                        {formatPrice(item.price)}
                      </span>
                      {hasDiscount(item) && (
                        <span className="text-sm text-gray-400 line-through">
                          {formatPrice(item.originalPrice)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => updateQuantity(item.coffeeId, item.variantId, item.quantity - 1)}
                          className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          <Minus className="h-4 w-4 text-gray-600" />
                        </button>
                        <span className="font-semibold text-gray-800 text-lg min-w-[40px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.coffeeId, item.variantId, item.quantity + 1)}
                          className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.coffeeId, item.variantId)}
                        className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="border-t border-gray-200 mt-6 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-gray-800">Total:</span>
                <span className="text-2xl font-bold text-blue-600">
                  {formatPrice(getTotalPrice())}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Information */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Data Pemesan</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="inline h-4 w-4 mr-1" />
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Masukkan nama lengkap"
                  className="w-full px-4 py-3 border text-gray-800 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="inline h-4 w-4 mr-1" />
                  Nomor WhatsApp
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Contoh: 08123456789"
                  className="w-full px-4 py-3 text-gray-800 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Order Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
        <button
          onClick={sendWhatsAppOrder}
          disabled={!customerName || !customerPhone || isLoading}
          className="w-full bg-green-500 text-white py-4 rounded-xl hover:bg-green-600 transition-colors flex items-center justify-center space-x-2 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold text-lg"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <>
              <MessageCircle className="h-5 w-5" />
              <span>Pesan Sekarang via WhatsApp</span>
            </>
          )}
        </button>
        {(!customerName || !customerPhone) && (
          <p className="text-sm text-red-500 text-center mt-2">
            Mohon lengkapi data pemesan terlebih dahulu
          </p>
        )}
      </div>
    </div>
  );
} 