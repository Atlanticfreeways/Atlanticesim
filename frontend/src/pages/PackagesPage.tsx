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
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const { data: packages, isLoading } = useQuery(
    ['packages', { countries: selectedCountry, hasVoice }],
    () => packagesApi.search({ 
      countries: selectedCountry || undefined,
      hasVoice 
    })
  );
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
      {/* Header Section */}
      <div className="bg-gradient-to-br from-blue-700 to-indigo-900 rounded-[2rem] p-10 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-4xl font-extrabold mb-4 tracking-tight">Find Your Global Connection</h1>
          <p className="text-blue-100 text-lg mb-8 opacity-90">Compare 500+ eSIM routes across 190 countries. AI-optimized for the best speed and price.</p>
          
          <div className="flex flex-col md:flex-row gap-2 bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20">
            <div className="flex-1 relative">
                <Search className="absolute left-4 top-3.5 w-5 h-5 text-blue-200" />
                <input
                  type="text"
                  placeholder="Where are you going?"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-transparent border-none text-white placeholder:text-blue-200 focus:ring-0 pl-12 py-3 text-lg"
                />
            </div>
            <button className="bg-blue-500 hover:bg-blue-400 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-lg active:scale-95">
                Search
            </button>
          </div>
        </div>
        <div className="absolute right-[-50px] top-[-50px] w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap items-center gap-4 py-2">
           <div className="flex items-center gap-2 bg-white border border-gray-100 px-4 py-2 rounded-full shadow-sm">
                <span className="text-xs font-bold text-gray-400 uppercase">Country</span>
                <select
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className="border-none bg-transparent text-sm font-bold text-gray-900 focus:ring-0 p-0"
                >
                    <option value="">All Regions</option>
                    <option value="US">USA</option>
                    <option value="UK">United Kingdom</option>
                    <option value="JP">Japan</option>
                    <option value="DE">Germany</option>
                    <option value="FR">France</option>
                </select>
           </div>

           <div className="flex items-center gap-2 bg-white border border-gray-100 px-4 py-2 rounded-full shadow-sm">
                <span className="text-xs font-bold text-gray-400 uppercase">Plan Type</span>
                <div className="flex gap-1">
                    <button 
                        onClick={() => setHasVoice(undefined)}
                        className={`text-xs px-3 py-1 rounded-full transition-all ${hasVoice === undefined ? 'bg-blue-600 text-white' : 'hover:bg-gray-50'}`}
                    >
                        All
                    </button>
                    <button 
                        onClick={() => setHasVoice(false)}
                        className={`text-xs px-3 py-1 rounded-full transition-all ${hasVoice === false ? 'bg-blue-600 text-white' : 'hover:bg-gray-50'}`}
                    >
                        Data Only
                    </button>
                    <button 
                        onClick={() => setHasVoice(true)}
                        className={`text-xs px-3 py-1 rounded-full transition-all ${hasVoice === true ? 'bg-blue-600 text-white' : 'hover:bg-gray-50'}`}
                    >
                        Voice + Data
                    </button>
                </div>
           </div>

           <button 
            onClick={() => setIsFilterDrawerOpen(true)}
            className="ml-auto flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-full font-bold text-sm hover:bg-gray-800 transition-all shadow-md active:scale-95"
           >
            <Filter className="w-4 h-4" />
            Advanced Filters
           </button>
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