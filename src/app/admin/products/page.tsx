'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Package, 
  CheckCircle,
  XCircle,
  Save,
  X,
  User,
  Eye,
  EyeOff,
  ChefHat
} from 'lucide-react';
import Image from 'next/image';

interface CoffeeVariant {
  id: string;
  size: string;
  price: number;
  original_price: number;
  stock: number;
  available: boolean;
  cost_price?: number;
  profit_amount?: number;
  profit_percentage?: number;
}

interface Coffee {
  id: number;
  name: string;
  description: string;
  image: string;
  category: string;
  best_seller: boolean;
  coffee_variants: CoffeeVariant[];
}

interface ProductFormData {
  id?: number;
  name: string;
  description: string;
  image: string;
  category: string;
  bestSeller: boolean;
  variants: {
    id: string;
    size: string;
    price: number;
    originalPrice: number;
    available: boolean;
  }[];
}

interface AdminUser {
  id: number;
  email: string;
}

export default function ProductsPage() {
  const router = useRouter();
  const [coffees, setCoffees] = useState<Coffee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal states
  const [showProductModal, setShowProductModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Coffee | null>(null);
  const [deleteProductId, setDeleteProductId] = useState<number | null>(null);
  
  // Form states
  const [productForm, setProductForm] = useState<ProductFormData>({
    name: '',
    description: '',
    image: '',
    category: 'Coffee',
    bestSeller: false,
    variants: [
      { id: '', size: '250ml', price: 13000, originalPrice: 13000, available: true },
      { id: '', size: '1 Liter', price: 50000, originalPrice: 50000, available: true }
    ]
  });
  
  // Profile states
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [profileForm, setProfileForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchAdminProfile();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/admin/products');
      
      if (response.status === 401) {
        router.push('/admin/login');
        return;
      }

      const data = await response.json();
      setCoffees(data.coffees || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAdminProfile = async () => {
    try {
      const response = await fetch('/api/admin/profile');
      if (response.ok) {
        const data = await response.json();
        setAdminUser(data.admin);
      }
    } catch (error) {
      console.error('Error fetching admin profile:', error);
    }
  };

  const updateAvailability = async (variantId: string, available: boolean) => {
    try {
      const response = await fetch('/api/admin/stock', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          variantId,
          stock: available ? 100 : 0,
          available
        }),
      });

      if (response.ok) {
        setCoffees(prevCoffees => 
          prevCoffees.map(coffee => ({
            ...coffee,
            coffee_variants: coffee.coffee_variants.map(variant => 
              variant.id === variantId 
                ? { ...variant, available, stock: available ? 100 : 0 }
                : variant
            )
          }))
        );
      }
    } catch (error) {
      console.error('Error updating availability:', error);
    }
  };

  // Product Management Functions
  const openAddProductModal = () => {
    setSelectedProduct(null);
    setProductForm({
      name: '',
      description: '',
      image: '',
      category: 'Coffee',
      bestSeller: false,
      variants: [
        { id: '', size: '250ml', price: 13000, originalPrice: 13000, available: true },
        { id: '', size: '1 Liter', price: 50000, originalPrice: 50000, available: true }
      ]
    });
    setShowProductModal(true);
  };

  const openEditProductModal = (coffee: Coffee) => {
    setSelectedProduct(coffee);
    setProductForm({
      id: coffee.id,
      name: coffee.name,
      description: coffee.description,
      image: coffee.image,
      category: coffee.category,
      bestSeller: coffee.best_seller,
      variants: coffee.coffee_variants.map(variant => ({
        id: variant.id,
        size: variant.size,
        price: variant.price,
        originalPrice: variant.original_price,
        available: variant.available
      }))
    });
    setShowProductModal(true);
  };

  const openDeleteModal = (coffeeId: number) => {
    setDeleteProductId(coffeeId);
    setShowDeleteModal(true);
  };

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const variants = productForm.variants.map(variant => ({
        ...variant,
        id: variant.id || `${productForm.id || 'new'}-${variant.size.toLowerCase().replace(/\s+/g, '')}`
      }));

      const method = selectedProduct ? 'PUT' : 'POST';
      const response = await fetch('/api/admin/products', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...productForm,
          variants
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(selectedProduct ? 'Product updated successfully!' : 'Product created successfully!');
        setTimeout(() => {
          setShowProductModal(false);
          fetchProducts();
          setSuccess('');
        }, 1500);
      } else {
        setError(data.error || 'Failed to save product');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!deleteProductId) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/products?id=${deleteProductId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccess('Product deleted successfully!');
        setTimeout(() => {
          setShowDeleteModal(false);
          fetchProducts();
          setSuccess('');
          setDeleteProductId(null);
        }, 1500);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete product');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addVariant = () => {
    setProductForm(prev => ({
      ...prev,
      variants: [...prev.variants, {
        id: '',
        size: '',
        price: 0,
        originalPrice: 0,
        available: true
      }]
    }));
  };

  const removeVariant = (index: number) => {
    setProductForm(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  const updateVariant = (index: number, field: string, value: any) => {
    setProductForm(prev => ({
      ...prev,
      variants: prev.variants.map((variant, i) => 
        i === index ? { ...variant, [field]: value } : variant
      )
    }));
  };

  // Profile Management Functions
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    if (profileForm.newPassword !== profileForm.confirmPassword) {
      setError('New passwords do not match');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: profileForm.currentPassword,
          newPassword: profileForm.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Password updated successfully!');
        setProfileForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setTimeout(() => {
          setShowProfileModal(false);
          setSuccess('');
        }, 1500);
      } else {
        setError(data.error || 'Failed to update password');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    return `Rp ${price.toLocaleString('id-ID')}`;
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(1)}%`;
  };

  const getProfitColor = (percentage: number) => {
    if (percentage < 0) return 'text-red-600';
    if (percentage < 10) return 'text-orange-600';
    if (percentage < 20) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout title="Products">
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

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">Product Management</h2>
            <button 
              onClick={openAddProductModal}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Product</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Variants & Availability
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  HPP & Profitability
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {coffees.map((coffee) => (
                <tr key={coffee.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={coffee.image}
                          alt={coffee.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {coffee.name}
                          {coffee.best_seller && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Best Seller
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 line-clamp-1">
                          {coffee.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {coffee.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      {coffee.coffee_variants.map((variant) => {
                        return (
                          <div key={variant.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                            <div className="flex items-center space-x-2">
                              {variant.available ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500" />
                              )}
                              <span className="text-sm font-medium text-gray-700">
                                {variant.size}
                              </span>
                              <span className="text-sm text-gray-500">
                                {formatPrice(variant.price)}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => updateAvailability(variant.id, !variant.available)}
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  variant.available 
                                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                                }`}
                              >
                                {variant.available ? 'Available' : 'Unavailable'}
                              </button>
                              <button
                                onClick={() => router.push(`/admin/recipes/${variant.id}`)}
                                className="px-2 py-1 rounded text-xs font-medium bg-primary-100 text-primary-700 hover:bg-primary-200"
                                title="Manage Recipe"
                              >
                                <ChefHat className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      {coffee.coffee_variants.map((variant) => {
                        return (
                          <div key={`hpp-${variant.id}`} className="bg-gray-50 p-2 rounded-lg">
                            <div className="text-xs text-gray-600 mb-1">{variant.size}</div>
                            <div className="space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500">HPP:</span>
                                <span className="text-xs font-medium text-gray-900">
                                  {variant.cost_price ? formatPrice(variant.cost_price) : 'Rp 0'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500">Profit:</span>
                                <span className="text-xs font-medium text-gray-900">
                                  {variant.profit_amount ? formatPrice(variant.profit_amount) : 'Rp 0'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500">Margin:</span>
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getProfitColor(variant.profit_percentage || 0)}`}>
                                  {variant.profit_percentage ? formatPercentage(variant.profit_percentage) : '0%'}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {coffee.coffee_variants.some(v => v.available) ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Available
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Not Available
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => openEditProductModal(coffee)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => openDeleteModal(coffee.id)}
                        className="text-red-600 hover:text-red-900"
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
      </div>

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">
                  {selectedProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
                <button
                  onClick={() => setShowProductModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmitProduct} className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900 bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900 bg-white"
                  >
                    <option value="Coffee">Coffee</option>
                    <option value="Tea">Tea</option>
                    <option value="Beverage">Beverage</option>
                    <option value="Snack">Snack</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900 bg-white"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image URL
                </label>
                <input
                  type="url"
                  value={productForm.image}
                  onChange={(e) => setProductForm(prev => ({ ...prev, image: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900 bg-white"
                  placeholder="/images/coffee-name.png"
                  required
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="bestSeller"
                  checked={productForm.bestSeller}
                  onChange={(e) => setProductForm(prev => ({ ...prev, bestSeller: e.target.checked }))}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="bestSeller" className="ml-2 block text-sm text-gray-900">
                  Mark as Best Seller
                </label>
              </div>

              {/* Variants */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Product Variants
                  </label>
                  <button
                    type="button"
                    onClick={addVariant}
                    className="flex items-center space-x-1 px-3 py-1 bg-primary-100 text-primary-600 rounded-lg hover:bg-primary-200 transition-colors text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Variant</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {productForm.variants.map((variant, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-800">Variant {index + 1}</h4>
                        {productForm.variants.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeVariant(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Size
                          </label>
                          <input
                            type="text"
                            value={variant.size}
                            onChange={(e) => updateVariant(index, 'size', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                            placeholder="e.g., 250ml"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Price
                          </label>
                          <input
                            type="number"
                            value={variant.price}
                            onChange={(e) => updateVariant(index, 'price', parseInt(e.target.value) || 0)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                            min="0"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Original Price
                          </label>
                          <input
                            type="number"
                            value={variant.originalPrice}
                            onChange={(e) => updateVariant(index, 'originalPrice', parseInt(e.target.value) || 0)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                            min="0"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={variant.available}
                            onChange={(e) => updateVariant(index, 'available', e.target.checked)}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">Available for sale</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
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
                      <span>Saving...</span>
                    </div>
                  ) : (
                    selectedProduct ? 'Update Product' : 'Create Product'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 text-center mb-2">
                Delete Product
              </h3>
              <p className="text-gray-600 text-center mb-6">
                Are you sure you want to delete this product? This action cannot be undone.
              </p>
              <div className="flex items-center justify-center space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteProduct}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Deleting...</span>
                    </div>
                  ) : (
                    'Delete Product'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">Admin Profile</h2>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Admin Info */}
              <div className="mb-6">
                <div className="flex items-center justify-center w-16 h-16 mx-auto bg-primary-100 rounded-full mb-4">
                  <User className="h-8 w-8 text-primary-600" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-800">{adminUser?.email}</h3>
                  <p className="text-sm text-gray-600">Administrator</p>
                </div>
              </div>

              {/* Change Password Form */}
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <h4 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">
                  Change Password
                </h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={profileForm.currentPassword}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900 bg-white"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={profileForm.newPassword}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900 bg-white"
                      minLength={6}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={profileForm.confirmPassword}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900 bg-white"
                      minLength={6}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowProfileModal(false)}
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
                      'Update Password'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
} 