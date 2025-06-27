'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Coffee, CheckCircle, XCircle, Star, Search, Instagram, Facebook, Twitter, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface Variant {
  id: string;
  size: string;
  price: number;
  originalPrice: number;
}

interface Coffee {
  id: number;
  name: string;
  description: string;
  image: string;
  available: boolean;
  category: string;
  bestSeller: boolean;
  variants: Variant[];
}

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

export default function CoffeeOrderPage() {
  const router = useRouter();
  const [coffees, setCoffees] = useState<Coffee[]>([]);
  const [config, setConfig] = useState<Config>({ adminWhatsApp: '', storeName: '', currency: '' });
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVariants, setSelectedVariants] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    // Load coffee data from JSON
    fetch('/coffee-data.json')
      .then(response => response.json())
      .then(data => {
        setCoffees(data.coffees);
        setConfig(data.config);
        
        // Set default selected variants (first variant for each coffee)
        const defaultVariants: { [key: number]: string } = {};
        data.coffees.forEach((coffee: Coffee) => {
          if (coffee.variants && coffee.variants.length > 0) {
            defaultVariants[coffee.id] = coffee.variants[0].id;
          }
        });
        setSelectedVariants(defaultVariants);
      })
      .catch(error => console.error('Error loading coffee data:', error));

    // Load cart from localStorage
    const savedCart = localStorage.getItem('coffee-cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  useEffect(() => {
    // Save cart to localStorage whenever it changes
    localStorage.setItem('coffee-cart', JSON.stringify(cart));
  }, [cart]);

  const categories = ['All', ...Array.from(new Set(coffees.map(coffee => coffee.category)))];

  const filteredCoffees = coffees.filter(coffee => {
    const matchesCategory = selectedCategory === 'All' || coffee.category === selectedCategory;
    const matchesSearch = coffee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         coffee.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getSelectedVariant = (coffee: Coffee): Variant | null => {
    const selectedVariantId = selectedVariants[coffee.id];
    return coffee.variants.find(variant => variant.id === selectedVariantId) || coffee.variants[0] || null;
  };

  const addToCart = (coffee: Coffee) => {
    if (!coffee.available) return;
    
    const selectedVariant = getSelectedVariant(coffee);
    if (!selectedVariant) return;

    setCart(prevCart => {
      const existingItem = prevCart.find(item => 
        item.coffeeId === coffee.id && item.variantId === selectedVariant.id
      );
      
      if (existingItem) {
        return prevCart.map(item =>
          item.coffeeId === coffee.id && item.variantId === selectedVariant.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, {
          coffeeId: coffee.id,
          variantId: selectedVariant.id,
          name: coffee.name,
          size: selectedVariant.size,
          price: selectedVariant.price,
          originalPrice: selectedVariant.originalPrice,
          image: coffee.image,
          quantity: 1
        }];
      }
    });
  };

  const removeFromCart = (coffeeId: number, variantId: string) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => 
        item.coffeeId === coffeeId && item.variantId === variantId
      );
      
      if (existingItem && existingItem.quantity > 1) {
        return prevCart.map(item =>
          item.coffeeId === coffeeId && item.variantId === variantId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      } else {
        return prevCart.filter(item => 
          !(item.coffeeId === coffeeId && item.variantId === variantId)
        );
      }
    });
  };

  const getCartItemQuantity = (coffeeId: number, variantId: string): number => {
    const item = cart.find(item => item.coffeeId === coffeeId && item.variantId === variantId);
    return item ? item.quantity : 0;
  };

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const formatPrice = (price: number) => {
    return `${config.currency} ${price.toLocaleString('id-ID')}`;
  };

  const hasDiscount = (variant: Variant) => {
    return variant.originalPrice > variant.price;
  };

  const getDiscountPercentage = (variant: Variant) => {
    if (!hasDiscount(variant)) return 0;
    return Math.round(((variant.originalPrice - variant.price) / variant.originalPrice) * 100);
  };

  const goToCheckout = () => {
    if (cart.length > 0) {
      router.push('/checkout');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-blue-600 text-white shadow-lg">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
                <Image
                  src="/logo.svg"
                  alt={config.storeName}
                  width={80}
                  height={40}
                  className="object-contain"
                />
            </div>
            <div className="flex items-center space-x-3">
              <button onClick={() => window.open('https://www.instagram.com/koiucoffee', '_blank')} className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
                <Instagram className="h-5 w-5" />
              </button>
              {/* <button onClick={() => window.open('https://www.facebook.com/koiu.coffee', '_blank')} className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
                <Facebook className="h-5 w-5" />
              </button>
              <button onClick={() => window.open('https://www.twitter.com/koiu_coffee', '_blank')} className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
                <Twitter className="h-5 w-5" />
              </button> */}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="px-4 py-6 text-center bg-blue-50">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Selamat Datang di {config.storeName}
        </h2>
        <p className="text-gray-600 mb-4">Nikmati kopi premium dengan cita rasa terbaik</p>
        {/* <div className="inline-flex items-center px-4 py-2 bg-yellow-400 text-gray-800 rounded-full text-sm font-medium">
          <Star className="h-4 w-4 mr-2" />
          Promo Spesial Hari Ini!
        </div> */}
      </div>

      {/* Search Bar */}
      <div className="px-4 py-4 bg-white">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kopi favorit Anda..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all text-gray-800"
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="px-4 mb-6 bg-white">
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Coffee Grid */}
      <div className="px-4 pb-32 bg-gray-50">
        <div className="grid grid-cols-2 gap-4">
          {filteredCoffees.map(coffee => {
            const selectedVariant = getSelectedVariant(coffee);
            if (!selectedVariant) return null;

            return (
              <div key={coffee.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className="relative">
                  <div className="relative h-32 overflow-hidden">
                    <Image
                      src={coffee.image}
                      alt={coffee.name}
                      fill
                      className="object-cover"
                    />
                    {hasDiscount(selectedVariant) && (
                      <div className="absolute top-2 left-2">
                        <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                          -{getDiscountPercentage(selectedVariant)}%
                        </div>
                      </div>
                    )}
                    {coffee.bestSeller && (
                      <div className={`absolute top-2 ${hasDiscount(selectedVariant) ? 'left-2 mt-7' : 'left-2'}`}>
                        <div className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
                          <Star className="h-3 w-3 mr-1" />
                          Best Seller
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="font-bold text-gray-800 text-base mb-1">{coffee.name}</h3>
                  <p className="text-gray-600 text-xs mb-3 line-clamp-2">{coffee.description}</p>
                  
                  {/* Variant Selector */}
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-1">
                      {coffee.variants.map(variant => (
                        <button
                          key={variant.id}
                          onClick={() => setSelectedVariants(prev => ({
                            ...prev,
                            [coffee.id]: variant.id
                          }))}
                          className={`px-2 py-1 text-xs rounded-full border transition-all ${
                            selectedVariants[coffee.id] === variant.id
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-600 border-gray-300 hover:border-blue-600'
                          }`}
                        >
                          {variant.size}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex flex-col">
                      <span className="text-lg font-bold text-blue-600">
                        {formatPrice(selectedVariant.price)}
                      </span>
                      {hasDiscount(selectedVariant) && (
                        <span className="text-xs text-gray-400 line-through">
                          {formatPrice(selectedVariant.originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    {getCartItemQuantity(coffee.id, selectedVariant.id) > 0 ? (
                      <div className="flex items-center space-x-2 bg-gray-50 rounded-lg p-1 flex-1">
                        <button
                          onClick={() => removeFromCart(coffee.id, selectedVariant.id)}
                          className="p-1 bg-white rounded-md shadow-sm hover:shadow-md transition-shadow"
                        >
                          <Minus className="h-3 w-3 text-gray-600" />
                        </button>
                        <span className="font-bold text-sm min-w-[24px] text-center text-blue-600 flex-1">
                          {getCartItemQuantity(coffee.id, selectedVariant.id)}
                        </span>
                        <button
                          onClick={() => addToCart(coffee)}
                          disabled={!coffee.available}
                          className="p-1 bg-blue-600 text-white rounded-md shadow-sm hover:shadow-md transition-shadow disabled:bg-gray-300"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(coffee)}
                        disabled={!coffee.available}
                        className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        {coffee.available ? 'Add to Cart' : 'Sold Out'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {filteredCoffees.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Tidak ada hasil</h3>
            <p className="text-gray-600">Coba ubah kata kunci pencarian atau kategori</p>
          </div>
        )}
      </div>

      {/* Sticky Bottom Cart */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-600 rounded-xl">
                  <ShoppingCart className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">
                    {getCartItemCount()} item{getCartItemCount() > 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-gray-500">Siap untuk checkout</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-blue-600">
                  {formatPrice(getTotalPrice())}
                </p>
                <p className="text-xs text-gray-500">Total pembayaran</p>
              </div>
            </div>
            <button
              onClick={goToCheckout}
              className="w-full bg-blue-600 text-white py-4 rounded-xl hover:bg-blue-700 transition-all font-semibold text-lg flex items-center justify-center space-x-2"
            >
              <span>Lanjut ke Checkout</span>
              <ShoppingCart className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
