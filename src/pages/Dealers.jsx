import React, { useState } from 'react';
import { 
    Store, 
    Plus, 
    Search, 
    Edit, 
    Trash2, 
    TrendingUp, 
    TrendingDown, 
    Wallet, 
    Users, 
    Filter, 
    ChevronRight, 
    Phone, 
    MapPin, 
    MoreHorizontal,
    X,
    CheckCircle2,
    AlertCircle,
    BadgePercent,
    ArrowUpRight,
    ArrowDownRight,
    Landmark
} from 'lucide-react';
import useStore from '../store/useStore';
const Dealers = () => {
    const { subscribers, addSubscriber, updateSubscriber, deleteSubscriber, orders, expenses } = useStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
    const [selectedDealer, setSelectedDealer] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
        type: 'bayi',
        status: 'Active',
        notes: '',
        creditLimit: 0,
        balance: 0
    });

    const getSubscriberDocId = (subscriberOrId) => {
        if (!subscriberOrId) return null;
        if (typeof subscriberOrId === 'string') return subscriberOrId;
        return subscriberOrId.firestoreId || subscriberOrId.id || null;
    };

    const getDealerInitial = (value) => {
        const normalized = String(value ?? '').trim();
        return normalized ? normalized.charAt(0).toLocaleUpperCase('tr-TR') : '?';
    };

    const normalizeText = (value) => String(value ?? '').toLocaleLowerCase('tr-TR');

    const dealers = subscribers.filter(s => {
        const typeMatch = normalizeText(s?.type).includes('bayi') || s.type === 'bayi' || s.type === 'corporate';
        const search = normalizeText(searchTerm);
        const nameMatch = normalizeText(s?.name).includes(search);
        const phoneMatch = String(s?.phone || '').includes(searchTerm || '');
        return typeMatch && (nameMatch || phoneMatch);
    });

    // Calculate Stats
    const totalDealers = dealers.length;
    const activeDealers = dealers.filter(d => d.status === 'Active').length;
    const totalBalance = dealers.reduce((acc, d) => acc + (Number(d.balance) || 0), 0);

    const handleOpenAdd = () => {
        setFormData({
            name: '',
            phone: '',
            address: '',
            type: 'bayi',
            status: 'Active',
            notes: '',
            creditLimit: 0,
            balance: 0
        });
        setIsEditMode(false);
        setIsAddDrawerOpen(true);
    };

    const handleOpenEdit = (dealer) => {
        setFormData({ ...dealer });
        setSelectedDealer(dealer);
        setIsEditMode(true);
        setIsAddDrawerOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isEditMode && selectedDealer) {
            await updateSubscriber(getSubscriberDocId(selectedDealer), formData);
        } else {
            await addSubscriber(formData);
        }
        setIsAddDrawerOpen(false);
    };

    const handleDelete = async (dealer) => {
        const dealerDocId = getSubscriberDocId(dealer);
        if (!dealerDocId) return;
        if (deleteConfirmId === dealerDocId) {
            await deleteSubscriber(dealerDocId);
            useStore.getState().addNotification('Bayi başarıyla silindi.', 'success');
            setDeleteConfirmId(null);
        } else {
            setDeleteConfirmId(dealerDocId);
            useStore.getState().addNotification('Silmek için tekrar tıklayın.', 'warning');
            setTimeout(() => setDeleteConfirmId(null), 3000);
        }
    };

    return (
        <div className="p-4 md:p-8 bg-slate-50 min-h-screen pb-24 md:pb-8">
            {/* Header & Stats */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight font-display">Bayi Yönetimi</h1>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Bayilerİnİzİ, bakiye ve İşlemlerİnİ yönetİn</p>
                </div>
                <button 
                    onClick={handleOpenAdd}
                    className="flex items-center gap-2 bg-brand-primary text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                    <Plus size={18} /> YENİ BAYİ EKLE
                </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="premium-card p-6 bg-white border border-slate-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
                        <Store size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Toplam Bayi</p>
                        <p className="text-2xl font-black text-slate-900 font-display">{totalDealers}</p>
                    </div>
                </div>
                <div className="premium-card p-6 bg-white border border-slate-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center">
                        <CheckCircle2 size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aktif Bayiler</p>
                        <p className="text-2xl font-black text-slate-900 font-display">{activeDealers}</p>
                    </div>
                </div>
                <div className={`premium-card p-6 border flex items-center gap-4 ${totalBalance >= 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${totalBalance >= 0 ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                        <Wallet size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Toplam Bakiye</p>
                        <p className="text-2xl font-black font-display">₺{totalBalance.toLocaleString()}</p>
                    </div>
                </div>
                <div className="premium-card p-6 bg-slate-900 border border-slate-800 flex items-center gap-4 text-white">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                        <Landmark size={24} className="text-brand-accent" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kredi Limitleri</p>
                        <p className="text-2xl font-black font-display text-white">₺{dealers.reduce((acc, d) => acc + (Number(d.creditLimit) || 0), 0).toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm mb-8 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Bayi ismi veya telefon numarası ile ara..." 
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-brand-primary transition-all font-bold text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <select 
                        className="bg-slate-50 border border-slate-100 rounded-2xl px-6 py-3.5 outline-none font-black text-[10px] uppercase tracking-widest text-slate-500"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                    >
                        <option value="all">Tüm Durumlar</option>
                        <option value="Active">Aktif</option>
                        <option value="Suspended">Askıya Alındı</option>
                        <option value="Inactive">Pasif</option>
                    </select>
                </div>
            </div>

            {/* Dealers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {dealers.map(dealer => (
                    <div key={getSubscriberDocId(dealer) || dealer.id} className={`premium-card bg-white border border-slate-100 group hover:-translate-y-1 transition-all duration-200 ${deleteConfirmId === getSubscriberDocId(dealer) ? 'ring-2 ring-rose-500 bg-rose-50/10' : ''}`}>
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-black text-xl border border-slate-100 group-hover:from-brand-primary group-hover:to-brand-primary group-hover:text-white transition-all">
                                        {getDealerInitial(dealer.name)}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-900 uppercase tracking-tight leading-none mb-1 group-hover:text-brand-primary transition-colors">{dealer.name}</h3>
                                        <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md ${dealer.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                            {dealer.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => handleOpenEdit(dealer)} className="p-2 text-slate-400 hover:text-brand-primary hover:bg-brand-primary/5 rounded-xl transition-all">
                                        <Edit size={16} />
                                    </button>
                                     <button onClick={() => handleDelete(dealer)} className={`p-2 rounded-xl transition-all ${deleteConfirmId === getSubscriberDocId(dealer) ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50'}`}>
                                         <Trash2 size={16} />
                                     </button>
                                </div>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div className="flex items-center gap-3 text-slate-500">
                                    <Phone size={14} className="text-slate-300" />
                                    <span className="text-xs font-bold">{dealer.phone || 'Telefon Yok'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-500">
                                    <MapPin size={14} className="text-slate-300" />
                                    <span className="text-xs font-bold truncate">{dealer.address || 'Adres Girilmemiş'}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-6">
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Bakiye</p>
                                    <p className={`text-lg font-black font-display ${(dealer.balance || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>₺{(dealer.balance || 0).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Kredi Limiti</p>
                                    <p className="text-lg font-black font-display text-slate-900">₺{(dealer.creditLimit || 0).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-b-[2rem] border-t border-slate-100 flex justify-between items-center group-hover:bg-brand-primary/5 transition-colors">
                            <button className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-brand-primary transition-colors flex items-center gap-2">
                                İŞLEM GEÇMİŞİ <ChevronRight size={14} />
                            </button>
                            {dealer.notes && (
                                <div title={dealer.notes} className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 cursor-help">
                                    <MoreHorizontal size={14} />
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {dealers.length === 0 && (
                    <div className="col-span-full py-20 bg-white rounded-[3rem] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-300">
                            <Store size={40} />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">Bayi Bulunamadı</h3>
                        <p className="text-slate-400 text-sm mt-2 max-w-xs mx-auto font-medium">Aradığınız kriterlere uygun bayi bulunmuyor veya henüz bayi eklemediniz.</p>
                    </div>
                )}
            </div>

            {/* Add/Edit Drawer */}
            {isAddDrawerOpen && (
                <div className="fixed inset-0 z-[150] flex justify-end">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsAddDrawerOpen(false)}></div>
                    <div className="relative bg-white w-full sm:max-w-md h-[100dvh] md:h-auto md:max-h-screen shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-right duration-200">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight font-display uppercase">{isEditMode ? 'Bayi Düzenle' : 'Yeni Bayi Kaydı'}</h3>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Lütfen tüm alanları eksİksİz doldurun</p>
                            </div>
                            <button onClick={() => setIsAddDrawerOpen(false)} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-600 transition-colors border border-slate-100">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto scrollbar-hide p-8 space-y-8 pb-4">
                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2 px-1">Bayi İsmi / Ünvanı</label>
                                    <input 
                                        type="text" required
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:border-brand-primary transition-all"
                                        placeholder="Örn: Kuzey Su Bayi"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2 px-1">Telefon</label>
                                        <input 
                                            type="tel"
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:border-brand-primary transition-all"
                                            placeholder="05xx..."
                                            value={formData.phone}
                                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2 px-1">Durum</label>
                                        <select 
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:border-brand-primary transition-all"
                                            value={formData.status}
                                            onChange={(e) => setFormData({...formData, status: e.target.value})}
                                        >
                                            <option value="Active">Aktif</option>
                                            <option value="Suspended">Askıda</option>
                                            <option value="Inactive">Pasif</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2 px-1">Adres Bilgisi</label>
                                    <textarea 
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:border-brand-primary transition-all min-h-[100px]"
                                        placeholder="Tam adres giriniz..."
                                        value={formData.address}
                                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3 md:gap-4">
                                    <div className="min-w-0">
                                        <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest md:tracking-[0.2em] block mb-2 px-1 text-emerald-600 truncate">Başlangıç Bakiyesi (₺)</label>
                                        <input 
                                            type="number"
                                            className="w-full bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 text-sm font-black text-emerald-700 outline-none focus:border-emerald-500 transition-all"
                                            value={formData.balance}
                                            onChange={(e) => setFormData({...formData, balance: Number(e.target.value)})}
                                        />
                                    </div>
                                    <div className="min-w-0">
                                        <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest md:tracking-[0.2em] block mb-2 px-1 text-slate-900 truncate">Kredi Limiti (₺)</label>
                                        <input 
                                            type="number"
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-black text-slate-900 outline-none focus:border-brand-primary transition-all"
                                            value={formData.creditLimit}
                                            onChange={(e) => setFormData({...formData, creditLimit: Number(e.target.value)})}
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 pb-24 md:pb-8">
                                    <button 
                                        type="submit"
                                        className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase text-[11px] md:text-xs tracking-[0.25em] shadow-2xl shadow-slate-900/30 hover:scale-[1.02] active:scale-95 transition-all"
                                    >
                                        {isEditMode ? 'DEĞİŞİKLİKLERİ KAYDET' : 'BAYİ KAYDINI TAMAMLA'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dealers;
