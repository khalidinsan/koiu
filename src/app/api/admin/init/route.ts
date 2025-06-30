import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST() {
  try {
    // Check if admin already exists
    const { data: existingAdmin } = await supabase
      .from('admin_users')
      .select('id')
      .limit(1);

    if (existingAdmin && existingAdmin.length > 0) {
      return NextResponse.json({ 
        error: 'Admin user already exists' 
      }, { status: 400 });
    }

    // Create default admin user
    const defaultEmail = 'admin@koiucoffee.com';
    const defaultPassword = 'admin123456';
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);

    const { error } = await supabase
      .from('admin_users')
      .insert({
        email: defaultEmail,
        password_hash: hashedPassword
      });

    if (error) {
      console.error('Error creating admin user:', error);
      return NextResponse.json({ 
        error: 'Failed to create admin user' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Admin user created successfully',
      credentials: {
        email: defaultEmail,
        password: defaultPassword
      }
    });
  } catch (error) {
    console.error('Init admin error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 