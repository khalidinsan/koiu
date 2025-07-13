import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

// Helper function to verify admin session
async function verifyAdminSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('admin_session');
  
  if (!sessionToken) {
    return null;
  }

  try {
    const decoded = Buffer.from(sessionToken.value, 'base64').toString();
    const [adminId] = decoded.split(':');
    return parseInt(adminId);
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const adminId = await verifyAdminSession();
    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get admin profile
    const { data: admin, error } = await supabase
      .from('admin_users')
      .select('id, email, created_at, updated_at')
      .eq('id', adminId)
      .single();

    if (error || !admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // Return profile data (excluding password)
    const profile = {
      id: admin.id,
      email: admin.email,
      name: 'Admin',
      created_at: admin.created_at,
      updated_at: admin.updated_at
    };

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const adminId = await verifyAdminSession();
    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, currentPassword } = body;

    // Get current admin data to verify password
    const { data: admin, error: fetchError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', adminId)
      .single();

    if (fetchError || !admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, admin.password_hash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    if (action === 'update_email') {
      const { email } = body;

      if (!email || !email.includes('@')) {
        return NextResponse.json(
          { error: 'Please provide a valid email address' },
          { status: 400 }
        );
      }

      // Check if email is already taken by another admin
      const { data: existingAdmin } = await supabase
        .from('admin_users')
        .select('id')
        .eq('email', email)
        .neq('id', adminId)
        .single();

      if (existingAdmin) {
        return NextResponse.json(
          { error: 'Email address is already in use' },
          { status: 400 }
        );
      }

      // Update email
      const { error } = await supabase
        .from('admin_users')
        .update({ 
          email,
          updated_at: new Date().toISOString()
        })
        .eq('id', adminId);

      if (error) {
        console.error('Email update error:', error);
        return NextResponse.json(
          { error: 'Failed to update email' },
          { status: 500 }
        );
      }

      return NextResponse.json({ message: 'Email updated successfully' });

    } else if (action === 'update_password') {
      const { newPassword } = body;

      if (!newPassword || newPassword.length < 8) {
        return NextResponse.json(
          { error: 'New password must be at least 8 characters long' },
          { status: 400 }
        );
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update password
      const { error } = await supabase
        .from('admin_users')
        .update({ 
          password_hash: hashedPassword,
          updated_at: new Date().toISOString()
        })
        .eq('id', adminId);

      if (error) {
        console.error('Password update error:', error);
        return NextResponse.json(
          { error: 'Failed to update password' },
          { status: 500 }
        );
      }

      return NextResponse.json({ message: 'Password updated successfully' });

    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 