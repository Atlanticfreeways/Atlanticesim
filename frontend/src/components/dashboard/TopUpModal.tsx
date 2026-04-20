import React, { useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  esimId: string;
  onTopUp: (amount: string) => void;
}

const TOPUP_OPTIONS = [
  { id: '1gb', label: '1 GB', price: '$5.00' },
  { id: '3gb', label: '3 GB', price: '$12.00' },
  { id: '5gb', label: '5 GB', price: '$18.00' },
  { id: '10gb', label: '10 GB', price: '$30.00' },
];

export const TopUpModal: React.FC<TopUpModalProps> = ({ isOpen, onClose, esimId, onTopUp }) => {
  const [selected, setSelected] = useState(TOPUP_OPTIONS[1].id);

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Top Up Data">
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-4 uppercase tracking-wider">Select Data Bundle</p>
          <div className="grid grid-cols-2 gap-3">
            {TOPUP_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSelected(opt.id)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  selected === opt.id 
                    ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-sm' 
                    : 'border-gray-100 hover:border-gray-300 bg-white text-gray-900'
                }`}
              >
                <div className="text-lg font-bold">{opt.label}</div>
                <div className="text-sm opacity-70">{opt.price}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
          <p className="text-xs text-blue-600 font-medium leading-relaxed">
            New data will be added to your existing eSIM ({esimId}). The validity period will be extended based on the bundle chosen.
          </p>
        </div>

        <div className="flex space-x-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={() => onTopUp(selected)}>
            Add Data Now
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
