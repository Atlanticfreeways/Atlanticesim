/**
 * DashboardHeader Component
 * Top navigation bar with search, notifications, and user profile
 *
 * Features:
 * - Welcome message with user name
 * - Search bar for packages
 * - Notification bell with count
 * - User profile dropdown
 * - Responsive design (stacks on mobile)
 * - Accessible navigation structure
 */

import React, { useState } from 'react';
import { cn } from '@/utils/cn';

interface DashboardHeaderProps {
  /** User's display name */
  userName: string;
  /** Number of unread notifications */
  notificationCount?: number;
  /** Callback when search input changes */
  onSearch?: (query: string) => void;
  /** Callback when notifications bell is clicked */
  onNotifications?: () => void;
  /** Callback when profile menu item is clicked */
  onProfile?: () => void;
  /** Callback when logout is clicked */
  onLogout?: () => void;
  /** Optional loading state */
  isLoading?: boolean;
}

/**
 * DashboardHeader Component
 */
export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  userName,
  notificationCount = 0,
  onSearch,
  onNotifications,
  onProfile,
  onLogout,
  isLoading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  /**
   * Handle search input change
   */
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch?.(query);
  };

  /**
   * Handle search clear
   */
  const handleSearchClear = () => {
    setSearchQuery('');
    onSearch?.('');
  };

  /**
   * Handle profile menu toggle
   */
  const handleProfileToggle = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  /**
   * Handle profile click
   */
  const handleProfileClick = () => {
    onProfile?.();
    setIsProfileOpen(false);
  };

  /**
   * Handle logout click
   */
  const handleLogoutClick = () => {
    onLogout?.();
    setIsProfileOpen(false);
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="px-4 md:px-6 py-4">
        {/* Welcome Section */}
        <div className="mb-4 md:mb-0">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {userName}! 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* Header Controls */}
        <div className="flex items-center justify-between gap-4 mt-4 md:mt-0">
          {/* Search Bar */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <input
                type="text"
                placeholder="Search packages..."
                value={searchQuery}
                onChange={handleSearchChange}
                disabled={isLoading}
                className={cn(
                  'w-full px-4 py-2 pl-10 pr-10 border border-gray-300 rounded-lg',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                  'placeholder-gray-400 text-gray-900',
                  'transition-all duration-200',
                  isLoading && 'opacity-50 cursor-not-allowed'
                )}
                aria-label="Search packages"
              />
              {/* Search Icon */}
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                🔍
              </span>
              {/* Clear Button */}
              {searchQuery && (
                <button
                  onClick={handleSearchClear}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button
              onClick={onNotifications}
              disabled={isLoading}
              className={cn(
                'relative p-2 text-gray-600 hover:text-gray-900',
                'hover:bg-gray-100 rounded-lg transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                notificationCount > 0 && 'text-blue-600'
              )}
              aria-label={`Notifications ${notificationCount > 0 ? `(${notificationCount} unread)` : ''}`}
              title="Notifications"
            >
              <span className="text-xl">🔔</span>
              {notificationCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>

            {/* Profile Menu */}
            <div className="relative">
              <button
                onClick={handleProfileToggle}
                disabled={isLoading}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-gray-900',
                  'hover:bg-gray-100 rounded-lg transition-colors',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
                aria-label="User profile menu"
                aria-expanded={isProfileOpen}
              >
                <span className="text-xl">👤</span>
                <span className="hidden sm:inline text-sm font-medium">{userName}</span>
                <span className={cn('text-gray-400 transition-transform', isProfileOpen && 'rotate-180')}>
                  ▼
                </span>
              </button>

              {/* Profile Dropdown */}
              {isProfileOpen && (
                <div
                  className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
                  role="menu"
                >
                  <button
                    onClick={handleProfileClick}
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 first:rounded-t-lg transition-colors"
                    role="menuitem"
                  >
                    👤 Profile Settings
                  </button>
                  <button
                    onClick={handleLogoutClick}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 last:rounded-b-lg transition-colors"
                    role="menuitem"
                  >
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

DashboardHeader.displayName = 'DashboardHeader';
