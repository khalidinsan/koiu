'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Coffee, CheckCircle, XCircle, Star, Search, Instagram, Facebook, Twitter } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface Variant {
  id: string;
  size: string;
  price: number;
  originalPrice: number;
  stock: number;
  available: boolean;
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
  itemNotes?: string;
}

interface Config {
  adminWhatsApp: string;
  storeName: string;
  currency: string;
  pickupLocation: {
    address: string;
    coordinates: string;
    mapLink: string;
  };
}

export default function CoffeeOrderPage() {
  const router = useRouter();
  const [coffees, setCoffees] = useState<Coffee[]>([]);
  const [config, setConfig] = useState<Config>({ 
    adminWhatsApp: '', 
    storeName: '', 
    currency: '',
    pickupLocation: { address: '', coordinates: '', mapLink: '' }
  });
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVariants, setSelectedVariants] = useState<{ [key: number]: string }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedCoffeeForNotes, setSelectedCoffeeForNotes] = useState<Coffee | null>(null);
  const [itemNotes, setItemNotes] = useState('');

  useEffect(() => {
    // Load coffee data from API
    fetch('/api/coffees')
      .then(response => response.json())
      .then(data => {
        setCoffees(data.coffees);
        setConfig(data.config);
        
        // Set default selected variants (first available variant for each coffee)
        const defaultVariants: { [key: number]: string } = {};
        data.coffees.forEach((coffee: Coffee) => {
          if (coffee.variants && coffee.variants.length > 0) {
            // Find first available variant, or first variant if none available
            const availableVariant = coffee.variants.find(v => v.available && v.stock > 0);
            defaultVariants[coffee.id] = availableVariant ? availableVariant.id : coffee.variants[0].id;
          }
        });
        setSelectedVariants(defaultVariants);
      })
      .catch(error => console.error('Error loading coffee data:', error))
      .finally(() => setIsLoading(false));

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

  const getSelectedVariant = (coffee: Coffee) => {
    const selectedVariantId = selectedVariants[coffee.id];
    return coffee.variants.find(variant => variant.id === selectedVariantId) || coffee.variants[0];
  };

  const addToCart = (coffee: Coffee, itemNotes?: string) => {
    const selectedVariant = getSelectedVariant(coffee);
    if (!selectedVariant || !selectedVariant.available || selectedVariant.stock <= 0) return;

    const existingItem = cart.find(item => 
      item.coffeeId === coffee.id && item.variantId === selectedVariant.id && item.itemNotes === itemNotes
    );

    if (existingItem) {
      // Check if we can add more (don't exceed stock)
      if (existingItem.quantity >= selectedVariant.stock) {
        return; // Can't add more than available stock
      }
      
      setCart(prevCart =>
        prevCart.map(item =>
          item.coffeeId === coffee.id && item.variantId === selectedVariant.id && item.itemNotes === itemNotes
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      const newItem: CartItem = {
        coffeeId: coffee.id,
        variantId: selectedVariant.id,
        name: coffee.name,
        size: selectedVariant.size,
        price: selectedVariant.price,
        originalPrice: selectedVariant.originalPrice,
        image: coffee.image,
        quantity: 1,
        itemNotes: itemNotes || undefined
      };
      setCart(prevCart => [...prevCart, newItem]);
    }
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

  const getCartItemQuantity = (coffeeId: number, variantId: string) => {
    const item = cart.find(item => item.coffeeId === coffeeId && item.variantId === variantId);
    return item ? item.quantity : 0;
  };

  const getTotalItems = () => {
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

  const getStockText = (variant: Variant) => {
    if (!variant.available || variant.stock <= 0) return 'Habis';
    if (variant.stock < 10) return `Sisa ${variant.stock}`;
    return 'Tersedia';
  };

  const getStockColor = (variant: Variant) => {
    if (!variant.available || variant.stock <= 0) return 'text-red-500';
    if (variant.stock < 10) return 'text-yellow-500';
    return 'text-green-500';
  };

  const openNotesModal = (coffee: Coffee) => {
    setSelectedCoffeeForNotes(coffee);
    setItemNotes('');
    setShowNotesModal(true);
  };

  const closeNotesModal = () => {
    setShowNotesModal(false);
    setSelectedCoffeeForNotes(null);
    setItemNotes('');
  };

  const addToCartWithNotes = () => {
    if (selectedCoffeeForNotes) {
      addToCart(selectedCoffeeForNotes, itemNotes);
      closeNotesModal();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading menu...</p>
        </div>
      </div>
    );
  }

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
              className={`px-3 py-1.5 rounded-full whitespace-nowrap text-sm font-medium transition-all ${
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
      <div className="px-4 pb-24">
        <div className="grid grid-cols-2 gap-4">
          {filteredCoffees.map(coffee => {
            const selectedVariant = getSelectedVariant(coffee);
            const cartQuantity = getCartItemQuantity(coffee.id, selectedVariant.id);
            const canAddToCart = selectedVariant.available && selectedVariant.stock > 0 && cartQuantity < selectedVariant.stock;
            
            return (
              <div key={coffee.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Image */}
                <div className="relative aspect-square">
          <Image
                    src={coffee.image}
                    alt={coffee.name}
                    fill
                    className="object-cover"
                  />
                  {coffee.bestSeller && (
                    <div className="absolute top-2 left-2 bg-yellow-400 text-gray-800 px-2 py-1 rounded-full text-xs font-bold">
                      <Star className="inline h-3 w-3 mr-1" />
                      Best Seller
                    </div>
                  )}
                  {hasDiscount(selectedVariant) && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                      -{getDiscountPercentage(selectedVariant)}%
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-bold text-gray-800 text-lg mb-1">{coffee.name}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{coffee.description}</p>

                  {/* Variant Selector - Pills */}
                  {coffee.variants.length > 1 && (
                    <div className="mb-3">
                      <div className="flex flex-wrap gap-2">
                        {coffee.variants.map(variant => (
                          <button
                            key={variant.id}
                            onClick={() => setSelectedVariants(prev => ({
                              ...prev,
                              [coffee.id]: variant.id
                            }))}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                              selectedVariants[coffee.id] === variant.id
                                ? 'bg-blue-600 text-white shadow-md'
                                : variant.available && variant.stock > 0
                                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                            }`}
                            disabled={!variant.available || variant.stock <= 0}
                          >
                            {variant.size}
                            {!variant.available || variant.stock <= 0 ? ' (Habis)' : ''}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stock Status */}
                  {/* <div className="mb-3">
                    <span className={`text-xs font-medium ${getStockColor(selectedVariant)}`}>
                      {getStockText(selectedVariant)}
                    </span>
                  </div> */}

                  {/* Price */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-blue-600">
                        {formatPrice(selectedVariant.price)}
                      </span>
                      {hasDiscount(selectedVariant) && (
                        <span className="text-sm text-gray-400 line-through">
                          {formatPrice(selectedVariant.originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Add to Cart */}
                  {cartQuantity > 0 ? (
                    <div className="flex items-center justify-between bg-blue-50 rounded-xl p-2">
                      <button
                        onClick={() => removeFromCart(coffee.id, selectedVariant.id)}
                        className="p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                      >
                        <Minus className="h-4 w-4 text-blue-600" />
                      </button>
                      <span className="font-semibold text-blue-600 text-lg">{cartQuantity}</span>
                      <button
                        onClick={() => openNotesModal(coffee)}
                        disabled={!canAddToCart}
                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => openNotesModal(coffee)}
                      disabled={!canAddToCart}
                      className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Tambah</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sticky Bottom Cart */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-600 text-white p-2 rounded-lg">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">{getTotalItems()} item</p>
                <p className="text-sm text-gray-600">{formatPrice(getTotalPrice())}</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/checkout')}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-semibold"
            >
              Checkout
            </button>
          </div>
        </div>
      )}

      {/* Notes Modal */}
      {showNotesModal && selectedCoffeeForNotes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              Tambah ke Keranjang
            </h3>
            <p className="text-gray-600 mb-4">
              {selectedCoffeeForNotes.name} - {getSelectedVariant(selectedCoffeeForNotes).size}
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catatan Item (Opsional)
              </label>
              <input
                type="text"
                value={itemNotes}
                onChange={(e) => setItemNotes(e.target.value)}
                placeholder="Misal: less sugar, extra hot, tanpa whip cream..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all text-gray-800"
                autoFocus
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={closeNotesModal}
                className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
              >
                Batal
              </button>
              <button
                onClick={addToCartWithNotes}
                className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
              >
                Tambah ke Keranjang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
