import React, { useState, useMemo, useCallback } from 'react';
import { Users, Search, Filter, Phone, MapPin, MoreHorizontal, CheckCircle, XCircle, RefreshCw, FileSpreadsheet, Upload, Package, Calendar, UserPlus, Edit2, ChevronRight, TrendingUp, UserCheck, UserMinus, Trash2, Building2, User } from 'lucide-react';
import useStore from '../store/useStore';
import SubscriberDrawer from '../components/SubscriberDrawer';
import ExcelImportDrawer from '../components/ExcelImportDrawer';

const Subscribers = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [isSubscriberDrawerOpen, setIsSubscriberDrawerOpen] = useState(false);
    const [selectedSubscriber, setSelectedSubscriber] = useState(null);
    const [isImportDrawerOpen, setIsImportDrawerOpen] = useState(false);
    const [activeMenu, setActiveMenu] = useState(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);
    const [importStats, setImportStats] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const [visibleCount, setVisibleCount] = useState(50);
    const [sortOption, setSortOption] = useState('newest'); // 'newest', 'oldest', 'name_asc', 'name_desc'

    const { subscribers, addSubscriber, updateSubscriber, deleteSubscriber, bulkUpdateSubscribers, bulkDeleteSubscribers } = useStore();

    const typeMap = {
        'All': 'Tümü',
        'Corporate': 'Kurumsal (İşletme)',
        'Individual': 'Bireysel'
    };

    const statusMap = {
        'All': 'Tümü',
        'Active': 'Aktif',
        'Pending': 'Beklemede',
        'Suspended': 'Askıya Alındı'
    };

    const getSubscriberDocId = (subscriberOrId) => {
        if (!subscriberOrId) return null;
        if (typeof subscriberOrId === 'string') return subscriberOrId;
        return subscriberOrId.firestoreId || subscriberOrId.id || null;
    };

    const getMenuId = (subscriber) => getSubscriberDocId(subscriber) || subscriber?.id || null;
    const normalizeText = (value) => String(value ?? '').toLocaleLowerCase('tr-TR');

    const handleStatusUpdate = async (subscriber, newStatus) => {
        const subscriberDocId = getSubscriberDocId(subscriber);
        if (!subscriberDocId) return;
        await updateSubscriber(subscriberDocId, { status: newStatus });
        setActiveMenu(null);
    };

    const handleOpenEdit = (sub) => {
        setSelectedSubscriber(sub);
        setIsSubscriberDrawerOpen(true);
        setActiveMenu(null);
        setDeleteConfirmId(null);
    };

    const handleSaveSubscriber = async (data) => {
        if (selectedSubscriber) {
            await updateSubscriber(getSubscriberDocId(selectedSubscriber), data);
        } else {
            let maxId = -1;
            subscribers.forEach(sub => {
                const match = String(sub.id).match(/^\d+$/);
                if (match) {
                    maxId = Math.max(maxId, parseInt(match[0], 10));
                }
            });
            const systemId = String(maxId + 1).padStart(4, '0');
            await addSubscriber({
                id: systemId,
                ...data
            });
        }
        setIsSubscriberDrawerOpen(false);
        setSelectedSubscriber(null);
        setActiveMenu(null);
        setDeleteConfirmId(null);
    };

    const handleDelete = async (subscriber) => {
        const subscriberDocId = getSubscriberDocId(subscriber);
        if (!subscriberDocId) return;

        if (deleteConfirmId === subscriberDocId) {
            await deleteSubscriber(subscriberDocId);
            useStore.getState().addNotification('Abone başarıyla silindi.', 'success');
            setActiveMenu(null);
            setDeleteConfirmId(null);
        } else {
            setDeleteConfirmId(subscriberDocId);
            useStore.getState().addNotification('Silmek için tekrar tıklayın.', 'warning');
            setTimeout(() => setDeleteConfirmId(null), 3000);
        }
    };

    const handleBulkImport = async (newSubs) => {
        let addedCount = 0;
        let maxId = -1;
        subscribers.forEach(sub => {
            const match = String(sub.id).match(/^\d+$/);
            if (match) {
                maxId = Math.max(maxId, parseInt(match[0], 10));
            }
        });

        for (const sub of newSubs) {
            maxId++;
            const systemId = String(maxId).padStart(4, '0');
            await addSubscriber({
                id: systemId,
                ...sub
            });
            addedCount++;
        }
        setImportStats({ added: addedCount, duplicates: 0 });
    };

    const typeCounts = useMemo(() => {
        return subscribers.reduce((acc, s) => {
            acc.All++;
            if (s.isCorporate) acc.Corporate++;
            else acc.Individual++;
            return acc;
        }, { All: 0, Corporate: 0, Individual: 0 });
    }, [subscribers]);

    const statusCounts = useMemo(() => {
        return subscribers.reduce((acc, s) => {
            acc.All++;
            if (s.status === 'Active') acc.Active++;
            else if (s.status === 'Pending') acc.Pending++;
            else if (s.status === 'Suspended') acc.Suspended++;
            return acc;
        }, { All: 0, Active: 0, Pending: 0, Suspended: 0 });
    }, [subscribers]);
    const displaySubscribers = useMemo(() => {
        const lowerSearch = normalizeText(searchTerm);
        let filtered = subscribers.filter(sub => {
            const matchesSearch = normalizeText(sub?.name).includes(lowerSearch) ||
                String(sub.phone || '').includes(searchTerm || '') ||
                normalizeText(sub?.address).includes(lowerSearch) ||
                (sub.legacyId && String(sub.legacyId).includes(searchTerm || ''));
            const matchesType = filterType === 'All' || 
                (filterType === 'Corporate' && sub.isCorporate) || 
                (filterType === 'Individual' && !sub.isCorporate);
            return matchesSearch && matchesType;
        });

        // Apply Sorting
        filtered.sort((a, b) => {
            if (sortOption === 'name_asc') {
                return String(a?.name ?? '').localeCompare(String(b?.name ?? ''), 'tr');
            } else if (sortOption === 'name_desc') {
                return String(b?.name ?? '').localeCompare(String(a?.name ?? ''), 'tr');
            } else if (sortOption === 'oldest') {
                return parseInt(a.id) - parseInt(b.id);
            } else {
                // Newest is default (highest ID)
                return parseInt(b.id) - parseInt(a.id);
            }
        });
        return filtered;
    }, [subscribers, searchTerm, filterType, sortOption]);

    const paginatedSubscribers = useMemo(() => {
        return displaySubscribers.slice(0, visibleCount);
    }, [displaySubscribers, visibleCount]);

    const toggleSelectAll = useCallback(() => {
        if (selectedIds.length === displaySubscribers.length && displaySubscribers.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(displaySubscribers.map(sub => getSubscriberDocId(sub)).filter(Boolean));
        }
    }, [selectedIds, displaySubscribers]);

    const toggleSelect = useCallback((id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    }, []);

    const handleLoadMore = useCallback(() => {
        setVisibleCount(prev => prev + 50);
    }, []);

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (deleteConfirmId === 'bulk') {
            await bulkDeleteSubscribers(selectedIds);
            setSelectedIds([]);
            setDeleteConfirmId(null);
            useStore.getState().addNotification('Seçili aboneler silindi.', 'success');
        } else {
            setDeleteConfirmId('bulk');
            useStore.getState().addNotification('Toplu silme işlemini onaylamak için tekrar tıklayın.', 'warning');
            setTimeout(() => setDeleteConfirmId(null), 3000);
        }
    };

    const handleBulkStatusUpdate = async (status) => {
        if (selectedIds.length === 0) return;
        await bulkUpdateSubscribers(selectedIds, { status });
        setSelectedIds([]);
        setDeleteConfirmId(null);
        useStore.getState().addNotification('Seçili aboneler güncellendi.', 'success');
    };

    const handleBulkCorporateUpdate = async (isCorporate) => {
        if (selectedIds.length === 0) return;
        await bulkUpdateSubscribers(selectedIds, { isCorporate });
        setSelectedIds([]);
        setDeleteConfirmId(null);
        useStore.getState().addNotification('Seçili abone tipi güncellendi.', 'success');
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const getSubscriberInitial = (name) => {
        const normalizedName = String(name ?? '').trim();
        return normalizedName ? normalizedName.charAt(0) : '?';
    };

    return (
        <div className="p-4 md:p-8 bg-slate-50 min-h-screen w-full overflow-hidden selection:bg-brand-primary/10">
            {/* Header section with Stats & Search */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-6">
                <div>
                    <p className="text-brand-primary text-[10px] font-black uppercase tracking-[0.2em] mb-1">Müşteri Portföyü</p>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-display break-words">Aboneler</h1>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-4">
                        <span className="px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center gap-1.5"><UserCheck size={14} className="shrink-0"/> <span className="hidden sm:inline">Aktif Abone:</span><span className="sm:hidden">Aktif:</span> {statusCounts.Active}</span>
                        <span className="px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-100 flex items-center gap-1.5"><TrendingUp size={14} className="shrink-0"/> <span className="hidden sm:inline">Bekleyen:</span><span className="sm:hidden">Bek.:</span> {statusCounts.Pending}</span>
                        <span className="px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest bg-rose-50 text-rose-600 border border-rose-100 flex items-center gap-1.5"><UserMinus size={14} className="shrink-0"/> <span className="hidden sm:inline">AskÄ±da Olan:</span><span className="sm:hidden">AskÄ±:</span> {statusCounts.Suspended}</span>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
                    <button
                        onClick={() => setIsImportDrawerOpen(true)}
                        className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-6 py-3.5 rounded-2xl transition-all font-black text-xs uppercase tracking-widest shadow-sm flex items-center justify-center gap-2.5 active:scale-95"
                    >
                        <Upload size={18} className="text-emerald-500" /> EXCEL AKTAR
                    </button>
                    <button
                        onClick={() => {
                            setSelectedSubscriber(null);
                            setIsSubscriberDrawerOpen(true);
                        }}
                        className="bg-slate-900 hover:bg-black text-white px-8 py-3.5 rounded-2xl transition-all font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2.5 active:scale-95 translate-y-0 hover:translate-y-[-2px]"
                    >
                        <UserPlus size={18} /> YENİ ABONE
                    </button>
                </div>
            </div>

            {/* Quick Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="premium-card p-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                        <Users size={22} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kayıtlı Abone</p>
                        <p className="text-xl font-black text-slate-900 font-display">{typeCounts.All}</p>
                    </div>
                </div>
                <div className="premium-card p-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary shadow-sm">
                        <Building2 size={22} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kurumsal (İşletme)</p>
                        <p className="text-xl font-black text-slate-900 font-display">{typeCounts.Corporate}</p>
                    </div>
                </div>
                <div className="premium-card p-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm">
                        <User size={22} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bireysel Müşteri</p>
                        <p className="text-xl font-black text-slate-900 font-display">{typeCounts.Individual}</p>
                    </div>
                </div>
            </div>

            {importStats && (
                <div className="mb-10 p-6 bg-emerald-50 text-emerald-800 rounded-[2rem] flex items-center gap-4 border border-emerald-100 shadow-sm animate-in slide-in-from-top duration-200">
                    <CheckCircle size={24} className="text-emerald-600" />
                    <span className="font-bold text-sm">
                        <span className="text-emerald-900 font-black">{importStats.added}</span> yeni abone başarıyla aktarıldı.
                    </span>
                    <button onClick={() => setImportStats(null)} className="ml-auto p-2 hover:bg-emerald-100 rounded-xl transition-colors">
                        <XCircle size={20} className="text-emerald-400" />
                    </button>
                </div>
            )}

            {/* Filters & Search */}
            <div className="premium-card p-5 mb-8 flex flex-col md:flex-row justify-between items-center gap-5 bg-white/50 backdrop-blur-xl">
                <div className="relative group w-full max-w-md">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Ä°sim, telefon veya eski no ile ara..."
                        className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary focus:bg-white transition-all font-bold text-sm shadow-inner"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setVisibleCount(50); // Reset pagination on search
                        }}
                    />
                </div>
                
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto scrollbar-hide">
                    <select
                        className="px-6 py-3 bg-white border border-slate-100 outline-none rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-sm focus:border-brand-primary"
                        value={sortOption}
                        onChange={(e) => { setSortOption(e.target.value); setVisibleCount(50); }}
                    >
                        <option value="newest">En Yeni (Önce)</option>
                        <option value="oldest">En Eski (Önce)</option>
                        <option value="name_asc">A-Z İsim</option>
                        <option value="name_desc">Z-A İsim</option>
                    </select>
                </div>

                <div className="flex gap-2 p-1.5 bg-slate-100/50 rounded-2xl border border-slate-100 overflow-x-auto scrollbar-hide w-full md:w-auto">
                    {['All', 'Corporate', 'Individual'].map(type => (
                        <button
                            key={type}
                            onClick={() => {
                                setFilterType(type);
                                setVisibleCount(50); // Reset pagination on filter
                            }}
                            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterType === type
                                ? 'bg-white text-brand-primary shadow-lg shadow-brand-primary/5 border border-slate-200'
                                : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
                                }`}
                        >
                            {typeMap[type]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Mobile Cards (Visible only on small screens) */}
            <div className="lg:hidden space-y-4 mb-8">
                {paginatedSubscribers.map(sub => (
                    <div key={getSubscriberDocId(sub) || sub.id} className="premium-card p-6 relative">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-xl">
                                    {getSubscriberInitial(sub.name)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">{sub.name}</h3>
                                    <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest">{sub.id}</p>
                                </div>
                            </div>
                            <button onClick={() => setActiveMenu(activeMenu === getMenuId(sub) ? null : getMenuId(sub))} className="p-2 text-slate-400">
                                <MoreHorizontal size={20} />
                            </button>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-sm text-slate-600 font-bold">
                                <Phone size={16} className="text-brand-primary" /> <span className="truncate">{sub.phone}</span>
                            </div>
                            <div className="flex items-start gap-3 text-xs text-slate-500 font-medium">
                                <MapPin size={16} className="text-slate-300 mt-0.5 shrink-0" /> {sub.address}
                            </div>
                            <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                                <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${sub.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                    {statusMap[sub.status]}
                                </span>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                    <Calendar size={14} /> {formatDate(sub.nextDelivery)}
                                </div>
                            </div>
                        </div>

                        {activeMenu === getMenuId(sub) && (
                            <div className="fixed inset-0 z-[100] sm:relative sm:inset-auto">
                                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm sm:hidden" onClick={() => setActiveMenu(null)}></div>
                                <div className="absolute right-4 left-4 top-1/2 -translate-y-1/2 sm:top-14 sm:translate-y-0 sm:left-auto sm:right-0 glass-dark rounded-[2.5rem] shadow-2xl z-[110] w-auto sm:w-72 p-3 animate-in fade-in zoom-in duration-200 border border-white/10">
                                    <div className="bg-white/5 px-6 py-4 rounded-[1.8rem] mb-3 border border-white/5">
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-primary mb-1">Müşteri Seçenekleri</p>
                                        <h4 className="text-sm font-black text-white truncate leading-tight">{sub.name}</h4>
                                    </div>

                                    <div className="grid grid-cols-1 gap-2">
                                        <button onClick={() => handleOpenEdit(sub)} className="w-full h-14 px-6 rounded-2xl text-[10px] font-black text-slate-300 hover:bg-white/10 hover:text-white transition-all flex items-center gap-4 bg-white/5 border border-white/5 group">
                                            <div className="w-8 h-8 rounded-xl bg-brand-primary/20 flex items-center justify-center text-brand-primary group-hover:scale-110 transition-transform">
                                                <Edit2 size={16} />
                                            </div>
                                            <span>GÜNCELLE</span>
                                        </button>

                                        <div className="grid grid-cols-3 gap-2">
                                                            <button onClick={() => handleStatusUpdate(sub, 'Active')} className="h-14 flex flex-col items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all group" title="Aktif Yap">
                                                <CheckCircle size={18} className="mb-1" />
                                                <span className="text-[8px] font-black uppercase tracking-tighter">AKTİF</span>
                                            </button>
                                                            <button onClick={() => handleStatusUpdate(sub, 'Pending')} className="h-14 flex flex-col items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-white transition-all group" title="Beklemeye Al">
                                                <TrendingUp size={18} className="mb-1" />
                                                <span className="text-[8px] font-black uppercase tracking-tighter">BEKLE</span>
                                            </button>
                                                            <button onClick={() => handleStatusUpdate(sub, 'Suspended')} className="h-14 flex flex-col items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white transition-all group" title="AskÄ±ya Al">
                                                <XCircle size={18} className="mb-1" />
                                                <span className="text-[8px] font-black uppercase tracking-tighter">ASKI</span>
                                            </button>
                                        </div>

                                                            <button onClick={() => handleDelete(sub)} className="w-full h-14 px-6 rounded-2xl text-[10px] font-black text-rose-100 bg-rose-500/10 hover:bg-rose-500 hover:text-white transition-all flex items-center gap-4 border border-rose-500/20 group">
                                            <div className="w-8 h-8 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform bg-white/5">
                                                <Trash2 size={16} />
                                            </div>
                                            <span>ABONELİĞİ TAMAMEN SİL</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Subscribers Table (Desktop only) */}
            <div className={`hidden lg:block premium-card ${activeMenu ? 'overflow-visible z-50 relative' : 'overflow-hidden'}`}>
                <div className="overflow-visible">
                    <table className="w-full table-fixed text-left">
                        <thead className="bg-slate-50/50 border-b border-slate-100 text-slate-400 text-[10px] uppercase font-black tracking-[0.2em]">
                            <tr>
                                <th className="px-3 py-4 w-10">
                                    <div className="flex items-center justify-center">
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 rounded-lg border-2 border-slate-200 text-brand-primary focus:ring-brand-primary/20 transition-all cursor-pointer"
                                            checked={selectedIds.length === displaySubscribers.length && displaySubscribers.length > 0}
                                            onChange={toggleSelectAll}
                                        />
                                    </div>
                                </th>
                                <th className="px-3 py-4 w-[21%]">Abone Bilgisi</th>
                                <th className="px-3 py-4 w-[24%]">İletişim & Adres</th>
                                <th className="px-3 py-4 w-[8%] text-center">İşletme</th>
                                <th className="px-3 py-4 w-[15%] text-center">Ürün & Miktar</th>
                                <th className="px-3 py-4 w-[12%] text-center">Durum</th>
                                <th className="px-3 py-4 w-[14%]">Sonraki Teslimat</th>
                                <th className="px-3 py-4 w-[6%] text-right">Eylem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/50">
                            {paginatedSubscribers.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-5 py-16 text-center">
                                        <div className="flex flex-col items-center gap-6">
                                            <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200">
                                                <Users size={48} />
                                            </div>
                                            <div>
                                                <p className="text-xl font-black text-slate-800 font-display">Abonelik Kaydı Bulunamadı±</p>
                                                <p className="text-sm text-slate-400 font-medium mt-1">Sisteme henüz bir abone kaydı girilmemiş veya arama kriteri yanlış.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedSubscribers.map((sub, idx) => (
                                    <tr key={sub.firestoreId || sub.id} className={`hover:bg-slate-50/80 transition-all duration-200 group ${selectedIds.includes(getSubscriberDocId(sub)) ? 'bg-brand-primary/[0.02]' : ''}`}>
                                        <td className="px-3 py-4 w-10">
                                            <div className="flex items-center justify-center">
                                                <input
                                                    type="checkbox"
                                                    className="w-5 h-5 rounded-lg border-2 border-slate-200 text-brand-primary focus:ring-brand-primary/20 transition-all cursor-pointer"
                                                    checked={selectedIds.includes(getSubscriberDocId(sub))}
                                                    onChange={() => toggleSelect(getSubscriberDocId(sub))}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-3 py-4">
                                            <div className="flex items-center gap-4 min-w-0">
                                                <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-xl transition-all duration-300 group-hover:bg-brand-primary shrink-0">
                                                    {getSubscriberInitial(sub.name)}
                                                </div>
                                                <div className="overflow-hidden min-w-0">
                                                    <h3 className="font-black text-slate-900 text-sm tracking-tight leading-tight mb-1 truncate" title={sub.name}>{sub.name}</h3>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="text-[10px] font-black text-brand-primary bg-brand-primary/5 px-2.5 py-1 rounded-lg border border-brand-primary/10 tracking-widest shrink-0">{String(sub.id).match(/^\d+$/) ? String(sub.id).padStart(4, '0') : sub.id}</span>
                                                        {sub.legacyId && (
                                                            <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100 tracking-widest truncate max-w-[100px]" title={`Eski No: ${sub.legacyId}`}>Eski No: {sub.legacyId}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-4">
                                            <div className="space-y-1.5">
                                                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-700">
                                                    <Phone size={14} className="text-brand-primary" />
                                                    <span className="truncate">{sub.phone}</span>
                                                </div>
                                                <div className="flex items-start gap-2 text-[10px] font-medium text-slate-400 overflow-hidden">
                                                    <MapPin size={14} className="text-slate-300 mt-0.5 shrink-0" />
                                                    <span className="line-clamp-2 break-words text-left">{sub.address}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-4 text-center">
                                            <div className="flex justify-center">
                                                {sub.isCorporate ? (
                                                    <div className="w-10 h-10 bg-brand-primary/10 text-brand-primary rounded-xl flex items-center justify-center shadow-sm border border-brand-primary/20" title="Kurumsal">
                                                        <Building2 size={20} />
                                                    </div>
                                                ) : (
                                                    <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center border border-slate-100" title="Bireysel">
                                                        <User size={20} />
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-3 py-4 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <span className="text-xs font-black text-slate-800 text-center line-clamp-2">{sub.product || '-'}</span>
                                                <span className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg mt-1 font-bold">x{sub.quantity || 1}</span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-4">
                                            <div className="flex items-center justify-center">
                                                <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm ${sub.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                    sub.status === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                        'bg-rose-50 text-rose-600 border-rose-100'
                                                    }`}>
                                                    {statusMap[sub.status] || sub.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all shrink-0">
                                                    <Calendar size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-slate-900 leading-tight">{formatDate(sub.nextDelivery || sub.nextRenewal)}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Teslimat</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-4 text-right w-20 relative overflow-visible">
                                            <button
                                                onClick={() => setActiveMenu(activeMenu === getMenuId(sub) ? null : getMenuId(sub))}
                                                className={`p-3.5 rounded-2xl transition-all ${activeMenu === getMenuId(sub) ? 'bg-slate-900 text-white shadow-xl rotate-90 scale-110' : 'text-slate-300 hover:text-slate-900 hover:bg-slate-100'}`}
                                            >
                                                <MoreHorizontal size={20} />
                                            </button>

                                            {activeMenu === getMenuId(sub) && (
                                                <>
                                                    <div
                                                        className="fixed inset-0 z-[55] cursor-default bg-transparent"
                                                        onClick={() => setActiveMenu(null)}
                                                    />
                                                    <div className={`absolute right-full mr-2 ${idx > paginatedSubscribers.length - 3 ? 'bottom-0' : 'top-0'} glass-dark rounded-[2.5rem] shadow-2xl z-[60] w-72 max-w-[calc(100vw-8rem)] p-4 animate-in fade-in zoom-in duration-200 border border-white/10`}>
                                                        <div className="bg-white/5 px-6 py-4 rounded-[1.8rem] mb-4 border border-white/5">
                                                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-primary mb-1">Müşteri Seçenekleri</p>
                                                            <h4 className="text-sm font-black text-white truncate leading-tight">{sub.name}</h4>
                                                        </div>

                                                        <div className="grid grid-cols-1 gap-3">
                                                            {/* Primary Actions */}
                                                            <button onClick={() => handleOpenEdit(sub)} className="w-full h-16 px-6 rounded-2xl text-[11px] font-black text-slate-200 hover:bg-white/10 hover:text-white transition-all flex items-center gap-4 bg-white/5 border border-white/5 group shadow-sm">
                                                                <div className="w-10 h-10 rounded-xl bg-brand-primary/20 flex items-center justify-center text-brand-primary group-hover:scale-110 transition-transform">
                                                                    <Edit2 size={18} />
                                                                </div>
                                                                <div className="text-left">
                                                                    <span className="block">BÄ°LGÄ°LERÄ° DÃœZENLE</span>
                                                                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest group-hover:text-slate-400 transition-colors">Adres ve telefon ayarları</span>
                                                                </div>
                                                            </button>

                                                            {/* Status Actions Grid */}
                                                            <div className="grid grid-cols-3 gap-3">
                                                                <button onClick={() => handleStatusUpdate(sub, 'Active')} className="h-20 flex flex-col items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all group" title="Aktif Yap">
                                                                     <div className="relative mb-2">
                                                                         <CheckCircle size={22} />
                                                                     </div>
                                                                     <span className="text-[9px] font-black uppercase tracking-widest">AKTİF</span>
                                                                 </button>
                                                                <button onClick={() => handleStatusUpdate(sub, 'Pending')} className="h-20 flex flex-col items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white transition-all group" title="Beklemeye Al">
                                                                    <TrendingUp size={22} className="mb-2" />
                                                                    <span className="text-[9px] font-black uppercase tracking-widest">BEKLE</span>
                                                                </button>
                                                                <button onClick={() => handleStatusUpdate(sub, 'Suspended')} className="h-20 flex flex-col items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all group" title="Askıya Al">
                                                                    <XCircle size={22} className="mb-2" />
                                                                    <span className="text-[9px] font-black uppercase tracking-widest">ASKI</span>
                                                                </button>
                                                            </div>

                                                            {/* Danger Zone */}
                                                            <button onClick={() => handleDelete(sub)} className="w-full h-16 px-6 rounded-2xl text-[11px] font-black text-rose-100 bg-rose-500/10 hover:bg-rose-500 hover:text-white transition-all flex items-center gap-4 border border-rose-500/20 group">
                                                                <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400 group-hover:bg-white group-hover:text-rose-500 transition-all">
                                                                    <Trash2 size={18} />
                                                                </div>
                                                                <div className="text-left">
                                                                    <span className="block">ABONELİĞİ SİL</span>
                                                                    <span className="text-[8px] font-bold uppercase tracking-widest opacity-60">Geri döndürülemez eylem</span>
                                                                </div>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {displaySubscribers.length > paginatedSubscribers.length && (
                    <div className="p-10 flex justify-center border-t border-slate-100 bg-slate-50/30">
                        <button
                            onClick={handleLoadMore}
                            className="bg-white border border-slate-200 text-slate-600 px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all active:scale-95 flex items-center gap-3"
                        >
                            <RefreshCw size={18} className="text-brand-primary" /> DAHA FAZLA YÃœKLE ({displaySubscribers.length - paginatedSubscribers.length} kayÄ±t kaldÄ±)
                        </button>
                    </div>
                )}
            </div>

            <SubscriberDrawer
                isOpen={isSubscriberDrawerOpen}
                onClose={() => setIsSubscriberDrawerOpen(false)}
                onSave={handleSaveSubscriber}
                subscriber={selectedSubscriber}
            />

            <ExcelImportDrawer
                isOpen={isImportDrawerOpen}
                onClose={() => setIsImportDrawerOpen(false)}
                onImport={handleBulkImport}
                subscribers={subscribers}
            />

            {/* Bulk Actions Bar */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom duration-300">
                    <div className="glass-dark px-8 py-5 rounded-[2.5rem] shadow-2xl border border-white/10 flex items-center gap-8 backdrop-blur-2xl">
                        <div className="flex items-center gap-4 border-r border-white/10 pr-8">
                            <div className="w-12 h-12 bg-brand-primary text-white rounded-2xl flex items-center justify-center font-black">
                                {selectedIds.length}
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest">SeÃ§ili Abone</p>
                                <p className="text-xs font-bold text-white uppercase tracking-tighter">Ä°ÅŸlem Bekliyor</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleBulkStatusUpdate('Active')}
                                className="w-36 h-12 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 border border-emerald-500/20"
                            >
                                <CheckCircle size={16} /> AKTÄ°F YAP
                            </button>
                            <button
                                onClick={() => handleBulkStatusUpdate('Suspended')}
                                className="w-36 h-12 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 border border-rose-500/20"
                            >
                                <XCircle size={16} /> DURDUR
                            </button>
                            <button
                                onClick={() => handleBulkCorporateUpdate(true)}
                                className="w-36 h-12 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-500 hover:text-white rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 border border-indigo-500/20"
                            >
                                <Building2 size={16} /> KURUMSAL
                            </button>
                            <div className="w-px h-8 bg-white/10 mx-2" />
                             <button
                                 onClick={handleBulkDelete}
                                 className={`px-5 py-3.5 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-xl ${deleteConfirmId === 'bulk' ? 'bg-rose-600 text-white' : 'bg-white text-slate-900 hover:bg-rose-50'}`}
                             >
                                 <Trash2 size={16} /> {deleteConfirmId === 'bulk' ? 'SÄ°LMEYÄ° ONAYLA' : 'SEÃ‡Ä°LÄ°LERÄ° SÄ°L'}
                             </button>
                            <button
                                onClick={() => setSelectedIds([])}
                                className="p-3.5 text-slate-400 hover:text-white transition-colors"
                                title="SeÃ§imi Temizle"
                            >
                                <RefreshCw size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Subscribers;


