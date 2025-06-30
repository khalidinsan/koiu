import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PUT(request: NextRequest) {
  try {
    // Extract id from URL
    const id = parseInt(request.url.split('/').pop() || '');
    const data = await request.json();
    const {
      name,
      description,
      unit,
      cost_per_unit,
      supplier,
      category_id,
      minimum_stock,
      current_stock,
      is_active,
      package_size,
      package_price,
      use_auto_calculate
    } = data;

    // Auto calculate cost_per_unit if using package calculation
    let finalCostPerUnit = cost_per_unit;
    if (use_auto_calculate && package_size > 0 && package_price > 0) {
      finalCostPerUnit = package_price / package_size;
    }

    // Validate required fields
    if (!name || !unit || finalCostPerUnit === undefined || !category_id) {
      return NextResponse.json(
        { error: 'Name, unit, cost_per_unit, and category_id are required' },
        { status: 400 }
      );
    }

    // Check if ingredient exists
    const { data: existingIngredient } = await supabase
      .from('ingredients')
      .select('id')
      .eq('id', id)
      .single();

    if (!existingIngredient) {
      return NextResponse.json(
        { error: 'Ingredient not found' },
        { status: 404 }
      );
    }

    // Check if another ingredient with the same name exists (excluding current one)
    const { data: duplicateCheck } = await supabase
      .from('ingredients')
      .select('id')
      .eq('name', name)
      .neq('id', id)
      .single();

    if (duplicateCheck) {
      return NextResponse.json(
        { error: 'Another ingredient with this name already exists' },
        { status: 400 }
      );
    }

    // Record price change in history if cost changed
    const { data: currentIngredient } = await supabase
      .from('ingredients')
      .select('cost_per_unit')
      .eq('id', id)
      .single();

    if (currentIngredient && currentIngredient.cost_per_unit !== parseFloat(finalCostPerUnit.toString())) {
      await supabase
        .from('ingredient_price_history')
        .insert({
          ingredient_id: id,
          old_price: currentIngredient.cost_per_unit,
          new_price: parseFloat(finalCostPerUnit.toString()),
          change_reason: use_auto_calculate 
            ? `Auto-calculated from package: ${package_size}${unit} @ Rp${package_price}`
            : 'Manual update via admin panel',
          changed_by: null // We'll need to implement admin user tracking later
        });
    }

    // Update ingredient
    const { data: updatedIngredient, error } = await supabase
      .from('ingredients')
      .update({
        name,
        description,
        unit,
        cost_per_unit: parseFloat(finalCostPerUnit.toString()),
        supplier,
        category_id: parseInt(category_id),
        minimum_stock: parseInt(minimum_stock) || 0,
        current_stock: parseFloat(current_stock) || 0,
        is_active: is_active !== undefined ? is_active : true,
        package_size: use_auto_calculate ? parseFloat(package_size) || null : null,
        package_price: use_auto_calculate ? parseFloat(package_price) || null : null,
        last_package_update: use_auto_calculate ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating ingredient:', error);
      return NextResponse.json(
        { error: 'Failed to update ingredient' },
        { status: 500 }
      );
    }

    // Trigger recalculation of recipe costs that use this ingredient
    await recalculateRecipeCosts(id);

    return NextResponse.json({
      message: 'Ingredient updated successfully',
      ingredient: updatedIngredient
    });
  } catch (error) {
    console.error('Error in update ingredient API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Extract id from URL
    const id = parseInt(request.url.split('/').pop() || '');

    // Check if ingredient exists
    const { data: existingIngredient } = await supabase
      .from('ingredients')
      .select('id, name')
      .eq('id', id)
      .single();

    if (!existingIngredient) {
      return NextResponse.json(
        { error: 'Ingredient not found' },
        { status: 404 }
      );
    }

    // Check if ingredient is used in any recipes
    const { data: usedInRecipes } = await supabase
      .from('recipe_ingredients')
      .select('recipe_id')
      .eq('ingredient_id', id)
      .limit(1);

    if (usedInRecipes && usedInRecipes.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete ingredient that is used in recipes. Please remove it from all recipes first.' },
        { status: 400 }
      );
    }

    // Delete ingredient
    const { error } = await supabase
      .from('ingredients')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting ingredient:', error);
      return NextResponse.json(
        { error: 'Failed to delete ingredient' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Ingredient deleted successfully'
    });
  } catch (error) {
    console.error('Error in delete ingredient API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to recalculate recipe costs when ingredient price changes
async function recalculateRecipeCosts(ingredientId: number) {
  try {
    // Get all recipes that use this ingredient
    const { data: recipeIngredients } = await supabase
      .from('recipe_ingredients')
      .select(`
        id,
        recipe_id,
        quantity,
        ingredients!inner(cost_per_unit)
      `)
      .eq('ingredient_id', ingredientId);

    if (!recipeIngredients || recipeIngredients.length === 0) {
      return;
    }

    // Update cost for each recipe ingredient
    for (const recipeIngredient of recipeIngredients) {
      // Fix TypeScript error by properly accessing the nested object
      const ingredientData = recipeIngredient.ingredients as any;
      const newCost = recipeIngredient.quantity * ingredientData.cost_per_unit;
      
      await supabase
        .from('recipe_ingredients')
        .update({ cost: newCost })
        .eq('id', recipeIngredient.id);
    }

    // Get unique recipe IDs to update total costs
    const recipeIds = [...new Set(recipeIngredients.map(ri => ri.recipe_id))];

    // Recalculate total cost for each affected recipe
    for (const recipeId of recipeIds) {
      const { data: allIngredients } = await supabase
        .from('recipe_ingredients')
        .select('cost')
        .eq('recipe_id', recipeId);

      if (allIngredients) {
        const totalCost = allIngredients.reduce((sum, ing) => sum + ing.cost, 0);
        
        await supabase
          .from('variant_recipes')
          .update({ estimated_cost: totalCost })
          .eq('id', recipeId);

        // Update coffee variant costs
        const { data: recipe } = await supabase
          .from('variant_recipes')
          .select('variant_id')
          .eq('id', recipeId)
          .single();

        if (recipe) {
          const { data: variant } = await supabase
            .from('coffee_variants')
            .select('price')
            .eq('id', recipe.variant_id)
            .single();

          if (variant) {
            const profitAmount = variant.price - totalCost;
            const profitPercentage = variant.price > 0 ? (profitAmount / variant.price) * 100 : 0;

            await supabase
              .from('coffee_variants')
              .update({
                cost_price: totalCost,
                profit_amount: profitAmount,
                profit_percentage: profitPercentage
              })
              .eq('id', recipe.variant_id);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error recalculating recipe costs:', error);
  }
}