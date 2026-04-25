/**
 * Application Routes
 * Centralized route configuration
 */

import React, { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
import { LandingPage } from '@/pages/LandingPage';
import { ComingSoon } from '@/pages/ComingSoon';

// Lazy load heavy components
const Dashboard = lazy(() => import('@/pages/Dashboard').then(m => ({ default: m.Dashboard })));
const PackagesPage = lazy(() => import('@/pages/PackagesPage').then(m => ({ default: m.PackagesPage })));
const PackageDetailsPage = lazy(() => import('@/pages/PackageDetailsPage').then(m => ({ default: m.PackageDetailsPage })));
const ApiKeyPage = lazy(() => import('@/pages/ApiKeyPage').then(m => ({ default: m.ApiKeyPage })));
const WebhookPage = lazy(() => import('@/pages/WebhookPage').then(m => ({ default: m.WebhookPage })));

/**
 * Route configuration
 */
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/dashboard',
    element: <Dashboard />,
  },
  {
    path: '/packages',
    element: <PackagesPage />,
  },
  {
    path: '/packages/:id',
    element: <PackageDetailsPage />,
  },
  {
    path: '/settings/api',
    element: <ApiKeyPage />,
  },
  {
    path: '/settings/webhooks',
    element: <WebhookPage />,
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
