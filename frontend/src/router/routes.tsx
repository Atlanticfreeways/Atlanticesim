/**
 * Application Routes
 * Centralized route configuration
 */

import React from 'react';
import { RouteObject } from 'react-router-dom';
import { Dashboard } from '@/pages/Dashboard';
import { ComingSoon } from '@/pages/ComingSoon';

/**
 * Route configuration
 */
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <Dashboard />,
  },
  {
    path: '/dashboard',
    element: <Dashboard />,
  },
  {
    path: '/packages',
    element: (
      <ComingSoon
        featureName="Browse Packages"
        description="Explore and compare eSIM packages from multiple providers"
        icon="📦"
      />
    ),
  },
  {
    path: '/packages/:id',
    element: (
      <ComingSoon
        featureName="Package Details"
        description="View detailed information about this package"
        icon="📋"
      />
    ),
  },
  {
    path: '/orders',
    element: (
      <ComingSoon
        featureName="Order History"
        description="View all your past orders and their status"
        icon="📜"
      />
    ),
  },
  {
    path: '/orders/:id',
    element: (
      <ComingSoon
        featureName="Order Details"
        description="View detailed information about this order"
        icon="🔍"
      />
    ),
  },
  {
    path: '/esims/:id',
    element: (
      <ComingSoon
        featureName="eSIM Details"
        description="View and manage your eSIM"
        icon="📱"
      />
    ),
  },
  {
    path: '/esims/:id/manage',
    element: (
      <ComingSoon
        featureName="Manage eSIM"
        description="Manage your eSIM settings and options"
        icon="⚙️"
      />
    ),
  },
  {
    path: '/settings',
    element: (
      <ComingSoon
        featureName="Settings"
        description="Manage your account settings and preferences"
        icon="⚙️"
      />
    ),
  },
  {
    path: '/profile',
    element: (
      <ComingSoon
        featureName="Profile"
        description="View and edit your profile information"
        icon="👤"
      />
    ),
  },
  {
    path: '/support',
    element: (
      <ComingSoon
        featureName="Support"
        description="Get help and contact our support team"
        icon="💬"
      />
    ),
  },
  {
    path: '/help',
    element: (
      <ComingSoon
        featureName="Help Center"
        description="Browse our help documentation and FAQs"
        icon="❓"
      />
    ),
  },
  {
    path: '/checkout',
    element: (
      <ComingSoon
        featureName="Checkout"
        description="Complete your purchase"
        icon="🛒"
      />
    ),
  },
  {
    path: '/login',
    element: (
      <ComingSoon
        featureName="Login"
        description="Sign in to your account"
        icon="🔐"
      />
    ),
  },
  {
    path: '/register',
    element: (
      <ComingSoon
        featureName="Register"
        description="Create a new account"
        icon="📝"
      />
    ),
  },
  {
    path: '*',
    element: (
      <ComingSoon
        featureName="Page Not Found"
        description="The page you're looking for doesn't exist"
        icon="🤔"
      />
    ),
  },
];

/**
 * Get route by path
 */
export function getRoute(path: string): RouteObject | undefined {
  return routes.find((route) => route.path === path);
}

/**
 * Get all route paths
 */
export function getAllRoutePaths(): string[] {
  return routes
    .map((route) => route.path)
    .filter((path): path is string => typeof path === 'string' && path !== '*');
}

/**
 * Navigation items for sidebar/menu
 */
export const navigationItems = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: '📊',
  },
  {
    label: 'Browse Packages',
    path: '/packages',
    icon: '📦',
  },
  {
    label: 'Order History',
    path: '/orders',
    icon: '📜',
  },
  {
    label: 'Settings',
    path: '/settings',
    icon: '⚙️',
  },
  {
    label: 'Support',
    path: '/support',
    icon: '💬',
  },
];
