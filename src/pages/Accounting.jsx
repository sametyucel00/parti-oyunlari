import React, { useState } from 'react';
import {
    Banknote,
    CreditCard as CreditCardIcon,
    History,
    Landmark,
    Plus,
    Lock,
    TrendingUp,
    TrendingDown,
    Wallet as WalletIcon,
    CheckCircle,
    Clock,
    XCircle,
    PieChart as PieChartIcon
} from 'lucide-react';

const formatRelativeTime = (isoString) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Az önce';
    if (diffMins < 60) return `${diffMins} dk önce`;

    if (date.toDateString() === now.toDateString()) {
        return `Bugün ${date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
    }

    return date.toLocaleString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};


import useStore from '../store/useStore';

// eslint-disable-next-line no-unused-vars
const StatCard = ({ title, value, subtext, icon: Icon, color, trend }) => (
    <div className="premium-card p-3 lg:p-4 group relative overflow-hidden transition-all duration-200 hover:scale-[1.01]">
        <div className={`absolute top-0 right-0 w-20 h-20 -mr-6 -mt-6 rounded-full opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-300 ${color}`}></div>
        <div className="relative z-10 flex flex-col h-full">
            <div className="flex justify-between items-start mb-2">
                <div className={`p-2 rounded-xl shadow-md transition-all duration-200 group-hover:scale-110 group-hover:rotate-3 ${color} shadow-blue-500/20`}>
                    <Icon className="text-white w-3.5 h-3.5 xl:w-4 xl:h-4" />
                </div>
            </div>
            <div className="flex-1 flex flex-col justify-end">
                <p className="text-slate-400 text-[8px] font-black uppercase tracking-[0.1em] mb-0.5 break-words">{title}</p>
                <h3 className="text-lg sm:text-xl lg:text-lg xl:text-xl font-black text-slate-900 tracking-tighter font-display break-words leading-none" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                    {value}
                </h3>
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className={`text-[7px] lg:text-[8px] font-black px-1 py-0.5 rounded-lg shrink-0 ${trend > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {trend > 0 ? '+' : ''}{trend}%
                    </span>
                    <span className="text-[7px] text-slate-400 font-bold uppercase tracking-widest line-clamp-1" title={subtext}>{subtext}</span>
                </div>
            </div>
        </div>
    </div>
);

const Accounting = () => {
    const { orders, subscribers, expenses } = useStore();
    const [isReconciled, setIsReconciled] = useState(false);
    const [isReconciliationDrawerOpen, setIsReconciliationDrawerOpen] = useState(false);
    const [timeFilter, setTimeFilter] = useState('daily'); // 'daily' or 'monthly'

    const now = new Date();
    const isToday = (dateString) => {
        if (!dateString) return false;
        const d = new Date(dateString);
        return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    };

    const isThisMonth = (dateString) => {
        if (!dateString) return false;
        const d = new Date(dateString);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    };

    const isWithinFilter = (dateStr) => timeFilter === 'daily' ? isToday(dateStr) : isThisMonth(dateStr);

    const filteredOrders = orders.filter(o => o.status === 'Tamamlandı' && isWithinFilter(o.timestamp || o.date));

    const paymentMethods = [
        { id: 'Nakit', icon: Banknote, color: 'text-emerald-600', bg: 'bg-emerald-50', barColor: 'bg-emerald-500' },
        { id: 'POS', icon: CreditCardIcon, color: 'text-brand-primary', bg: 'bg-brand-primary/10', barColor: 'bg-brand-primary' },
        { id: 'Veresiye', icon: History, color: 'text-brand-accent', bg: 'bg-brand-accent/10', barColor: 'bg-brand-accent' },
        { id: 'IBAN', icon: Landmark, color: 'text-indigo-600', bg: 'bg-indigo-50', barColor: 'bg-indigo-500' }
    ];

    const distribution = paymentMethods.map(method => {
        const methodOrders = filteredOrders.filter(o => (o.paymentMethod || 'Nakit') === method.id);
        const total = methodOrders.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
        const count = methodOrders.length;
        return { ...method, total, count };
    });

    const totalIncome = distribution.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
    const totalDepositIncome = filteredOrders.reduce((acc, order) => acc + (Number(order.depositTotal) || 0), 0);

    const totalExpenses = expenses.reduce((acc, exp) => {
        const amount = Number(exp.amount) || 0;
        const isDailyExpense = exp.period === 'daily';

        if (isDailyExpense) {
            return isWithinFilter(exp.timestamp) ? acc + amount : acc;
        } else {
            // Monthly expense (Aylık/Sabit)
            return acc + (timeFilter === 'daily' ? (amount / 30) : amount);
        }
    }, 0);

    const netProfit = totalIncome - totalExpenses;

    const recentTransactions = [...filteredOrders]
        .sort((a, b) => {
            const dateA = new Date(a.timestamp || a.date);
            const dateB = new Date(b.timestamp || b.date);
            return dateB - dateA;
        })
        .slice(0, 10);

    const veresiyeData = subscribers.map(sub => {
        const subOrders = orders.filter(o => o.customerId === sub.id && o.paymentMethod === 'Veresiye');
        const totalDebt = subOrders.reduce((acc, curr) => acc + (curr.status !== 'İptal Edildi' ? (Number(curr.amount) || 0) : 0), 0);

        if (totalDebt <= 0) return null;

        const limit = Number(sub.limit) || 2000;
        const riskScore = (totalDebt / limit) * 100;
        const riskLevel = riskScore > 85 ? 'Kritik' : riskScore > 50 ? 'Orta' : 'Düşük';

        return { ...sub, totalDebt, limit, riskLevel, riskScore };
    }).filter(Boolean).sort((a, b) => b.totalDebt - a.totalDebt);

    const handleReconcile = () => {
        setIsReconciled(true);
        setIsReconciliationDrawerOpen(false);
    };

    const handleExportCSV = () => {
        const csvContent = "data:text/csv;charset=utf-8,MÜŞTERİ,YÖNTEM,TUTAR,ZAMAN,DURUM\n" +
            recentTransactions.map(tx => `${tx.customer},${tx.paymentMethod},${tx.amount},${formatRelativeTime(tx.timestamp || tx.date)},${tx.status}`).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "merkezi_islem_defteri.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="p-4 md:p-8 bg-slate-50 min-h-screen selection:bg-brand-primary/10 w-full overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div>
                    <p className="text-brand-primary text-[10px] font-black uppercase tracking-[0.2em] mb-1">Finansal Merkez</p>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight font-display">Kasa ve Analiz</h1>
                </div>
                <div className="flex flex-wrap gap-3 w-full md:w-auto items-center">
                    <div className="flex bg-slate-200/50 p-1 rounded-2xl mr-4">
                        <button
                            onClick={() => setTimeFilter('daily')}
                            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${timeFilter === 'daily' ? 'bg-white text-brand-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Günlük
                        </button>
                        <button
                            onClick={() => setTimeFilter('monthly')}
                            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${timeFilter === 'monthly' ? 'bg-white text-brand-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Aylık
                        </button>
                    </div>

                    {!isReconciled ? (
                        <button
                            onClick={() => setIsReconciliationDrawerOpen(true)}
                            className="flex-1 md:flex-none bg-slate-900 hover:bg-black text-white px-8 py-3.5 rounded-2xl transition-all font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2.5 active:scale-95"
                        >
                            <Lock size={18} /> GÜN SONU (Z-RAPORU)
                        </button>
                    ) : (
                        <div className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2.5">
                            <CheckCircle size={18} /> GÜN KAPATILDI
                        </div>
                    )}
                </div>
            </div>

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
                <StatCard
                    title="Brüt Tahsilat"
                    value={`₺${totalIncome.toLocaleString('tr-TR')}`}
                    subtext="Geçen Haftaya Göre"
                    icon={WalletIcon}
                    color="bg-brand-primary"
                    trend={14.2}
                />
                <StatCard
                    title="Toplam Gider"
                    value={`₺${totalExpenses.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`}
                    subtext={timeFilter === 'daily' ? "Sabit (Aylık) günlük orantılı + Günlükler" : "Tüm Aylık Gider ve O Ayın Giderleri"}
                    icon={TrendingDown}
                    color="bg-rose-500"
                    trend={-3.1}
                />
                <StatCard
                    title="Net Kazanç"
                    value={`₺${netProfit.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`}
                    subtext="Nakit Akışı"
                    icon={TrendingUp}
                    color="bg-emerald-500"
                    trend={18.5}
                />
                <StatCard
                    title="Mevcut Veresiye"
                    value={`₺${veresiyeData.reduce((acc, curr) => acc + curr.totalDebt, 0).toLocaleString('tr-TR')}`}
                    subtext="8 Aktif Alacak"
                    icon={History}
                    color="bg-brand-accent"
                    trend={5.2}
                />
                <StatCard
                    title="Depozito Geliri"
                    value={`₺${totalDepositIncome.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`}
                    subtext="Tamamlanan Siparişlerden"
                    icon={PieChartIcon}
                    color="bg-orange-500"
                    trend={4.6}
                />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Payment Analysis */}
                <div className="premium-card p-8">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-brand-primary">
                            <PieChartIcon size={24} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Ödeme Dağılımı</h3>
                            <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Nakit ve Dijital Dağılım</p>
                        </div>
                    </div>
                    <div className="space-y-6">
                        {distribution.map((item) => (
                            <div key={item.id}>
                                <div className="flex justify-between items-center mb-2.5 px-1">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${item.barColor}`}></div>
                                        <span className="text-xs font-black text-slate-700 uppercase tracking-wider">{item.id}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-black text-slate-900">₺{item.total.toLocaleString()}</span>
                                        <span className="text-[10px] text-slate-400 font-bold ml-2">({item.count} İşlem)</span>
                                    </div>
                                </div>
                                <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100/50">
                                    <div
                                        className={`h-full ${item.barColor} transition-all duration-300 ease-out`}
                                        style={{ width: `${totalIncome > 0 ? (item.total / totalIncome) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-10 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white rounded-xl shadow-sm">
                                <Landmark size={20} className="text-brand-primary" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bankaya Hazır</p>
                                <p className="text-xl font-black text-slate-900 font-display">₺{(totalIncome - distribution.find(d => d.id === 'Nakit')?.total || 0).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Ledger */}
                <div className="xl:col-span-2 premium-card overflow-hidden flex flex-col">
                    <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-800 shadow-sm">
                                <History size={24} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Merkezi İşlem Defteri</h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Canlı Finansal Akış Kayıtları</p>
                            </div>
                        </div>
                        <button onClick={handleExportCSV} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-primary transition-all">TÜMÜNÜ DIŞA AKTAR</button>
                    </div>
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 text-slate-400 uppercase font-black text-[10px] tracking-widest">
                                <tr>
                                    <th className="px-8 py-5">MÜŞTERİ</th>
                                    <th className="px-8 py-5">YÖNTEM</th>
                                    <th className="px-8 py-5">TUTAR</th>
                                    <th className="px-8 py-5">ZAMAN</th>
                                    <th className="px-8 py-5 text-right">DURUM</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {recentTransactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="font-bold text-slate-800 text-xs">{tx.customer}</div>
                                            <div className="text-[9px] text-slate-400 font-black uppercase mt-0.5">#{String(tx.id).slice(-6).toUpperCase()}</div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${tx.paymentMethod === 'Nakit' ? 'bg-emerald-500' : tx.paymentMethod === 'POS' ? 'bg-brand-primary' : 'bg-brand-accent'}`}></div>
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{tx.paymentMethod || 'Nakit'}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="text-sm font-black text-slate-900 font-display tracking-tight">₺{(tx.amount || 0).toLocaleString()}</span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <Clock size={12} />
                                                <span className="text-[10px] font-bold">{formatRelativeTime(tx.timestamp || tx.date)}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <span className={`text-[10px] font-black px-3 py-1.5 rounded-lg border uppercase tracking-tighter ${tx.status === 'Tamamlandı' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                tx.status === 'İptal Edildi' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                    'bg-amber-50 text-amber-600 border-amber-100'
                                                }`}>
                                                {tx.status?.toUpperCase() || 'İŞLENİYOR'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {isReconciliationDrawerOpen && (
                <div className="fixed inset-0 z-[150] flex justify-end">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsReconciliationDrawerOpen(false)}></div>
                    <div className="relative w-full max-w-xl h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white/50 sticky top-0 z-10 backdrop-blur-md">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg relative">
                                    <Lock size={28} />
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-brand-accent rounded-full border-2 border-white"></div>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight font-display uppercase">Z-RAPORU & KAPANIŞ</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Günlük hesap kapatma işlemi</p>
                                </div>
                            </div>
                            <button onClick={() => setIsReconciliationDrawerOpen(false)} className="p-3 bg-white rounded-2xl text-slate-400 hover:text-slate-600 shadow-sm transition-colors border border-slate-100">
                                <XCircle size={28} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-10 scrollbar-hide">
                            <div className="space-y-8">
                                <div className="p-8 bg-blue-50/50 rounded-[2.5rem] border border-blue-100/50 relative overflow-hidden">
                                    <div className="relative z-10">
                                        <p className="text-slate-500 font-medium leading-relaxed mb-8">
                                            Günün tüm işlemleri dondurulacak, muhasebe kayıtları kesinleşecek ve kasa yeni güne devredilecektir. Bu işlem geri alınamaz.
                                        </p>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-50">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Kapanış Bakiyesi</p>
                                                <p className="text-2xl font-black text-slate-900 font-display">₺{totalIncome.toLocaleString()}</p>
                                            </div>
                                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-50">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">İşlem Sayısı</p>
                                                <p className="text-2xl font-black text-slate-900 font-display">{orders.length} Adet</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl"></div>
                                </div>

                                <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl flex gap-4">
                                    <Clock className="text-amber-500 shrink-0" size={24} />
                                    <p className="text-xs text-amber-900 font-bold leading-relaxed">
                                        Sistem şu anki saati ({new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}) baz alarak defteri kapatacaktır.
                                    </p>
                                </div>

                                <div className="pt-10 space-y-4">
                                    <button
                                        onClick={handleReconcile}
                                        className="w-full py-6 bg-slate-900 text-white font-black rounded-[1.5rem] shadow-xl hover:bg-brand-primary transition-all active:scale-95 uppercase tracking-widest text-xs"
                                    >
                                        ONAYLA VE DEFTERİ KAPAT
                                    </button>
                                    <button
                                        onClick={() => setIsReconciliationDrawerOpen(false)}
                                        className="w-full py-4 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:text-slate-600 transition-colors"
                                    >
                                        VAZGEÇ VE DEVAM ET
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Accounting;
