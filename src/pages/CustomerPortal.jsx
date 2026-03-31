import React, { useState } from 'react';
import { ShoppingBag, Clock, MapPin, Truck, History, RefreshCcw, Plus, Minus, CreditCard, Wallet, CheckCircle2, Trash2, ShoppingCart, Banknote, CreditCard as IbanIcon, Receipt, Map, Building2, Navigation } from 'lucide-react';
import useStore from '../store/useStore';
import { updateLocationInFirestore } from '../services/firestoreService';
import GoogleMapTracker from '../components/GoogleMapTracker';
import { useEffect } from 'react';
import { normalizeLocation, pickFirstValidLocation } from '../utils/location';
import { calculateOrderTotals, hydrateOrderItemWithProduct } from '../utils/orderPricing';

const CustomerPortal = ({ user, initialTab = 'market' }) => {
    const storeProducts = useStore(state => state.products) || [];
    const products = (storeProducts && storeProducts.length > 0) ? storeProducts : [];
    const orders = useStore(state => state.orders) || [];
    const addOrder = useStore(state => state.addOrder);

    const businesses = useStore(state => state.businesses) || [];
    const selectBusinessForCustomer = useStore(state => state.selectBusinessForCustomer);

    const [selectedBusinessId, setSelectedBusinessId] = useState(null);
    const [userLocation, setUserLocation] = useState(null);

    // Unified location tracking is handled in App.jsx
    useEffect(() => {
        if (user?.location) {
            setUserLocation(user.location);
        }
    }, [user?.location]);

    // Calculate distance between two points
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) return Infinity;
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    // Sort businesses by distance
    const sortedBusinesses = [...businesses].sort((a, b) => {
        if (!userLocation) return 0;
        const normalizedA = normalizeLocation(a.location);
        const normalizedB = normalizeLocation(b.location);
        const distA = calculateDistance(userLocation.lat, userLocation.lng, normalizedA?.lat, normalizedA?.lng);
        const distB = calculateDistance(userLocation.lat, userLocation.lng, normalizedB?.lat, normalizedB?.lng);
        return distA - distB;
    });

    // Filter orders for the current user safely
    // Prioritize customerId for sync, but keep name fallback for legacy/manual entries if they happen to be in state
    const userOrders = orders.filter(o => o.customerId === user?.id || (user?.name && o.customer === user?.name)) || [];
    const activeOrders = userOrders.filter(o => o.status !== 'Teslim Edildi' && o.status !== 'İptal Edildi');
    const lastOrder = userOrders.length > 0 ? [...userOrders].reverse().find(o => o.status === 'Teslim Edildi') : null;

    // Loading state check - if we have no orders but we know we are a customer, wait a bit for sync
    const isInitialLoading = orders.length === 0 && user?.id;

    // Cart and Order State
    const [cart, setCart] = useState({}); // { productId: { quantity, includeDeposit } }
    const [paymentMethod, setPaymentMethod] = useState('Nakit');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [eta, setEta] = useState(null);
    const [etaSeconds, setEtaSeconds] = useState(null);

    const cartItems = Object.entries(cart)
        .map(([id, entry]) => {
            const product = products.find(p => p.id.toString() === id.toString());
            return product ? { ...product, quantity: Number(entry?.quantity || 0), includeDeposit: Boolean(entry?.includeDeposit) } : null;
        })
        .filter(item => item !== null && item.quantity > 0);

    const orderTotals = calculateOrderTotals(cartItems.map((item) => ({
        price: item.price,
        depositFee: item.depositFee,
        quantity: item.quantity,
        includeDeposit: item.includeDeposit,
    })));
    const totalAmount = orderTotals.amount;
    const totalQuantity = orderTotals.quantity;

    const updateCart = (productId, delta) => {
        setCart(prev => {
            const currentEntry = prev[productId] || { quantity: 0, includeDeposit: false };
            const currentQty = Number(currentEntry.quantity || 0);
            const newQty = Math.max(0, currentQty + delta);
            if (newQty === 0) {
                const newCart = { ...prev };
                delete newCart[productId];
                return newCart;
            }
            return { ...prev, [productId]: { ...currentEntry, quantity: newQty } };
        });
    };

    const updateCartDeposit = (productId, includeDeposit) => {
        setCart((prev) => ({
            ...prev,
            [productId]: {
                quantity: Number(prev[productId]?.quantity || 1),
                includeDeposit,
            },
        }));
    };

    const handleCreateOrder = async () => {
        if (cartItems.length === 0) return;

        setIsSubmitting(true);
        try {
            const productDescription = cartItems.map(item => `${item.name} x${item.quantity}`).join(', ');
            const orderItems = cartItems.map((item) => {
                const hydrated = hydrateOrderItemWithProduct(item, {
                    quantity: item.quantity,
                    includeDeposit: Boolean(item.includeDeposit),
                });
                return {
                    productId: hydrated.productId,
                    name: hydrated.name,
                    price: hydrated.price,
                    quantity: hydrated.quantity,
                    depositFee: hydrated.depositFee,
                    includeDeposit: hydrated.includeDeposit,
                };
            });

            const orderData = {
                customerId: user.id || null,
                customer: user.name,
                product: orderItems.map((item) => `${item.name} x${item.quantity}${item.includeDeposit ? ' (Depozitolu)' : ''}`).join(', '),
                items: orderItems,
                quantity: totalQuantity,
                amount: totalAmount,
                productTotal: orderTotals.productTotal,
                depositTotal: orderTotals.depositTotal,
                paymentMethod: paymentMethod,
                date: new Date().toLocaleString('tr-TR'),
                hasInvoice: false,
                status: 'Hazırlanıyor',
                businessId: selectedBusinessId,
                address: user?.address || '',
                phone: user?.phone || '',
                customerLocation: pickFirstValidLocation(userLocation, user?.location)
            };

            await addOrder(orderData);

            setShowSuccess(true);
            setCart({});

            setTimeout(() => setShowSuccess(false), 3000);
        } catch (error) {
            console.error("Order creation failed:", error);
            useStore.getState().addNotification("Sipariş oluşturulurken bir hata oluştu.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReorder = async () => {
        if (!lastOrder) return;

        setIsSubmitting(true);
        try {
            const orderData = {
                ...lastOrder,
                id: undefined, // Let store generate new ID
                date: new Date().toLocaleString('tr-TR'),
                status: 'Hazırlanıyor',
                customerLocation: pickFirstValidLocation(userLocation, user?.location, lastOrder.customerLocation)
            };

            await addOrder(orderData);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (error) {
            console.error("Reorder failed:", error);
            useStore.getState().addNotification("Tekrar sipariş oluşturulurken bir hata oluştu.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReorderSpecific = async (orderToReorder) => {
        if (!orderToReorder) return;

        setIsSubmitting(true);
        try {
            const orderData = {
                ...orderToReorder,
                id: undefined, // Let store generate new ID
                date: new Date().toLocaleString('tr-TR'),
                status: 'Hazırlanıyor',
                hasInvoice: false,
                customerLocation: pickFirstValidLocation(userLocation, user?.location, orderToReorder.customerLocation)
            };

            await addOrder(orderData);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (error) {
            console.error("Reorder failed:", error);
            useStore.getState().addNotification("Tekrar sipariş oluşturulurken bir hata oluştu.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const paymentMethods = [
        { id: 'Nakit', label: 'Nakit', icon: Banknote, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
        { id: 'POS', label: 'POS', icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
        { id: 'IBAN', label: 'IBAN', icon: IbanIcon, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
        { id: 'Veresiye', label: 'Veresiye', icon: Receipt, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' }
    ];

    // STRICT FILTER: Only show products belonging to the selected business
    const filteredProducts = products.filter(p => p.businessId === selectedBusinessId);

    if (isInitialLoading && initialTab !== 'market') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-slate-50">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Siparişler Hesaplanıyor...</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 bg-slate-50 min-h-screen pb-24 md:pb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight font-display">
                        {initialTab === 'market' ? 'Hızlı Sipariş' : 'Sipariş Takibi'}
                    </h1>
                    <p className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-widest mt-1">
                        {initialTab === 'market'
                            ? 'Ürünlerinizi seçin ve hızlıca sipariş oluşturun'
                            : 'Aktif ve geçmiş siparişlerinizi takip edebilirsiniz'}
                    </p>
                </div>
                {showSuccess && (
                    <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-emerald-100 animate-in fade-in zoom-in w-full md:w-auto justify-center">
                        <CheckCircle2 size={16} />
                        SİPARİŞ ALINDI!
                    </div>
                )}
            </div>

            {initialTab === 'market' ? (
                // ... Market view remains same (snipped for brevity in instruction, will replace precisely)
                !selectedBusinessId ? (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                <Building2 size={18} className="text-blue-500" />
                                İşletme Seçimi
                            </h2>
                            {userLocation ? (
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest">Konum Aktif</span>
                                </div>
                            ) : (
                                <button 
                                    onClick={() => {
                                        if (navigator.geolocation) {
                                            navigator.geolocation.getCurrentPosition(
                                                (pos) => {
                                                    const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                                                    setUserLocation(newLoc);
                                                    if (user?.id) {
                                                        import('../services/firestoreService').then(({ updateLocationInFirestore }) => {
                                                            updateLocationInFirestore(user.id, newLoc.lat, newLoc.lng);
                                                        });
                                                    }
                                                },
                                                (err) => {
                                                    console.log("Location acquisition failed silent:", err.message);
                                                },
                                                { enableHighAccuracy: true, timeout: 10000 }
                                            );
                                        }
                                    }}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full border border-slate-200 transition-all"
                                >
                                    <Navigation size={12} />
                                    <span className="text-[10px] font-black uppercase tracking-widest font-sans">Konum Al / Yenile</span>
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {sortedBusinesses.map(business => {
                                const businessLocation = normalizeLocation(business.location);
                                const distance = userLocation
                                    ? calculateDistance(userLocation.lat, userLocation.lng, businessLocation?.lat, businessLocation?.lng)
                                    : null;
                                return (
                                    <div
                                        key={business.id}
                                        onClick={() => {
                                            setSelectedBusinessId(business.id);
                                            selectBusinessForCustomer(business.id);
                                            setCart({});
                                        }}
                                        className="bg-white border border-slate-100 hover:border-brand-primary rounded-3xl p-6 transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer group flex items-center gap-4 relative overflow-hidden"
                                    >
                                        <div className="w-14 h-14 bg-slate-50 rounded-2xl group-hover:bg-blue-50 flex items-center justify-center transition-colors shadow-sm shrink-0">
                                            <Building2 className="text-slate-400 group-hover:text-blue-500 transition-colors" size={28} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight mb-0.5 truncate">{business.name || 'İsimsiz İşletme'}</h3>
                                            <div className="flex items-center gap-2">
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">SİPARİŞE BAŞLA →</p>
                                                {distance !== null && distance !== Infinity ? (
                                                    <span className="text-[9px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                                                        {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`}
                                                    </span>
                                                ) : (
                                                    <span className="text-[9px] font-black text-slate-300 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100 italic">
                                                        Mesafe Yok
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {distance !== null && distance < 2 && (
                                            <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-emerald-500 text-white rounded-lg text-[8px] font-black uppercase tracking-tighter shadow-sm">
                                                <MapPin size={8} /> EN YAKIN
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Products Grid */}
                        <div className="lg:col-span-8 space-y-6">
                            <div className="flex items-center justify-between mb-2">
                                <button
                                    onClick={() => { setSelectedBusinessId(null); setCart({}); }}
                                    className="text-[10px] font-black text-slate-400 hover:text-blue-600 transition-colors flex items-center gap-2 uppercase tracking-widest bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm"
                                >
                                    ← GERİ DÖN
                                </button>
                                <h2 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">MENÜ / ÜRÜNLER</h2>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                {filteredProducts.map(product => {
                                    const qty = Number(cart[product.id]?.quantity || 0);
                                    return (
                                        <div
                                            key={product.id}
                                            className={`bg-white border rounded-[2rem] p-5 transition-all relative overflow-hidden group flex flex-col justify-between min-h-[160px] ${qty > 0 ? 'border-blue-500 ring-4 ring-blue-50 shadow-xl' : 'border-slate-100 hover:border-slate-300 shadow-sm'
                                                }`}
                                        >
                                            <div className="relative z-10">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="font-black text-slate-900 text-sm md:text-base leading-tight uppercase group-hover:text-brand-primary transition-colors tracking-tight">{product.name}</div>
                                                    {qty > 0 && (
                                                        <span className="bg-blue-600 text-white w-7 h-7 flex items-center justify-center rounded-xl text-[10px] font-black shadow-lg">
                                                            {qty}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-slate-400 text-sm font-bold">₺</span>
                                                    <span className="text-slate-900 font-display font-black text-2xl tracking-tighter">{product.price}</span>
                                                </div>
                                                <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1 opacity-60">STOK: {product.stock || 0}</div>
                                            </div>

                                            <div className="mt-4 relative z-10">
                                                {qty > 0 ? (
                                                    <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl w-full justify-between border border-slate-100">
                                                        <button
                                                            onClick={() => updateCart(product.id, -1)}
                                                            className="w-10 h-10 flex items-center justify-center bg-white rounded-xl text-slate-600 hover:text-rose-500 shadow-sm transition-all active:scale-95 border border-slate-100"
                                                        >
                                                            <Minus size={18} />
                                                        </button>
                                                        <span className="font-black text-slate-900 text-lg md:text-xl font-display">{qty}</span>
                                                        <button
                                                            onClick={() => updateCart(product.id, 1)}
                                                            className="w-10 h-10 flex items-center justify-center bg-white rounded-xl text-slate-600 hover:text-brand-primary shadow-sm transition-all active:scale-95 border border-slate-100"
                                                        >
                                                            <Plus size={18} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => updateCart(product.id, 1)}
                                                        className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest hover:bg-brand-primary transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 active:scale-95"
                                                    >
                                                        <Plus size={16} /> SEPETE EKLE
                                                    </button>
                                                )}
                                            </div>

                                            {/* Subtle background decoration */}
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full -mr-12 -mt-12 group-hover:bg-blue-50 transition-colors"></div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Cart Sidebar */}
                        <div className="lg:col-span-4 space-y-6">
                            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden sticky top-8">
                                <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
                                    <div>
                                        <h3 className="flex items-center gap-2 font-bold uppercase tracking-widest text-sm">
                                            <ShoppingCart size={18} className="text-blue-400" />
                                            Sepet Özeti
                                        </h3>
                                        <p className="text-slate-400 text-[10px] font-bold mt-1 uppercase">Güvenli Sipariş</p>
                                    </div>
                                    {cartItems.length > 0 && (
                                        <button onClick={() => setCart({})} className="text-slate-500 hover:text-red-400 transition-colors">
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>

                                <div className="p-6 space-y-6">
                                    {cartItems.length > 0 ? (
                                        <>
                                            <div className="space-y-3 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                                                {cartItems.map(item => (
                                                    <div key={item.id} className="flex justify-between items-center group">
                                                        <div>
                                                            <div className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">{item.name}</div>
                                                            <div className="text-[10px] text-slate-400 font-bold">{item.quantity} Adet × ₺{item.price}</div>
                                                            {Number(item.depositFee || 0) > 0 && (
                                                                <label className="mt-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-wide text-orange-600">
                                                                    <input
                                                                        type="checkbox"
                                                                        className="h-4 w-4 accent-orange-500"
                                                                        checked={Boolean(item.includeDeposit)}
                                                                        onChange={(e) => updateCartDeposit(item.id, e.target.checked)}
                                                                    />
                                                                    Depozito Var
                                                                </label>
                                                            )}
                                                        </div>
                                                        <div className="font-bold text-slate-700">₺{(Number(item.price || 0) + (item.includeDeposit ? Number(item.depositFee || 0) : 0)) * item.quantity}</div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="pt-4 border-t border-dashed border-slate-200">
                                                {orderTotals.depositTotal > 0 && (
                                                    <div className="flex justify-between items-center mb-3">
                                                        <span className="text-orange-500 font-bold uppercase tracking-tighter text-xs">Depozito</span>
                                                        <span className="text-orange-600 font-black">₺{orderTotals.depositTotal}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between items-center mb-6">
                                                    <span className="text-slate-500 font-bold uppercase tracking-tighter">Genel Toplam</span>
                                                    <span className="text-2xl font-black text-slate-900 tracking-tighter">₺{totalAmount}</span>
                                                </div>

                                                <div className="space-y-4">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">ÖDEME YÖNTEMİ</label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {paymentMethods.map(method => (
                                                            <button
                                                                key={method.id}
                                                                onClick={() => setPaymentMethod(method.id)}
                                                                className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all font-bold text-xs ${paymentMethod === method.id
                                                                    ? `${method.border} ${method.bg} ${method.color}`
                                                                    : 'border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-200'
                                                                    }`}
                                                            >
                                                                <method.icon size={16} />
                                                                {method.label}
                                                            </button>
                                                        ))}
                                                    </div>

                                                    <button
                                                        onClick={handleCreateOrder}
                                                        disabled={isSubmitting}
                                                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-100 transition-all transform active:scale-95 flex items-center justify-center gap-3 text-lg mt-4"
                                                    >
                                                        {isSubmitting ? <span className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></span> : <>SİPARİŞİ ONAYLA <Truck size={22} /></>}
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="py-12 text-center space-y-4">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                                                <ShoppingCart size={32} className="text-slate-200" />
                                            </div>
                                            <div className="text-slate-400 font-bold text-sm uppercase">Sepetiniz Boş</div>
                                            <p className="text-xs text-slate-400 px-4">Marketten ürün seçerek hızlıca sipariş oluşturabilirsiniz.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Recent Order Replay */}
                            {lastOrder && (
                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                                    <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-xs uppercase tracking-widest">
                                        <History className="text-green-500" size={16} />
                                        Son Siparişi Tekrarla
                                    </h2>
                                    <div className="bg-green-50/30 rounded-xl p-4 border border-green-100">
                                        <div className="font-bold text-slate-800 text-xs mb-1 truncate">{lastOrder.product}</div>
                                        <div className="text-[10px] text-slate-400 font-bold mb-4">{lastOrder.date}</div>
                                        <button
                                            onClick={handleReorder}
                                            className="w-full bg-white text-green-600 border border-green-200 font-bold py-2 rounded-lg text-[10px] transition-all shadow-sm hover:bg-green-600 hover:text-white flex items-center justify-center gap-2"
                                        >
                                            <RefreshCcw size={12} /> ₺{lastOrder.amount} TEKRARLA
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )
            ) : (
                /* Orders Tracking View */
                <div className="space-y-8">
                    {activeOrders.length > 0 ? (
                        <div className="space-y-6">
                            {activeOrders.map((activeOrder, index) => (
                                <div key={activeOrder.id} className={`bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-white relative overflow-hidden ${index > 0 ? 'opacity-90 scale-[0.98]' : ''}`}>
                                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>

                                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
                                        <div className="md:col-span-8 space-y-8">
                                            <div>
                                                <div className="flex items-center gap-4 mb-4">
                                                    <span className="bg-green-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">AKTİF SİPARİŞ</span>
                                                    <span className="text-slate-400 text-xs font-mono">NO: {activeOrder.orderNumber || (activeOrder.id ? String(activeOrder.id).slice(-8).toUpperCase() : '---')}</span>
                                                </div>
                                                <h3 className="text-4xl font-black uppercase tracking-tighter leading-none">{activeOrder.status}</h3>
                                                <div className="flex items-center gap-2 text-slate-400 mt-2 font-medium">
                                                    <MapPin size={14} className="text-blue-500" />
                                                    <span>{activeOrder.address || 'Adres belirtilmemiş'}</span>
                                                </div>
                                                <p className="text-slate-500 text-[10px] mt-1 font-bold">{activeOrder.date}</p>
                                            </div>

                                            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/5 space-y-4">
                                                <div className="text-lg font-bold text-white leading-relaxed">{activeOrder.product}</div>
                                                <div className="flex items-center gap-6 pt-4 border-t border-white/5">
                                                    <div className="flex items-center gap-2 text-sm font-bold text-white/60">
                                                        <Wallet size={16} className="text-blue-400" /> {activeOrder.paymentMethod}
                                                    </div>
                                                    <div className="text-2xl font-black text-white">₺{activeOrder.amount}</div>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex justify-between text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">
                                                    <span className={activeOrder.status === 'Hazırlanıyor' ? 'text-white' : ''}>Hazırlanıyor</span>
                                                    <span className={activeOrder.status === 'Yolda' ? 'text-white' : ''}>Yolda</span>
                                                    <span className={activeOrder.status === 'Teslim Edildi' ? 'text-white' : ''}>Teslimat</span>
                                                </div>
                                                <div className="h-5 bg-white/5 rounded-full p-1.5">
                                                    <div
                                                        className="h-full bg-blue-500 rounded-full transition-all duration-1000 shadow-[0_0_20px_rgba(59,130,246,0.4)]"
                                                        style={{ width: activeOrder.status === 'Hazırlanıyor' ? '33%' : activeOrder.status === 'Yolda' ? '66%' : '100%' }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="md:col-span-4 flex flex-col items-center justify-center space-y-6">
                                            {(activeOrder.status === 'Yolda' || activeOrder.status === 'Hazırlanıyor') ? (
                                                <div className="w-full h-56 md:h-64 bg-white/5 rounded-2xl overflow-hidden border border-white/10 relative shadow-inner">
                                                    <GoogleMapTracker
                                                        className="min-h-0 rounded-2xl"
                                                        courierLocation={activeOrder.courierLocation}
                                                        customerAddress={activeOrder.address || "İstanbul Merkez"}
                                                        customerLocation={pickFirstValidLocation(user?.location, userLocation, activeOrder.customerLocation)}
                                                        businessAddress={businesses.find(b => b.id === activeOrder.businessId)?.address || "İstanbul Merkez"}
                                                        businessLocation={businesses.find(b => b.id === activeOrder.businessId)?.location}
                                                        onTimeEstimate={(time, seconds) => { setEta(time); setEtaSeconds(seconds); }}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-32 h-32 bg-blue-600 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl shadow-blue-500/20 transform rotate-3">
                                                    <Truck size={64} strokeWidth={2} />
                                                </div>
                                            )}

                                            <div className="text-center">
                                                <div className="text-xl font-bold tracking-tight uppercase mb-1">
                                                    {activeOrder.status === 'Hazırlanıyor' ? 'HAZIRLANIYOR' : 'KURYEDE'}
                                                </div>
                                                {etaSeconds !== null && etaSeconds <= 300 && activeOrder.status === 'Yolda' && (
                                                    <div className="text-emerald-400 text-xs font-black mb-2 uppercase tracking-wider bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                                                        Yaklaştık, birazdan teslim edeceğiz!
                                                    </div>
                                                )}
                                                {eta && (
                                                    <div className="text-blue-400 text-sm font-black mt-1 uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20 inline-block">
                                                        Tahmini {eta}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm animate-in fade-in duration-500">
                            <ShoppingCart size={64} className="mx-auto mb-4 text-slate-100" />
                            <h3 className="text-xl font-bold text-slate-800">Aktif Sipariş Bulunmuyor</h3>
                            <p className="text-slate-500 mt-2 max-w-xs mx-auto">Market sayfasından dilediğiniz ürünleri seçip sipariş verebilirsiniz.</p>
                        </div>
                    )}

                    {/* Past Orders List */}
                    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <History size={22} className="text-slate-400" />
                            Geçmiş Siparişlerim
                        </h2>
                        <div className="space-y-4">
                            {userOrders.filter(o => o.status === 'Teslim Edildi' || o.status === 'İptal Edildi').reverse().slice(0, 5).map(order => (
                                <div key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border border-slate-50 hover:bg-slate-50/50 transition-colors gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-xl ${order.status === 'İptal Edildi' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                                            <ShoppingBag size={20} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-800 line-clamp-1">{order.product}</div>
                                            <div className="text-xs text-slate-400 font-medium">{order.date} • {order.paymentMethod}</div>
                                            <div className="text-[10px] text-slate-400 mt-1 italic line-clamp-1">{order.address}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between sm:justify-end gap-8">
                                        <div className="text-right">
                                            <div className="font-black text-slate-800 text-lg">₺{order.amount}</div>
                                            <div className={`text-[10px] font-bold uppercase tracking-wider ${order.status === 'İptal Edildi' ? 'text-red-400' : 'text-green-500'}`}>{order.status}</div>
                                        </div>
                                        <button
                                            onClick={() => handleReorderSpecific(order)}
                                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
                                            title="Tekrar Sipariş Ver"
                                        >
                                            <RefreshCcw size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerPortal;


