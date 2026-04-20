/**
 * Dashboard Page
 * Main dashboard page that combines all dashboard components
 *
 * Features:
 * - Fetches real data from API using custom hooks
 * - Displays all dashboard sections
 * - Handles loading and error states
 * - Responsive layout
 * - Error boundary support
 */

import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardFooter } from '@/components/dashboard/DashboardFooter';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { MyESIMsSection } from '@/components/dashboard/MyESIMsSection';
import { RecentOrdersTable } from '@/components/dashboard/RecentOrdersTable';
import { QuickActionsBar } from '@/components/dashboard/QuickActionsBar';
import { QRModal } from '@/components/dashboard/QRModal';
import { TopUpModal } from '@/components/dashboard/TopUpModal';
import { WalletDepositModal } from '@/components/partners/WalletDepositModal';
import { useDashboard } from '@/hooks/useDashboard';
import { useAuth } from '@/hooks/useAuth';

/**
 * Error state component
 */
const ErrorState: React.FC<{ error: Error; onRetry: () => void }> = ({ error, onRetry }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div className="text-center text-gray-900">
      <h1 className="text-3xl font-bold mb-2">Oops! Something went wrong</h1>
      <p className="text-gray-600 mb-4">{error.message}</p>
      <button
        onClick={onRetry}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Try Again
      </button>
    </div>
  </div>
);

/**
 * Stats cards skeleton loader
 */
const StatsCardsSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {Array.from({ length: 3 }).map((_, i) => (
      <StatsCard
        key={i}
        icon="📊"
        label="Loading..."
        value="-"
        isLoading={true}
      />
    ))}
  </div>
);

/**
 * Dashboard Page Component
 */
export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { data, isLoading, error, refetch } = useDashboard();
  
  // Modal states
  const [activeQR, setActiveQR] = useState<{ id: string, code: string } | null>(null);
  const [activeTopUp, setActiveTopUp] = useState<string | null>(null);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  /**
   * Handle retry on error
   */
  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  /**
   * Handle navigation to packages
   */
  const handleBuyNew = useCallback(() => {
    navigate('/packages');
  }, [navigate]);

  /**
   * Handle top up
   */
  const handleTopUp = useCallback((esimId?: string) => {
    if (user?.role === 'BUSINESS_PARTNER' && !esimId) {
      setIsWalletModalOpen(true);
    } else {
      setActiveTopUp(esimId || 'general');
    }
  }, [user?.role]);

  /**
   * Handle support navigation
   */
  const handleSupport = useCallback(() => {
    navigate('/support');
  }, [navigate]);

  /**
   * Handle settings navigation
   */
  const handleSettings = useCallback(() => {
    navigate('/settings');
  }, [navigate]);

  /**
   * Handle view all orders
   */
  const handleViewAllOrders = useCallback(() => {
    navigate('/orders');
  }, [navigate]);

  /**
   * Handle view specific order
   */
  const handleViewOrder = useCallback(
    (orderId: string) => {
      navigate(`/orders/${orderId}`);
    },
    [navigate]
  );

  /**
   * Handle view eSIM details
   */
  const handleViewESIMDetails = useCallback(
    (esimId: string) => {
      navigate(`/esims/${esimId}`);
    },
    [navigate]
  );

  /**
   * Handle show QR code
   */
  const handleShowQR = useCallback((esimId: string, code?: string) => {
    setActiveQR({ id: esimId, code: code || 'LPA:1$smdp.example.com$TEST-CODE' });
  }, []);

  /**
   * Handle manage eSIM
   */
  const handleManageESIM = useCallback((esimId: string) => {
    navigate(`/esims/${esimId}/manage`);
  }, [navigate]);

  /**
   * Handle logout
   */
  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  /**
   * Handle search
   */
  const handleSearch = useCallback(
    (query: string) => {
      if (query.trim()) {
        navigate(`/packages?search=${encodeURIComponent(query)}`);
      }
    },
    [navigate]
  );

  // Show error state
  if (error) {
    return <ErrorState error={error} onRetry={handleRetry} />;
  }

  // Get user name from data or use default
  const userName = data?.user?.name || 'User';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <DashboardHeader
        userName={userName}
        notificationCount={data?.notificationCount || 0}
        onSearch={handleSearch}
        onNotifications={handleSupport}
        onProfile={() => navigate('/profile')}
        onLogout={handleLogout}
        isLoading={isLoading}
      />

      {/* Main Content */}
      <main className="flex-1 px-4 md:px-6 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Welcome Section */}
          {!isLoading && (
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-3xl p-8 text-white shadow-xl shadow-blue-100">
              <h2 className="text-3xl font-bold mb-2 leading-tight">Hello, {userName}! 👋</h2>
              <p className="text-blue-100 text-lg opacity-90">
                You're currently traveler-ready across {data?.stats?.activeCountries || 0} countries.
              </p>
            </div>
          )}

          {/* Stats Cards */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-5">At a Glance</h2>
            {isLoading ? (
              <StatsCardsSkeleton />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
                {user?.role === 'BUSINESS_PARTNER' && (
                  <StatsCard
                    icon="🪙"
                    label="Wallet Balance"
                    value={`$${(data?.stats?.walletBalance || 0).toFixed(2)}`}
                    unit="USD"
                    isLoading={isLoading}
                    className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200"
                  />
                )}
                <StatsCard
                  icon="📱"
                  label="Active eSIMs"
                  value={data?.stats?.activeESIMs || 0}
                  isLoading={isLoading}
                />
                <StatsCard
                  icon="💰"
                  label="Total Spent"
                  value={`$${(data?.stats?.totalSpent || 0).toFixed(2)}`}
                  unit={data?.stats?.currency || 'USD'}
                  isLoading={isLoading}
                />
                <StatsCard
                  icon="📊"
                  label="Data Used"
                  value={`${(data?.stats?.totalDataUsed || 0).toFixed(2)}`}
                  unit="GB"
                  isLoading={isLoading}
                />
              </div>
            )}
          </section>

          {/* My eSIMs Section */}
          <section>
            <MyESIMsSection
              esims={data?.esims || []}
              isLoading={isLoading}
              onViewDetails={handleViewESIMDetails}
              onShowQR={(id) => handleShowQR(id, data?.esims?.find(e => e.id === id)?.qrCode)}
              onManage={handleManageESIM}
            />
          </section>

          {/* Recent Orders Section */}
          <section>
            <RecentOrdersTable
              orders={data?.recentOrders || []}
              isLoading={isLoading}
              onViewAll={handleViewAllOrders}
              onViewOrder={handleViewOrder}
            />
          </section>

          {/* Quick Actions */}
          <section>
            <QuickActionsBar
              onBuyNew={handleBuyNew}
              onTopUp={() => handleTopUp()}
              onSupport={handleSupport}
              onSettings={handleSettings}
              isLoading={isLoading}
            />
          </section>

          {/* Partner Specific Actions */}
          {user?.role === 'BUSINESS_PARTNER' && (
            <section className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Partner Console</h2>
                  <p className="text-sm text-gray-500">Manage your B2B aggregation infrastructure</p>
                </div>
                <Badge variant="info">Partner Active</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                  onClick={() => navigate('/settings/api')}
                  className="flex items-center gap-4 p-4 border rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold">API</div>
                  <div className="text-left">
                    <p className="font-bold text-gray-900">Developer Keys</p>
                    <p className="text-xs text-gray-400">View and rotate your x-api-keys</p>
                  </div>
                </button>
                <button 
                  onClick={() => navigate('/settings/webhooks')}
                  className="flex items-center gap-4 p-4 border rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 font-bold">WH</div>
                  <div className="text-left">
                    <p className="font-bold text-gray-900">Webhooks</p>
                    <p className="text-xs text-gray-400">Configure real-time event callbacks</p>
                  </div>
                </button>
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Footer */}
      <DashboardFooter
        onHelpClick={() => navigate('/help')}
        onSupportClick={() => navigate('/support')}
        onTermsClick={() => window.open('/terms', '_blank')}
        onPrivacyClick={() => window.open('/privacy', '_blank')}
      />

      {/* Modals */}
      <QRModal 
        isOpen={!!activeQR} 
        onClose={() => setActiveQR(null)} 
        esimId={activeQR?.id || ''} 
        qrCodeValue={activeQR?.code || ''} 
      />

      <TopUpModal 
        isOpen={!!activeTopUp} 
        onClose={() => setActiveTopUp(null)} 
        esimId={activeTopUp || ''} 
        onTopUp={(amount) => {
          console.log(`Top up ${activeTopUp} with ${amount}`);
          setActiveTopUp(null);
          navigate(`/checkout/topup/${activeTopUp}?bundle=${amount}`);
        }} 
      />

      <WalletDepositModal 
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
      />
    </div>
  );
};

Dashboard.displayName = 'Dashboard';

Dashboard.displayName = 'Dashboard';
