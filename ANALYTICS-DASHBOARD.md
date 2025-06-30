# Analytics Dashboard - KOIU Coffee

Dashboard analytics yang canggih untuk memantau performa bisnis dan profitabilitas KOIU Coffee secara real-time.

## Fitur Utama

### 1. Filter Date Range
- **Quick Date Buttons**: 7D, 30D, 90D untuk filter cepat
- **Custom Date Picker**: Pilih rentang tanggal kustom
- **Period Selector**: Tampilkan data per hari, bulan, atau tahun

### 2. Key Metrics Cards
Menampilkan 4 metrik utama:

#### Total Revenue
- Total pendapatan dalam periode yang dipilih
- Growth indicator vs kemarin (naik/turun)
- Icon: Dollar Sign (hijau)

#### Total Profit
- Total keuntungan setelah dikurangi biaya produksi
- Profit margin dalam persentase
- Icon: Target (biru)

#### Total Orders
- Jumlah total pesanan yang completed
- Jumlah pesanan hari ini
- Icon: Shopping Bag (ungu)

#### Average Order Value
- Rata-rata nilai pesanan
- Total biaya produksi
- Icon: Bar Chart (orange)

### 3. Charts & Visualizations

#### Revenue & Profit Trend Chart
- Line chart menggunakan Recharts
- Menampilkan tren pendapatan dan keuntungan
- Responsive dan interactive
- Format data berdasarkan periode (hari/bulan/tahun)

#### Orders Volume Chart
- Bar chart volume pesanan
- Menampilkan jumlah pesanan per periode
- Interactive tooltip

### 4. Analysis Tables

#### Product Profitability
- Daftar 10 produk teratas berdasarkan profitabilitas
- Status indicator:
  - **Excellent** (>30%): Hijau
  - **Good** (20-30%): Biru  
  - **Average** (10-20%): Kuning
  - **Poor** (0-10%): Orange
  - **Loss** (<0%): Merah
- Menampilkan harga jual, cost price, profit amount, dan persentase

#### Top Selling Products
- 10 produk terlaris berdasarkan revenue
- Ranking dengan color-coded numbers
- Quantity sold dan total revenue

### 5. Quick Actions
Akses cepat ke halaman admin:
- Manage Products
- View Orders  
- Ingredients
- Settings

## API Endpoint

### GET `/api/admin/analytics`

**Query Parameters:**
- `startDate` (optional): Format YYYY-MM-DD
- `endDate` (optional): Format YYYY-MM-DD  
- `period` (optional): 'daily' | 'monthly' | 'yearly'

**Response Structure:**
```json
{
  "summary": {
    "totalOrders": number,
    "totalRevenue": number,
    "totalProfit": number,
    "totalCost": number,
    "profitMargin": number,
    "averageOrderValue": number,
    "todayOrders": number,
    "todayRevenue": number,
    "revenueGrowth": number
  },
  "chartData": [
    {
      "date": "2024-01-01",
      "revenue": 150000,
      "profit": 45000,
      "orders": 12,
      "cost": 105000
    }
  ],
  "productProfitability": [
    {
      "id": "variant-id",
      "name": "Americano - 250ml",
      "price": 15000,
      "costPrice": 8500,
      "profitAmount": 6500,
      "profitPercentage": 43.3,
      "status": "excellent"
    }
  ],
  "topProducts": [
    {
      "name": "Cafe Latte - 250ml",
      "quantity": 45,
      "revenue": 675000
    }
  ],
  "period": "daily",
  "dateRange": {
    "from": "2024-01-01",
    "to": "2024-01-31"
  }
}
```

## Teknologi yang Digunakan

### Frontend Libraries
- **Recharts**: Library chart untuk React
- **React DatePicker**: Component date picker
- **Date-fns**: Utility untuk manipulasi tanggal
- **Lucide React**: Icon library
- **TailwindCSS**: Styling

### Backend
- **Supabase**: Database queries untuk orders dan variants
- **Next.js API Routes**: REST endpoints
- **TypeScript**: Type safety

## Instalasi Dependencies

```bash
npm install recharts react-datepicker date-fns @types/react-datepicker
```

## Fitur Data Processing

### 1. Chart Data Processing
- Menginisialisasi data structure berdasarkan periode
- Mengisi data dengan orders yang completed saja
- Menghitung revenue, profit, cost, dan jumlah orders per periode

### 2. Product Profitability Analysis
- Mengambil data dari coffee_variants dengan recipe costs
- Mengurutkan berdasarkan profit percentage
- Memberikan status indicator berdasarkan profitabilitas

### 3. Top Products Calculation
- Menghitung penjualan per produk dari completed orders
- Mengurutkan berdasarkan total revenue
- Limit 10 produk teratas

### 4. Growth Calculation
- Membandingkan revenue hari ini vs kemarin
- Menghitung persentase pertumbuhan
- Menampilkan dengan indicator visual (naik/turun)

## Custom Styling

### DatePicker Theme
Custom CSS untuk menyesuaikan react-datepicker dengan theme aplikasi:
- Primary color scheme
- Rounded corners
- Hover effects
- Focus states

### Responsive Design
- Mobile-first approach
- Grid layouts yang responsive
- Flexible date controls
- Scrollable tables untuk mobile

## Data Flow

1. **User Input**: Pilih date range dan period
2. **API Call**: Fetch data dari `/api/admin/analytics`
3. **Data Processing**: 
   - Filter orders berdasarkan date range
   - Process chart data berdasarkan period
   - Calculate profitability metrics
   - Generate top products list
4. **Visualization**: Render charts dan tables
5. **Real-time Updates**: Auto-refresh saat filter berubah

## Security

- Authentication check pada API endpoint
- Redirect ke login jika unauthorized
- Input validation untuk date parameters
- SQL injection protection melalui Supabase

## Performance Optimizations

- Efficient database queries dengan proper joins
- Data filtering di database level
- Pagination untuk large datasets
- Responsive chart rendering
- Debounced date picker updates

## Future Enhancements

1. **Export Functionality**: PDF/Excel export untuk reports
2. **Email Reports**: Scheduled analytics reports
3. **Comparative Analysis**: Year-over-year comparisons
4. **Forecasting**: Predictive analytics
5. **Real-time Updates**: WebSocket untuk live data
6. **Advanced Filters**: Category, product type filters
7. **Custom Metrics**: User-defined KPIs

## Troubleshooting

### Common Issues

1. **Chart Not Rendering**
   - Check if data array is not empty
   - Verify date format consistency
   - Ensure Recharts dependencies installed

2. **Date Picker Styling Issues**
   - Import CSS: `import 'react-datepicker/dist/react-datepicker.css'`
   - Check custom CSS in globals.css

3. **API Timeout**
   - Reduce date range for large datasets
   - Check Supabase connection
   - Verify query performance

4. **TypeScript Errors**
   - Install type definitions: `@types/react-datepicker`
   - Check interface definitions match API response

## Monitoring & Analytics

Dashboard ini memberikan insight mendalam untuk:
- **Financial Performance**: Revenue, profit, costs
- **Product Analysis**: Best/worst performing products
- **Trend Analysis**: Growth patterns dan seasonality
- **Operational Metrics**: Order volumes dan values
- **Profitability Optimization**: Identify unprofitable products

Dengan dashboard ini, KOIU Coffee dapat membuat keputusan bisnis yang data-driven untuk meningkatkan profitabilitas dan pertumbuhan. 