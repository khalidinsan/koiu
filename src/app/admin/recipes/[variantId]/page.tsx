'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  X,
  ArrowLeft,
  Calculator,
  Package,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  ChefHat
} from 'lucide-react';

interface Ingredient {
  id: number;
  name: string;
  description: string;
  unit: string;
  cost_per_unit: number;
  category_name: string;
  category_color: string;
  current_stock: number;
  minimum_stock: number;
}

interface RecipeIngredient {
  id: number;
  ingredient_id: number;
  ingredient_name: string;
  ingredient_unit: string;
  ingredient_cost_per_unit: number;
  quantity: number;
  cost: number;
  notes?: string;
}

interface Recipe {
  id: number;
  variant_id: string;
  name: string;
  description: string;
  serving_size: number;
  estimated_cost: number;
  profit_margin: number;
  is_active: boolean;
  ingredients: RecipeIngredient[];
}

interface CoffeeVariant {
  id: string;
  coffee_id: number;
  size: string;
  price: number;
  cost_price: number;
  profit_amount: number;
  profit_percentage: number;
  coffee_name: string;
}

export default function RecipeManagementPage() {
  const router = useRouter();
  const params = useParams();
  const variantId = params.variantId as string;

  const [variant, setVariant] = useState<CoffeeVariant | null>(null);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddIngredient, setShowAddIngredient] = useState(false);

  // Form states
  const [selectedIngredientId, setSelectedIngredientId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    fetchVariantData();
    fetchIngredients();
  }, [variantId]);

  const fetchVariantData = async () => {
    try {
      const response = await fetch(`/api/admin/variants/${variantId}`);
      if (response.ok) {
        const data = await response.json();
        setVariant(data.variant);
        setRecipe(data.recipe);
      }
    } catch (error) {
      console.error('Error fetching variant data:', error);
      setError('Failed to load variant data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchIngredients = async () => {
    try {
      const response = await fetch('/api/admin/ingredients');
      if (response.ok) {
        const data = await response.json();
        setIngredients(data.ingredients || []);
      }
    } catch (error) {
      console.error('Error fetching ingredients:', error);
    }
  };

  const createOrUpdateRecipe = async () => {
    if (!variant) return;

    const recipeData = {
      variant_id: variantId,
      name: `${variant.coffee_name} ${variant.size} Recipe`,
      description: `Recipe for ${variant.coffee_name} - ${variant.size}`,
      serving_size: parseFloat(variant.size.replace(/[^\d.]/g, '')) || 250
    };

    try {
      const response = await fetch('/api/admin/recipes', {
        method: recipe ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recipe ? { ...recipeData, id: recipe.id } : recipeData)
      });

      if (response.ok) {
        const data = await response.json();
        setRecipe(data.recipe);
        return data.recipe;
      }
    } catch (error) {
      console.error('Error creating/updating recipe:', error);
      setError('Failed to save recipe');
    }
    return null;
  };

  const handleAddIngredient = async () => {
    if (!selectedIngredientId || quantity <= 0) {
      setError('Please select an ingredient and enter a valid quantity');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Create recipe if it doesn't exist
      let currentRecipe = recipe;
      if (!currentRecipe) {
        currentRecipe = await createOrUpdateRecipe();
        if (!currentRecipe) {
          setError('Failed to create recipe');
          setIsSubmitting(false);
          return;
        }
      }

      const response = await fetch('/api/admin/recipe-ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipe_id: currentRecipe.id,
          ingredient_id: selectedIngredientId,
          quantity,
          notes
        })
      });

      if (response.ok) {
        setSuccess('Ingredient added successfully!');
        setSelectedIngredientId(null);
        setQuantity(0);
        setNotes('');
        setShowAddIngredient(false);
        fetchVariantData(); // Refresh data
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to add ingredient');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateIngredient = async (recipeIngredientId: number, newQuantity: number, newNotes: string) => {
    try {
      const response = await fetch(`/api/admin/recipe-ingredients/${recipeIngredientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQuantity, notes: newNotes })
      });

      if (response.ok) {
        setSuccess('Ingredient updated successfully!');
        setEditingId(null);
        fetchVariantData();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update ingredient');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    }
  };

  const handleDeleteIngredient = async (recipeIngredientId: number) => {
    if (!confirm('Are you sure you want to remove this ingredient?')) return;

    try {
      const response = await fetch(`/api/admin/recipe-ingredients/${recipeIngredientId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setSuccess('Ingredient removed successfully!');
        fetchVariantData();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to remove ingredient');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    }
  };

  const formatPrice = (price: number) => {
    return `Rp ${price.toLocaleString('id-ID')}`;
  };

  const getSelectedIngredient = () => {
    return ingredients.find(ing => ing.id === selectedIngredientId);
  };

  const calculatePreviewCost = () => {
    const ingredient = getSelectedIngredient();
    if (!ingredient || quantity <= 0) return 0;
    return ingredient.cost_per_unit * quantity;
  };

  const getProfitColor = (percentage: number) => {
    if (percentage < 0) return 'text-red-600 bg-red-50';
    if (percentage < 10) return 'text-orange-600 bg-orange-50';
    if (percentage < 20) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading recipe data...</p>
        </div>
      </div>
    );
  }

  if (!variant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">Variant not found</p>
          <button
            onClick={() => router.push('/admin/products')}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout title={`Recipe: ${variant.coffee_name} - ${variant.size}`}>
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

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-4 mb-4">
          <button
            onClick={() => router.push('/admin/products')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Products</span>
          </button>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center space-x-2">
                <ChefHat className="h-6 w-6 text-primary-600" />
                <span>{variant.coffee_name} - {variant.size}</span>
              </h1>
              <p className="text-gray-600 mt-1">Recipe Management & HPP Calculation</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-800">{formatPrice(variant.price)}</div>
              <div className="text-sm text-gray-500">Selling Price</div>
            </div>
          </div>
        </div>
      </div>

      {/* Cost Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">HPP (Cost Price)</p>
              <p className="text-2xl font-bold text-gray-800">
                {variant.cost_price ? formatPrice(variant.cost_price) : 'Rp 0'}
              </p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <Calculator className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Profit Amount</p>
              <p className="text-2xl font-bold text-gray-800">
                {variant.profit_amount ? formatPrice(variant.profit_amount) : 'Rp 0'}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Profit Margin</p>
              <p className={`text-2xl font-bold ${variant.profit_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {variant.profit_percentage ? `${variant.profit_percentage.toFixed(1)}%` : '0%'}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${variant.profit_percentage >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              {variant.profit_percentage >= 0 ? (
                <TrendingUp className="h-6 w-6 text-green-600" />
              ) : (
                <TrendingDown className="h-6 w-6 text-red-600" />
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ingredients Count</p>
              <p className="text-2xl font-bold text-gray-800">
                {recipe?.ingredients?.length || 0}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recipe Ingredients */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">Recipe Ingredients</h2>
            <button
              onClick={() => setShowAddIngredient(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Ingredient</span>
            </button>
          </div>
        </div>

        {recipe?.ingredients && recipe.ingredients.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ingredient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recipe.ingredients.map((recipeIngredient) => (
                  <tr key={recipeIngredient.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {recipeIngredient.ingredient_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === recipeIngredient.id ? (
                        <input
                          type="number"
                          step="0.01"
                          defaultValue={recipeIngredient.quantity}
                          className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                          onBlur={(e) => {
                            const newQuantity = parseFloat(e.target.value) || 0;
                            const notesInput = e.target.parentElement?.parentElement?.querySelector('textarea') as HTMLTextAreaElement;
                            const newNotes = notesInput?.value || '';
                            handleUpdateIngredient(recipeIngredient.id, newQuantity, newNotes);
                          }}
                        />
                      ) : (
                        <div className="text-sm text-gray-900">
                          {recipeIngredient.quantity} {recipeIngredient.ingredient_unit}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatPrice(recipeIngredient.ingredient_cost_per_unit)}
                      </div>
                      <div className="text-xs text-gray-500">
                        per {recipeIngredient.ingredient_unit}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatPrice(recipeIngredient.cost)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {editingId === recipeIngredient.id ? (
                        <textarea
                          defaultValue={recipeIngredient.notes || ''}
                          className="w-32 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                          rows={2}
                        />
                      ) : (
                        <div className="text-sm text-gray-500 max-w-32 truncate">
                          {recipeIngredient.notes || '-'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        {editingId === recipeIngredient.id ? (
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-green-600 hover:text-green-900"
                            title="Save Changes"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => setEditingId(recipeIngredient.id)}
                            className="text-primary-600 hover:text-primary-900"
                            title="Edit Ingredient"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteIngredient(recipeIngredient.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Remove Ingredient"
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
        ) : (
          <div className="p-12 text-center">
            <ChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No ingredients yet</h3>
            <p className="text-gray-500 mb-4">Start building your recipe by adding ingredients</p>
            <button
              onClick={() => setShowAddIngredient(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Add First Ingredient
            </button>
          </div>
        )}
      </div>

      {/* Add Ingredient Modal */}
      {showAddIngredient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">Add Ingredient to Recipe</h2>
                <button
                  onClick={() => setShowAddIngredient(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Ingredient *
                </label>
                <select
                  value={selectedIngredientId || ''}
                  onChange={(e) => setSelectedIngredientId(parseInt(e.target.value) || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900 bg-white"
                  required
                >
                  <option value="">Choose an ingredient...</option>
                  {ingredients.map(ingredient => (
                    <option key={ingredient.id} value={ingredient.id}>
                      {ingredient.name} ({formatPrice(ingredient.cost_per_unit)}/{ingredient.unit})
                    </option>
                  ))}
                </select>
              </div>

              {selectedIngredientId && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Ingredient Details</h4>
                  <div className="text-sm text-blue-800">
                    <p><strong>Cost per unit:</strong> {formatPrice(getSelectedIngredient()?.cost_per_unit || 0)} per {getSelectedIngredient()?.unit}</p>
                    <p><strong>Stock:</strong> {getSelectedIngredient()?.current_stock} {getSelectedIngredient()?.unit}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={quantity}
                    onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900 bg-white"
                    placeholder="0.00"
                    required
                  />
                  {selectedIngredientId && (
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                      {getSelectedIngredient()?.unit}
                    </span>
                  )}
                </div>
              </div>

              {selectedIngredientId && quantity > 0 && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="text-sm font-medium text-green-900 mb-2">Cost Preview</h4>
                  <div className="text-lg font-bold text-green-800">
                    {formatPrice(calculatePreviewCost())}
                  </div>
                  <div className="text-sm text-green-700">
                    {quantity} {getSelectedIngredient()?.unit} × {formatPrice(getSelectedIngredient()?.cost_per_unit || 0)}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900 bg-white"
                  rows={3}
                  placeholder="Special preparation notes..."
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowAddIngredient(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddIngredient}
                  disabled={!selectedIngredientId || quantity <= 0 || isSubmitting}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Adding...</span>
                    </div>
                  ) : (
                    'Add Ingredient'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
} 