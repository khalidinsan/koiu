'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { 
  Save, 
  MapPin, 
  Phone, 
  Store, 
  DollarSign,
  ExternalLink,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface Config {
  id: number;
  admin_whatsapp: string;
  store_name: string;
  currency: string;
  pickup_address: string;
  pickup_coordinates: string;
  pickup_map_link: string;
}

export default function ConfigPage() {
  const router = useRouter();
  const [config, setConfig] = useState<Config | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    admin_whatsapp: '',
    store_name: '',
    currency: '',
    pickup_address: '',
    pickup_coordinates: '',
    pickup_map_link: ''
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/admin/config');
      
      if (response.status === 401) {
        router.push('/admin/login');
        return;
      }

      const data = await response.json();
      if (data.config) {
        setConfig(data.config);
        setFormData({
          admin_whatsapp: data.config.admin_whatsapp,
          store_name: data.config.store_name,
          currency: data.config.currency,
          pickup_address: data.config.pickup_address,
          pickup_coordinates: data.config.pickup_coordinates,
          pickup_map_link: data.config.pickup_map_link
        });
      }
    } catch (error) {
      console.error('Error fetching config:', error);
      setError('Failed to load configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Configuration updated successfully!');
        setConfig(data.config);
        setTimeout(() => {
          setSuccess('');
        }, 3000);
      } else {
        setError(data.error || 'Failed to update configuration');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout title="Configuration">
      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <p className="text-green-700">{success}</p>
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Configuration Form */}
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Store Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Store className="h-5 w-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-800">Store Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Store Name
                </label>
                <input
                  type="text"
                  value={formData.store_name}
                  onChange={(e) => handleInputChange('store_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900 bg-white"
                  placeholder="KOIU Coffee"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency Symbol
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.currency}
                    onChange={(e) => handleInputChange('currency', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900 bg-white"
                    placeholder="Rp"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Phone className="h-5 w-5 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-800">Contact Information</h2>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin WhatsApp Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="tel"
                  value={formData.admin_whatsapp}
                  onChange={(e) => handleInputChange('admin_whatsapp', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900 bg-white"
                  placeholder="6282217301554"
                  required
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Include country code without + sign (e.g., 6282217301554 for Indonesia)
              </p>
            </div>
          </div>

          {/* Pickup Location */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center space-x-2 mb-6">
              <MapPin className="h-5 w-5 text-red-600" />
              <h2 className="text-lg font-semibold text-gray-800">Pickup Location</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pickup Address
                </label>
                <textarea
                  value={formData.pickup_address}
                  onChange={(e) => handleInputChange('pickup_address', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900 bg-white"
                  rows={3}
                  placeholder="Complete pickup address..."
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GPS Coordinates
                </label>
                <input
                  type="text"
                  value={formData.pickup_coordinates}
                  onChange={(e) => handleInputChange('pickup_coordinates', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900 bg-white"
                  placeholder="-6.849631952797085, 107.92745780720186"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  Format: latitude, longitude (separated by comma and space)
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Google Maps Link
                </label>
                <div className="flex">
                  <input
                    type="url"
                    value={formData.pickup_map_link}
                    onChange={(e) => handleInputChange('pickup_map_link', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900 bg-white"
                    placeholder="https://maps.app.goo.gl/..."
                    required
                  />
                  {formData.pickup_map_link && (
                    <a
                      href={formData.pickup_map_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-primary-50 border border-l-0 border-gray-300 rounded-r-lg text-primary-600 hover:bg-primary-100 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Share link from Google Maps for customer navigation
                </p>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.push('/admin/dashboard')}
              className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Configuration</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
} 