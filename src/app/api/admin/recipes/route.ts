import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { variant_id, name, description, serving_size } = data;

    // Validate required fields
    if (!variant_id || !name || !serving_size) {
      return NextResponse.json(
        { error: 'variant_id, name, and serving_size are required' },
        { status: 400 }
      );
    }

    // Check if recipe already exists for this variant
    const { data: existingRecipe } = await supabase
      .from('variant_recipes')
      .select('id')
      .eq('variant_id', variant_id)
      .single();

    if (existingRecipe) {
      return NextResponse.json(
        { error: 'Recipe already exists for this variant. Use PUT to update.' },
        { status: 400 }
      );
    }

    // Create new recipe
    const { data: newRecipe, error } = await supabase
      .from('variant_recipes')
      .insert({
        variant_id,
        name,
        description,
        serving_size: parseFloat(serving_size),
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating recipe:', error);
      return NextResponse.json(
        { error: 'Failed to create recipe' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Recipe created successfully',
      recipe: newRecipe
    });
  } catch (error) {
    console.error('Error in create recipe API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { id, variant_id, name, description, serving_size } = data;

    // Validate required fields
    if (!id || !variant_id || !name || !serving_size) {
      return NextResponse.json(
        { error: 'id, variant_id, name, and serving_size are required' },
        { status: 400 }
      );
    }

    // Update recipe
    const { data: updatedRecipe, error } = await supabase
      .from('variant_recipes')
      .update({
        variant_id,
        name,
        description,
        serving_size: parseFloat(serving_size),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating recipe:', error);
      return NextResponse.json(
        { error: 'Failed to update recipe' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Recipe updated successfully',
      recipe: updatedRecipe
    });
  } catch (error) {
    console.error('Error in update recipe API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 