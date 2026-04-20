import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { packagesApi, ordersApi } from '../services/api';
import { Wifi, Phone, MessageSquare, Globe, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const PackageDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const providerId = new URLSearchParams(window.location.search).get('providerId');

    const { data: pkg, isLoading } = useQuery(['package', id], () => 
        packagesApi.getDetails(id!, providerId!)
    );

    const handleBuyNow = async () => {
        try {
            await ordersApi.create(id!, providerId!);
            navigate('/dashboard');
        } catch (error) {
            console.error('Order creation failed');
        }
    };

    if (isLoading) return <div className="p-20 text-center text-gray-400 animate-pulse font-bold text-2xl">Loading Package Intelligence...</div>;
    if (!pkg?.data) return <div>Package not found</div>;

    const pack = pkg.data;

    return (
        <div className="max-w-6xl mx-auto py-10 px-4 space-y-10">
            {/* Top Navigation */}
            <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-2 font-medium">
                ← Back to Packages
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-5">
                            <Globe className="w-40 h-40" />
                        </div>

                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h1 className="text-4xl font-extrabold text-gray-900 mb-2">{pack.name}</h1>
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                    <span className="bg-gray-100 px-3 py-1 rounded-full font-bold uppercase">{pack.providerName}</span>
                                    <span>•</span>
                                    <span>Institutional Grade Network</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Data</p>
                                <p className="text-xl font-bold text-blue-900">{pack.dataAmount} {pack.dataUnit}</p>
                            </div>
                            <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
                                <p className="text-[10px] font-bold text-green-400 uppercase tracking-widest mb-1">Validity</p>
                                <p className="text-xl font-bold text-green-900">{pack.validityDays} Days</p>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100">
                                <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1">Network</p>
                                <p className="text-xl font-bold text-purple-900">LTE / 5G</p>
                            </div>
                            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                                <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-1">Price</p>
                                <p className="text-xl font-bold text-amber-900">${pack.price}</p>
                            </div>
                        </div>

                        <div className="prose prose-blue max-w-none text-gray-600">
                            <p>{pack.description}</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                             <Globe className="w-5 h-5 text-blue-500" /> Coverage Details
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {pack.countries.map(c => (
                                <span key={c} className="bg-gray-50 border border-gray-100 px-4 py-2 rounded-xl text-sm font-medium text-gray-700">
                                    {c}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar Checkout */}
                <div className="space-y-6">
                    <div className="bg-gray-900 rounded-3xl p-8 text-white shadow-2xl relative">
                        <div className="space-y-6">
                            <div className="flex justify-between items-center text-sm text-gray-400 uppercase font-bold tracking-widest">
                                <span>Total Price</span>
                                <span className="p-1 bg-blue-500 rounded text-white"><Zap className="w-3 h-3 fill-current" /></span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-extrabold">${pack.price}</span>
                                <span className="text-gray-400 font-bold">{pack.currency}</span>
                            </div>

                            <ul className="space-y-4 pt-4">
                                <li className="flex items-center gap-3 text-sm text-gray-300">
                                    <CheckCircle2 className="w-4 h-4 text-blue-400" />
                                    Instant QR Code Delivery
                                </li>
                                <li className="flex items-center gap-3 text-sm text-gray-300">
                                    <CheckCircle2 className="w-4 h-4 text-blue-400" />
                                    No ID registration required
                                </li>
                                <li className="flex items-center gap-3 text-sm text-gray-300">
                                    <CheckCircle2 className="w-4 h-4 text-blue-400" />
                                    Valid for 90 days after purchase
                                </li>
                            </ul>

                            <Button 
                                fullWidth 
                                size="lg" 
                                onClick={handleBuyNow}
                                className="bg-blue-500 hover:bg-blue-400 text-white font-black py-4 text-lg rounded-2xl shadow-[0_10px_40px_rgba(59,130,246,0.3)]"
                            >
                                BUY NOW
                            </Button>

                            <p className="text-[10px] text-gray-500 text-center uppercase font-bold tracking-widest">
                                Powered by AI Smart-Select™ Routing
                            </p>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl p-6 border border-gray-100 text-center">
                         <ShieldCheck className="w-8 h-8 text-green-500 mx-auto mb-4" />
                         <h4 className="font-bold text-gray-900 mb-1 text-sm">Security Guaranteed</h4>
                         <p className="text-xs text-gray-400">All data packets are encrypted and prioritized on the global backbone.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
