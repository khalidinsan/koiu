'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { 
  Calendar,
  Download,
  Filter,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Users,
  FileText,
  BarChart3,
  PieChart,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface SalesData {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  averageOrderValue: number;
  topProducts: {
    name: string;
    quantity: number;
    revenue: number;
  }[];
  dailySales: {
    date: string;
    revenue: number;
    orders: number;
  }[];
  statusBreakdown: {
    status: string;
    count: number;
    percentage: number;
  }[];
  paymentMethodBreakdown: {
    method: string;
    count: number;
    revenue: number;
    percentage: number;
  }[];
  hourlySales: {
    hour: number;
    orders: number;
    revenue: number;
  }[];
}

interface DateFilter {
  startDate: string;
  endDate: string;
  preset: 'today' | 'yesterday' | 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'custom';
}

export default function SalesReportsPage() {
  const router = useRouter();
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState('');
  
  const [dateFilter, setDateFilter] = useState<DateFilter>({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    preset: 'last7days'
  });

  useEffect(() => {
    fetchSalesData();
  }, [dateFilter.startDate, dateFilter.endDate]);

  const fetchSalesData = async () => {
    setIsLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        startDate: dateFilter.startDate,
        endDate: dateFilter.endDate
      });

      const response = await fetch(`/api/admin/reports?${params}`);
      
      if (response.status === 401) {
        router.push('/admin/login');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setSalesData(data);
      } else {
        setError('Failed to load sales data');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePresetChange = (preset: DateFilter['preset']) => {
    const today = new Date();
    let startDate: Date;
    let endDate: Date = today;

    switch (preset) {
      case 'today':
        startDate = today;
        break;
      case 'yesterday':
        startDate = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        endDate = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'last7days':
        startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'last30days':
        startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'thisMonth':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'lastMonth':
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        startDate = lastMonth;
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      default:
        return;
    }

    setDateFilter({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      preset
    });
  };

  const exportToCSV = async () => {
    if (!salesData) return;

    setIsExporting(true);
    try {
      const response = await fetch('/api/admin/reports/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: dateFilter.startDate,
          endDate: dateFilter.endDate,
          format: 'csv'
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `sales-report-${dateFilter.startDate}-to-${dateFilter.endDate}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
      } else {
        setError('Failed to export data');
      }
    } catch (error) {
      setError('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const formatPrice = (price: number) => {
    return `Rp ${price.toLocaleString('id-ID')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short'
    });
  };

  const getGrowthIndicator = (current: number, previous: number) => {
    if (previous === 0) return null;
    const growth = ((current - previous) / previous) * 100;
    
    if (growth > 0) {
      return (
        <div className="flex items-center text-green-600">
          <TrendingUp className="h-4 w-4 mr-1" />
          <span className="text-sm font-medium">+{growth.toFixed(1)}%</span>
        </div>
      );
    } else if (growth < 0) {
      return (
        <div className="flex items-center text-red-600">
          <TrendingDown className="h-4 w-4 mr-1" />
          <span className="text-sm font-medium">{growth.toFixed(1)}%</span>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading sales data...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout title="Sales Reports">
      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <BarChart3 className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Sales Analytics</h2>
              <p className="text-gray-600">Track your business performance</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Date Presets */}
            <div className="flex items-center space-x-2">
              <select
                value={dateFilter.preset}
                onChange={(e) => handlePresetChange(e.target.value as DateFilter['preset'])}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900 bg-white"
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="last7days">Last 7 days</option>
                <option value="last30days">Last 30 days</option>
                <option value="thisMonth">This month</option>
                <option value="lastMonth">Last month</option>
                <option value="custom">Custom range</option>
              </select>
            </div>

            {/* Custom Date Inputs */}
            {dateFilter.preset === 'custom' && (
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  value={dateFilter.startDate}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900 bg-white"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={dateFilter.endDate}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900 bg-white"
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={fetchSalesData}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh data"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <button
                onClick={exportToCSV}
                disabled={isExporting || !salesData}
                className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <Download className="h-4 w-4" />
                <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {salesData && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-800 mt-2">
                    {formatPrice(salesData.totalRevenue)}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-800 mt-2">
                    {salesData.totalOrders.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <ShoppingBag className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Customers</p>
                  <p className="text-2xl font-bold text-gray-800 mt-2">
                    {salesData.totalCustomers.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Avg. Order Value</p>
                  <p className="text-2xl font-bold text-gray-800 mt-2">
                    {formatPrice(salesData.averageOrderValue)}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Daily Sales Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Daily Sales</h3>
              <div className="space-y-3">
                {salesData.dailySales.map((day, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{formatDate(day.date)}</span>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-medium text-gray-800">
                        {day.orders} orders
                      </span>
                      <span className="text-sm font-semibold text-primary-600">
                        {formatPrice(day.revenue)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Status Breakdown */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Order Status</h3>
              <div className="space-y-3">
                {salesData.statusBreakdown.map((status, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 capitalize">{status.status}</span>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-medium text-gray-800">
                        {status.count} orders
                      </span>
                      <span className="text-sm font-semibold text-primary-600">
                        {status.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Detailed Reports Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Products */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Products</h3>
              <div className="space-y-4">
                {salesData.topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800">{product.name}</p>
                      <p className="text-sm text-gray-600">{product.quantity} sold</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary-600">
                        {formatPrice(product.revenue)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Methods</h3>
              <div className="space-y-4">
                {salesData.paymentMethodBreakdown.map((method, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800 capitalize">{method.method}</p>
                      <p className="text-sm text-gray-600">{method.count} orders</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary-600">
                        {formatPrice(method.revenue)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {method.percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Hourly Sales Analysis */}
          {salesData.hourlySales.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Hourly Sales Pattern</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {salesData.hourlySales.map((hour, index) => (
                  <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">
                      {hour.hour}:00
                    </p>
                    <p className="text-sm font-semibold text-gray-800">
                      {hour.orders} orders
                    </p>
                    <p className="text-xs text-primary-600">
                      {formatPrice(hour.revenue)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
} 