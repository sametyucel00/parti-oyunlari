import React, { useEffect, useState } from 'react';
import { Phone, PhoneOff, User, MapPin, Plus, ShoppingCart, UserPlus, X, CheckCircle2, Building2 } from 'lucide-react';
import useStore from '../store/useStore';
import { calculateOrderTotals, createOrderItemDraft, hydrateOrderItemWithProduct } from '../utils/orderPricing';

const isDebugLoggingEnabled = import.meta.env.DEV && import.meta.env.VITE_DEBUG_LOGS === 'true';

const createEmptyOrderItem = () => createOrderItemDraft();

const getNextSubscriberNumber = (subscribers = []) => {
    const numbers = subscribers
        .map((item) => Number.parseInt(String(item?.id ?? '').replace(/\D/g, ''), 10))
        .filter((value) => Number.isFinite(value));

    return String((numbers.length > 0 ? Math.max(...numbers) : 0) + 1);
};

const IncomingCallDrawer = ({ isOpen, phone: incomingPhone, deviceId, onClose, isManual }) => {
    const { subscribers, orders, products, addSubscriber, addOrder, addNotification } = useStore();
    const [subscriber, setSubscriber] = useState(null);
    const [lastOrder, setLastOrder] = useState(null);
    const [phone, setPhone] = useState(incomingPhone);
    const [callState, setCallState] = useState('ringing');
    const [directOrderAvailable, setDirectOrderAvailable] = useState(false);

    const [newSubName, setNewSubName] = useState('');
    const [newSubAddress, setNewSubAddress] = useState('');
    const [newSubIsCorporate, setNewSubIsCorporate] = useState(false);

    const [orderItems, setOrderItems] = useState([createEmptyOrderItem()]);

    useEffect(() => {
        if (!isOpen) return;

        if (isDebugLoggingEnabled) {
            console.log('IncomingCallDrawer Opened. Phone:', incomingPhone, 'Manual:', isManual);
        }

        setPhone(incomingPhone || '');
        const incomingStr = String(incomingPhone || '').replace(/\s/g, '');
        const found = subscribers.find((s) => s.phone && String(s.phone).replace(/\s/g, '') === incomingStr);

        setSubscriber(found || null);
        setNewSubName('');
        setNewSubAddress('');
        setNewSubIsCorporate(false);
        setLastOrder(null);
        setDirectOrderAvailable(false);
        setOrderItems([createEmptyOrderItem()]);

        if (found) {
            const subOrders = orders
                .filter((o) => o.customerId === found.id)
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            if (subOrders.length > 0) {
                setLastOrder(subOrders[0]);

                if (Array.isArray(subOrders[0].items) && subOrders[0].items.length > 0) {
                    setOrderItems(
                        subOrders[0].items.map((item) => ({
                            productId: item.productId || products.find((product) => item.name && product.name === item.name)?.id || '',
                            quantity: Number(item.quantity || 1),
                            includeDeposit: Boolean(item.includeDeposit),
                        }))
                    );
                    setDirectOrderAvailable(true);
                }
            } else if (found.product) {
                const matchingProd = products.find((p) => {
                    const productName = String(p.name || '').toLocaleLowerCase('tr-TR');
                    const preferredProduct = String(found.product || '').toLocaleLowerCase('tr-TR');
                    return productName.includes(preferredProduct) || preferredProduct.includes(productName);
                });

                if (matchingProd) {
                    setOrderItems([createOrderItemDraft({ productId: matchingProd.id, quantity: Number(found.quantity || 1) })]);
                    setDirectOrderAvailable(true);
                }
            }
        }

        if (isManual) {
            setCallState(found ? 'quick-order' : 'new-subscriber');
        } else {
            setCallState('ringing');
        }
    }, [incomingPhone, isManual, isOpen, orders, products, subscribers]);

    if (!isOpen) return null;

    const handleAnswer = () => {
        if (deviceId) {
            useStore.getState().sendDeviceCommand(deviceId, 'ANSWER_CALL');
        }
        setCallState(subscriber ? 'quick-order' : 'new-subscriber');
    };

    const handleReject = () => {
        onClose();
        setTimeout(() => setCallState('ringing'), 300);
    };

    const handleAddSubscriber = async (e) => {
        e.preventDefault();
        if (!newSubName.trim()) return;

        const nextSubscriberNumber = getNextSubscriberNumber(subscribers);

        const newSub = {
            id: nextSubscriberNumber,
            name: newSubName,
            phone,
            address: newSubAddress,
            location: '',
            bottles: 0,
            registrationDate: new Date().toISOString(),
            status: 'Active',
            isCorporate: newSubIsCorporate
        };

        try {
            const docRef = await addSubscriber(newSub);
            setSubscriber({ ...newSub, firestoreId: docRef?.id || null });
            setCallState('quick-order');
        } catch (error) {
            console.error('Failed to add subscriber:', error);
            addNotification('Abone kaydedilemedi.', 'error');
        }
    };

    const handleCreateOrder = async (e) => {
        if (e) e.preventDefault();
        if (!subscriber) return;

        const validItems = orderItems
            .map((item) => {
                const product = products.find((p) => String(p.id) === String(item.productId));
                if (!product) return null;
                const hydrated = hydrateOrderItemWithProduct(product, {
                    quantity: Number(item.quantity || 1),
                    includeDeposit: Boolean(item.includeDeposit),
                });

                return {
                    productId: hydrated.productId,
                    name: hydrated.name,
                    price: hydrated.price,
                    depositFee: hydrated.depositFee,
                    includeDeposit: hydrated.includeDeposit,
                    quantity: hydrated.quantity
                };
            })
            .filter(Boolean);

        if (validItems.length === 0) return;

        const totals = calculateOrderTotals(validItems);

        await addOrder({
            customer: subscriber.name,
            customerId: subscriber.id,
            product: validItems.map((item) => `${item.quantity}x ${item.name}${item.includeDeposit ? ' (Depozitolu)' : ''}`).join(', '),
            items: validItems.map(({ productId, name, price, quantity, depositFee, includeDeposit }) => ({ productId, name, price, quantity, depositFee, includeDeposit })),
            quantity: totals.quantity,
            amount: totals.amount,
            productTotal: totals.productTotal,
            depositTotal: totals.depositTotal,
            courier: '-',
            paymentMethod: 'Nakit',
            address: subscriber.address || '',
            phone: subscriber.phone || '',
            hasInvoice: false,
            timestamp: new Date().toISOString()
        });

        addNotification('Sipariş başarıyla oluşturuldu!', 'success');
        handleReject();
    };

    const updateOrderItem = (index, field, value) => {
        setOrderItems((current) => current.map((item, itemIndex) => (
            itemIndex === index ? { ...item, [field]: value } : item
        )));
    };

    const addProductLine = () => {
        setOrderItems((current) => [...current, createEmptyOrderItem()]);
    };

    const removeProductLine = (index) => {
        setOrderItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
    };

    return (
        <div className="fixed inset-0 z-[200] flex justify-end">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={handleReject}></div>

            <div
                onClick={(e) => e.stopPropagation()}
                className={`relative w-full max-w-md h-[100dvh] shadow-2xl transition-all duration-300 animate-in slide-in-from-right ${callState === 'ringing' ? 'bg-gradient-to-b from-slate-800 to-slate-900' : 'bg-white'}`}
            >
                {callState === 'ringing' && (
                    <div className="absolute inset-0 flex flex-col items-center py-16 px-6">
                        <h2 className="text-white text-3xl font-light tracking-wider mt-4 text-center">
                            {subscriber ? subscriber.name : 'Bilinmeyen Numara'}
                        </h2>
                        <h4 className="text-white/60 text-lg font-mono mt-2 tracking-widest">
                            {phone}
                        </h4>

                        {subscriber && (
                            <div className="flex items-center gap-2 mt-2">
                                <span className="px-3 py-1 bg-brand-primary/20 text-brand-primary rounded-full text-[10px] font-black uppercase tracking-widest border border-brand-primary/20">
                                    No: {subscriber.id}
                                </span>
                                {subscriber.legacyId && (
                                    <span className="px-3 py-1 bg-amber-500/20 text-amber-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-500/20">
                                        Eski No: {subscriber.legacyId}
                                    </span>
                                )}
                            </div>
                        )}

                        {deviceId && (
                            <div className="mt-2 px-3 py-1 bg-white/10 rounded-full border border-white/5">
                                <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">HAT: {deviceId}</p>
                            </div>
                        )}

                        <div className="mt-8 relative">
                            <div className="w-32 h-32 bg-white/5 rounded-full flex items-center justify-center text-white/50 relative z-10 border border-white/10 shadow-2xl">
                                <User size={48} />
                            </div>
                            <div className="absolute inset-0 bg-white/10 rounded-full animate-ping duration-1000 opacity-50"></div>
                            <div className="absolute inset-[-20px] bg-white/5 rounded-full animate-ping duration-[1500ms] opacity-30"></div>
                        </div>

                        {subscriber && (
                            <div className="mt-8 text-center px-4 bg-white/5 py-3 rounded-2xl border border-white/10 w-full animate-in fade-in slide-in-from-bottom-4">
                                <p className="text-[10px] uppercase font-black text-brand-primary tracking-widest mb-1">Mevcut Müşteri</p>
                                <p className="text-white/80 text-xs font-medium truncate">{subscriber.address || 'Adres tanımlı değil'}</p>
                            </div>
                        )}

                        <div className="mt-auto w-full flex flex-col gap-6 px-10 pb-12">
                            {directOrderAvailable && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleCreateOrder(); }}
                                    className="w-full bg-brand-primary text-white font-black py-5 rounded-[2rem] shadow-2xl shadow-brand-primary/20 active:scale-95 transition-all flex items-center justify-center gap-3 uppercase text-xs tracking-[0.2em] border-2 border-white/20"
                                >
                                    <ShoppingCart size={20} /> HAZIR SİPARİŞİ ONAYLA
                                </button>
                            )}

                            <div className="flex justify-between w-full">
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleReject(); }}
                                    className="group flex flex-col items-center gap-4 active:scale-95 transition-all outline-none"
                                >
                                    <div className="w-20 h-20 bg-rose-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-rose-500/30 ring-4 ring-rose-500/10">
                                        <PhoneOff size={32} className="fill-white" />
                                    </div>
                                    <span className="text-white font-black text-[12px] uppercase tracking-[0.2em] group-hover:text-rose-400 transition-colors">Reddet</span>
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleAnswer(); }}
                                    className="group flex flex-col items-center gap-4 active:scale-95 transition-all outline-none"
                                >
                                    <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-emerald-500/30 ring-4 ring-emerald-500/10">
                                        <Phone size={32} className="fill-white" />
                                    </div>
                                    <span className="text-white font-black text-[12px] uppercase tracking-[0.2em] group-hover:text-emerald-400 transition-colors">Cevapla</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {callState === 'new-subscriber' && (
                    <div className="p-8 animate-in fade-in slide-in-from-right duration-300">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight font-display uppercase">Yeni Abone</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1 font-mono">{phone}</p>
                                <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest mt-2">
                                    Yeni Müşteri No: {getNextSubscriberNumber(subscribers)}
                                </p>
                            </div>
                            <button onClick={handleReject} className="p-2 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all shadow-sm">
                                <PhoneOff size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleAddSubscriber} className="space-y-6">
                            {!incomingPhone && (
                                <div className="group animate-in slide-in-from-top-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Telefon Numarası</label>
                                    <div className="relative">
                                        <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="tel"
                                            required
                                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-[1.2rem] outline-none focus:border-brand-primary focus:bg-white transition-all font-bold text-slate-800"
                                            placeholder="5XX XXX XX XX"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="group">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Abone Adı Soyadı</label>
                                <div className="relative">
                                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        required
                                        autoFocus
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-[1.2rem] outline-none focus:border-brand-primary focus:bg-white transition-all font-bold text-slate-800"
                                        placeholder="Örn: Ayşe Yılmaz"
                                        value={newSubName}
                                        onChange={(e) => setNewSubName(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="group">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Teslimat Adresi</label>
                                <div className="relative">
                                    <MapPin size={18} className="absolute left-4 top-4 text-slate-400" />
                                    <textarea
                                        required
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-[1.2rem] outline-none focus:border-brand-primary focus:bg-white transition-all font-bold text-slate-800 resize-none h-28"
                                        placeholder="Mahalle, sokak, bina ve daire no..."
                                        value={newSubAddress}
                                        onChange={(e) => setNewSubAddress(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-3 mt-2">
                                <label className="flex items-center gap-3 cursor-pointer group/cb">
                                    <div className="relative flex items-center justify-center w-6 h-6 rounded-lg border-2 border-slate-200 bg-slate-50 group-hover/cb:border-brand-primary transition-colors">
                                        <input
                                            type="checkbox"
                                            className="absolute opacity-0 w-full h-full cursor-pointer z-10"
                                            checked={newSubIsCorporate}
                                            onChange={(e) => setNewSubIsCorporate(e.target.checked)}
                                        />
                                        {newSubIsCorporate && <CheckCircle2 size={16} className="text-brand-primary absolute" />}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Building2 size={18} className={newSubIsCorporate ? 'text-brand-primary' : 'text-slate-400'} />
                                        <span className={`text-[11px] font-black uppercase tracking-widest ${newSubIsCorporate ? 'text-brand-primary' : 'text-slate-500'}`}>
                                            Kurumsal / İşletme Müşterisi
                                        </span>
                                    </div>
                                </label>
                            </div>

                            <button type="submit" className="w-full bg-slate-900 text-white font-black py-4 rounded-[1.2rem] shadow-xl hover:bg-brand-primary transition-all active:scale-95 flex items-center justify-center gap-2 uppercase text-xs tracking-widest mt-8">
                                <UserPlus size={18} /> KAYDI TAMAMLA VE SİPARİŞE GEÇ
                            </button>
                        </form>
                    </div>
                )}

                {callState === 'quick-order' && (
                    <div className="p-8 animate-in fade-in slide-in-from-right duration-300">
                        <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-6">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Görüşme Aktif</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight font-display uppercase">{subscriber?.name}</h3>
                                    <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg text-[10px] font-black">
                                        #{subscriber?.id}
                                    </span>
                                    {subscriber?.legacyId && (
                                        <span className="bg-amber-100 text-amber-600 px-2 py-0.5 rounded-lg text-[10px] font-black">
                                            Eski: {subscriber.legacyId}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs font-bold text-slate-500 mt-1 line-clamp-1">{subscriber?.address}</p>
                            </div>
                            <button onClick={handleReject} className="p-3 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-2xl transition-all shadow-sm">
                                <PhoneOff size={24} className="fill-current" />
                            </button>
                        </div>

                        {lastOrder && (
                            <div className="mb-6 bg-indigo-50/50 border border-indigo-100 p-4 rounded-2xl flex items-center justify-between">
                                <div>
                                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Son Siparişi</p>
                                    <p className="font-bold text-indigo-900 text-sm">{lastOrder.product}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        if (Array.isArray(lastOrder.items) && lastOrder.items.length > 0) {
                                            setOrderItems(
                                                lastOrder.items.map((item) => ({
                                                    productId: item.productId || products.find((product) => item.name && product.name === item.name)?.id || '',
                                                    quantity: Number(item.quantity || 1),
                                                    includeDeposit: Boolean(item.includeDeposit),
                                                }))
                                            );
                                            return;
                                        }

                                        const prod = products.find((p) => String(lastOrder.product || '').includes(p.name));
                                        if (prod) {
                                            setOrderItems([createOrderItemDraft({ productId: prod.id, quantity: Number(lastOrder.quantity || 1) })]);
                                        }
                                    }}
                                    className="p-2 bg-white rounded-xl text-indigo-500 shadow-sm hover:scale-105 active:scale-95 transition-transform text-[10px] font-black uppercase tracking-widest"
                                >
                                    Aynısını Gir
                                </button>
                            </div>
                        )}

                        <form onSubmit={handleCreateOrder} className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between gap-3">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Ne İstediler?</label>
                                    <button
                                        type="button"
                                        onClick={addProductLine}
                                        className="px-3 py-2 rounded-xl bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
                                    >
                                        <Plus size={14} /> Ürün Ekle
                                    </button>
                                </div>

                                {orderItems.map((item, index) => {
                                    const selectedProduct = products.find((product) => String(product.id) === String(item.productId));
                                    const hasDeposit = Number(selectedProduct?.depositFee || 0) > 0;
                                    return (
                                    <div key={`${index}-${item.productId || 'empty'}`} className="bg-slate-50 border border-slate-100 rounded-[1.4rem] p-4 space-y-4">
                                        <select
                                            required
                                            className="w-full p-4 bg-white border-2 border-transparent rounded-[1.2rem] outline-none focus:border-brand-primary focus:bg-white transition-all font-bold text-slate-800"
                                            value={item.productId}
                                            onChange={(e) => updateOrderItem(index, 'productId', e.target.value)}
                                        >
                                            <option value="">Ürün Seçiniz...</option>
                                            {products.map((product) => (
                                                <option key={product.id} value={product.id}>{product.name} - ₺{product.price}</option>
                                            ))}
                                        </select>

                                        <div className="flex items-center gap-4">
                                            <button
                                                type="button"
                                                onClick={() => updateOrderItem(index, 'quantity', Math.max(1, Number(item.quantity || 1) - 1))}
                                                className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-black text-slate-500 hover:bg-slate-200 active:scale-95"
                                            >
                                                -
                                            </button>
                                            <div className="flex-1 text-center font-black text-3xl font-display text-slate-900">{Number(item.quantity || 1)}</div>
                                            <button
                                                type="button"
                                                onClick={() => updateOrderItem(index, 'quantity', Number(item.quantity || 1) + 1)}
                                                className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-black text-slate-500 hover:bg-slate-200 active:scale-95"
                                            >
                                                +
                                            </button>
                                            {orderItems.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeProductLine(index)}
                                                    className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all active:scale-95"
                                                >
                                                    <X size={18} />
                                                </button>
                                            )}
                                        </div>
                                        {hasDeposit && (
                                            <label className="flex items-center justify-between gap-4 rounded-[1.2rem] border border-orange-100 bg-orange-50/70 px-4 py-3 text-[11px] font-black uppercase tracking-wider text-orange-600">
                                                <span>Depozito Var</span>
                                                <input
                                                    type="checkbox"
                                                    className="h-5 w-5 accent-orange-500"
                                                    checked={Boolean(item.includeDeposit)}
                                                    onChange={(e) => updateOrderItem(index, 'includeDeposit', e.target.checked)}
                                                />
                                            </label>
                                        )}
                                    </div>
                                );})}
                            </div>

                            <button type="submit" className="w-full bg-emerald-500 text-white font-black py-5 rounded-[1.5rem] shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-95 flex items-center justify-center gap-3 uppercase text-xs tracking-widest mt-8">
                                <ShoppingCart size={20} /> SİPARİŞİ ONAYLA
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default IncomingCallDrawer;
