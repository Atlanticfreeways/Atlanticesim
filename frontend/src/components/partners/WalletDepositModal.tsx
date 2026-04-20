import React, { useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { useMutation, useQueryClient } from 'react-query';
import { partnersApi } from '../../services/api';
import { DollarSign, CreditCard, Wallet, CheckCircle2 } from 'lucide-react';

interface WalletDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AMOUNTS = [50, 100, 500, 1000];

export const WalletDepositModal: React.FC<WalletDepositModalProps> = ({ isOpen, onClose }) => {
  const [amount, setAmount] = useState<number>(100);
  const [step, setStep] = useState<'amount' | 'payment' | 'success'>('amount');
  const queryClient = useQueryClient();

  const depositMutation = useMutation((amt: number) => partnersApi.topUpWallet(amt), {
    onSuccess: () => {
      queryClient.invalidateQueries('dashboard');
      setStep('success');
    }
  });

  const handleDeposit = () => {
    depositMutation.mutate(amount);
  };

  const handleClose = () => {
    setStep('amount');
    onClose();
  };

  return (
    <Dialog isOpen={isOpen} onClose={handleClose} title="Fund Your Wallet">
      {step === 'amount' && (
        <div className="space-y-6">
          <div>
            <p className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider">Select Deposit Amount</p>
            <div className="grid grid-cols-2 gap-3">
              {AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setAmount(amt)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    amount === amt 
                      ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-sm' 
                      : 'border-gray-100 hover:border-gray-300 bg-white text-gray-900'
                  }`}
                >
                  <div className="text-2xl font-bold">${amt}</div>
                  <div className="text-sm opacity-50">USD Credit</div>
                </button>
              ))}
            </div>
            
            <div className="mt-4 relative">
              <span className="absolute left-4 top-3 text-gray-400 font-bold">$</span>
              <input 
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-4 py-3 text-lg font-bold focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="Custom Amount"
              />
            </div>
          </div>

          <Button 
            fullWidth 
            size="lg" 
            onClick={() => setStep('payment')}
            disabled={amount < 1}
          >
            Continue to Payment
          </Button>
        </div>
      )}

      {step === 'payment' && (
        <div className="space-y-4">
          <p className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-wider">Select Payment Method</p>
          <button 
            onClick={handleDeposit}
            className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
               <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><CreditCard className="w-6 h-6" /></div>
               <div className="text-left">
                  <p className="font-bold">Cards / Paystack</p>
                  <p className="text-xs text-gray-400">Secure instant deposit</p>
               </div>
            </div>
          </button>
          <button 
            onClick={handleDeposit}
            className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
               <div className="bg-orange-100 p-2 rounded-lg text-orange-600"><Wallet className="w-6 h-6" /></div>
               <div className="text-left">
                  <p className="font-bold">Crypto Checkout</p>
                  <p className="text-xs text-gray-400">BTC, ETH, stablecoins</p>
               </div>
            </div>
          </button>
          
          <Button variant="ghost" fullWidth onClick={() => setStep('amount')}>Back</Button>
        </div>
      )}

      {step === 'success' && (
        <div className="text-center py-8 space-y-4">
          <div className="flex justify-center">
            <div className="bg-green-100 p-4 rounded-full text-green-600">
               <CheckCircle2 className="w-12 h-12" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Deposit Success!</h3>
            <p className="text-gray-500">Your wallet has been credited with ${amount}.00</p>
          </div>
          <Button fullWidth onClick={handleClose}>Back to Dashboard</Button>
        </div>
      )}
    </Dialog>
  );
};
