'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Package, 
  DollarSign,
  AlertTriangle,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  X,
  Save
} from 'lucide-react';

interface IngredientCategory {
  id: number;
  name: string;
  description: string;
  color: string;
}

interface Ingredient {
  id: number;
  name: string;
  description: string;
  unit: string;
  cost_per_unit: number;
  supplier: string;
  category_id: number;
  category_name: string;
  category_color: string;
  minimum_stock: number;
  current_stock: number;
  is_active: boolean;
  package_size?: number;
  package_price?: number;
  last_package_update?: string;
  created_at: string;
  updated_at: string;
}

interface IngredientFormData {
  name: string;
  description: string;
  unit: string;
  cost_per_unit: number;
  supplier: string;
  category_id: number;
  minimum_stock: number;
  current_stock: number;
  is_active: boolean;
  package_size: number;
  package_price: number;
  use_auto_calculate: boolean;
}

export default function IngredientsPage() {
  const router = useRouter();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [categories, setCategories] = useState<IngredientCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Form data
  const [formData, setFormData] = useState<IngredientFormData>({
    name: '',
    description: '',
    unit: 'gram',
    cost_per_unit: 0,
    supplier: '',
    category_id: 1,
    minimum_stock: 0,
    current_stock: 0,
    is_active: true,
    package_size: 0,
    package_price: 0,
    use_auto_calculate: false
  });

  useEffect(() => {
    fetchIngredients();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/ingredients/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchIngredients = async () => {
    try {
      const response = await fetch('/api/admin/ingredients');
      
      if (response.status === 401) {
        router.push('/admin/login');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setIngredients(data.ingredients || []);
      }
    } catch (error) {
      console.error('Error fetching ingredients:', error);
      setError('Failed to load ingredients');
    } finally {
      setIsLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingIngredient(null);
    setFormData({
      name: '',
      description: '',
      unit: 'gram',
      cost_per_unit: 0,
      supplier: '',
      category_id: categories[0]?.id || 1,
      minimum_stock: 0,
      current_stock: 0,
      is_active: true,
      package_size: 0,
      package_price: 0,
      use_auto_calculate: false
    });
    setShowModal(true);
  };

  const openEditModal = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient);
    const hasPackageData = !!(ingredient.package_size && ingredient.package_price);
    setFormData({
      name: ingredient.name,
      description: ingredient.description,
      unit: ingredient.unit,
      cost_per_unit: ingredient.cost_per_unit,
      supplier: ingredient.supplier,
      category_id: ingredient.category_id,
      minimum_stock: ingredient.minimum_stock,
      current_stock: ingredient.current_stock,
      is_active: ingredient.is_active,
      package_size: ingredient.package_size || 0,
      package_price: ingredient.package_price || 0,
      use_auto_calculate: hasPackageData
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const url = editingIngredient 
        ? `/api/admin/ingredients/${editingIngredient.id}`
        : '/api/admin/ingredients';
      
      const method = editingIngredient ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(editingIngredient ? 'Ingredient updated successfully!' : 'Ingredient created successfully!');
        setTimeout(() => {
          setShowModal(false);
          fetchIngredients();
          setSuccess('');
        }, 1500);
      } else {
        setError(data.error || 'Failed to save ingredient');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (ingredientId: number) => {
    if (!confirm('Are you sure you want to delete this ingredient? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/ingredients/${ingredientId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccess('Ingredient deleted successfully!');
        fetchIngredients();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete ingredient');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    }
  };

  const formatPrice = (price: number) => {
    return `Rp ${price.toLocaleString('id-ID')}`;
  };

  const getStockStatus = (current: number, minimum: number) => {
    if (current <= 0) return { status: 'empty', color: 'text-red-600', bg: 'bg-red-100' };
    if (current <= minimum) return { status: 'low', color: 'text-orange-600', bg: 'bg-orange-100' };
    return { status: 'good', color: 'text-green-600', bg: 'bg-green-100' };
  };

  const filteredIngredients = ingredients.filter(ingredient => {
    const matchesSearch = ingredient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ingredient.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || ingredient.category_id.toString() === categoryFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && ingredient.is_active) ||
                         (statusFilter === 'inactive' && !ingredient.is_active);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Auto calculate cost per unit
  const handleAutoCalculate = () => {
    if (formData.package_size > 0 && formData.package_price > 0) {
      const calculatedCost = formData.package_price / formData.package_size;
      setFormData(prev => ({ 
        ...prev, 
        cost_per_unit: Math.round(calculatedCost * 100) / 100 // Round to 2 decimal places
      }));
    }
  };

  // Auto calculate when package data changes
  React.useEffect(() => {
    if (formData.use_auto_calculate && formData.package_size > 0 && formData.package_price > 0) {
      handleAutoCalculate();
    }
  }, [formData.package_size, formData.package_price, formData.use_auto_calculate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ingredients...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout title="Ingredients Management">
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Ingredients</p>
              <p className="text-2xl font-bold text-gray-800">{ingredients.length}</p>
            </div>
            <div className="bg-primary-100 p-3 rounded-lg">
              <Package className="h-6 w-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600">
                {ingredients.filter(i => i.is_active).length}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold text-orange-600">
                {ingredients.filter(i => i.current_stock <= i.minimum_stock && i.current_stock > 0).length}
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600">
                {ingredients.filter(i => i.current_stock <= 0).length}
              </p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

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
                placeholder="Search ingredients..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900 bg-white"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900 bg-white"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900 bg-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Ingredient</span>
          </button>
        </div>
      </div>

      {/* Ingredients Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Ingredients List</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier
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
              {filteredIngredients.map((ingredient) => {
                const stockStatus = getStockStatus(ingredient.current_stock, ingredient.minimum_stock);
                return (
                  <tr key={ingredient.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {ingredient.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {ingredient.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span 
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: ingredient.category_color }}
                      >
                        {ingredient.category_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatPrice(ingredient.cost_per_unit)}
                      </div>
                      <div className="text-sm text-gray-500">
                        per {ingredient.unit}
                        {ingredient.package_size && ingredient.package_price && (
                          <div className="text-xs text-blue-600 mt-1">
                            📦 {ingredient.package_size}{ingredient.unit} @ {formatPrice(ingredient.package_price)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {ingredient.current_stock} {ingredient.unit}
                      </div>
                      <div className={`text-xs ${stockStatus.color}`}>
                        Min: {ingredient.minimum_stock} {ingredient.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {ingredient.supplier || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        ingredient.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {ingredient.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openEditModal(ingredient)}
                          className="text-primary-600 hover:text-primary-900"
                          title="Edit Ingredient"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(ingredient.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Ingredient"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">
                  {editingIngredient ? 'Edit Ingredient' : 'Add New Ingredient'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900 bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, category_id: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900 bg-white"
                    required
                  >
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900 bg-white"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit *
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900 bg-white"
                    required
                  >
                    <option value="gram">gram</option>
                    <option value="ml">ml</option>
                    <option value="piece">piece</option>
                    <option value="shot">shot</option>
                    <option value="kg">kg</option>
                    <option value="liter">liter</option>
                  </select>
                </div>
                <div>
                  <label className="flex items-center space-x-2 mb-2">
                    <input
                      type="checkbox"
                      checked={formData.use_auto_calculate}
                      onChange={(e) => setFormData(prev => ({ ...prev, use_auto_calculate: e.target.checked }))}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-600"
                    />
                    <span className="text-sm font-medium text-gray-700">Auto Calculate Cost</span>
                  </label>
                  {formData.use_auto_calculate ? (
                    <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                      Calculated from package data
                    </div>
                  ) : (
                    <input
                      type="number"
                      step="0.01"
                      value={formData.cost_per_unit}
                      onChange={(e) => setFormData(prev => ({ ...prev, cost_per_unit: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900 bg-white"
                      placeholder="Cost per unit"
                      required
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supplier
                  </label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Stock
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.current_stock}
                    onChange={(e) => setFormData(prev => ({ ...prev, current_stock: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Stock
                  </label>
                  <input
                    type="number"
                    value={formData.minimum_stock}
                    onChange={(e) => setFormData(prev => ({ ...prev, minimum_stock: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-600"
                  />
                  <span className="text-sm font-medium text-gray-700">Active</span>
                </label>
              </div>

              {/* Package Calculation Section */}
              {formData.use_auto_calculate && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="text-sm font-medium text-blue-900 mb-3">Package Cost Calculation</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-blue-900 mb-2">
                        Package Size *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          value={formData.package_size}
                          onChange={(e) => setFormData(prev => ({ ...prev, package_size: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 bg-white"
                          placeholder="950"
                          required={formData.use_auto_calculate}
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                          {formData.unit}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-900 mb-2">
                        Package Price *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.package_price}
                        onChange={(e) => setFormData(prev => ({ ...prev, package_price: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 bg-white"
                        placeholder="16700"
                        required={formData.use_auto_calculate}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-900 mb-2">
                        Cost per {formData.unit}
                      </label>
                      <div className="px-3 py-2 bg-green-50 border border-green-300 rounded-lg text-green-800 font-medium">
                        {formData.package_size > 0 && formData.package_price > 0 
                          ? `Rp ${(formData.package_price / formData.package_size).toFixed(2)}`
                          : 'Rp 0.00'
                        }
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-blue-700">
                    <strong>Example:</strong> Susu kemasan 950ml seharga Rp 16,700 = Rp {(16700/950).toFixed(2)} per ml
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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
                    <div className="flex items-center space-x-2">
                      <Save className="h-4 w-4" />
                      <span>{editingIngredient ? 'Update' : 'Create'}</span>
                    </div>
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