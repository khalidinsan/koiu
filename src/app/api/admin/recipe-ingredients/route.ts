import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { recipe_id, ingredient_id, quantity, notes } = data;

    // Validate required fields
    if (!recipe_id || !ingredient_id || quantity === undefined || quantity <= 0) {
      return NextResponse.json(
        { error: 'recipe_id, ingredient_id, and valid quantity are required' },
        { status: 400 }
      );
    }

    // Check if ingredient already exists in this recipe
    const { data: existingIngredient } = await supabase
      .from('recipe_ingredients')
      .select('id')
      .eq('recipe_id', recipe_id)
      .eq('ingredient_id', ingredient_id)
      .single();

    if (existingIngredient) {
      return NextResponse.json(
        { error: 'This ingredient is already in the recipe. Update the existing one instead.' },
        { status: 400 }
      );
    }

    // Get ingredient cost per unit
    const { data: ingredient, error: ingredientError } = await supabase
      .from('ingredients')
      .select('cost_per_unit')
      .eq('id', ingredient_id)
      .single();

    if (ingredientError || !ingredient) {
      return NextResponse.json(
        { error: 'Ingredient not found' },
        { status: 404 }
      );
    }

    // Calculate cost
    const cost = parseFloat(quantity) * ingredient.cost_per_unit;

    // Add ingredient to recipe
    const { data: newRecipeIngredient, error } = await supabase
      .from('recipe_ingredients')
      .insert({
        recipe_id: parseInt(recipe_id),
        ingredient_id: parseInt(ingredient_id),
        quantity: parseFloat(quantity),
        cost,
        notes: notes || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding ingredient to recipe:', error);
      return NextResponse.json(
        { error: 'Failed to add ingredient to recipe' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Ingredient added to recipe successfully',
      recipe_ingredient: newRecipeIngredient
    });
  } catch (error) {
    console.error('Error in add recipe ingredient API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 