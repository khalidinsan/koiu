'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { 
  Package, 
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  Users,
  ShoppingBag,
  Settings,
  Calendar,
  BarChart3,
  PieChart,
  Target,
  AlertTriangle
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell
} from 'recharts';
import DatePicker from 'react-datepicker';
import { format, subDays, subMonths, subYears } from 'date-fns';
import 'react-datepicker/dist/react-datepicker.css';

interface AnalyticsData {
  summary: {
    totalOrders: number;
    totalRevenue: number;
    totalProfit: number;
    totalCost: number;
    profitMargin: number;
    averageOrderValue: number;
    todayOrders: number;
    todayRevenue: number;
    revenueGrowth: number;
  };
  chartData: {
    date: string;
    revenue: number;
    profit: number;
    orders: number;
    cost: number;
  }[];
  productProfitability: {
    id: string;
    name: string;
    price: number;
    costPrice: number;
    profitAmount: number;
    profitPercentage: number;
    status: string;
  }[];
  topProducts: {
    name: string;
    quantity: number;
    revenue: number;
  }[];
  period: string;
  dateRange: {
    from: string;
    to: string;
  };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState(new Date());
  const [period, setPeriod] = useState('daily');

  useEffect(() => {
    fetchAnalytics();
  }, [startDate, endDate, period]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        period
      });

      const response = await fetch(`/api/admin/analytics?${params}`);
      
      if (response.status === 401) {
        router.push('/admin/login');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return `Rp ${price.toLocaleString('id-ID')}`;
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(1)}%`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'average': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-orange-600 bg-orange-100';
      case 'loss': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const setQuickDateRange = (days: number) => {
    const end = new Date();
    const start = subDays(end, days);
    setStartDate(start);
    setEndDate(end);
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <AdminLayout title="Dashboard">
        <div className="p-6">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">Failed to load analytics data</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const { summary, chartData, productProfitability, topProducts } = analyticsData;

  return (
    <AdminLayout title="Dashboard">
      <div className="p-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Analytics Dashboard
              </h1>
              <p className="text-gray-600">
                Monitor your business performance and profitability
              </p>
            </div>

            {/* Date Range Controls */}
            <div className="mt-4 lg:mt-0">
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                {/* Quick Date Buttons */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => setQuickDateRange(1)}
                    className="px-3 py-1 text-sm bg-primary-500 rounded hover:bg-gray-200"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setQuickDateRange(7)}
                    className="px-3 py-1 text-sm bg-primary-500 rounded hover:bg-gray-200"
                  >
                    7D
                  </button>
                  <button
                    onClick={() => setQuickDateRange(30)}
                    className="px-3 py-1 text-sm bg-primary-500 rounded hover:bg-gray-200"
                  >
                    30D
                  </button>
                </div>

                {/* Date Pickers */}
                <div className="flex space-x-2">
                  <DatePicker
                    selected={startDate}
                    onChange={(date) => date && setStartDate(date)}
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholderText="Start Date"
                  />
                  <DatePicker
                    selected={endDate}
                    onChange={(date) => date && setEndDate(date)}
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                    minDate={startDate}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholderText="End Date"
                  />
                </div>

                {/* Period Selector */}
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="px-3 py-2 border text-primary-600 border-gray-300 rounded-md text-sm"
                >
                  <option value="daily">Daily</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatPrice(summary.totalRevenue)}
                </p>
                <div className="flex items-center mt-1">
                  {summary.revenueGrowth >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span
                    className={`text-xs ${
                      summary.revenueGrowth >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatPercentage(Math.abs(summary.revenueGrowth))} vs
                    yesterday
                  </span>
                </div>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Profit</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatPrice(summary.totalProfit)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Margin: {formatPercentage(summary.profitMargin)}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-purple-600">
                  {summary.totalOrders}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Today: {summary.todayOrders}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <ShoppingBag className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Order Value</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatPrice(summary.averageOrderValue)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Cost: {formatPrice(summary.totalCost)}
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <BarChart3 className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue & Profit Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Revenue & Profit Trend
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(date) => {
                    if (period === "daily")
                      return format(new Date(date), "MM/dd");
                    if (period === "monthly")
                      return format(new Date(date + "-01"), "MMM yy");
                    return date;
                  }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    formatPrice(value),
                    name,
                  ]}
                  labelFormatter={(date) => {
                    if (period === "daily")
                      return format(new Date(date), "MMM dd, yyyy");
                    if (period === "monthly")
                      return format(new Date(date + "-01"), "MMM yyyy");
                    return date;
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10B981"
                  strokeWidth={2}
                  name="Revenue"
                />
                <Line
                  type="monotone"
                  dataKey="profit"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  name="Profit"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Orders Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Orders Volume
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(date) => {
                    if (period === "daily")
                      return format(new Date(date), "MM/dd");
                    if (period === "monthly")
                      return format(new Date(date + "-01"), "MMM yy");
                    return date;
                  }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number) => [value, "Orders"]}
                  labelFormatter={(date) => {
                    if (period === "daily")
                      return format(new Date(date), "MMM dd, yyyy");
                    if (period === "monthly")
                      return format(new Date(date + "-01"), "MMM yyyy");
                    return date;
                  }}
                />
                <Bar dataKey="orders" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Product Profitability */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">
                Product Profitability
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4 max-h-80 overflow-y-auto">
                {productProfitability.slice(0, 10).map((product, index) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 text-sm">
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatPrice(product.price)} - Cost:{" "}
                        {formatPrice(product.costPrice)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          product.status
                        )}`}
                      >
                        {formatPercentage(product.profitPercentage)}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatPrice(product.profitAmount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">
                Top Selling Products
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4 max-h-80 overflow-y-auto">
                {topProducts.map((product, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold`}
                        style={{
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 text-sm">
                          {product.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {product.quantity} sold
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-800">
                        {formatPrice(product.revenue)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">Quick Actions</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <button
                onClick={() => router.push("/admin/products")}
                className="flex items-center justify-center space-x-2 p-4 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors"
              >
                <Package className="h-5 w-5" />
                <span>Manage Products</span>
              </button>
              <button
                onClick={() => router.push("/admin/orders")}
                className="flex items-center justify-center space-x-2 p-4 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
              >
                <ShoppingBag className="h-5 w-5" />
                <span>View Orders</span>
              </button>
              <button
                onClick={() => router.push("/admin/ingredients")}
                className="flex items-center justify-center space-x-2 p-4 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors"
              >
                <Target className="h-5 w-5" />
                <span>Ingredients</span>
              </button>
              <button
                onClick={() => router.push("/admin/config")}
                className="flex items-center justify-center space-x-2 p-4 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
} 