# Orders Management - Recipe & Receipt Features

## Overview
Enhanced the orders management page with recipe viewing per item and downloadable receipt functionality.

## New Features

### 1. Recipe Viewing Per Item
- **Location**: Available in Order Details modal for each item
- **Icon**: Chef Hat (ChefHat) button next to each order item
- **Functionality**: 
  - Shows complete recipe details for each coffee variant
  - Displays serving size and production cost
  - Lists all ingredients with quantities and costs
  - Shows recipe description and notes

### 2. Receipt Generation
- **Location**: Available in main table actions and order details modal
- **Icon**: Receipt button in actions column
- **Features**:
  - **Print Receipt**: Direct printing with optimized 80mm thermal printer format
  - **Download as Image**: PNG format download using html2canvas
  - **Download as PDF**: PDF format download using jsPDF
  - **Professional Layout**: Styled like a real cafe receipt

### 3. Access Points

#### Main Table
- **Recipe Button**: In order details modal → each item has a chef hat icon
- **Receipt Button**: New green receipt icon in actions column

#### Order Details Modal
- **Recipe Access**: Chef hat button next to each item
- **Receipt Access**: Receipt button in modal header

## Technical Implementation

### Dependencies Added
```bash
npm install html2canvas jspdf react-to-print @types/html2canvas
```

### Key Components
1. **Recipe Modal**: Shows detailed recipe information
2. **Receipt Modal**: Professional receipt layout with export options
3. **Enhanced Actions**: Added recipe and receipt buttons

### Features Details

#### Recipe Modal
- Recipe name and description
- Serving size (ml)
- Production cost calculation
- Complete ingredients list with:
  - Ingredient names
  - Quantities and units
  - Individual costs
  - Optional notes

#### Receipt Layout
- Company header (KOIU COFFEE)
- Order information (number, date, customer)
- Payment and pickup details
- Itemized order details
- Total amount
- Customer notes (if any)
- Professional footer with status

#### Export Options
1. **Print**: Optimized for 80mm thermal printers
2. **Image (PNG)**: High-resolution download
3. **PDF**: Portable document format

## User Experience

### Recipe Viewing Workflow
1. Click order in table → View Details
2. Find desired item → Click chef hat icon
3. View complete recipe with costs and ingredients
4. Close modal when done

### Receipt Generation Workflow
1. Click receipt icon in table actions OR order details header
2. Preview receipt in modal
3. Choose export option:
   - **Blue Image Icon**: Download as PNG
   - **Red Download Icon**: Download as PDF  
   - **Green Printer Icon**: Print directly
4. Files saved with format: `receipt-{order_number}.{extension}`

## Benefits
- **Cost Analysis**: View exact production costs per order
- **Recipe Transparency**: Complete ingredient breakdown
- **Professional Receipts**: Customer-ready printable receipts
- **Multiple Formats**: Choose preferred export format
- **Efficient Workflow**: Quick access from order management

## Future Enhancements
- Bulk receipt printing
- Recipe cost optimization suggestions
- Customer receipt email sending
- Custom receipt templates 