import React, { useState } from 'react';
import {
    TrendingUp,
    TrendingDown,
    CreditCard,
    Wallet,
    PieChart,
    Building2,
    Calendar,
    Clock,
    X,
    XCircle
} from 'lucide-react';
import useStore from '../store/useStore';

const Finance = () => {
    const { suppliers, orders, expenses, updateSupplier, addExpense } = useStore();
    const [timeFilter, setTimeFilter] = useState('monthly'); // 'daily' or 'monthly'

    const [isPaymentDrawerOpen, setIsPaymentDrawerOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');

    const handleOpenPaymentModal = (supplier) => {
        setSelectedSupplier(supplier);
        setPaymentAmount(Math.abs(supplier.balance).toString()); // Default to full amount
        setIsPaymentDrawerOpen(true);
    };

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        const amountToPay = parseFloat(paymentAmount);
        if (!amountToPay || amountToPay <= 0 || !selectedSupplier) return;

        // Increase supplier balance (since balance is negative, adding makes it closer to 0)
        const updatedBalance = Number(selectedSupplier.balance) + amountToPay;
        await updateSupplier(selectedSupplier.id, { balance: updatedBalance });

        // Record as an expense
        await addExpense({
            label: `${selectedSupplier.name} Ödemesi`,
            amount: amountToPay,
            type: 'supplier',
            timestamp: new Date().toISOString(),
            iconName: 'Building2',
            color: 'text-orange-500',
            bg: 'bg-orange-50'
        });

        setIsPaymentDrawerOpen(false);
        setSelectedSupplier(null);
        setPaymentAmount('');
    };

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

    // Calculate total debt to suppliers (Global)
    const totalSupplierDebt = suppliers.reduce((acc, supplier) => {
        return acc + (supplier.balance < 0 ? Math.abs(supplier.balance) : 0);
    }, 0);

    const totalExpensesDebt = expenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const totalDebt = totalSupplierDebt + totalExpensesDebt;

    // Real calculations based on true data
    const completedOrders = orders.filter(o => o.status === 'Tamamlandı');

    // Total veresiye from all time (active receivables)
    const totalReceivables = completedOrders
        .filter(o => o.paymentMethod === 'Veresiye')
        .reduce((acc, o) => acc + (Number(o.amount) || 0), 0);

    // Earnings based on filter
    const filteredOrders = completedOrders.filter(o => isWithinFilter(o.timestamp || o.date));

    const cashIncome = filteredOrders
        .filter(o => o.paymentMethod !== 'Veresiye')
        .reduce((acc, o) => acc + (Number(o.amount) || 0), 0);

    const pendingCollectionFilter = filteredOrders
        .filter(o => o.paymentMethod === 'Veresiye')
        .reduce((acc, o) => acc + (Number(o.amount) || 0), 0);
    const depositIncome = filteredOrders.reduce((acc, o) => acc + (Number(o.depositTotal) || 0), 0);

    // Expenses based on filter
    const filteredExpenses = expenses.reduce((acc, exp) => {
        if (exp.type === 'gov') {
            return acc + (timeFilter === 'daily' ? (Number(exp.amount) / 30) : Number(exp.amount));
        } else {
            return acc + (isWithinFilter(exp.timestamp) ? Number(exp.amount) : 0);
        }
    }, 0);

    const periodNet = cashIncome - filteredExpenses;

    return (
        <div className="p-4 md:p-8 bg-slate-50 min-h-screen pb-24 md:pb-8 w-full overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Finansal Durum</p>
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight font-display">Finansal Raporlar</h1>
                </div>
                <div className="flex bg-slate-200/50 p-1 rounded-2xl w-full md:w-auto">
                    <button
                        onClick={() => setTimeFilter('daily')}
                        className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all f-center gap-2 ${timeFilter === 'daily' ? 'bg-white text-brand-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Clock size={16} /> GÜNLÜK
                    </button>
                    <button
                        onClick={() => setTimeFilter('monthly')}
                        className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all f-center gap-2 ${timeFilter === 'monthly' ? 'bg-white text-brand-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Calendar size={16} /> AYLIK
                    </button>
                </div>
            </div>

            {/* Top Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-5 mb-8">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                            <TrendingUp size={20} />
                        </div>
                    </div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Toplam Alacak</p>
                    <h3 className="text-xl font-black text-slate-900">₺{totalReceivables.toLocaleString()}</h3>
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                            <TrendingDown size={20} />
                        </div>
                    </div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Toplam Borç</p>
                    <h3 className="text-xl font-black text-slate-900">₺{totalDebt.toLocaleString()}</h3>
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                            <Wallet size={20} />
                        </div>
                    </div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{timeFilter === 'daily' ? 'Net Nakit' : 'Aylık Nakit'}</p>
                    <h3 className={`text-xl font-black font-display ${periodNet >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                        {periodNet >= 0 ? '+' : ''}₺{periodNet.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                    </h3>
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                            <CreditCard size={20} />
                        </div>
                    </div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Pasif Alacak</p>
                    <h3 className="text-xl font-black text-slate-900 font-display">₺{pendingCollectionFilter.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</h3>
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
                            <PieChart size={20} />
                        </div>
                    </div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Depozito Geliri</p>
                    <h3 className="text-xl font-black text-slate-900 font-display">₺{depositIncome.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</h3>
                </div>
            </div>

            {/* Debt/Receivable Balance Graph */}
            <div className="mb-8">
                <div className="bg-white p-4 md:p-6 rounded-[1.5rem] shadow-sm border border-slate-100">
                    <h3 className="font-black text-slate-900 mb-6 flex items-center gap-3 uppercase tracking-tighter text-base">
                        <Building2 className="text-blue-500" size={20} />
                        Borç / Alacak Dengesi
                    </h3>

                    <div className="flex flex-col lg:flex-row items-center gap-8 mb-8">
                        <div className="w-full">
                            <div className="flex justify-between mb-3 px-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alacaklar (Müşteriler)</span>
                                <span className="font-black text-emerald-500 text-sm">₺{totalReceivables.toLocaleString()}</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden shadow-inner p-1">
                                <div className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-full rounded-full shadow-lg" style={{ width: '100%' }}></div>
                            </div>
                        </div>

                        <div className="hidden lg:block text-2xl font-black text-slate-200">/</div>

                        <div className="w-full">
                            <div className="flex justify-between mb-3 px-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Borçlar (Tedarikçi + Giderler)</span>
                                <span className="font-black text-rose-500 text-sm">₺{totalDebt.toLocaleString()}</span>
                            </div>
                            <div className="w-full bg-slate-50 rounded-full h-2 overflow-hidden border border-slate-100/50">
                                <div
                                    className="bg-gradient-to-r from-rose-400 to-rose-500 h-full rounded-full shadow-lg"
                                    style={{ width: `${Math.min((totalDebt / (totalReceivables || 1)) * 100, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                        <div>
                            <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1">Net Pozisyon (Güncel Toplam)</p>
                            <p className={`text-2xl md:text-3xl font-black font-display ${totalReceivables - totalDebt > 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                                {totalReceivables - totalDebt > 0 ? '+' : ''}
                                ₺{(totalReceivables - totalDebt).toLocaleString('tr-TR')}
                            </p>
                        </div>
                        <div className="md:text-right flex flex-col justify-center">
                            <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1">Finansal Risk Skorlaması</p>
                            <div className="flex items-center md:justify-end gap-2">
                                <div className={`w-3 h-3 rounded-full ${totalDebt / (totalReceivables || 1) > 0.5 ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
                                <span className={`font-black text-lg ${totalDebt / (totalReceivables || 1) > 0.5 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                    %{(totalReceivables > 0 ? (totalDebt / totalReceivables) * 100 : 0).toFixed(1)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Calendar */}
            <div className="bg-white p-4 md:p-6 rounded-[1.5rem] shadow-sm border border-slate-100">
                <h3 className="font-black text-slate-900 mb-5 flex items-center gap-3 uppercase tracking-tighter text-base">
                    <Calendar className="text-orange-500" size={20} />
                    Ödeme Takvimi & Planlama
                </h3>
                <div className="space-y-4">
                    {suppliers.filter(s => s.balance < 0).map(supplier => (
                        <div key={supplier.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-white border border-slate-100 rounded-2xl group hover:border-blue-200 transition-all gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center font-black text-xs border border-rose-100">
                                    <Clock size={20} />
                                </div>
                                <div>
                                    <h4 className="font-black text-slate-900 uppercase tracking-tight">{supplier.name}</h4>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Bekleyen Ödeme</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between sm:justify-end gap-6 sm:text-right">
                                <div>
                                    <p className="font-black text-rose-600 text-lg">₺{Math.abs(supplier.balance).toLocaleString()}</p>
                                    <p className="text-[9px] text-slate-400 font-medium font-bold">Vade: 3 Gün Kaldı</p>
                                </div>
                                <button
                                    onClick={() => handleOpenPaymentModal(supplier)}
                                    className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-6 py-3.5 rounded-xl hover:bg-brand-primary transition-all shadow-lg shadow-slate-900/10 active:scale-95 whitespace-nowrap"
                                >
                                    Hızlı Öde
                                </button>
                            </div>
                        </div>
                    ))}
                    {suppliers.filter(s => s.balance < 0).length === 0 && (
                        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            <TrendingUp className="mx-auto text-slate-300 mb-3" size={40} />
                            <p className="text-slate-400 font-bold text-sm">Tüm tedarikçi borçları ödendi. Harika!</p>
                        </div>
                    )}
                </div>
            </div>

            {isPaymentDrawerOpen && selectedSupplier && (
                <div className="fixed inset-0 z-[150] flex justify-end">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsPaymentDrawerOpen(false)}></div>
                    <div className="relative w-full max-w-xl h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white/50 sticky top-0 z-10 backdrop-blur-md">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
                                    <CreditCard size={28} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight font-display uppercase">ÖDEME YAP</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{selectedSupplier.name}</p>
                                </div>
                            </div>
                            <button onClick={() => setIsPaymentDrawerOpen(false)} className="p-3 bg-white rounded-2xl text-slate-400 hover:text-slate-600 shadow-sm transition-colors border border-slate-100">
                                <XCircle size={28} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-10 scrollbar-hide">
                            <form onSubmit={handlePaymentSubmit} className="space-y-8">
                                <div className="p-8 bg-rose-50/50 rounded-[2.5rem] border border-rose-100/50 flex justify-between items-center relative overflow-hidden">
                                    <div className="relative z-10">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">GÜNCEL BORÇ DURUMU</p>
                                        <p className="text-4xl font-black text-rose-600 font-display">₺{Math.abs(selectedSupplier.balance).toLocaleString('tr-TR')}</p>
                                        <p className="text-[10px] text-rose-400 font-bold uppercase mt-2">Bu tutar tedarikçiye olan toplam borçtur.</p>
                                    </div>
                                    <TrendingDown size={64} className="text-rose-100 absolute -right-4 -bottom-4 rotate-12" />
                                </div>

                                <div className="space-y-4">
                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">ÖDENECEK TUTAR (₺)</label>
                                    <div className="relative">
                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 font-bold text-2xl">₺</div>
                                        <input
                                            type="number" required
                                            placeholder="0.00"
                                            max={Math.abs(selectedSupplier.balance)}
                                            step="0.01"
                                            className="w-full pl-16 pr-8 py-6 bg-slate-50 border-2 border-transparent rounded-[2rem] outline-none focus:border-blue-500 focus:bg-white transition-all font-black text-slate-900 shadow-inner text-3xl"
                                            value={paymentAmount}
                                            onChange={e => setPaymentAmount(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                    <div className="bg-blue-50/50 p-4 rounded-2xl flex gap-3">
                                        <Clock className="text-blue-500 shrink-0" size={18} />
                                        <p className="text-[10px] text-blue-700 font-bold leading-relaxed">
                                            Ödeme işlemi tamamlandığında bakiye güncellenecek ve işlem "Giderler" bölümüne otomatik olarak kaydedilecektir.
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-10 flex gap-4">
                                     <button
                                        type="button"
                                        onClick={() => setIsPaymentDrawerOpen(false)}
                                        className="flex-1 py-6 bg-slate-100 text-slate-500 font-black rounded-[1.5rem] hover:bg-slate-200 transition-all active:scale-95 uppercase tracking-widest text-xs"
                                    >
                                        İPTAL
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-[2] py-6 bg-slate-900 text-white font-black rounded-[1.5rem] shadow-xl hover:bg-blue-600 transition-all active:scale-95 uppercase tracking-widest text-xs"
                                    >
                                        ÖDEMEYİ ONAYLA
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Finance;
