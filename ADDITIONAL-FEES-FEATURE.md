# Additional Fees Feature for KOIU Coffee Orders

This feature adds support for custom additional fees (like delivery charges, service fees, etc.) to manual orders created through the admin panel.

## Overview

The additional fees feature allows admin users to add multiple custom fees to manual orders, such as:
- Delivery fees
- Service charges  
- Packaging fees
- Any other custom charges

These fees will appear on the receipt and are included in the total order amount.

## Database Changes

A new table `order_additional_fees` has been added to store the additional fees:

```sql
CREATE TABLE order_additional_fees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  fee_name VARCHAR(100) NOT NULL,
  fee_amount INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Setup Instructions

1. **Run Database Migration**: 
   - Go to your Supabase dashboard
   - Navigate to SQL Editor
   - Copy and run the contents of `migration-additional-fees.sql`

2. **Verify Installation**:
   - The build should complete successfully (already tested)
   - The additional fees section will appear in manual order creation

## Features Implemented

### 1. Manual Order Creation with Additional Fees

When creating a manual order through the admin panel:

- **Add Fee Button**: Click "Add Fee" to add a new additional fee
- **Fee Name Input**: Enter descriptive name (e.g., "Delivery Fee", "Service Charge")
- **Fee Amount Input**: Enter the fee amount in Rupiah
- **Multiple Fees**: Add as many fees as needed
- **Remove Fees**: Delete individual fees with the trash icon
- **Auto-calculation**: Total automatically updates to include all fees

### 2. Order Display Enhancements

**Order Details Modal**:
- Shows separate "Additional Fees" section if fees exist
- Displays fee breakdown with individual fee names and amounts
- Shows subtotal calculation:
  - Items Subtotal
  - Additional Fees Total  
  - Grand Total

**Orders Table**:
- Total amount includes all additional fees
- No separate display needed in table view

### 3. Receipt Integration

**Professional Receipt Layout**:
- Additional fees section appears after items
- Each fee listed with name and amount
- Clear breakdown showing:
  - Items Subtotal
  - Additional Fees
  - Final Total
- Maintains thermal printer compatibility (80mm)

### 4. API Enhancements

**Updated Endpoints**:
- `GET /api/admin/orders` - Returns orders with additional fees
- `POST /api/admin/orders` - Accepts additional fees in manual order creation

**Request Format**:
```json
{
  "customerName": "John Doe",
  "customerPhone": "+62123456789", 
  "items": [...],
  "additionalFees": [
    {
      "feeName": "Delivery Fee",
      "feeAmount": 5000
    },
    {
      "feeName": "Service Charge", 
      "feeAmount": 2000
    }
  ],
  "totalAmount": 57000,
  "paymentMethod": "cash"
}
```

## User Interface

### Manual Order Form

1. **Customer Information** (unchanged)
2. **Order Details** (unchanged) 
3. **Order Items** (unchanged)
4. **Additional Fees** (NEW):
   - "Add Fee" button to add new fees
   - Fee name and amount inputs for each fee
   - Delete button for each fee
   - Real-time total calculation
5. **Summary**:
   - Items subtotal
   - Additional fees total
   - Grand total

### Receipt Format

```
KOIU COFFEE
Jl. Pendopo No.17, Sumedang Utara
Sumedang, Jawa Barat
+62 822 1730 1554
================================

Order: #20241215-001
Date: 15 Dec 2024, 14:30
Customer: John Doe
Phone: +62123456789
Payment: Cash

================================

Cafe Latte
250ml           1 x Rp 13,000
                        Rp 13,000

Palm Sugar  
250ml           2 x Rp 13,000
                        Rp 26,000

================================

Delivery Fee:           Rp 5,000
Service Charge:         Rp 2,000

================================

Items Subtotal:        Rp 39,000
Additional Fees:        Rp 7,000

TOTAL:                 Rp 46,000

================================

Thank you for your order!
Follow us @koiucoffee
Status: Confirmed
```

## Technical Details

### TypeScript Interfaces

```typescript
interface AdditionalFee {
  id: string;
  fee_name: string;
  fee_amount: number;
}

interface ManualAdditionalFee {
  feeName: string;
  feeAmount: number;
}

interface Order {
  // ... existing fields
  order_additional_fees?: AdditionalFee[];
}
```

### Key Functions

- `addAdditionalFee()` - Add new fee to form
- `removeAdditionalFee(index)` - Remove fee from form  
- `updateAdditionalFee(index, field, value)` - Update fee field
- Total calculation includes fees in all displays

## Usage Example

1. **Create Manual Order**:
   - Go to Admin > Orders
   - Click "Add Manual Order"
   - Fill customer information
   - Add order items
   - Click "Add Fee" in Additional Fees section
   - Enter "Delivery Fee" and amount "5000"
   - Add another fee if needed
   - Submit order

2. **View Order**:
   - Additional fees appear in order details
   - Receipt shows complete breakdown
   - Total includes all fees

3. **Customer Receipt**:
   - Download as PNG/PDF or print
   - Shows professional layout with fee breakdown
   - Customer can see exactly what they're paying for

## Benefits

- **Transparency**: Clear fee breakdown for customers
- **Flexibility**: Support any type of additional charge
- **Professional**: Properly formatted receipts
- **Easy Management**: Simple admin interface
- **Accurate Totals**: Automatic calculation prevents errors

## Limitations

- Additional fees only available for manual orders (not customer-created orders)
- Fees are added at order creation time (not editable after creation)
- No pre-defined fee templates (must be entered manually each time)

## Future Enhancements

Potential improvements for future versions:
- Fee templates for common charges
- Percentage-based fees (e.g., 10% service charge)
- Edit fees after order creation
- Customer-visible fee options during online ordering
- Automatic delivery fee calculation based on distance 