import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Plus, Minus, UserCircle, Truck } from 'lucide-react';
import useStore from '../store/useStore';
import { calculateOrderTotals, hydrateOrderItemWithProduct } from '../utils/orderPricing';

const QuickSaleDrawer = ({ isOpen, onClose, onComplete, initialCustomer = null }) => {
    const { products, addOrder, subscribers, couriers } = useStore();
    const [cart, setCart] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState('Nakit');
    const [customer, setCustomer] = useState(initialCustomer || { name: 'Hızlı Satış (Gel-Al)', guest: true });
    const [selectedCourierId, setSelectedCourierId] = useState('');

    useEffect(() => {
        if (initialCustomer) {
            setTimeout(() => setCustomer(initialCustomer), 0);
        }
    }, [initialCustomer]);

    if (!isOpen) return null;

    const addToCart = (product) => {
        const existing = cart.find(item => item.id === product.id);
        if (existing) {
            setCart(cart.map(item =>
                item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            ));
        } else {
            setCart([...cart, { ...product, quantity: 1, includeDeposit: false }]);
        }
    };

    const removeFromCart = (productId) => {
        const existing = cart.find(item => item.id === productId);
        if (!existing) return;

        if (existing.quantity > 1) {
            setCart(cart.map(item =>
                item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
            ));
        } else {
            setCart(cart.filter(item => item.id !== productId));
        }
    };

    const totals = calculateOrderTotals(cart.map((item) => ({
        price: item.price,
        depositFee: item.depositFee,
        quantity: item.quantity,
        includeDeposit: item.includeDeposit,
    })));
    const totalAmount = totals.productTotal;
    const totalDeposit = totals.depositTotal;

    const toggleDeposit = (productId, checked) => {
        setCart((current) => current.map((item) => (
            item.id === productId ? { ...item, includeDeposit: checked } : item
        )));
    };

    const handleComplete = async () => {
        for (const item of cart) {
            let courierName = 'Gel-Al';
            if (selectedCourierId) {
                const c = couriers.find(c => c.id === selectedCourierId);
                if (c) courierName = c.name;
            }

            const hydrated = hydrateOrderItemWithProduct(item, {
                quantity: item.quantity,
                includeDeposit: Boolean(item.includeDeposit),
            });
            const lineTotals = calculateOrderTotals([hydrated]);

            await addOrder({
                customer: customer.name,
                customerId: customer.id || null,
                phone: customer.phone || '',
                address: customer.address || '',
                product: `${item.name}${hydrated.includeDeposit ? ' (Depozitolu)' : ''}`,
                productId: item.id,
                items: [{
                    productId: hydrated.productId,
                    name: hydrated.name,
                    price: hydrated.price,
                    quantity: hydrated.quantity,
                    depositFee: hydrated.depositFee,
                    includeDeposit: hydrated.includeDeposit,
                }],
                quantity: hydrated.quantity,
                amount: lineTotals.amount,
                productTotal: lineTotals.productTotal,
                depositTotal: lineTotals.depositTotal,
                depositFee: hydrated.depositFee || 0,
                includeDeposit: hydrated.includeDeposit,
                courier: courierName,
                paymentMethod: paymentMethod,
                hasInvoice: false,
                status: courierName === 'Gel-Al' ? 'Tamamlandı' : 'Kurye Yolda',
                date: new Date().toISOString()
            });
        }

        onComplete(cart, totals.amount);
        setCart([]);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[200] flex justify-end">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}></div>
            <div className="relative bg-white w-full h-[100dvh] md:h-full max-w-5xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-right duration-500">
                {/* Header - Reduced padding */}
                <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-brand-primary rounded-2xl text-white shadow-lg shadow-brand-primary/20">
                            <ShoppingBag size={20} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight font-display">
                                {customer.guest ? 'Hızlı Satış (Gel-Al)' : 'Yeni Sipariş Oluştur'}
                            </h3>
                            <p className="text-xs text-slate-500 font-medium truncate max-w-[200px] md:max-w-none">
                                {customer.name} - {customer.phone || 'Misafir Müşteri'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2.5 bg-white rounded-xl text-slate-400 hover:text-slate-600 shadow-sm transition-colors border border-slate-100">
                        <X size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto md:overflow-hidden flex flex-col md:flex-row pb-20 md:pb-0">
                    {/* Product Grid - Efficient padding */}
                    <div className="w-full md:flex-1 p-4 sm:p-6 overflow-y-auto border-b md:border-b-0 md:border-r border-slate-100 bg-white/50 min-h-[50vh] md:min-h-0">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Ürün Kataloğu</h4>
                            <span className="text-[10px] font-bold text-brand-primary bg-brand-primary/10 px-3 py-1 rounded-full">{products.length} Ürün</span>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3">
                            {products.map(product => (
                                <button
                                    key={product.id}
                                    onClick={() => addToCart(product)}
                                    className="premium-card p-3.5 text-left group hover:border-brand-primary transition-all active:scale-95 bg-white"
                                >
                                    <div className="font-black text-slate-900 mb-1 text-sm group-hover:text-brand-primary transition-colors truncate">{product.name}</div>
                                    <div className="flex justify-between items-end mt-2">
                                        <div className="text-base font-black text-slate-800 font-display">₺{product.price}</div>
                                        <div className="p-1 bg-slate-50 rounded-lg text-slate-400 group-hover:bg-brand-primary group-hover:text-white transition-all">
                                            <Plus size={14} />
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Order Sidebar - Optimized layout */}
                    <div className="w-full md:w-[26rem] p-4 bg-slate-50 flex flex-col border-l border-slate-100 md:overflow-hidden min-h-[60vh] md:min-h-0">
                        <div className="flex-1 md:overflow-y-auto space-y-4 pr-1 scrollbar-hide pb-4">
                            {/* Selections Section */}
                            <div className="space-y-3">
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 px-1 flex items-center gap-1.5"><UserCircle size={12} /> Hızlı Müşteri Seçimi</label>
                                    <select
                                        className="w-full p-3 bg-white border border-slate-100 rounded-xl font-bold text-xs outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 transition-all shadow-sm text-slate-700"
                                        value={customer.id || ''}
                                        onChange={(e) => {
                                            if (e.target.value === '') {
                                                setCustomer({ name: 'Hızlı Satış (Gel-Al)', guest: true });
                                            } else {
                                                const sub = subscribers.find(s => s.id === e.target.value);
                                                if (sub) setCustomer(sub);
                                            }
                                        }}
                                    >
                                        <option value="">Misafir (İsimsiz Satış)</option>
                                        {subscribers.map(sub => (
                                            <option key={sub.id} value={sub.id}>{sub.name} - {sub.phone}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 px-1 flex items-center gap-1.5"><Truck size={12} /> Kurye Ataması</label>
                                    <select
                                        className="w-full p-3 bg-white border border-slate-100 rounded-xl font-bold text-xs outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 transition-all shadow-sm text-slate-700"
                                        value={selectedCourierId}
                                        onChange={(e) => setSelectedCourierId(e.target.value)}
                                    >
                                        <option value="">Gel-Al (Kuryesiz Teslimat)</option>
                                        {couriers.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Sepet ({cart.length})</h4>
                                {cart.length > 0 && (
                                    <button onClick={() => setCart([])} className="text-[9px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-600">Temizle</button>
                                )}
                            </div>

                            <div className="space-y-2">
                                {cart.length === 0 ? (
                                    <div className="py-8 flex flex-col items-center justify-center opacity-30">
                                        <ShoppingBag size={32} className="mb-2 text-slate-300" />
                                        <p className="text-xs font-bold text-slate-400">Sepetiniz boş</p>
                                    </div>
                                ) : (
                                    cart.map(item => (
                                        <div key={item.id} className="premium-card p-3 bg-white border border-slate-100 shadow-none">
                                            <div className="text-[13px] font-black text-slate-900 mb-2 truncate">{item.name}</div>
                                            <div className="flex justify-between items-center">
                                                <div className="text-brand-primary font-black font-display text-sm">₺{(Number(item.price || 0) + (item.includeDeposit ? Number(item.depositFee || 0) : 0)) * item.quantity}</div>
                                                <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100 shadow-inner">
                                                    <button onClick={() => removeFromCart(item.id)} className="p-1 bg-white text-slate-400 hover:text-rose-500 rounded-lg shadow-sm transition-colors">
                                                        <Minus size={12} />
                                                    </button>
                                                    <span className="text-[13px] font-black w-5 text-center text-slate-800">{item.quantity}</span>
                                                    <button onClick={() => addToCart(item)} className="p-1 bg-white text-slate-400 hover:text-brand-primary rounded-lg shadow-sm transition-colors">
                                                        <Plus size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                            {Number(item.depositFee || 0) > 0 && (
                                                <label className="mt-3 flex items-center justify-between gap-4 rounded-xl border border-orange-100 bg-orange-50/60 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-orange-600">
                                                    <span>Depozito Var</span>
                                                    <input
                                                        type="checkbox"
                                                        className="h-4 w-4 accent-orange-500"
                                                        checked={Boolean(item.includeDeposit)}
                                                        onChange={(e) => toggleDeposit(item.id, e.target.checked)}
                                                    />
                                                </label>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Payment & Action Section - Fixed at bottom for MD, appended for mobile scroll */}
                        <div className="mt-auto pt-4 border-t border-slate-200 space-y-4 bg-slate-50 flex-shrink-0 pb-10 md:pb-0">
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Ödeme Tipi</label>
                                <div className="grid grid-cols-4 gap-1.5">
                                    {['Nakit', 'POS', 'IBAN', 'Veresiye'].map(method => (
                                        <button
                                            key={method}
                                            onClick={() => setPaymentMethod(method)}
                                            className={`py-2 px-1 rounded-xl text-[10px] font-black transition-all border-2 ${paymentMethod === method
                                                ? 'bg-slate-900 border-slate-900 text-white shadow-lg translate-y-[-1px]'
                                                : 'bg-white border-transparent text-slate-400 hover:border-slate-200'
                                                }`}
                                        >
                                            {method}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1.5 bg-white p-3 rounded-2xl border border-slate-100">
                                <div className="flex justify-between items-center text-slate-500">
                                    <span className="text-[9px] font-black uppercase tracking-widest">Ara Toplam</span>
                                    <span className="font-bold text-xs">₺{totalAmount}</span>
                                </div>
                                {totalDeposit > 0 && (
                                    <div className="flex justify-between items-center text-orange-500">
                                        <span className="text-[9px] font-black uppercase tracking-widest">Depozito</span>
                                        <span className="font-bold text-xs">₺{totalDeposit}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-100">
                                    <span className="text-slate-900 font-black text-[11px] uppercase tracking-widest">Genel Toplam</span>
                                    <span className="text-2xl font-black text-slate-900 font-display tracking-tighter">₺{totals.amount}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleComplete}
                                disabled={cart.length === 0}
                                className="w-full bg-brand-primary text-white font-black py-4 rounded-2xl shadow-xl shadow-brand-primary/20 hover:shadow-brand-primary/30 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:grayscale disabled:scale-100"
                            >
                                SİPARİŞİ TAMAMLA
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuickSaleDrawer;
