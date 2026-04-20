import React, { useState } from 'react';
import { useQuery, useMutation } from 'react-query';
import { partnersApi } from '../services/api';
import { Share2, Save, Activity, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const WebhookPage: React.FC = () => {
  const [url, setUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [events, setEvents] = useState<string[]>(['order.completed', 'order.failed']);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success'>('idle');

  const { data: profile } = useQuery('webhook-config', () => partnersApi.getProfile(), {
    onSuccess: (data) => {
      if (data.data.webhookUrl) setUrl(data.data.webhookUrl);
      // We don't fetch the secret for security, user must rotation to see it
    },
  });

  const saveMutation = useMutation(() => 
    partnersApi.updateWebhook(url, secret, events), 
    {
      onSuccess: () => {
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    }
  );

  const availableEvents = [
    { id: 'order.completed', label: 'Order Completed', desc: 'Sent when eSIM is ready' },
    { id: 'order.failed', label: 'Order Failed', desc: 'Sent after all activation retries fail' },
    { id: 'esim.depleted', label: 'ESIM Depleted', desc: 'Sent when usage reaches 0MB' },
    { id: 'wallet.low', label: 'Low Balance', desc: 'Sent when wallet drops below $50' },
  ];

  const toggleEvent = (id: string) => {
    setEvents(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8">
      <div className="flex items-center gap-4">
        <div className="bg-purple-600 p-3 rounded-2xl">
          <Share2 className="text-white w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Webhooks</h1>
          <p className="text-gray-500">Enable real-time push notifications for your server</p>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm space-y-8">
        {/* Endpoint Config */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Payload URL</label>
            <input 
              type="url" 
              placeholder="https://your-server.com/webhooks"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Secret Key (for HMAC signing)</label>
            <input 
              type="password" 
              placeholder="••••••••••••••••"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm"
            />
          </div>
        </div>

        {/* Event Subscription */}
        <div className="space-y-4">
          <label className="text-sm font-bold text-gray-700 font-bold block">Event Subscriptions</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableEvents.map(event => (
              <div 
                key={event.id}
                onClick={() => toggleEvent(event.id)}
                className={`p-4 border rounded-2xl cursor-pointer transition-all flex items-center gap-4 ${events.includes(event.id) ? 'border-purple-500 bg-purple-50' : 'hover:bg-gray-50'}`}
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${events.includes(event.id) ? 'bg-purple-500 border-purple-500' : 'border-gray-300'}`}>
                   {events.includes(event.id) && <CheckCircle2 className="text-white w-4 h-4" />}
                </div>
                <div>
                  <p className="font-bold text-sm text-gray-900">{event.label}</p>
                  <p className="text-xs text-gray-400">{event.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-6 border-t flex justify-between items-center">
            <div className="flex items-center gap-2 text-gray-400 text-xs">
                <ShieldAlert className="w-4 h-4" />
                All payloads are signed with HMAC-SHA256
            </div>
            <button 
              onClick={() => saveMutation.mutate()}
              className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700 transition-all shadow-lg active:scale-95"
            >
              {saveStatus === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
              {saveStatus === 'success' ? 'Saved!' : 'Save Config'}
            </button>
        </div>
      </div>

      <div className="flex items-center gap-6 p-6 border rounded-2xl bg-gray-50">
        <Activity className="w-10 h-10 text-gray-300" />
        <div>
          <p className="font-bold text-gray-900">Webhook Logging</p>
          <p className="text-sm text-gray-500">Coming soon: View delivery history and retry logs for your endpoint.</p>
        </div>
      </div>
    </div>
  );
};
