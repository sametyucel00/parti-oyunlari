import React, { useState, useEffect } from 'react';
import { XCircle, User, Phone, MapPin, Hash, Package, Calendar, RefreshCw, CreditCard, ShieldCheck, Zap, Info, UserPlus, CheckCircle, Plus, Trash2, StickyNote } from 'lucide-react';
import useStore from '../store/useStore';

const plans = [
    { id: 'Haftalık', label: 'Haftalık', days: 7, desc: '7 Günlük Periyot' },
    { id: '15 Gün', label: '15 Gün', days: 15, desc: 'Yarım Ay Periyot' },
    { id: 'Aylık', label: 'Aylık', days: 30, desc: 'Tam Ay Periyot' },
    { id: 'Yok', label: 'Periyot Yok', days: 3650, desc: 'Periyodik Değil' }
];

const statuses = [
    { id: 'Active', label: 'Aktif', color: 'text-emerald-500' },
    { id: 'Pending', label: 'Beklemede', color: 'text-amber-500' },
    { id: 'Suspended', label: 'Askıya Alındı', color: 'text-rose-500' }
];

const SubscriberDrawer = ({ isOpen, onClose, onSave, subscriber = null }) => {
    const { products } = useStore();
    const [formData, setFormData] = useState({
        name: '', phone: '', address: '', legacyId: '', plan: 'Haftalık', product: '', quantity: 1, limit: 2000, status: 'Active',
        nextDelivery: new Date().toISOString().split('T')[0],
        isCorporate: false,
        notes: '',
        items: [{ productId: '', quantity: 1 }]
    });

    const calculateNextDelivery = React.useCallback((planId) => {
        if (planId === 'Yok') return '';
        const plan = plans.find(p => p.id === planId);
        const days = plan ? plan.days : 7;
        const date = new Date();
        date.setDate(date.getDate() + days);
        return date.toISOString().split('T')[0];
    }, []);

    const normalizeText = (value) => String(value ?? '').trim().toLocaleLowerCase('tr-TR');

    useEffect(() => {
        if (subscriber) {
            let initialItems = [{ productId: '', quantity: 1 }];
            if (subscriber.items && subscriber.items.length > 0) {
                initialItems = subscriber.items.map(item => ({
                    productId: item.productId || '',
                    quantity: item.quantity || 1
                }));
            } else if (subscriber.product) {
                // Try to find product ID by name, handle comma-separated names
                const productNames = String(subscriber.product || '').split(',').map(n => n.trim());
                initialItems = productNames.map(name => {
                    const prod = products.find(p => normalizeText(p?.name) === normalizeText(name));
                    return {
                        productId: prod ? prod.id : '',
                        quantity: subscriber.quantity || 1, // Fallback to subscriber quantity if single item
                        legacyName: !prod ? name : ''
                    };
                }).filter(item => item.productId || item.legacyName);

                if (initialItems.length === 0) {
                    initialItems = [{ productId: '', quantity: 1 }];
                }
            }

            setFormData({
                name: subscriber.name || '',
                phone: subscriber.phone || '',
                address: subscriber.address || '',
                legacyId: subscriber.legacyId || '',
                plan: subscriber.plan || 'Haftalık',
                product: subscriber.product || '',
                quantity: subscriber.quantity || 1,
                limit: subscriber.limit || 2000,
                status: subscriber.status || 'Active',
                nextDelivery: subscriber.nextDelivery || subscriber.nextRenewal || (subscriber.plan === 'Yok' ? '' : new Date().toISOString().split('T')[0]),
                isCorporate: subscriber.isCorporate || false,
                notes: subscriber.notes || '',
                items: initialItems
            });
        } else {
            setFormData({
                name: '', phone: '', address: '', legacyId: '', plan: 'Haftalık', product: '', quantity: 1, limit: 2000, status: 'Active',
                nextDelivery: calculateNextDelivery('Haftalık'),
                isCorporate: false,
                notes: '',
                items: [{ productId: '', quantity: 1 }]
            });
        }
    }, [subscriber, isOpen, calculateNextDelivery, products]);

    const handlePlanChange = (newPlan) => {
        setFormData({
            ...formData,
            plan: newPlan,
            nextDelivery: calculateNextDelivery(newPlan)
        });
    };

    const handleAddItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { productId: '', quantity: 1 }]
        });
    };

    const handleRemoveItem = (index) => {
        if (formData.items.length <= 1) return;
        const newItems = [...formData.items];
        newItems.splice(index, 1);
        setFormData({ ...formData, items: newItems });
    };

    const handleUpdateItem = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setFormData({ ...formData, items: newItems });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Consolidate items for main product/quantity fields (for backwards compatibility)
        const validItems = formData.items.filter(item => item.productId);
        const itemNames = validItems.map(item => {
            const p = products.find(prod => prod.id === item.productId);
            return p ? p.name : '';
        }).filter(Boolean);

        const updatedData = {
            ...formData,
            product: itemNames.join(', ') || formData.product,
            quantity: validItems.reduce((acc, curr) => acc + curr.quantity, 0) || formData.quantity,
            items: validItems
        };

        onSave(updatedData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex justify-end">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}></div>

            <div className="relative w-full sm:max-w-xl h-full bg-white sm:shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                {/* Header Section */}
                <div className="p-5 sm:p-8 border-b border-slate-100 flex justify-between items-center bg-white/50 sticky top-0 z-10 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg">
                            {subscriber ? <RefreshCw size={24} /> : <UserPlus size={24} />}
                        </div>
                        <div>
                            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-display uppercase leading-tight">
                                {subscriber ? 'ABONE GÜNCELLE' : 'YENİ ABONE'}
                            </h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Müşteri Yönetim Portalı</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 sm:p-3 bg-white rounded-2xl text-slate-400 hover:text-slate-600 shadow-sm transition-colors border border-slate-100">
                        <XCircle size={24} sm:size={28} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-5 sm:p-10 space-y-8 scrollbar-hide">
                        <div className="space-y-6">
                            <div>
                                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">AD SOYAD / ÜNVAN</label>
                                <div className="relative group text-slate-950">
                                    <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-primary transition-colors" size={20} />
                                    <input
                                        type="text"
                                        placeholder="Müşteri tam adı"
                                        className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] outline-none focus:border-brand-primary focus:bg-white transition-all font-black text-slate-800 shadow-inner text-sm"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">TELEFON</label>
                                    <div className="relative group">
                                        <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-primary transition-colors" size={20} />
                                        <input
                                            type="tel"
                                            placeholder="05..."
                                            className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] outline-none focus:border-brand-primary focus:bg-white transition-all font-black text-slate-800 shadow-inner text-sm"
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">SİSTEM NO</label>
                                    <div className="relative group">
                                        <Hash className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-primary transition-colors" size={20} />
                                        <input
                                            type="text"
                                            placeholder="Eski No"
                                            className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] outline-none focus:border-brand-primary focus:bg-white transition-all font-black text-slate-800 shadow-inner text-sm"
                                            value={formData.legacyId}
                                            onChange={e => setFormData({ ...formData, legacyId: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">TESLİMAT ADRESİ</label>
                                <div className="relative group">
                                    <MapPin className="absolute left-5 top-6 text-slate-300 group-focus-within:text-brand-primary transition-colors" size={20} />
                                    <textarea
                                        placeholder="Abone açık adresi..."
                                        className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] outline-none focus:border-brand-primary focus:bg-white transition-all font-black text-slate-800 shadow-inner resize-none h-28 text-sm"
                                        value={formData.address}
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">ABONE NOTU</label>
                                <div className="relative group">
                                    <StickyNote className="absolute left-5 top-6 text-slate-300 group-focus-within:text-brand-primary transition-colors" size={20} />
                                    <textarea
                                        placeholder="Teslimat notu, bina girişi, özel açıklama..."
                                        className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] outline-none focus:border-brand-primary focus:bg-white transition-all font-black text-slate-800 shadow-inner resize-none h-28 text-sm"
                                        value={formData.notes}
                                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center px-1">
                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest">ABONELİK ÜRÜNLERİ</label>
                                    <span className="text-[9px] font-black text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-md uppercase">Müşteri Seçİmlerİ</span>
                                </div>
                                {formData.items.map((item, index) => (
                                     <div key={index} className="bg-slate-50/50 p-4 rounded-[2rem] border border-slate-100 flex flex-col gap-4 animate-in slide-in-from-left duration-200">
                                         <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                                             <div className="flex-1 relative group">
                                                 <Package className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-primary transition-colors" size={20} />
                                                 <select
                                                     className="w-full pl-14 pr-6 py-5 bg-white border-2 border-transparent rounded-[1.5rem] outline-none focus:border-brand-primary focus:bg-white transition-all font-black text-slate-800 shadow-inner text-sm appearance-none cursor-pointer"
                                                     value={item.productId}
                                                     onChange={e => handleUpdateItem(index, 'productId', e.target.value)}
                                                 >
                                                     <option value="">Ürün Seçin</option>
                                                     {products.map(p => (
                                                         <option key={p.id} value={p.id}>{p.name}</option>
                                                     ))}
                                                 </select>
                                             </div>
                                             <div className="flex flex-row gap-3">
                                                 <div className="flex-1 relative group">
                                                     <Zap className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-primary transition-colors" size={20} />
                                                     <input
                                                         type="number" min="1"
                                                         className="w-full pl-12 pr-4 py-5 bg-white border-2 border-transparent rounded-[1.5rem] outline-none focus:border-brand-primary focus:bg-white transition-all font-black text-slate-800 shadow-inner text-sm"
                                                         value={item.quantity}
                                                         onChange={e => handleUpdateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                                                     />
                                                 </div>
                                                 {formData.items.length > 1 && (
                                                     <button
                                                         type="button"
                                                         onClick={() => handleRemoveItem(index)}
                                                         className="p-4 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-sm shrink-0"
                                                     >
                                                         <Trash2 size={20} />
                                                     </button>
                                                 )}
                                             </div>
                                         </div>
                                     </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={handleAddItem}
                                    className="w-full py-5 border-2 border-dashed border-slate-200 rounded-[1.5rem] text-slate-400 font-black text-[10px] uppercase tracking-widest hover:border-brand-primary hover:text-brand-primary hover:bg-brand-primary/5 transition-all flex items-center justify-center gap-2 mt-2"
                                >
                                    <Plus size={16} /> BAŞKA ÜRÜN EKLE
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 p-5 sm:p-6 bg-slate-50 rounded-[2rem] border-2 border-slate-100/50">
                            <label className="flex items-center gap-4 cursor-pointer group flex-1">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={formData.isCorporate}
                                        onChange={e => setFormData({ ...formData, isCorporate: e.target.checked })}
                                    />
                                    <div className={`w-12 h-7 sm:w-14 sm:h-8 rounded-full transition-all duration-300 ${formData.isCorporate ? 'bg-brand-primary' : 'bg-slate-300'}`}></div>
                                    <div className={`absolute top-1 left-1 w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-full transition-all duration-300 shadow-md flex items-center justify-center ${formData.isCorporate ? 'translate-x-5 sm:translate-x-6' : 'translate-x-0'}`}>
                                        {formData.isCorporate && <CheckCircle size={12} sm:size={14} className="text-brand-primary" />}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] sm:text-[11px] font-black text-slate-900 uppercase tracking-widest leading-none">Kurumsal Müşteri</p>
                                    <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase mt-1">İşletme statüsünde kaydet</p>
                                </div>
                            </label>
                        </div>

                        <div className="bg-slate-900 p-6 sm:p-8 rounded-[2.5rem] space-y-6 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-1 flex items-center gap-2">
                                    <RefreshCw size={14} className="text-brand-primary" /> ABONELİK PERİYODU
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    {plans.map((p) => (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => handlePlanChange(p.id)}
                                            className={`py-3 sm:py-4 rounded-2xl border-2 transition-all text-center ${formData.plan === p.id
                                                ? 'border-brand-primary bg-brand-primary/10 text-white'
                                                : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
                                                }`}
                                        >
                                            <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest">{p.label}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">SIRAKİ TESLİMAT</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                        <input
                                            type="date" 
                                            className={`w-full pl-12 pr-4 py-4 bg-white/5 border-2 border-white/10 rounded-2xl outline-none focus:border-brand-primary focus:bg-white/10 transition-all font-black text-white text-[11px] sm:text-xs ${formData.plan === 'Yok' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            disabled={formData.plan === 'Yok'}
                                            value={formData.nextDelivery}
                                            onChange={e => setFormData({ ...formData, nextDelivery: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">ÜYELİK DURUMU</label>
                                    <div className="relative">
                                        <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                        <select
                                            className="w-full pl-12 pr-4 py-4 bg-white/5 border-2 border-white/10 rounded-2xl outline-none focus:border-brand-primary focus:bg-white/10 transition-all font-black text-white text-[11px] sm:text-xs appearance-none cursor-pointer"
                                            value={formData.status}
                                            onChange={e => setFormData({ ...formData, status: e.target.value })}
                                        >
                                            {statuses.map(s => <option key={s.id} value={s.id} className="bg-slate-900">{s.label}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-5 sm:p-8 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-3 sm:gap-4 sticky bottom-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 sm:py-6 bg-white border-2 border-slate-100 rounded-[2rem] font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all active:scale-95"
                        >
                            İPTAL
                        </button>
                        <button
                            type="submit"
                            className="flex-[2] py-4 sm:py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-brand-primary transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-3"
                        >
                            <ShieldCheck size={20} />
                            {subscriber ? 'GÜNCELLEMEYİ KAYDET' : 'ABONELİĞİ BAŞLAT'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SubscriberDrawer;
