import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Extract variantId from URL
    const variantId = request.url.split('/').pop() || '';

    // Get variant data with coffee name
    const { data: variant, error: variantError } = await supabase
      .from('coffee_variants')
      .select(`
        *,
        coffees!inner(name)
      `)
      .eq('id', variantId)
      .single();

    if (variantError || !variant) {
      return NextResponse.json(
        { error: 'Variant not found' },
        { status: 404 }
      );
    }

    // Transform variant data
    const variantData = {
      ...variant,
      coffee_name: variant.coffees.name,
      coffees: undefined
    };

    // Get recipe data with ingredients
    const { data: recipe, error: recipeError } = await supabase
      .from('variant_recipes')
      .select(`
        *,
        recipe_ingredients!inner(
          id,
          ingredient_id,
          quantity,
          cost,
          notes,
          ingredients!inner(
            name,
            unit,
            cost_per_unit
          )
        )
      `)
      .eq('variant_id', variantId)
      .single();

    let recipeData = null;
    if (recipe && !recipeError) {
      // Transform recipe ingredients data
      const transformedIngredients = recipe.recipe_ingredients.map((ri: any) => ({
        id: ri.id,
        ingredient_id: ri.ingredient_id,
        ingredient_name: ri.ingredients.name,
        ingredient_unit: ri.ingredients.unit,
        ingredient_cost_per_unit: ri.ingredients.cost_per_unit,
        quantity: ri.quantity,
        cost: ri.cost,
        notes: ri.notes
      }));

      recipeData = {
        ...recipe,
        ingredients: transformedIngredients,
        recipe_ingredients: undefined
      };
    }

    return NextResponse.json({
      variant: variantData,
      recipe: recipeData
    });
  } catch (error) {
    console.error('Error fetching variant data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 