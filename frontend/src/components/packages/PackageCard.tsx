import React from 'react';
import { Package } from '../../types';
import { Wifi, Phone, MessageSquare, Diamond } from 'lucide-react';

interface PackageCardProps {
  package: Package;
  onSelect: (pkg: Package) => void;
}

export const PackageCard: React.FC<PackageCardProps> = ({ package: pkg, onSelect }) => {
  return (
    <div className={`relative border rounded-xl p-5 hover:shadow-xl transition-all duration-300 ${pkg.isBestValue ? 'border-amber-400 bg-amber-50/30' : 'bg-white'}`}>
      {pkg.isBestValue && (
        <div className="absolute -top-3 right-4 flex items-center gap-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg uppercase tracking-wider">
          <Diamond className="w-3 h-3 fill-current" />
          Best Value
        </div>
      )}
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-lg text-gray-900">{pkg.name}</h3>
        <span className="text-[10px] font-bold text-gray-400 border border-gray-200 px-2 py-0.5 rounded-full uppercase">{pkg.providerName}</span>
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