import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data: categories, error } = await supabase
      .from('ingredient_categories')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching ingredient categories:', error);
      return NextResponse.json(
        { error: 'Failed to fetch categories' },
        { status: 500 }
      );
    }

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error in ingredient categories API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { name, description, color } = data;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Check if category name already exists
    const { data: existingCategory } = await supabase
      .from('ingredient_categories')
      .select('id')
      .eq('name', name)
      .single();

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category with this name already exists' },
        { status: 400 }
      );
    }

    // Create new category
    const { data: newCategory, error } = await supabase
      .from('ingredient_categories')
      .insert({
        name,
        description,
        color: color || '#6B7280'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating ingredient category:', error);
      return NextResponse.json(
        { error: 'Failed to create category' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        message: 'Category created successfully',
        category: newCategory
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in create ingredient category API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 