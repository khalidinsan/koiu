# KOIU Coffee - Setup Instructions

## Supabase Database Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note down your project URL and API keys

### 2. Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

Replace the values with your actual Supabase project credentials.

### 3. Database Schema

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase-schema.sql` file
4. Run the SQL script to create all necessary tables and initial data

This will create:
- `config` table for store configuration
- `coffees` table for coffee products
- `coffee_variants` table for different sizes/prices with availability tracking
- `admin_users` table for admin authentication
- Sample data for testing

### 4. Initialize Admin User

After setting up the database, you need to create the admin user:

1. Start your development server: `npm run dev`
2. Make a POST request to `/api/admin/init` to create the default admin user
3. You can use curl or any API client:

```bash
curl -X POST http://localhost:3000/api/admin/init
```

This will create an admin user with:
- Email: `admin@koiucoffee.com`
- Password: `admin123456`

**Important: Change these credentials after first login!**

## Key Features Implemented

### 1. Availability-Based Product Management
- Each coffee variant has availability status (Available/Unavailable)
- No complex stock tracking - simple binary availability system
- Admin can toggle availability per variant with one click
- Real-time availability status display throughout the system

### 2. Supabase Database Integration
- All data now stored in Supabase PostgreSQL database
- Real-time data synchronization
- Secure API endpoints with authentication
- Automatic data backup and recovery

### 3. WhatsApp Integration
- Direct WhatsApp ordering through configured admin number
- Automatic order message formatting
- Customer pickup location sharing
- Seamless mobile ordering experience

### 4. Modern UI/UX Design
- **Pill-Based Variant Selection**: User-friendly pill buttons instead of dropdowns
- **Solid Modal Backgrounds**: Full black modal backdrops for better focus
- **Proper Text Contrast**: Fixed white text input issues for better visibility
- **Best Seller Labels**: Clear "Best Seller" badges (not just "Best")
- Mobile-first responsive design
- Smooth animations and transitions
- Professional color scheme with blue theme

## Admin Panel Features

### 1. Product Management
- **Add Products**: Complete product creation with variants
- **Edit Products**: Modify existing products and their variants
- **Delete Products**: Remove products with confirmation
- **Variant Management**: Add/remove variants with size, price, and availability
- **Image Management**: URL-based image system
- **Category Management**: Organize products by categories
- **Best Seller Marking**: Highlight popular products

### 2. Availability Control
- **Quick Toggle**: One-click availability switching per variant
- **Bulk Operations**: Manage multiple variants efficiently
- **Real-time Updates**: Instant reflection across all interfaces
- **Status Indicators**: Clear visual feedback for availability states

### 3. Profile & Account Management
- **Admin Profile**: View account information and creation date
- **Password Management**: Secure password change functionality
- **Password Visibility Toggles**: Enhanced security with show/hide options
- **Session Management**: Secure login/logout with 24-hour sessions

### 4. Store Configuration Management
- **Store Information**: Manage store name and currency settings
- **Contact Details**: Configure admin WhatsApp number for orders
- **Pickup Location**: Set complete address, GPS coordinates, and Google Maps link
- **Real-time Updates**: Changes reflect immediately across the website
- **Validation**: Built-in validation for phone numbers, coordinates, and URLs

#### Configuration Features:
- **Store Name**: Customize business name display
- **Currency Symbol**: Set local currency (e.g., Rp for Indonesian Rupiah)
- **WhatsApp Integration**: Configure admin contact for order processing
- **Location Management**: Complete pickup address with GPS coordinates
- **Maps Integration**: Direct Google Maps link for customer navigation

#### Security Features:
- Session-based authentication with 24-hour expiration
- Password visibility toggles for security
- Confirmation dialogs for destructive actions
- Real-time form validation and error handling

## API Endpoints

### Public Endpoints:
- `GET /api/coffees` - Fetch all coffee products with variants and availability

### Admin Endpoints (Authentication Required):
- `POST /api/admin/login` - Admin login
- `POST /api/admin/logout` - Admin logout
- `GET /api/admin/profile` - Fetch admin profile
- `PUT /api/admin/profile` - Update admin password
- `GET /api/admin/products` - Fetch products for admin
- `POST /api/admin/products` - Create new product
- `PUT /api/admin/products` - Update existing product
- `DELETE /api/admin/products` - Delete product
- `PUT /api/admin/stock` - Update variant availability
- `POST /api/admin/stock` - Bulk update availability
- `GET /api/admin/config` - Fetch store configuration
- `PUT /api/admin/config` - Update store configuration

## Database Schema Overview

### Tables:
1. **config** - Store configuration (WhatsApp, address, currency, etc.)
2. **coffees** - Coffee products (name, description, image, category)
3. **coffee_variants** - Product variants with individual availability tracking
4. **admin_users** - Admin authentication

### Key Changes from JSON:
- Availability is now tracked per variant instead of complex stock management
- Each variant has simple `available` boolean field
- Product availability is determined by having at least one variant available
- Real-time availability updates through admin panel
- Complete CRUD operations for product management
- Configuration management for store settings

## User Interface Improvements

### 1. Variant Selection
- **Pill Interface**: Modern pill-based variant selection instead of dropdowns
- **Visual Feedback**: Clear indication of selected variants
- **Availability Status**: Disabled state for unavailable variants
- **Responsive Design**: Works seamlessly on mobile and desktop

### 2. Modal System
- **Solid Backgrounds**: Full black modal backdrops for better focus
- **Proper Contrast**: Fixed white text input visibility issues
- **Smooth Animations**: Professional modal transitions
- **Mobile Optimized**: Touch-friendly interface design

### 3. Admin Dashboard
- **Real-time Stats**: Live availability and product counts
- **Quick Actions**: One-click availability toggles
- **Professional Design**: Clean, modern administrative interface
- **Intuitive Navigation**: Easy access to all management features

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Production Deployment

1. Set up environment variables in your hosting platform
2. Ensure Supabase database is properly configured
3. Run the admin initialization endpoint once after deployment
4. Configure store settings through the admin config panel
5. Test all functionality including WhatsApp integration

## Configuration Management

After deployment, access the admin panel to configure:

1. **Store Information**: Update store name and currency
2. **Contact Details**: Set WhatsApp number for order processing
3. **Pickup Location**: Configure complete address and GPS coordinates
4. **Maps Integration**: Add Google Maps link for customer navigation

All configuration changes take effect immediately across the website. 