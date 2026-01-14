import React from 'react';
import { Package } from '../../types';
import { Wifi, Phone, MessageSquare } from 'lucide-react';

interface PackageCardProps {
  package: Package;
  onSelect: (pkg: Package) => void;
}

export const PackageCard: React.FC<PackageCardProps> = ({ package: pkg, onSelect }) => {
  return (
    <div className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-lg">{pkg.name}</h3>
        <span className="text-xs bg-gray-100 px-2 py-1 rounded">{pkg.providerName}</span>
      </div>
      
      <p className="text-gray-600 text-sm mb-3">{pkg.description}</p>
      
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2">
          <Wifi className="w-4 h-4 text-blue-500" />
          <span className="text-sm">{pkg.dataAmount} {pkg.dataUnit} Data</span>
        </div>
        
        {pkg.hasVoice && (
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-green-500" />
            <span className="text-sm">{pkg.voiceMinutes} minutes</span>
          </div>
        )}
        
        {pkg.hasSms && (
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-purple-500" />
            <span className="text-sm">{pkg.smsCount} SMS</span>
          </div>
        )}
      </div>
      
      <div className="flex justify-between items-center">
        <div>
          <span className="text-2xl font-bold">${pkg.price}</span>
          <span className="text-gray-500 text-sm ml-1">{pkg.currency}</span>
        </div>
        
        <button
          onClick={() => onSelect(pkg)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Select
        </button>
      </div>
      
      <div className="mt-2 text-xs text-gray-500">
        Valid for {pkg.validityDays} days • {pkg.countries.join(', ')}
      </div>
    </div>
  );
};