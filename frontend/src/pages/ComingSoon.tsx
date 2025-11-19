/**
 * ComingSoon Page
 * Placeholder page for features under development
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

interface ComingSoonProps {
  /** Feature name */
  featureName: string;
  /** Feature description */
  description?: string;
  /** Feature icon */
  icon?: string;
}

/**
 * ComingSoon Component
 */
export const ComingSoon: React.FC<ComingSoonProps> = ({
  featureName,
  description,
  icon = '🚀',
}) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="text-6xl mb-6">{icon}</div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{featureName}</h1>

        {/* Description */}
        <p className="text-gray-600 text-lg mb-2">Coming Soon</p>
        {description && (
          <p className="text-gray-500 mb-8">{description}</p>
        )}

        {/* Message */}
        <p className="text-gray-600 mb-8">
          We're working hard to bring this feature to you. Stay tuned!
        </p>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Button
            variant="primary"
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/support')}
          >
            Get Help
          </Button>
        </div>

        {/* Footer */}
        <p className="text-sm text-gray-500 mt-12">
          Have feedback? Let us know at support@atlanticesim.com
        </p>
      </div>
    </div>
  );
};

ComingSoon.displayName = 'ComingSoon';
