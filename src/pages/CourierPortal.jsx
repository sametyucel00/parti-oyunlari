import React, { useState, useEffect } from 'react';
import { Truck, Package, Wallet, LogOut, CheckCircle, MapPin, Navigation, ArrowRight, CreditCard, Banknote, X, Map, Settings, User, Bell, Shield, Lock, Monitor, Save, RefreshCw, Phone, Landmark, History, FileText, Anchor, Plus } from 'lucide-react';
import useStore from '../store/useStore';
import { updateLocationInFirestore } from '../services/firestoreService';
import GoogleMapTracker from '../components/GoogleMapTracker';
import { getDirectionsTarget, pickFirstValidLocation } from '../utils/location';
import { calculateOrderTotals, createOrderItemDraft, hydrateOrderItemWithProduct } from '../utils/orderPricing';
const CourierPortal = ({ user, onLogout }) => {
    const { orders, updateOrder, addOrder, products, subscribers, businesses } = useStore();
    const [activeTab, setActiveTab] = useState('tasks');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isDeliveryDrawerOpen, setIsDeliveryDrawerOpen] = useState(false);
    const [courierLocation, setCourierLocation] = useState(null);
    const [estimatedTimes, setEstimatedTimes] = useState({});
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);

    // Settings State
    const [name, setName] = useState(user?.name || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [saveStatus, setSaveStatus] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [settingsTab, setSettingsTab] = useState('profile');

    // Functional Settings State
    const [soundAlerts, setSoundAlerts] = useState(user?.settings?.soundAlerts ?? true);
    const [nightMode, setNightMode] = useState(user?.settings?.nightMode ?? false);
    const [securityQuestion, setSecurityQuestion] = useState(user?.securityQuestion || '');
    const [securityAnswer, setSecurityAnswer] = useState(user?.securityAnswer || '');

    // Delivery Form State
    const [paymentMethod, setPaymentMethod] = useState('Nakit');
    const [emptiesReturned, setEmptiesReturned] = useState(0);

    // Stock/Reconciliation State
    const [reconTab, setReconTab] = useState('morning');
    const [reconDealerId, setReconDealerId] = useState('');
    const [reconItems, setReconItems] = useState([createOrderItemDraft()]);
    const [reconPaymentMethod, setReconPaymentMethod] = useState('Nakit');
    const [reconAmount, setReconAmount] = useState(0);

    const businessHub = { lat: 41.0924, lng: 28.7997 };
    const businessProfile = businesses.find(b => b.id === (user?.businessId || user?.id)) || null;
    const getSubscriberByOrder = (order) => subscribers.find(s => s.id === order.customerId);
    const getOrderCustomerLocation = (order) => pickFirstValidLocation(order?.customerLocation, getSubscriberByOrder(order)?.location);
    const getOrderCustomerAddress = (order) => order?.address || getSubscriberByOrder(order)?.address || '';

    const activeOrders = React.useMemo(() => {
        const remaining = orders.filter(o => o.status === 'Hazırlanıyor' || o.status === 'Yolda' || o.status === 'Kurye Yolda' || o.status === 'Beklemede' || o.status === 'Hazır');
        
        // Smart Sort: Nearest Neighbor
        const routeStart = pickFirstValidLocation(courierLocation, businessProfile?.location, businessHub);
        let currentPos = routeStart;
        const sorted = [];
        const toSort = [...remaining];

        while (toSort.length > 0) {
            let nearestIdx = 0;
            let minDistance = Infinity;

            toSort.forEach((order, idx) => {
                const loc = getOrderCustomerLocation(order);
                if (!loc || !currentPos) return;
                const dist = Math.sqrt(Math.pow(loc.lat - currentPos.lat, 2) + Math.pow(loc.lng - currentPos.lng, 2));
                if (dist < minDistance) {
                    minDistance = dist;
                    nearestIdx = idx;
                }
            });

            const next = toSort[nearestIdx];
            sorted.push(next);
            currentPos = getOrderCustomerLocation(next) || currentPos;
            toSort.splice(nearestIdx, 1);
        }

        return sorted;
    }, [orders, courierLocation, subscribers, businessProfile]);

    // Geo-tracking for Courier is now handled globally in App.jsx
    // We just sync the local courierLocation state from the store user
    useEffect(() => {
        if (user?.location) {
            setCourierLocation(user.location);
        }
    }, [user?.location]);

    const handleSetOnWay = (orderId) => {
        updateOrder(orderId, { status: 'Yolda' });
        
        // Use current location from state if available
        if (courierLocation) {
            updateOrder(orderId, { courierLocation: courierLocation });
        } else if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(pos => {
                const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setCourierLocation(newLoc);
                updateOrder(orderId, { courierLocation: newLoc });
                updateLocationInFirestore(user.id, newLoc.lat, newLoc.lng);
            });
        }
    };

    const handleOpenDelivery = (order) => {
        setSelectedOrder(order);
        setPaymentMethod(order.paymentMethod || 'Nakit');
        setEmptiesReturned(0);
        setIsDeliveryDrawerOpen(true);
    };

    const handleCompleteDelivery = async () => {
        if (!selectedOrder) return;

        await updateOrder(selectedOrder.id, {
            status: 'Tamamlandı',
            paymentMethod,
            emptiesReturned,
            deliveredAt: new Date().toISOString()
        });

        // Update Courier Cash if Payment is Nakit
        if (paymentMethod === 'Nakit') {
            const currentCourier = useStore.getState().couriers.find(c => c.userId === user.id);
            if (currentCourier) {
                await useStore.getState().updateCourier(currentCourier.id, {
                    cash: (currentCourier.cash || 0) + (Number(selectedOrder.amount) || 0)
                });
            }
        }

        setIsDeliveryDrawerOpen(false);
        setSelectedOrder(null);
    };

    const deliveredToday = orders.filter(o =>
        o.status === 'Tamamlandı' &&
        new Date(o.date || o.timestamp).toDateString() === new Date().toDateString() &&
        (o.courier === user.name || o.courierId === user.id)
    );

    const currentCourier = useStore.getState().couriers.find(c => c.userId === user.id) || { cash: 0, currentStock: {} };
    const totalCash = currentCourier.cash || 0;

    const totalPos = deliveredToday.filter(o => o.paymentMethod === 'POS').reduce((acc, o) => acc + (Number(o.amount) || 0), 0);
    const totalIban = deliveredToday.filter(o => o.paymentMethod === 'IBAN').reduce((acc, o) => acc + (Number(o.amount) || 0), 0);
    const totalVeresiye = deliveredToday.filter(o => o.paymentMethod === 'Veresiye').reduce((acc, o) => acc + (Number(o.amount) || 0), 0);

    const handleSmartRoute = () => {
        if (activeOrders.length === 0) {
            useStore.getState().addNotification("Aktif sipariş bulunamadı.", "error");
            return;
        }

        const businessHub = { lat: 41.0924, lng: 28.7997 }; // Default Hub (Basaksehir/Ikitelli as per businessAddress)
        const baseUrl = "https://www.google.com/maps/dir/?api=1";
        
        // 1. Determine Start Point (Courier or Hub)
        const routeStart = pickFirstValidLocation(courierLocation, businessProfile?.location, businessHub);
        let currentPos = routeStart;
        
        // 2. Prepare Waypoints & Sort by Distance (Nearest Neighbor Algorithm)
        let remainingOrders = [...activeOrders].filter(o =>
            getOrderCustomerLocation(o) || getOrderCustomerAddress(o)
        );

        if (remainingOrders.length === 0) {
            useStore.getState().addNotification("Siparişlerde konum bilgisi eksik.", "warning");
            return;
        }

        const optimizedPath = [];
        
        while (remainingOrders.length > 0) {
            // Find nearest
            let nearestIdx = 0;
            let minDistance = Infinity;

            remainingOrders.forEach((order, idx) => {
                const loc = getOrderCustomerLocation(order);
                const dist = loc && currentPos
                    ? Math.sqrt(
                        Math.pow(loc.lat - currentPos.lat, 2) +
                        Math.pow(loc.lng - currentPos.lng, 2)
                    )
                    : Infinity;
                
                // Boost priority if order has 'isPriority' (mocking priority analysis)
                const finalDist = order.isPriority ? dist * 0.5 : dist;
                
                if (finalDist < minDistance) {
                    minDistance = finalDist;
                    nearestIdx = idx;
                }
            });

            const nextOrder = remainingOrders[nearestIdx];
            optimizedPath.push(nextOrder);
            currentPos = getOrderCustomerLocation(nextOrder) || currentPos;
            remainingOrders.splice(nearestIdx, 1);
        }

        // 3. Generate URL
        const origin = getDirectionsTarget({
            location: routeStart,
            address: businessProfile?.address,
            fallbackAddress: "İstanbul Merkez"
        });
        if (!origin) {
            useStore.getState().addNotification("Başlangıç konumu belirlenemedi.", "error");
            return;
        }
        const originOpt = `&origin=${encodeURIComponent(origin)}`;
        
        // The last point is the destination, others are waypoints
        const waypointsData = optimizedPath.map(o => getDirectionsTarget({
            location: getOrderCustomerLocation(o),
            address: getOrderCustomerAddress(o)
        })).filter(Boolean);

        // Add Hub at the end for Round Trip
        const hubDestination = getDirectionsTarget({
            location: pickFirstValidLocation(businessProfile?.location, businessHub),
            address: businessProfile?.address,
            fallbackAddress: "İstanbul Merkez"
        });
        if (hubDestination) {
            waypointsData.push(hubDestination);
        }

        if (waypointsData.length === 0) {
            useStore.getState().addNotification("Rota için geçerli teslimat noktası bulunamadı.", "warning");
            return;
        }

        const dest = encodeURIComponent(waypointsData[waypointsData.length - 1]);
        let waypointsOpt = "";
        
        if (waypointsData.length > 1) {
            const waypoints = waypointsData.slice(0, waypointsData.length - 1).map(a => encodeURIComponent(a)).join('|');
            waypointsOpt = `&waypoints=${waypoints}`;
        }

        const fullUrl = `${baseUrl}${originOpt}&destination=${dest}${waypointsOpt}&travelmode=driving&dir_action=navigate`;
        const newWindow = window.open(fullUrl, '_blank', 'noopener,noreferrer');
        if (!newWindow) {
            useStore.getState().addNotification("Yeni sekme açılamadı. Tarayıcı pop-up engelliyor olabilir.", "warning");
            return;
        }
        useStore.getState().addNotification("Rota mesafe ve trafiğe göre optimize edildi.", "success");
    };

    const handleHandoverCash = async () => {
        if (totalCash === 0) {
            useStore.getState().addNotification("Teslim edilecek nakit bulunmuyor.", "info");
            return;
        }

        if (deleteConfirmId === 'handover') {
            const currentCourier = useStore.getState().couriers.find(c => c.userId === user.id);
            if (currentCourier) {
                await useStore.getState().updateCourier(currentCourier.id, { cash: 0 });
                useStore.getState().addNotification("Kasa başarıyla teslim edildi!", "success");
                setActiveTab('tasks');
                setDeleteConfirmId(null);
            }
        } else {
            setDeleteConfirmId('handover');
            useStore.getState().addNotification(`Kasayı (₺${totalCash}) teslim etmek için tekrar tıklayın.`, "warning");
            setTimeout(() => setDeleteConfirmId(null), 3000);
        }
    };


    const handleSaveSettings = async () => {
        if (newPassword && newPassword !== confirmPassword) {
            useStore.getState().addNotification("Yeni şifreler eşleşmiyor!", "error");
            return;
        }

        setIsSaving(true);
        try {
            const updates = {
                name,
                phone,
                securityQuestion,
                securityAnswer,
                ...(newPassword && { password: newPassword }),
                settings: {
                    ...user.settings,
                    soundAlerts,
                    nightMode
                }
            };

            await useStore.getState().updateUserSettings(updates);
            setSaveStatus('success');
            setTimeout(() => setSaveStatus(null), 3000);
            if (newPassword) {
                setNewPassword('');
                setConfirmPassword('');
            }
        } catch (error) {
            console.error(error);
            setSaveStatus('error');
        } finally {
            setIsSaving(false);
        }
    };

    const userName = (user?.name && typeof user.name === 'string') ? user.name.split(' ')[0] : 'Kurye';

    const renderStockTab = () => {
        const dealers = subscribers.filter(s => s.type === 'bayi' || s.type === 'corporate' || (s?.name || '').toLowerCase().includes('bayi'));

        return (
            <div className="px-6 space-y-6 pb-24">
                <div className="glass-dark p-6 rounded-3xl mb-4 text-white">
                    <h2 className="text-xl font-black mb-1">Stok ve Mutabakat</h2>
                    <p className="text-xs text-slate-300 font-medium">Sabah yüklenen stoklar ve bayi kapanış işlemleri</p>
                </div>

                <div className="flex gap-2 p-1.5 bg-slate-200/50 rounded-2xl">
                    <button
                        onClick={() => setReconTab('morning')}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${reconTab === 'morning' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                    >
                        Üzerimdeki Stok
                    </button>
                    <button
                        onClick={() => setReconTab('evening')}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${reconTab === 'evening' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                    >
                        Bayi Teslimatı
                    </button>
                </div>

                {reconTab === 'morning' && (
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                            <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                                <Package size={20} />
                            </div>
                            <div>
                                <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Aktif Stok Miktarı</h3>
                                <p className="text-[10px] text-slate-400">Yönetim tarafından araca yüklenen ürünler</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {(!currentCourier.currentStock || Object.keys(currentCourier.currentStock).length === 0) ? (
                                <p className="text-sm font-bold text-slate-400 text-center py-6">Üzerinize atanmış bir stok bulunmamaktadır.</p>
                            ) : (
                                Object.entries(currentCourier.currentStock).map(([key, val]) => (
                                    <div key={key} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <span className="font-black text-slate-700 uppercase">{key === "water" ? "Damacana Su" : key === "tube" ? "Mutfak Tüpü" : key}</span>
                                        <span className="font-black text-xl text-brand-primary">{val}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {reconTab === 'evening' && (
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
                            <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center">
                                <FileText size={20} />
                            </div>
                            <div>
                                <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Bayi Ürün Teslim Formu</h3>
                                <p className="text-[10px] text-slate-400">Akşam dönüşü toptan bayi teslimat fişi</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Teslim Edilen Bayi</label>
                            <select 
                                value={reconDealerId} 
                                onChange={(e) => setReconDealerId(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-bold text-slate-700 outline-none"
                            >
                                <option value="">Bayi / Şube Seçiniz</option>
                                {dealers.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Teslim Edilen Ürünler</label>
                                <button onClick={() => setReconItems([...reconItems, createOrderItemDraft()])} className="text-[10px] font-black text-brand-primary uppercase tracking-widest flex items-center gap-1">
                                    <Plus size={12}/> Ekle
                                </button>
                            </div>
                            {reconItems.map((item, idx) => (
                                <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 relative shadow-sm">
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <div className="flex-1">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block ml-1">Ürün</label>
                                            <select 
                                                value={item.productId}
                                                onChange={(e) => {
                                                    const nItems = [...reconItems];
                                                    nItems[idx].productId = e.target.value;
                                                    setReconItems(nItems);
                                                }}
                                                className="w-full bg-white border border-slate-200 rounded-xl p-3.5 text-xs font-bold outline-none focus:border-brand-primary"
                                            >
                                                <option value="">Ürün Seçiniz...</option>
                                                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="w-full sm:w-24 flex flex-col items-center">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block ml-1 text-center">Adet</label>
                                            <input 
                                                type="number" min="1" value={item.quantity}
                                                onChange={e => {
                                                    const qt = parseInt(e.target.value) || 1;
                                                    const nItems = [...reconItems];
                                                    nItems[idx].quantity = qt;
                                                    setReconItems(nItems);
                                                }}
                                                className="w-full bg-white border border-slate-200 rounded-xl p-3.5 text-xs font-black text-center outline-none focus:border-brand-primary"
                                            />
                                        </div>
                                    </div>
                                    {Number(products.find((product) => product.id === item.productId)?.depositFee || 0) > 0 && (
                                        <label className="mt-3 flex items-center justify-between gap-4 rounded-xl border border-orange-100 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-widest text-orange-600">
                                            <span>Depozito Var</span>
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 accent-orange-500"
                                                checked={Boolean(item.includeDeposit)}
                                                onChange={(e) => {
                                                    const nItems = [...reconItems];
                                                    nItems[idx].includeDeposit = e.target.checked;
                                                    setReconItems(nItems);
                                                }}
                                            />
                                        </label>
                                    )}
                                    {reconItems.length > 1 && (
                                        <button 
                                            onClick={() => setReconItems(reconItems.filter((_, i) => i !== idx))} 
                                            className="absolute -top-2 -right-2 w-7 h-7 flex items-center justify-center bg-rose-500 text-white rounded-full shadow-lg active:scale-90 transition-all z-10"
                                        >
                                            <X size={12}/>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ödeme Tipi</label>
                                <select 
                                    value={reconPaymentMethod} 
                                    onChange={(e) => setReconPaymentMethod(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-bold text-slate-700 outline-none"
                                >
                                    <option value="Nakit">Nakit</option>
                                    <option value="POS">POS / Kart</option>
                                    <option value="IBAN">IBAN</option>
                                    <option value="Veresiye">Veresiye (Sonra)</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alınan Tutar (₺)</label>
                                <input 
                                    type="number" 
                                    value={reconAmount} 
                                    onChange={(e) => setReconAmount(Number(e.target.value))}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-black text-slate-900 outline-none"
                                />
                            </div>
                        </div>

                        <button 
                            onClick={async () => {
                                if(!reconDealerId || reconItems.some(i => !i.productId)) { 
                                    useStore.getState().addNotification("Lütfen bayi ve ürün bilgilerini doldurun!", "error"); 
                                    return; 
                                }
                                const selectedDealer = dealers.find(d => d.id === reconDealerId);
                                const normalizedItems = reconItems.map((ri) => {
                                    const product = products.find(x => x.id === ri.productId);
                                    return product ? hydrateOrderItemWithProduct(product, { quantity: ri.quantity, includeDeposit: Boolean(ri.includeDeposit) }) : null;
                                }).filter(Boolean);
                                const totals = calculateOrderTotals(normalizedItems);
                                const prodsText = normalizedItems.map(ri => `${ri.quantity}x ${ri.name}${ri.includeDeposit ? ' (Depozitolu)' : ''}`).join(', ');
                                
                                await addOrder({
                                    customer: selectedDealer.name,
                                    customerId: selectedDealer.id,
                                    product: `(BAYİ TESLİMATI) ${prodsText}`,
                                    items: normalizedItems,
                                    quantity: totals.quantity,
                                    amount: reconAmount || totals.amount,
                                    productTotal: totals.productTotal,
                                    depositTotal: totals.depositTotal,
                                    paymentMethod: reconPaymentMethod,
                                    status: "Tamamlandı",
                                    courier: user?.name || 'Kurye',
                                    timestamp: new Date().toISOString()
                                });

                                // Update courier cash and STOCK
                                const updatedStock = { ...(currentCourier.currentStock || {}) };
                                reconItems.forEach(item => {
                                    const prod = products.find(p => p.id === item.productId);
                                    if (prod) {
                                        const pName = prod.name;
                                        if (updatedStock[pName]) {
                                            updatedStock[pName] = Math.max(0, updatedStock[pName] - item.quantity);
                                        }
                                    }
                                });

                                const courierUpdates = { currentStock: updatedStock };
                                if (reconPaymentMethod === 'Nakit') {
                                    courierUpdates.cash = (currentCourier.cash || 0) + reconAmount;
                                }

                                await useStore.getState().updateCourier(currentCourier.id, courierUpdates);

                                useStore.getState().addNotification("Bayi teslimatı sisteme işlendi ve stoklarınız güncellendi!", "success");
                                setReconDealerId('');
                                setReconAmount(0);
                                setReconPaymentMethod('Nakit');
                                setReconItems([createOrderItemDraft()]);
                                setActiveTab('tasks');
                            }}
                            className="w-full bg-slate-900 text-white rounded-2xl py-5 font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all"
                        >
                            TESLİMATI İŞLE VE KAYDET
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={`min-h-screen pb-32 font-sans selection:bg-brand-primary/10 transition-colors duration-300 ${nightMode ? 'bg-slate-950 dark-mode' : 'bg-slate-50'}`}>
            {/* Header Area */}
            <div className="bg-slate-900 text-white rounded-b-[3rem] shadow-2xl relative overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-brand-primary/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-accent/10 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

                <div className="p-8 pt-10 relative z-10">
                    <div className="flex justify-between items-start mb-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-2xl p-1 shadow-lg overflow-hidden shrink-0">
                                <img src="/favicon.png" alt="Logo" className="w-full h-full object-contain" />
                            </div>
                            <div>
                                <p className="text-brand-accent text-[10px] font-black uppercase tracking-[0.2em] mb-1">Saha Operasyonları</p>
                                <h1 className="text-3xl font-black tracking-tight font-display leading-none">Selam, {userName}</h1>
                            </div>
                        </div>
                        <button
                            onClick={onLogout}
                            className="bg-white/5 hover:bg-rose-500/20 p-3.5 rounded-2xl text-rose-400 border border-white/10 transition-all active:scale-90"
                        >
                            <LogOut size={22} />
                        </button>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="glass-dark p-5 rounded-3xl border-white/10 relative group overflow-hidden">
                            <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
                                <Wallet size={32} className="text-brand-accent" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Kasadaki Nakit</p>
                            <p className="text-3xl font-black tracking-tight font-display">₺{totalCash}</p>
                        </div>
                        <div className="glass-dark p-5 rounded-3xl border-white/10 relative group overflow-hidden">
                            <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
                                <Truck size={32} className="text-brand-primary" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Bugünkü Teslimat</p>
                            <p className="text-3xl font-black tracking-tight font-display">{deliveredToday.length}<span className="text-slate-500 text-sm ml-1 font-bold">Adet</span></p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Location Permission Warning for Couriers */}
            {!courierLocation && (
                <div className="mx-6 mt-6 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-between gap-4 animate-pulse">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                            <Navigation size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-amber-900 uppercase tracking-widest leading-tight">Konum İzni Gerekli</p>
                            <p className="text-[9px] text-amber-600 font-bold mt-1">Sipariş takibi için konum izni vermeniz gerekiyor.</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => {
                            if (navigator.geolocation) {
                                navigator.geolocation.getCurrentPosition(pos => {
                                    const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                                    setCourierLocation(newLoc);
                                    if (user?.id) {
                                        import('../services/firestoreService').then(({ updateLocationInFirestore }) => {
                                            updateLocationInFirestore(user.id, newLoc.lat, newLoc.lng);
                                        });
                                    }
                                    useStore.getState().addNotification("Konum izni başarıyla alındı.", "success");
                                }, err => {
                                    useStore.getState().addNotification("Konum izni reddedildi veya alınamadı.", "error");
                                }, { enableHighAccuracy: true });
                            }
                        }}
                        className="bg-amber-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-600/20 active:scale-95"
                    >
                        İZİN VER
                    </button>
                </div>
            )}

            {/* List Header */}
            {activeTab === 'tasks' && (
            <>
                <div className="px-6 mt-10 mb-6 flex items-end justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight font-display flex items-center gap-3">
                            Teslimat Listesi
                            <span className="bg-brand-primary text-white text-[10px] px-3 py-1 rounded-full font-black shadow-lg shadow-brand-primary/30">
                                {activeOrders.length}
                            </span>
                        </h2>
                        <p className="text-sm font-medium text-slate-400 mt-1">Sana atanan aktif görevler</p>
                    </div>
                    
                    <button onClick={handleSmartRoute} className="flex items-center gap-2 bg-blue-50 text-blue-600 border border-blue-100 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-colors">
                        <Navigation size={14}/> AKILLI ROTA
                    </button>
                    
                </div>

                {/* Content Area */}
                <div className="px-6 space-y-5">
                {activeOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
                        <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-6 text-emerald-500 shadow-inner">
                            <CheckCircle size={48} className="animate-in zoom-in duration-200" />
                        </div>
                        <p className="font-black text-slate-800 text-xl">Harika İş!</p>
                        <p className="text-slate-400 font-medium text-sm mt-1">Bekleyen bütün siparişler teslim edildi.</p>
                    </div>
                ) : (
                    activeOrders.map((order, index) => (
                        <div
                            key={order.id}
                            className={`premium-card p-6 group hover:translate-y-[-4px] active:scale-[0.98] relative overflow-hidden transition-all ${index === 0 ? 'ring-2 ring-brand-primary/50 bg-brand-primary/5' : ''}`}
                        >
                            {index === 0 && (
                                <div className="absolute top-0 right-0 bg-brand-primary text-white px-4 py-1.5 rounded-bl-2xl text-[9px] font-black uppercase tracking-widest shadow-lg animate-pulse z-10">
                                    Sıradaki Hedef
                                </div>
                            )}
                            
                            <div className="flex justify-between items-start mb-5 relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-2xl font-black shadow-2xl relative ${index === 0 ? 'bg-slate-900 text-white shadow-brand-primary/30' : 'bg-gradient-to-br from-brand-primary to-blue-600 text-white shadow-brand-primary/20'}`}>
                                        <span className="absolute -top-2 -left-2 w-7 h-7 bg-white text-slate-900 rounded-lg flex items-center justify-center text-xs border border-slate-100 shadow-sm">{index + 1}</span>
                                        {order.customer ? order.customer.charAt(0).toUpperCase() : '?'}
                                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-brand-accent rounded-full border-4 border-white flex items-center justify-center">
                                            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-900 text-xl leading-tight group-hover:text-brand-primary transition-colors">{order.customer || 'Misafir'}</h3>
                                        <div className="flex items-center gap-2 text-slate-400 text-xs mt-1 font-bold">
                                            <MapPin size={12} className="text-brand-primary" />
                                            {order.address || subscribers.find(s => s.id === order.customerId)?.address || <span className="text-rose-400 italic">Adres Tanımlı Değil</span>}
                                        </div>
                                    </div>
                                </div>
                                <span className="bg-slate-50 text-slate-400 border border-slate-100 px-3 py-1.5 rounded-xl text-[10px] font-black font-mono">
                                    #{order.orderNumber || String(order.id).slice(-4).toUpperCase()}
                                </span>
                            </div>

                            <div className="bg-slate-50/80 rounded-2xl p-4 mb-6 border border-slate-100 flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <p className="text-slate-700 text-sm font-black flex items-center gap-3">
                                        <Package size={18} className="text-brand-primary" />
                                        {order.product} <span className="text-brand-primary">x{order.quantity}</span>
                                    </p>
                                    <div className="text-[10px] font-black text-brand-accent uppercase tracking-widest bg-brand-accent/10 px-2 py-1 rounded-md">{order.status}</div>
                                </div>

                                {order.status === 'Yolda' && (
                                    <div className="w-full h-48 mt-2 relative rounded-xl overflow-hidden border border-slate-200">
                                        <GoogleMapTracker
                                            className="min-h-0 rounded-xl"
                                            courierLocation={pickFirstValidLocation(courierLocation, order.courierLocation)}
                                            customerAddress={getOrderCustomerAddress(order) || "İstanbul Merkez"}
                                            customerLocation={getOrderCustomerLocation(order)}
                                            businessAddress={businessProfile?.address || "İstanbul Merkez"}
                                            businessLocation={pickFirstValidLocation(businessProfile?.location, businessHub)}
                                            onTimeEstimate={(time) => setEstimatedTimes(prev => (
                                                prev[order.id] === time
                                                    ? prev
                                                    : { ...prev, [order.id]: time }
                                            ))}
                                        />
                                        {estimatedTimes[order.id] && (
                                            <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-[10px] font-black shadow-lg">
                                                TAHMİNİ: {estimatedTimes[order.id]}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between mt-4">
                                <div>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Teslimat Tutarı</p>
                                    <p className="font-black text-2xl text-slate-900 font-display">₺{order.amount}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {order.status !== "Yolda" && order.status !== "Tamamlandı" ? (
                                        <button
                                            onClick={() => handleSetOnWay(order.id)}
                                            className="bg-blue-600 text-white pl-5 pr-4 py-4 rounded-2xl font-black text-[11px] shadow-xl shadow-blue-500/20 flex items-center gap-2 hover:bg-blue-700 transition-all active:scale-95 translate-y-0 hover:translate-y-[-2px]"
                                        >
                                            <Map size={18} /> YOLA ÇIK
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleOpenDelivery(order)}
                                            className="bg-emerald-500 text-white pl-5 pr-4 py-4 rounded-2xl font-black text-[11px] shadow-xl shadow-emerald-500/20 flex items-center gap-2 hover:bg-emerald-600 transition-all active:scale-95 translate-y-0 hover:translate-y-[-2px]"
                                        >
                                            <CheckCircle size={18} /> TESLİM ET
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
            </>)}

            {activeTab === 'stock' && renderStockTab()}

            {/* Bottom Navigation - Fixed to bottom */}
            <div className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-xl px-6 pt-4 pb-[calc(1.2rem+env(safe-area-inset-bottom))] flex justify-around items-center z-[110] shadow-[0_-10px_50px_rgba(0,0,0,0.5)] border-t border-white/5">
                <button
                    onClick={() => setActiveTab('tasks')}
                    className={`flex-1 flex flex-col items-center gap-1.5 py-2 rounded-[1.5rem] transition-all duration-300 ${activeTab === 'tasks' ? 'text-white bg-brand-primary/20 shadow-lg shadow-brand-primary/10' : 'text-slate-500 hover:text-white'}`}
                >
                    <Navigation size={20} className={activeTab === 'tasks' ? 'text-brand-accent' : ''} />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] mt-0.5">GÖREVLER</span>
                </button>

                <button
                    onClick={() => setActiveTab('stock')}
                    className={`flex-1 flex flex-col items-center gap-1.5 py-2 rounded-[1.5rem] transition-all duration-300 ${activeTab === 'stock' ? 'text-white bg-brand-primary/20 shadow-lg shadow-brand-primary/10' : 'text-slate-500 hover:text-white'}`}
                >
                    <Package size={20} className={activeTab === 'stock' ? 'text-brand-accent' : ''} />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] mt-0.5">STOK</span>
                </button>

                <button
                    onClick={() => setActiveTab('wallet')}
                    className={`flex-1 flex flex-col items-center gap-1.5 py-2 rounded-[1.5rem] transition-all duration-300 ${activeTab === 'wallet' ? 'text-white bg-brand-primary/20 shadow-lg shadow-brand-primary/10' : 'text-slate-500 hover:text-white'}`}
                >
                    <Wallet size={20} className={activeTab === 'wallet' ? 'text-brand-accent' : ''} />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] mt-0.5">CÜZDAN</span>
                </button>

                <button
                    onClick={() => setActiveTab('settings')}
                    className={`flex-1 flex flex-col items-center gap-1.5 py-2 rounded-[1.5rem] transition-all duration-300 ${activeTab === 'settings' ? 'text-white bg-brand-primary/20 shadow-lg shadow-brand-primary/10' : 'text-slate-500 hover:text-white'}`}
                >
                    <Settings size={20} className={activeTab === 'settings' ? 'text-brand-accent' : ''} />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] mt-0.5">AYARLAR</span>
                </button>
            </div>

            {/* Delivery Action Drawer */}
            {isDeliveryDrawerOpen && selectedOrder && (
                <div className="fixed inset-0 z-[100] flex justify-end">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setIsDeliveryDrawerOpen(false)}></div>
                    <div className="relative bg-white w-full max-w-sm h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 sm:p-8 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-brand-primary text-white rounded-xl flex items-center justify-center shadow-lg">
                                    <CheckCircle size={20} />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight font-display uppercase">Teslimat Onayı</h3>
                            </div>
                            <button onClick={() => setIsDeliveryDrawerOpen(false)} className="p-2 bg-white rounded-xl text-slate-400 hover:text-slate-600 shadow-sm transition-colors border border-slate-100">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8 space-y-8 flex-1 overflow-y-auto">
                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 uppercase text-[10px] font-black text-slate-400">
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Müşteri ve Sipariş</p>
                                <p className="font-black text-slate-800">{selectedOrder.customer}</p>
                                <p className="text-sm text-slate-400 mt-1">{selectedOrder.product} x{selectedOrder.quantity}</p>
                            </div>

                            <div className="space-y-4">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Ödeme Yöntemi</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setPaymentMethod('Nakit')}
                                        className={`p-4 rounded-[1.5rem] border-2 flex flex-col items-center gap-2 font-black text-[10px] transition-all ${paymentMethod === 'Nakit' ? 'border-brand-primary bg-brand-primary/5 text-brand-primary shadow-xl' : 'border-slate-100 text-slate-400 opacity-60'}`}
                                    >
                                        <Banknote size={20} /> NAKİT
                                    </button>
                                    <button
                                        onClick={() => setPaymentMethod('POS')}
                                        className={`p-4 rounded-[1.5rem] border-2 flex flex-col items-center gap-2 font-black text-[10px] transition-all ${paymentMethod === 'POS' ? 'border-brand-primary bg-brand-primary/5 text-brand-primary shadow-xl' : 'border-slate-100 text-slate-400 opacity-60'}`}
                                    >
                                        <CreditCard size={20} /> POS / KART
                                    </button>
                                    <button
                                        onClick={() => setPaymentMethod('IBAN')}
                                        className={`p-4 rounded-[1.5rem] border-2 flex flex-col items-center gap-2 font-black text-[10px] transition-all ${paymentMethod === 'IBAN' ? 'border-brand-primary bg-brand-primary/5 text-brand-primary shadow-xl' : 'border-slate-100 text-slate-400 opacity-60'}`}
                                    >
                                        <Landmark size={20} /> IBAN
                                    </button>
                                    <button
                                        onClick={() => setPaymentMethod('Veresiye')}
                                        className={`p-4 rounded-[1.5rem] border-2 flex flex-col items-center gap-2 font-black text-[10px] transition-all ${paymentMethod === 'Veresiye' ? 'border-brand-primary bg-brand-primary/5 text-brand-primary shadow-xl' : 'border-slate-100 text-slate-400 opacity-60'}`}
                                    >
                                        <History size={20} /> VERESİYE
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Boş Damacana Alındı</label>
                                <div className="flex items-center gap-5 bg-slate-50 p-5 rounded-[2rem] border border-slate-100 shadow-inner">
                                    <button
                                        onClick={() => setEmptiesReturned(Math.max(0, emptiesReturned - 1))}
                                        className="w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center text-slate-400 font-black text-2xl active:scale-90"
                                    >
                                        -
                                    </button>
                                    <div className="flex-1 text-center">
                                        <span className="font-black text-4xl text-slate-900 font-display">{emptiesReturned}</span>
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">ADET BOŞ</p>
                                    </div>
                                    <button
                                        onClick={() => setEmptiesReturned(emptiesReturned + 1)}
                                        className="w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center text-brand-primary font-black text-2xl active:scale-90"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 border-t border-slate-100">
                            <button
                                onClick={handleCompleteDelivery}
                                className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black text-sm shadow-2xl shadow-slate-900/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                            >
                                <CheckCircle size={22} className="text-brand-accent" />
                                TESLİMATI TAMAMLA
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Wallet / End of Day Modal */}
            {activeTab === 'wallet' && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setActiveTab('tasks')}></div>
                    <div className="relative bg-white w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in duration-300 flex flex-col max-h-[85vh]">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 sm:p-8 shrink-0">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center shadow-md">
                                    <Wallet size={16} />
                                </div>
                                <h3 className="text-lg font-black text-slate-900 tracking-tight font-display uppercase">CÜZDAN ÖZETİ</h3>
                            </div>
                            <button onClick={() => setActiveTab('tasks')} className="p-2 bg-white rounded-xl text-slate-400 hover:text-slate-600 shadow-sm transition-colors border border-slate-100">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-5 space-y-4 flex-1">
                            <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-[2rem] text-center text-white shadow-xl shadow-slate-900/10 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-accent/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                                <p className="text-brand-accent text-[7px] font-black uppercase tracking-[0.2em] mb-1">Teslim Edilecek Nakit</p>
                                <p className="text-3xl font-black tracking-tight font-display">₺{totalCash}<span className="text-base opacity-40 ml-0.5">.00</span></p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="premium-card p-3 text-center bg-white border border-slate-100">
                                    <p className="text-slate-400 text-[8px] font-black uppercase tracking-widest mb-1">POS/KART</p>
                                    <p className="text-base font-black text-slate-900 font-display">₺{totalPos}</p>
                                </div>
                                <div className="premium-card p-3 text-center bg-white border border-slate-100">
                                    <p className="text-slate-400 text-[8px] font-black uppercase tracking-widest mb-1">IBAN</p>
                                    <p className="text-base font-black text-slate-900 font-display">₺{totalIban}</p>
                                </div>
                                <div className="premium-card p-3 text-center bg-white border border-slate-100">
                                    <p className="text-slate-400 text-[8px] font-black uppercase tracking-widest mb-1">VERESİYE</p>
                                    <p className="text-base font-black text-slate-900 font-display">₺{totalVeresiye}</p>
                                </div>
                                <div className="premium-card p-3 text-center bg-emerald-50 border border-emerald-100">
                                    <p className="text-emerald-600/70 text-[8px] font-black uppercase tracking-widest mb-1">TESLİMAT</p>
                                    <p className="text-base font-black text-emerald-700 font-display">{deliveredToday.length} Ad.</p>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <p className="text-[9px] text-slate-500 font-medium text-center">Nakit harici sistemdeki tüm cirolar otomatik olarak merkezi kasaya aktarılmıştır.</p>
                            </div>

                            <div className="flex flex-col gap-3 pb-2">
                                <button
                                    onClick={handleHandoverCash}
                                    className={`w-full py-4 rounded-2xl font-black text-xs shadow-lg transition-all flex items-center justify-center gap-2 ${deleteConfirmId === 'handover' ? 'bg-orange-500 text-white shadow-orange-500/40' : 'bg-brand-primary text-white shadow-brand-primary/20'}`}
                                >
                                    <CheckCircle size={18} className="text-brand-accent" />
                                    {deleteConfirmId === "handover" ? "ONAYLA VE TESLİM ET" : "KASAYI TESLİM ET"}
                                </button>
                                <button
                                    onClick={() => setActiveTab('tasks')}
                                    className="w-full py-3 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 rounded-2xl transition-colors"
                                >
                                    PANELE DÖN
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Settings Modal / View */}
            {activeTab === 'settings' && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setActiveTab('tasks')}></div>
                    <div className="relative bg-slate-50 w-full max-w-sm max-h-[85vh] rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in duration-300 flex flex-col">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white sm:p-6 shrink-0">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center shadow-md">
                                    <Settings size={18} />
                                </div>
                                <h3 className="text-lg font-black text-slate-900 tracking-tight font-display uppercase">Ayarlar</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                {saveStatus === 'success' && <span className="text-[9px] font-black text-emerald-500 uppercase mr-1">Tmm!</span>}
                                <button onClick={() => setActiveTab('tasks')} className="p-1.5 bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 shadow-sm transition-colors border border-slate-100">
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar pb-20">
                            {/* Tab Switcher */}
                            <div className="flex gap-1.5 p-1 bg-slate-100 rounded-2xl shrink-0">
                                {[
                                    { id: 'profile', label: 'Profil', icon: User },
                                    { id: 'system', label: 'Sistem', icon: Bell },
                                    { id: "security", label: "Güvenlik", icon: Shield }
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setSettingsTab(tab.id)}
                                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${settingsTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-500'}`}
                                    >
                                        <tab.icon size={14} />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {settingsTab === 'profile' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Ad Soyad</label>
                                        <div className="relative group">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="w-full bg-white border border-slate-100 rounded-xl py-3 pl-10 pr-4 text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-brand-primary/20 transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Telefon</label>
                                        <div className="relative group">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                            <input
                                                type="tel"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                className="w-full bg-white border border-slate-100 rounded-xl py-3 pl-10 pr-4 text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-brand-primary/20 transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-500 shadow-sm">
                                            <Truck size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Hesap Tipi</p>
                                            <p className="font-black text-slate-800 text-xs text-xs">Saha Kuryesi</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {settingsTab === 'system' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
                                    <div className="bg-white p-4 rounded-2xl border border-slate-100 space-y-4">
                                        <div className="flex justify-between items-center group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                                                    <Bell size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-800 text-xs">Sesli Uyarılar</p>
                                                    <p className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">Yeni görevlerde ses çal</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setSoundAlerts(!soundAlerts)}
                                                className={`w-10 h-5 rounded-full relative transition-all duration-200 ${soundAlerts ? 'bg-brand-primary' : 'bg-slate-200'}`}
                                            >
                                                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-200 ${soundAlerts ? 'right-0.5' : 'left-0.5'}`}></div>
                                            </button>
                                        </div>
                                        <div className="h-px bg-slate-50"></div>
                                        <div className="flex justify-between items-center group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                                                    <Monitor size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-800 text-xs">Gece Modu</p>
                                                    <p className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">Düşük ışıkta kullanım</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setNightMode(!nightMode)}
                                                className={`w-10 h-5 rounded-full relative transition-all duration-200 ${nightMode ? 'bg-brand-primary' : 'bg-slate-200'}`}
                                            >
                                                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-200 ${nightMode ? 'right-0.5' : 'left-0.5'}`}></div>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {settingsTab === 'security' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
                                     <div className="space-y-3">
                                         <div className="grid grid-cols-2 gap-3">
                                             <div className="space-y-1">
                                                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Yeni Şifre</label>
                                                 <input
                                                     type="password"
                                                     value={newPassword}
                                                     onChange={(e) => setNewPassword(e.target.value)}
                                                     className="w-full bg-white border border-slate-100 rounded-xl py-2.5 px-3 text-xs font-bold outline-none focus:ring-1 focus:ring-brand-primary/20"
                                                     placeholder="Yeni Şifre"
                                                 />
                                             </div>
                                             <div className="space-y-1">
                                                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Tekrar</label>
                                                 <input
                                                     type="password"
                                                     value={confirmPassword}
                                                     onChange={(e) => setConfirmPassword(e.target.value)}
                                                     className="w-full bg-white border border-slate-100 rounded-xl py-2.5 px-3 text-xs font-bold outline-none focus:ring-1 focus:ring-brand-primary/20"
                                                     placeholder="Onaylayın"
                                                 />
                                             </div>
                                         </div>
                                         <div className="grid grid-cols-2 gap-3">
                                             <div className="space-y-1">
                                                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Güvenlik Sorusu</label>
                                                 <input
                                                     type="text"
                                                     value={securityQuestion}
                                                     onChange={(e) => setSecurityQuestion(e.target.value)}
                                                     className="w-full bg-white border border-slate-100 rounded-xl py-2.5 px-3 text-xs font-bold outline-none focus:ring-1 focus:ring-brand-primary/20"
                                                     placeholder="Örn: Evcil hayvan?"
                                                 />
                                             </div>
                                             <div className="space-y-1">
                                                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Cevap</label>
                                                 <input
                                                     type="text"
                                                     value={securityAnswer}
                                                     onChange={(e) => setSecurityAnswer(e.target.value)}
                                                     className="w-full bg-white border border-slate-100 rounded-xl py-2.5 px-3 text-xs font-bold outline-none focus:ring-1 focus:ring-brand-primary/20"
                                                     placeholder="Cevap"
                                                 />
                                             </div>
                                         </div>
                                     </div>
                                </div>
                            )}

                            <div className="pt-3">
                                <button
                                    onClick={handleSaveSettings}
                                    disabled={isSaving}
                                    className="w-full bg-slate-900 text-white py-4 rounded-xl font-black text-[11px] shadow-xl transition-all flex items-center justify-center gap-2"
                                >
                                    {isSaving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} className="text-brand-accent" />}
                                    KAYDET
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CourierPortal;
