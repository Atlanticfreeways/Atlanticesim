import React, { useState } from 'react';
import { useQuery, useMutation } from 'react-query';
import { partnersApi } from '../services/api';
import { Key, RotateCcw, Copy, Eye, EyeOff, ShieldCheck } from 'lucide-react';

export const ApiKeyPage: React.FC = () => {
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: profile, refetch } = useQuery('partner-profile', () => partnersApi.getProfile());

  const rotateMutation = useMutation(() => partnersApi.regenerateApiKey(), {
    onSuccess: () => {
      refetch();
      setShowKey(true);
    },
  });

  const handleCopy = () => {
    if (profile?.data?.apiKey) {
      navigator.clipboard.writeText(profile.data.apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRotate = () => {
    if (window.confirm('Are you sure? Rotating your API key will immediately invalidate the old one.')) {
      rotateMutation.mutate();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8">
      <div className="flex items-center gap-4">
        <div className="bg-blue-600 p-3 rounded-2xl">
          <Key className="text-white w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Developer API Keys</h1>
          <p className="text-gray-500">Manage keys for your machine-to-machine integrations</p>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
        <div className="flex items-center gap-2 text-green-600 font-bold mb-6">
          <ShieldCheck className="w-5 h-5" />
          Production Environment
        </div>

        <div className="space-y-4">
          <label className="text-sm font-bold text-gray-700">Your x-api-key</label>
          <div className="flex gap-2">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-mono text-sm flex items-center justify-between">
              <span className={showKey ? 'text-gray-900' : 'text-gray-300'}>
                {showKey ? profile?.data?.apiKey : '••••••••••••••••••••••••••••••••'}
              </span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowKey(!showKey)}
                  className="p-1 hover:bg-gray-200 rounded transition-colors text-gray-400"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button 
                  onClick={handleCopy}
                  className="p-1 hover:bg-gray-200 rounded transition-colors text-gray-400"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          {copied && <p className="text-green-600 text-xs font-medium">Copied to clipboard!</p>}
        </div>

        <div className="mt-8 pt-8 border-t flex justify-between items-center">
          <div>
            <p className="font-bold text-gray-900">Rotate API Key</p>
            <p className="text-sm text-gray-500">Generate a new key if your current one is compromised.</p>
          </div>
          <button 
            onClick={handleRotate}
            disabled={rotateMutation.isLoading}
            className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-xl font-bold hover:bg-red-100 transition-colors"
          >
            <RotateCcw className={`w-4 h-4 ${rotateMutation.isLoading ? 'animate-spin' : ''}`} />
            Rotate Key
          </button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
        <h3 className="font-bold text-blue-900 mb-2">Integration Guide</h3>
        <p className="text-sm text-blue-700 leading-relaxed">
          To use our API, include your x-api-key in the request header. 
          Authentication is stateless and valid for all B2B aggregation endpoints.
        </p>
        <code className="block mt-4 bg-white/50 p-3 rounded-lg font-mono text-xs text-blue-900">
          curl -H "x-api-key: YOUR_KEY" https://api.atlantic-esim.com/v1/packages
        </code>
      </div>
    </div>
  );
};
