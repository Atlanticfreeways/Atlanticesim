import React from 'react';
import { useQuery } from 'react-query';
import { adminApi } from '../services/api';
import { BarChart, Users, ShoppingBag, Smartphone, Activity } from 'lucide-react';

export const AdminPage: React.FC = () => {
  const { data: dashboard } = useQuery('admin-dashboard', adminApi.getDashboard);
  const { data: providerHealth } = useQuery('provider-health', adminApi.getProviderHealth);
  const { data: analytics } = useQuery('sales-analytics', adminApi.getSalesAnalytics);

  if (!dashboard) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold">{dashboard.stats.totalUsers}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <ShoppingBag className="w-8 h-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold">{dashboard.stats.totalOrders}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Smartphone className="w-8 h-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Active eSIMs</p>
              <p className="text-2xl font-bold">{dashboard.stats.totalEsims}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Activity className="w-8 h-8 text-orange-500" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Active Providers</p>
              <p className="text-2xl font-bold">{dashboard.stats.activeProviders}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Queue & Background Health */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Background Activation Queue</h2>
          <span className="flex items-center gap-2 text-xs font-bold text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
             WORKERS ACTIVE
          </span>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border rounded-xl p-4 bg-gray-50">
                <p className="text-xs text-gray-400 font-bold uppercase mb-1">Waiting</p>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900">0</span>
                    <span className="text-xs text-gray-400">jobs</span>
                </div>
            </div>
            <div className="border rounded-xl p-4 bg-blue-50 border-blue-100">
                <p className="text-xs text-blue-400 font-bold uppercase mb-1">Active</p>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-blue-900">0</span>
                    <span className="text-xs text-blue-400">processing</span>
                </div>
            </div>
            <div className="border rounded-xl p-4 bg-gray-50">
                <p className="text-xs text-gray-400 font-bold uppercase mb-1">Failed Today</p>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-red-600">0</span>
                    <span className="text-xs text-gray-400">retries scheduled</span>
                </div>
            </div>
        </div>
      </div>

      {/* Provider Health */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Provider API Status</h2>
        </div>
        <div className="p-6">
          {providerHealth?.map((provider) => (
            <div key={provider.id} className="flex justify-between items-center py-3 border-b last:border-b-0">
              <div>
                <p className="font-medium">{provider.name}</p>
                <p className="text-sm text-gray-600">{provider.apiBaseUrl}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm">{provider.health.responseTime}ms</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  provider.health.status === 'healthy' 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {provider.health.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Recent Orders</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {dashboard.recentOrders.map((order) => (
              <div key={order.id} className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{order.user.name}</p>
                  <p className="text-sm text-gray-600">{order.package.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">${order.paymentAmount}</p>
                  <span className={`text-xs px-2 py-1 rounded ${
                    order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                    order.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};