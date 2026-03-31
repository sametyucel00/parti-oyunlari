import React from 'react';
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Truck,
    ClipboardCheck,
    Users,
    Wallet,
    PieChart,
    BarChart3,
    Settings,
    Printer,
    LogOut,
    X,
    ShoppingBag,
    PhoneCall,
    Store,
    Warehouse,
    RefreshCw
} from 'lucide-react';
import useStore from '../store/useStore';

const SyncStatus = () => {
    const isSyncing = useStore(state => state.isSyncing);
    const syncError = useStore(state => state.syncError);
    const initFirestoreSync = useStore(state => state.initFirestoreSync);

    return (
        <div className="px-4 py-1.5 mt-1">
            <div className={`px-2.5 py-2 rounded-xl flex items-center justify-between gap-2 ${syncError ? 'bg-rose-500/10 border border-rose-500/20' : 'bg-white/5 border border-white/5'}`}>
                <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${syncError ? 'bg-rose-500 animate-pulse' : isSyncing ? 'bg-amber-500 animate-spin' : 'bg-emerald-500'}`}></div>
                    <div>
                        <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.18em]">{syncError ? 'Bağlantı Hatası' : 'Veri Senkronizasyonu'}</p>
                        <p className="text-[10px] font-bold text-slate-400 capitalize leading-tight">{syncError ? 'Tekrar Deneyin' : isSyncing ? 'Güncelleniyor...' : 'Bağlantı Aktif'}</p>
                    </div>
                </div>
                <button
                    onClick={initFirestoreSync}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-brand-primary transition-all active:scale-95 shrink-0"
                    title="Yenile"
                >
                    <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
                </button>
            </div>
        </div>
    );
};

const Sidebar = ({ currentView, setCurrentView, isOpen, onClose, onLogout, user }) => {
    const normalizedRole = (user?.role || '').toLowerCase().trim();
    const isAdmin = normalizedRole === 'admin';

    const menuItems = [
        { id: 'dashboard', label: 'Kontrol Paneli', icon: LayoutDashboard, roles: ['admin'] },
        { id: 'orders', label: 'Siparişler', icon: ShoppingCart, roles: ['admin'] },
        { id: 'subscribers', label: 'Aboneler', icon: Users, roles: ['admin'] },
        { id: 'products', label: 'Ürünler', icon: Package, roles: ['admin'] },
        { id: 'suppliers', label: 'Tedarikçiler', icon: Warehouse, roles: ['admin'] },
        { id: 'dealers', label: 'Bayiler', icon: Store, roles: ['admin'] },
        { id: 'couriers', label: 'Kuryeler', icon: Truck, roles: ['admin'] },
        { id: 'reconciliation', label: 'Kurye Mutabakat', icon: ClipboardCheck, roles: ['admin'] },
        { id: 'cash', label: 'Kasa', icon: Wallet, roles: ['admin'] },
        { id: 'finance', label: 'Finans', icon: PieChart, roles: ['admin'] },
        { id: 'expenses', label: 'Giderler', icon: Wallet, roles: ['admin'] },
        { id: 'daily-closing', label: 'Gün Sonu Raporu', icon: Printer, roles: ['admin'] },
        { id: 'calls', label: 'Çağrılar', icon: PhoneCall, roles: ['admin'] },
        { id: 'analytics', label: 'Analiz', icon: BarChart3, roles: ['admin'] },
        { id: 'market', label: 'Market', icon: ShoppingBag, roles: ['customer'] },
        { id: 'my-orders', label: 'Siparişlerim', icon: ClipboardCheck, roles: ['customer'] }
    ].filter(item => item.roles.some(r => r.toLowerCase() === normalizedRole));

    const sidebarClasses = `
    fixed inset-y-0 left-0 z-50 w-full md:w-72 bg-slate-900/98 backdrop-blur-2xl text-white transform transition-all duration-500 ease-in-out border-r border-white/5
    ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
    md:translate-x-0 md:fixed md:shadow-none font-sans flex flex-col h-screen overflow-y-auto scrollbar-hide print:hidden
    `;

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
                    onClick={onClose}
                />
            )}

            <aside className={sidebarClasses}>
                <div className="p-7 border-b border-white/10 flex justify-between items-center group/logo">
                    <div>
                        <div className="flex items-center gap-3 mb-1.5 transition-transform duration-500 group-hover/logo:translate-x-1">
                            <div className="w-9 h-9 rounded-2xl overflow-hidden shadow-xl shadow-brand-primary/20 group-hover/logo:rotate-12 transition-transform duration-500 bg-white p-1">
                                <img src="/favicon.png" alt="Logo" className="w-full h-full object-contain" />
                            </div>
                            <h1 className="text-[28px] font-black tracking-tighter text-white font-display">
                                BayiOS
                            </h1>
                        </div>
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.24em] pl-1 opacity-80">
                            {isAdmin ? 'Operasyon Merkezi' : 'Müşteri Portalı'}
                        </p>
                    </div>
                    <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white transition-colors bg-white/5 p-2 rounded-lg">
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-1">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentView === item.id;

                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setCurrentView(item.id);
                                    if (window.innerWidth < 768) onClose();
                                }}
                                className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl relative ${isActive
                                    ? 'bg-brand-primary border border-white/10 text-white shadow-xl shadow-brand-primary/20'
                                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 font-semibold'
                                    }`}
                            >
                                <Icon size={20} className={`${isActive ? 'text-white' : 'text-slate-500 group-hover:text-brand-primary'}`} />
                                <span className={`text-[12px] tracking-wide ${isActive ? 'font-black' : ''}`}>{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-white/5 bg-black/20 space-y-2">
                    <button
                        onClick={() => {
                            setCurrentView('settings');
                            if (window.innerWidth < 768) onClose();
                        }}
                        className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all duration-300 ${currentView === 'settings'
                            ? 'bg-white/10 text-white font-black'
                            : 'text-slate-400 hover:bg-white/5 hover:text-white font-bold'
                            }`}
                    >
                        <Settings size={20} className={currentView === 'settings' ? 'text-brand-primary' : 'text-slate-500'} />
                        <span className="text-[13px] tracking-wide">Sistem Ayarları</span>
                    </button>
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-3.5 px-4 py-3 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 rounded-2xl transition-all group font-black"
                    >
                        <div className="p-1.5 bg-rose-500/10 rounded-lg group-hover:bg-rose-500/20 transition-colors">
                            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                        </div>
                        <span className="text-[13px] tracking-wide">Oturumu Kapat</span>
                    </button>
                    <SyncStatus />
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
