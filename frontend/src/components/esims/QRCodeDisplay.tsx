import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode.react';
import { esimsApi } from '../../services/api';
import { Download } from 'lucide-react';

interface QRCodeDisplayProps {
  esimId: string;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ esimId }) => {
  const [qrCode, setQrCode] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQrCode = async () => {
      try {
        const { data } = await esimsApi.getQrCode(esimId);
        setQrCode(data.qrCode);
      } catch (error) {
        console.error('Failed to fetch QR code:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQrCode();
  }, [esimId]);

  const downloadQrCode = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const url = canvas.toDataURL();
      const a = document.createElement('a');
      a.href = url;
      a.download = `esim-${esimId}.png`;
      a.click();
    }
  };

  if (loading) {
    return <div className="animate-pulse bg-gray-200 w-64 h-64 rounded"></div>;
  }

  return (
    <div className="text-center">
      <div className="bg-white p-4 rounded-lg shadow inline-block">
        <QRCode value={qrCode} size={256} />
      </div>
      
      <div className="mt-4">
        <button
          onClick={downloadQrCode}
          className="flex items-center gap-2 mx-auto bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
        >
          <Download className="w-4 h-4" />
          Download QR Code
        </button>
      </div>
      
      <p className="text-sm text-gray-600 mt-2">
        Scan this QR code with your device to install the eSIM
      </p>
    </div>
  );
};