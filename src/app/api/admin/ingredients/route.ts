import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data: ingredients, error } = await supabase
      .from('ingredients')
      .select(`
        *,
        ingredient_categories!inner(
          id,
          name,
          color
        )
      `)
      .order('name');

    if (error) {
      console.error('Error fetching ingredients:', error);
      return NextResponse.json(
        { error: 'Failed to fetch ingredients' },
        { status: 500 }
      );
    }

    // Transform data to flatten category info
    const transformedIngredients = ingredients?.map(ingredient => ({
      ...ingredient,
      category_name: ingredient.ingredient_categories.name,
      category_color: ingredient.ingredient_categories.color,
      ingredient_categories: undefined
    })) || [];

    return NextResponse.json({ ingredients: transformedIngredients });
  } catch (error) {
    console.error('Error in ingredients API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
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

    // Check if ingredient name already exists
    const { data: existingIngredient } = await supabase
      .from('ingredients')
      .select('id')
      .eq('name', name)
      .single();

    if (existingIngredient) {
      return NextResponse.json(
        { error: 'Ingredient with this name already exists' },
        { status: 400 }
      );
    }

    // Create new ingredient
    const { data: newIngredient, error } = await supabase
      .from('ingredients')
      .insert({
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
        last_package_update: use_auto_calculate ? new Date().toISOString() : null
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating ingredient:', error);
      return NextResponse.json(
        { error: 'Failed to create ingredient' },
        { status: 500 }
      );
    }

    // Log initial price if created with auto-calculation
    if (use_auto_calculate && package_size > 0 && package_price > 0) {
      await supabase
        .from('ingredient_price_history')
        .insert({
          ingredient_id: newIngredient.id,
          old_price: 0,
          new_price: parseFloat(finalCostPerUnit.toString()),
          change_reason: `Initial price auto-calculated from package: ${package_size}${unit} @ Rp${package_price}`,
          changed_by: null
        });
    }

    return NextResponse.json(
      { 
        message: 'Ingredient created successfully',
        ingredient: newIngredient
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in create ingredient API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 