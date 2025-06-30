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
    const { quantity, notes } = data;

    // Validate required fields
    if (quantity === undefined || quantity <= 0) {
      return NextResponse.json(
        { error: 'Valid quantity is required' },
        { status: 400 }
      );
    }

    // Get the recipe ingredient with ingredient cost
    const { data: recipeIngredient, error: fetchError } = await supabase
      .from('recipe_ingredients')
      .select(`
        *,
        ingredients!inner(cost_per_unit)
      `)
      .eq('id', id)
      .single();

    if (fetchError || !recipeIngredient) {
      return NextResponse.json(
        { error: 'Recipe ingredient not found' },
        { status: 404 }
      );
    }

    // Calculate new cost
    const newCost = parseFloat(quantity) * recipeIngredient.ingredients.cost_per_unit;

    // Update recipe ingredient
    const { data: updatedRecipeIngredient, error } = await supabase
      .from('recipe_ingredients')
      .update({
        quantity: parseFloat(quantity),
        cost: newCost,
        notes: notes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating recipe ingredient:', error);
      return NextResponse.json(
        { error: 'Failed to update recipe ingredient' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Recipe ingredient updated successfully',
      recipe_ingredient: updatedRecipeIngredient
    });
  } catch (error) {
    console.error('Error in update recipe ingredient API:', error);
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

    // Delete recipe ingredient
    const { error } = await supabase
      .from('recipe_ingredients')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting recipe ingredient:', error);
      return NextResponse.json(
        { error: 'Failed to delete recipe ingredient' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Recipe ingredient deleted successfully'
    });
  } catch (error) {
    console.error('Error in delete recipe ingredient API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 