import React from 'react';
import { Dialog } from '../ui/Dialog';
import { QRCodeSVG } from 'qrcode.react';

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  esimId: string;
  qrCodeValue: string;
}

export const QRModal: React.FC<QRModalProps> = ({ isOpen, onClose, esimId, qrCodeValue }) => {
  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Scan eSIM QR Code">
      <div className="flex flex-col items-center space-y-6">
        <div className="p-4 bg-white rounded-2xl shadow-inner-lg border border-gray-100">
          <QRCodeSVG value={qrCodeValue} size={256} level="H" includeMargin={true} />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-500 mb-1">eSIM ID</p>
          <code className="px-3 py-1 bg-gray-100 rounded-md text-sm text-blue-600 font-bold uppercase tracking-wider">
            {esimId}
          </code>
        </div>
        <p className="text-sm text-gray-400 text-center px-4 leading-relaxed">
          Open your device's Camera or Mobile Data settings and scan this code to install your eSIM.
        </p>
        <button 
          onClick={onClose}
          className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-200"
        >
          Done
        </button>
      </div>
    </Dialog>
  );
};
