import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { packagesApi, ordersApi } from '../services/api';
import { PackageCard } from '../components/packages/PackageCard';
import { Package } from '../types';
import { Search, Filter } from 'lucide-react';

export const PackagesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [hasVoice, setHasVoice] = useState<boolean | undefined>();

  const { data: packages, isLoading } = useQuery(
    ['packages', { countries: selectedCountry, hasVoice }],
    () => packagesApi.search({ 
      countries: selectedCountry || undefined,
      hasVoice 
    })
  );

  const handleSelectPackage = async (pkg: Package) => {
    try {
      await ordersApi.create(pkg.id, pkg.providerId);
      // Redirect to orders or show success
    } catch (error) {
      console.error('Failed to create order:', error);
    }
  };

  const filteredPackages = packages?.data?.filter(pkg =>
    pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pkg.countries.some(country => 
      country.toLowerCase().includes(searchTerm.toLowerCase())
    )
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">eSIM Packages</h1>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search packages or countries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full rounded-md border-gray-300"
            />
          </div>
          
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="rounded-md border-gray-300"
          >
            <option value="">All Countries</option>
            <option value="US">United States</option>
            <option value="UK">United Kingdom</option>
            <option value="JP">Japan</option>
            <option value="DE">Germany</option>
          </select>
          
          <select
            value={hasVoice?.toString() || ''}
            onChange={(e) => setHasVoice(
              e.target.value === '' ? undefined : e.target.value === 'true'
            )}
            className="rounded-md border-gray-300"
          >
            <option value="">All Types</option>
            <option value="false">Data Only</option>
            <option value="true">Data + Voice</option>
          </select>
          
          <button className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-md">
            <Filter className="w-4 h-4" />
            More Filters
          </button>
        </div>
      </div>

      {/* Packages Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 h-64 rounded-lg"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPackages.map((pkg) => (
            <PackageCard
              key={`${pkg.providerId}-${pkg.id}`}
              package={pkg}
              onSelect={handleSelectPackage}
            />
          ))}
        </div>
      )}

      {filteredPackages.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-gray-500">No packages found matching your criteria</p>
        </div>
      )}
    </div>
  );
};