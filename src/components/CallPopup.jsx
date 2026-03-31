import React, { useState } from 'react';
import { Phone, UserPlus, ShoppingBag, X } from 'lucide-react';
import useStore from '../store/useStore';
import { calculateOrderTotals } from '../utils/orderPricing';

const CallPopup = () => {
    const { subscribers, addOrder, addSubscriber } = useStore();
    const [incomingCall, setIncomingCall] = useState(null);
    const [callerData, setCallerData] = useState(null);
    const [isMinimized, setIsMinimized] = useState(false);
    const [includeDeposit, setIncludeDeposit] = useState(false);

    const triggerFakeCall = () => {
        const isKnown = Math.random() > 0.3;
        if (isKnown && subscribers.length > 0) {
            const randomSub = subscribers[Math.floor(Math.random() * subscribers.length)];
            setIncomingCall(randomSub.phone);
            setCallerData(randomSub);
        } else {
            const randomNum = `05${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 90) + 10}`;
            setIncomingCall(randomNum);
            setCallerData(null);
        }
        setIsMinimized(false);
        setIncludeDeposit(false);
    };

    const handleQuickOrder = () => {
        if (!callerData) return;

        const totals = calculateOrderTotals([{ name: 'Damacana 19L', quantity: 1, price: 100, depositFee: 0, includeDeposit }]);

        addOrder({
            customerId: callerData.id,
            customer: callerData.name,
            address: callerData.address,
            product: `Damacana 19L${includeDeposit ? ' (Depozitolu)' : ''}`,
            items: [{ name: 'Damacana 19L', quantity: 1, price: 100, depositFee: 0, includeDeposit }],
            quantity: 1,
            amount: totals.amount,
            productTotal: totals.productTotal,
            depositTotal: totals.depositTotal,
            paymentMethod: 'Nakit',
            status: 'Hazırlanıyor',
        });

        setIncomingCall(null);
        setIncludeDeposit(false);
        useStore.getState().addNotification(`Sipariş Oluşturuldu: ${callerData.name}`, 'success');
    };

    const handleNewSubscriber = () => {
        const newSub = {
            id: `B-${Date.now().toString().slice(-4)}`,
            name: 'Yeni Müşteri (Hızlı Kayıt)',
            phone: incomingCall,
            address: 'Hızlı Kayıt Adresi',
            status: 'Active',
            plan: 'Basic',
        };
        addSubscriber(newSub);
        setCallerData(newSub);
        useStore.getState().addNotification('Yeni abone kaydedildi!', 'success');
    };

    const handleClose = () => {
        setIncomingCall(null);
        setCallerData(null);
        setIncludeDeposit(false);
    };

    if (!incomingCall) {
        return (
            <button
                onClick={triggerFakeCall}
                className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-slate-800 p-3 text-white shadow-lg transition-all hover:bg-slate-700"
                title="Simulate Fake Call"
            >
                <Phone size={20} className="animate-pulse" />
                <span className="text-xs font-bold">Fake Call</span>
            </button>
        );
    }

    return (
        <div className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${isMinimized ? 'h-16 w-16' : 'w-80'}`}>
            {isMinimized ? (
                <button
                    onClick={() => setIsMinimized(false)}
                    className="flex h-full w-full items-center justify-center rounded-full bg-green-500 text-white shadow-xl animate-bounce"
                >
                    <Phone size={24} />
                </button>
            ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                    <div className="flex items-start justify-between bg-slate-900 p-4 text-white">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 animate-pulse">
                                <Phone size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Gelen Arama</p>
                                <h3 className="text-lg font-bold leading-tight">
                                    {callerData ? callerData.name : incomingCall}
                                </h3>
                                {callerData && <p className="text-xs text-slate-300">{callerData.phone}</p>}
                            </div>
                        </div>
                        <button onClick={() => setIsMinimized(true)} className="text-slate-400 hover:text-white">
                            <span className="text-xl font-bold">-</span>
                        </button>
                    </div>

                    <div className="bg-slate-50 p-4">
                        {callerData ? (
                            <div className="space-y-3">
                                <div className="rounded border border-slate-200 bg-white p-2 text-xs">
                                    <span className="font-bold text-slate-700">Adres:</span> {callerData.address}
                                </div>

                                <button
                                    onClick={handleQuickOrder}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3 font-bold text-white shadow-lg shadow-green-200 transition-transform active:scale-95 hover:bg-green-700"
                                >
                                    <ShoppingBag size={18} />
                                    Hızlı Sipariş (1 Damacana)
                                </button>

                                <label className="flex items-center justify-between gap-3 rounded-xl border border-orange-100 bg-white p-3 text-[10px] font-black uppercase tracking-wider text-orange-600">
                                    <span>Depozito Var</span>
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 accent-orange-500"
                                        checked={includeDeposit}
                                        onChange={(e) => setIncludeDeposit(e.target.checked)}
                                    />
                                </label>

                                <button className="w-full rounded-xl border border-slate-300 bg-white py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                                    Detaylı Sipariş Oluştur
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="p-4 text-center">
                                    <p className="mb-2 text-slate-600">Bu numara kayıtlı değil.</p>
                                    <button
                                        onClick={handleNewSubscriber}
                                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700"
                                    >
                                        <UserPlus size={18} />
                                        Yeni Abone Kaydet
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between bg-slate-100 p-2">
                        <button
                            onClick={handleClose}
                            className="flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-xs font-medium text-red-500 hover:bg-red-50"
                        >
                            <X size={14} /> Reddet
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CallPopup;
