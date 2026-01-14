/**
 * DashboardFooter Component
 * Footer with help links, support, and legal information
 *
 * Features:
 * - Help and support links
 * - Legal links (Terms, Privacy)
 * - Copyright information
 * - Responsive layout
 * - Accessible link structure
 */

import React from 'react';

interface DashboardFooterProps {
  /** Callback when Help link is clicked */
  onHelpClick?: () => void;
  /** Callback when Support link is clicked */
  onSupportClick?: () => void;
  /** Callback when Terms link is clicked */
  onTermsClick?: () => void;
  /** Callback when Privacy link is clicked */
  onPrivacyClick?: () => void;
  /** Company name for copyright */
  companyName?: string;
  /** Current year for copyright */
  year?: number;
}

/**
 * Footer link component
 */
interface FooterLinkProps {
  label: string;
  icon: string;
  onClick?: () => void;
}

const FooterLink: React.FC<FooterLinkProps> = ({ label, icon, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm"
    aria-label={label}
  >
    <span>{icon}</span>
    <span>{label}</span>
  </button>
);

/**
 * DashboardFooter Component
 */
export const DashboardFooter: React.FC<DashboardFooterProps> = ({
  onHelpClick,
  onSupportClick,
  onTermsClick,
  onPrivacyClick,
  companyName = 'Atlantic eSIM',
  year = new Date().getFullYear(),
}) => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-12">
      <div className="px-4 md:px-6 py-8">
        {/* Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Help Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Help & Support</h3>
            <div className="space-y-3">
              <FooterLink
                label="Help Center"
                icon="❓"
                onClick={onHelpClick}
              />
              <FooterLink
                label="Contact Support"
                icon="💬"
                onClick={onSupportClick}
              />
            </div>
          </div>

          {/* Legal Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Legal</h3>
            <div className="space-y-3">
              <FooterLink
                label="Terms of Service"
                icon="📋"
                onClick={onTermsClick}
              />
              <FooterLink
                label="Privacy Policy"
                icon="🔒"
                onClick={onPrivacyClick}
              />
            </div>
          </div>

          {/* About Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">About</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {companyName} is your trusted eSIM provider. Get connected anywhere in the world.
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 pt-8">
          {/* Bottom Section */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <p className="text-sm text-gray-500">
              © {year} {companyName}. All rights reserved.
            </p>

            {/* Social Links (Optional) */}
            <div className="flex items-center gap-4">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Twitter"
              >
                𝕏
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Facebook"
              >
                f
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="LinkedIn"
              >
                in
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

DashboardFooter.displayName = 'DashboardFooter';
