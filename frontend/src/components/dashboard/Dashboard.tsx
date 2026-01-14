import React from 'react';
import { useQuery } from 'react-query';
import { ordersApi, esimsApi } from '../../services/api';
import { Smartphone, ShoppingBag, Activity } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { data: orders } = useQuery('orders', ordersApi.getAll);
  const { data: esims } = useQuery('esims', esimsApi.getAll);

  const activeEsims = esims?.data?.filter(e => e.status === 'ACTIVE') || [];
  const recentOrders = orders?.data?.slice(0, 5) || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Smartphone className="w-8 h-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Active eSIMs</p>
              <p className="text-2xl font-bold">{activeEsims.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <ShoppingBag className="w-8 h-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold">{orders?.data?.length || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Activity className="w-8 h-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Data Usage</p>
              <p className="text-2xl font-bold">
                {activeEsims.reduce((acc, e) => acc + e.dataUsed, 0)} MB
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Recent Orders</h2>
        </div>
        <div className="p-6">
          {recentOrders.length === 0 ? (
            <p className="text-gray-500">No orders yet</p>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{order.package.name}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
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
          )}
        </div>
      </div>
    </div>
  );
};