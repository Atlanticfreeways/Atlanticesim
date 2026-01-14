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

import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardFooter } from '@/components/dashboard/DashboardFooter';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { MyESIMsSection } from '@/components/dashboard/MyESIMsSection';
import { RecentOrdersTable } from '@/components/dashboard/RecentOrdersTable';
import { QuickActionsBar } from '@/components/dashboard/QuickActionsBar';
import { useDashboard } from '@/hooks/useDashboard';

/**
 * Error state component
 */
const ErrorState: React.FC<{ error: Error; onRetry: () => void }> = ({ error, onRetry }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div className="text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h1>
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
  const { data, isLoading, error, refetch } = useDashboard();

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
   * Handle top up (show modal or navigate)
   */
  const handleTopUp = useCallback(() => {
    // TODO: Implement top-up modal
    alert('Top-up feature coming soon');
  }, []);

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
  const handleShowQR = useCallback((esimId: string) => {
    // TODO: Implement QR code modal
    alert(`QR Code for eSIM: ${esimId}`);
  }, []);

  /**
   * Handle manage eSIM
   */
  const handleManageESIM = useCallback((esimId: string) => {
    navigate(`/esims/${esimId}/manage`);
  }, [navigate]);

  /**
   * Handle help click
   */
  const handleHelpClick = useCallback(() => {
    navigate('/help');
  }, [navigate]);

  /**
   * Handle support click
   */
  const handleSupportClick = useCallback(() => {
    navigate('/support');
  }, [navigate]);

  /**
   * Handle terms click
   */
  const handleTermsClick = useCallback(() => {
    window.open('/terms', '_blank');
  }, []);

  /**
   * Handle privacy click
   */
  const handlePrivacyClick = useCallback(() => {
    window.open('/privacy', '_blank');
  }, []);

  /**
   * Handle profile click
   */
  const handleProfileClick = useCallback(() => {
    navigate('/profile');
  }, [navigate]);

  /**
   * Handle logout
   */
  const handleLogout = useCallback(() => {
    // TODO: Implement logout
    localStorage.removeItem('token');
    navigate('/login');
  }, [navigate]);

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
        onProfile={handleProfileClick}
        onLogout={handleLogout}
        isLoading={isLoading}
      />

      {/* Main Content */}
      <main className="flex-1 px-4 md:px-6 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Welcome Section */}
          {!isLoading && (
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
              <h2 className="text-2xl font-bold mb-2">Welcome to Atlantic eSIM</h2>
              <p className="text-blue-100">
                Stay connected anywhere in the world with our global eSIM solutions
              </p>
            </div>
          )}

          {/* Stats Cards */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Your Statistics</h2>
            {isLoading ? (
              <StatsCardsSkeleton />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              onShowQR={handleShowQR}
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
              onTopUp={handleTopUp}
              onSupport={handleSupport}
              onSettings={handleSettings}
              isLoading={isLoading}
            />
          </section>
        </div>
      </main>

      {/* Footer */}
      <DashboardFooter
        onHelpClick={handleHelpClick}
        onSupportClick={handleSupportClick}
        onTermsClick={handleTermsClick}
        onPrivacyClick={handlePrivacyClick}
      />
    </div>
  );
};

Dashboard.displayName = 'Dashboard';
