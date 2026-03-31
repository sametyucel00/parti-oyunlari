import React, { useMemo, useState } from 'react';
import {
    Calendar,
    CheckCircle,
    CheckCircle2,
    Clock,
    CreditCard,
    Edit2,
    FileText,
    Hash,
    Map,
    MapPin,
    MoreHorizontal,
    Package,
    Plus,
    Printer,
    Search,
    ShoppingCart,
    Trash2,
    Truck,
    User,
    XCircle,
} from 'lucide-react';
import useStore from '../store/useStore';
import GoogleMapTracker from '../components/GoogleMapTracker';
import InvoiceViewerDrawer from '../components/InvoiceViewerDrawer';
import { calculateOrderTotals, createOrderItemDraft, hydrateOrderItemWithProduct } from '../utils/orderPricing';

const STATUSES = [
    { id: 'Hazırlanıyor', label: 'Hazırlanıyor', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50/50', border: 'border-amber-100' },
    { id: 'Yolda', label: 'Yolda', icon: Truck, color: 'text-blue-500', bg: 'bg-blue-50/50', border: 'border-blue-100' },
    { id: 'Tamamlandı', label: 'Tamamlandı', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50/50', border: 'border-emerald-100' },
    { id: 'İptal Edildi', label: 'İptal Edildi', icon: XCircle, color: 'text-rose-500', bg: 'bg-rose-50/50', border: 'border-rose-100' },
];

const normalizeStatus = (value) => {
    const text = String(value || '');
    if (/yolda/i.test(text)) return 'Yolda';
    if (/tamam/i.test(text)) return 'Tamamlandı';
    if (/iptal/i.test(text)) return 'İptal Edildi';
    return 'Hazırlanıyor';
};

const formatMoney = (value) => `\u20BA${Number(value || 0).toLocaleString('tr-TR')}`;

const normalizeText = (value) => String(value ?? '').toLocaleLowerCase('tr-TR');

const getInitial = (value) => {
    const normalized = String(value ?? '').trim();
    return normalized ? normalized.charAt(0).toLocaleUpperCase('tr-TR') : '?';
};

const buildItems = (order) => {
    if (Array.isArray(order?.items) && order.items.length > 0) {
        return order.items.map((item) => ({
            name: item.name || item.productName || order.product || '',
            quantity: Number(item.quantity || 1),
            price: Number(item.price || 0),
            depositFee: Number(item.depositFee || 0),
            includeDeposit: Boolean(item.includeDeposit),
            productId: item.productId || '',
        }));
    }

    const quantity = Number(order?.quantity || 1);
    const amount = Number(order?.amount || 0);

    return [
        {
            name: order?.product || '',
            quantity,
            price: quantity > 0 ? amount / quantity : amount,
            depositFee: Number(order?.depositFee || 0),
            includeDeposit: Boolean(order?.includeDeposit),
        },
    ];
};

const Orders = () => {
    const { orders, subscribers, products, addOrder, updateOrder, deleteOrder, couriers, currentUser } = useStore();

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
    const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
    const [isMapDrawerOpen, setIsMapDrawerOpen] = useState(false);
    const [isInvoiceDrawerOpen, setIsInvoiceDrawerOpen] = useState(false);
    const [invoiceOrder, setInvoiceOrder] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [activeMenu, setActiveMenu] = useState(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);
    const [eta, setEta] = useState(null);
    const [customerSearch, setCustomerSearch] = useState('');
    const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
    const [visibleCount, setVisibleCount] = useState(50);

    const [newOrder, setNewOrder] = useState({
        customerId: '',
        items: [createOrderItemDraft()],
        courier: '-',
        paymentMethod: 'Nakit',
    });

    const [editOrderData, setEditOrderData] = useState({
        status: 'Hazırlanıyor',
        amount: 0,
        quantity: 1,
        courier: '-',
        paymentMethod: 'Nakit',
        address: '',
        items: [],
    });

    const normalizedOrders = useMemo(
        () => orders.map((order) => ({ ...order, status: normalizeStatus(order.status) })),
        [orders]
    );

    const getOrderDocId = (orderOrId) => {
        if (!orderOrId) return null;
        if (typeof orderOrId === 'string') return orderOrId;
        return orderOrId.firestoreId || orderOrId.id || null;
    };

    const filteredCustomers = useMemo(() => {
        const query = normalizeText(customerSearch);
        return subscribers.filter((subscriber) =>
            normalizeText(subscriber?.name).includes(query) ||
            String(subscriber?.phone || '').includes(customerSearch || '') ||
            String(subscriber?.legacyId || '').includes(customerSearch || '')
        );
    }, [customerSearch, subscribers]);

    const filteredOrders = useMemo(() => {
        const query = normalizeText(searchTerm);
        return normalizedOrders.filter((order) => {
            const matchesSearch =
                normalizeText(order?.customer).includes(query) ||
                normalizeText(order?.product).includes(query);
            const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [normalizedOrders, searchTerm, statusFilter]);

    const paginatedOrders = filteredOrders.slice(0, visibleCount);
    const getStatusCount = (status) => normalizedOrders.filter((order) => order.status === status).length;
    const activeMenuOrder = paginatedOrders.find((order) => getOrderDocId(order) === activeMenu) || null;

    const summaryItems = [
        { label: 'Toplam', value: normalizedOrders.length, icon: ShoppingCart, color: 'text-slate-600', bg: 'bg-slate-100', trend: 'Canl\u0131' },
        { label: 'Hazırlanan', value: getStatusCount('Hazırlanıyor'), icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50', trend: '\u00d6nemli' },
        { label: 'Yolda', value: getStatusCount('Yolda'), icon: Truck, color: 'text-blue-500', bg: 'bg-blue-50', trend: 'Teslimat' },
        { label: 'Bitmiş', value: getStatusCount('Tamamlandı'), icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', trend: 'Ba\u015far\u0131l\u0131' },
    ];

    const handleCreateOrder = async (event) => {
        event.preventDefault();
        const selectedCustomer = subscribers.find((subscriber) => subscriber.id === newOrder.customerId);

        if (!selectedCustomer || newOrder.items.length === 0 || newOrder.items.some((item) => !item.productId)) {
            useStore.getState().addNotification('L\u00fctfen m\u00fc\u015fteri ve en az bir \u00fcr\u00fcn se\u00e7iniz.', 'error');
            return;
        }

        const items = newOrder.items
            .map((item) => {
                const product = products.find((entry) => entry.id === item.productId);
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
                    quantity: hydrated.quantity,
                };
            })
            .filter(Boolean);

        const totals = calculateOrderTotals(items);

        await addOrder({
            customer: selectedCustomer.name,
            customerId: selectedCustomer.id,
            product: items.map((item) => `${item.quantity}x ${item.name}${item.includeDeposit ? ' (Depozitolu)' : ''}`).join(', '),
            items,
            quantity: totals.quantity,
            amount: totals.amount,
            productTotal: totals.productTotal,
            depositTotal: totals.depositTotal,
            courier: newOrder.courier,
            paymentMethod: newOrder.paymentMethod,
            address: selectedCustomer.address || '',
            phone: selectedCustomer.phone || '',
            hasInvoice: false,
            status: 'Hazırlanıyor',
            timestamp: new Date().toISOString(),
        });

        setIsCreateDrawerOpen(false);
        setNewOrder({ customerId: '', items: [createOrderItemDraft()], courier: '-', paymentMethod: 'Nakit' });
        setCustomerSearch('');
    };

    const handleOpenEdit = (order) => {
        setSelectedOrder(order);
        setEditOrderData({
            status: normalizeStatus(order.status),
            quantity: Number(order.quantity || 1),
            amount: Number(order.amount || 0),
            courier: order.courier || '-',
            paymentMethod: order.paymentMethod || 'Nakit',
            address: order.address || '',
            items: buildItems(order),
        });
        setIsEditDrawerOpen(true);
        setActiveMenu(null);
        setDeleteConfirmId(null);
    };

    const handleUpdateOrder = async (event) => {
        event.preventDefault();
        if (!selectedOrder) return;

        const items = editOrderData.items.map((item) => ({
            ...item,
            quantity: Number(item.quantity || 0),
            price: Number(item.price || 0),
            depositFee: Number(item.depositFee || 0),
            includeDeposit: Boolean(item.includeDeposit),
        }));
        const totals = calculateOrderTotals(items);

        await updateOrder(getOrderDocId(selectedOrder), {
            status: normalizeStatus(editOrderData.status),
            quantity: totals.quantity,
            amount: totals.amount,
            productTotal: totals.productTotal,
            depositTotal: totals.depositTotal,
            courier: editOrderData.courier,
            paymentMethod: editOrderData.paymentMethod,
            address: editOrderData.address,
            items,
            product: items.map((item) => `${item.quantity}x ${item.name}${item.includeDeposit ? ' (Depozitolu)' : ''}`).join(', '),
        });

        setIsEditDrawerOpen(false);
        setActiveMenu(null);
        setDeleteConfirmId(null);
    };

    const handleDeleteOrder = async (orderOrId) => {
        const orderDocId = getOrderDocId(orderOrId);
        if (!orderDocId) {
            return;
        }

        if (deleteConfirmId !== orderDocId) {
            setDeleteConfirmId(orderDocId);
            useStore.getState().addNotification('Siparişi silmek için tekrar tıklayın.', 'warning');
            setTimeout(() => {
                setDeleteConfirmId((current) => (current === orderDocId ? null : current));
            }, 3000);
            return;
        }

        await deleteOrder(orderDocId);
        useStore.getState().addNotification('Sipariş başarıyla silindi.', 'success');
        setActiveMenu(null);
        setDeleteConfirmId(null);
    };

    const handleCreateInvoice = async (orderOrId) => {
        const orderDocId = getOrderDocId(orderOrId);
        if (!orderDocId) return;
        await updateOrder(orderDocId, { hasInvoice: true });
        useStore.getState().addNotification(`Fatura oluşturuldu! (#${String(orderDocId).slice(-6).toUpperCase()})`, 'success');
    };

    const updateOrderItem = (index, field, value) => {
        const items = [...newOrder.items];
        items[index] = { ...items[index], [field]: value };
        setNewOrder((previous) => ({ ...previous, items }));
    };

    const removeOrderItem = (index) => {
        const items = newOrder.items.filter((_, currentIndex) => currentIndex !== index);
        setNewOrder((previous) => ({ ...previous, items }));
    };

    const addOrderItem = () => {
        setNewOrder((previous) => ({
            ...previous,
            items: [...previous.items, createOrderItemDraft()],
        }));
    };

    const addEditItem = () => {
        setEditOrderData((previous) => ({
            ...previous,
            items: [...previous.items, createOrderItemDraft()],
        }));
    };

    const updateEditItem = (index, field, value) => {
        const items = [...editOrderData.items];
        items[index] = { ...items[index], [field]: value };
        const totals = calculateOrderTotals(items);
        setEditOrderData((previous) => ({ ...previous, items, amount: totals.amount }));
    };

    const updateEditProduct = (index, productId) => {
        const product = products.find((entry) => entry.id === productId);
        if (!product) return;

        const items = [...editOrderData.items];
        const currentQuantity = Number(items[index]?.quantity || 1);
        items[index] = {
            ...items[index],
            ...hydrateOrderItemWithProduct(product, {
                quantity: currentQuantity,
                includeDeposit: Boolean(items[index]?.includeDeposit),
            }),
        };

        const totals = calculateOrderTotals(items);
        setEditOrderData((previous) => ({ ...previous, items, amount: totals.amount }));
    };

    const openMapDrawer = (order) => {
        setEta(null);
        setSelectedOrder(order);
        setIsMapDrawerOpen(true);
        setActiveMenu(null);
    };

    const removeEditItem = (index) => {
        const items = editOrderData.items.filter((_, currentIndex) => currentIndex !== index);
        const totals = calculateOrderTotals(items);
        setEditOrderData((previous) => ({ ...previous, items, amount: totals.amount }));
    };

    return (
        <div className="p-4 md:p-8 bg-slate-50 min-h-screen selection:bg-brand-primary/10 w-full overflow-hidden">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 md:mb-10 gap-6 md:gap-8">
                <div className="print:hidden">
                    <p className="text-brand-primary text-[10px] font-black uppercase tracking-[0.2em] mb-2">Operasyonel Akış</p>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight font-display">Sipariş Merkezi</h1>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto print:hidden">
                    <button onClick={() => window.print()} className="w-full sm:w-auto bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-6 py-3.5 rounded-2xl transition-all font-black text-xs uppercase tracking-widest shadow-sm flex items-center justify-center gap-2.5 active:scale-95"><Printer size={18} className="text-slate-400" /> LİSTEYİ YAZDIR</button>
                    <button onClick={() => setIsCreateDrawerOpen(true)} className="w-full sm:w-auto bg-slate-900 hover:bg-black text-white px-8 py-3.5 rounded-2xl transition-all font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2.5 active:scale-95 translate-y-0 hover:translate-y-[-2px]"><Plus size={18} /> YENİ SİPARİŞ OLUŞTUR</button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10 print:hidden">
                {summaryItems.map((item) => <div key={item.label} className="premium-card p-6 flex items-center gap-5"><div className={`w-14 h-14 ${item.bg} rounded-2xl flex items-center justify-center ${item.color} shadow-sm`}><item.icon size={28} /></div><div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p><p className="text-2xl font-black text-slate-900 font-display">{item.value}</p></div><div className="ml-auto"><span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter vertical-text">{item.trend}</span></div></div>)}
            </div>

            <div className="premium-card p-5 mb-8 flex flex-col md:flex-row justify-between items-center gap-5 bg-white/50 backdrop-blur-xl print:hidden">
                <div className="relative group w-full max-w-md"><Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors" size={20} /><input type="text" placeholder="Müşteri veya sipariş numarası ara..." className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary focus:bg-white transition-all font-bold text-sm shadow-inner" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} /></div>
                <div className="flex gap-2 p-1.5 bg-slate-100/50 rounded-2xl border border-slate-100 overflow-x-auto scrollbar-hide w-full md:w-auto">{['all', ...STATUSES.map((status) => status.id)].map((status) => <button key={status} onClick={() => setStatusFilter(status)} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${statusFilter === status ? 'bg-white text-brand-primary shadow-lg shadow-brand-primary/5 border border-slate-200' : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'}`}>{status === 'all' ? 'T\u00dcM\u00dc' : status.toUpperCase()}</button>)}</div>
            </div>

            <div className="lg:hidden space-y-4 mb-8">{paginatedOrders.map((order) => { const statusInfo = STATUSES.find((status) => status.id === order.status) || STATUSES[0]; return <div key={order.id} className="premium-card p-6 relative"><div className="flex justify-between items-start mb-4"><div className="flex items-center gap-4 min-w-0"><div className="w-12 h-12 shrink-0 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-xl">{getInitial(order.customer)}</div><div className="min-w-0"><h3 className="font-bold text-slate-900 truncate">{order.customer}</h3><div className="flex flex-wrap items-center gap-2 mt-1"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">#{order.orderNumber || String(order.id).slice(-6).toUpperCase()}</p><span className={`text-[9px] font-black px-2 py-0.5 rounded-md border ${order.paymentMethod === 'Veresiye' ? 'bg-amber-50 text-amber-600 border-amber-100' : order.paymentMethod === 'Nakit' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>{(order.paymentMethod || 'Nakit').toUpperCase()}</span></div></div></div><button onClick={() => setActiveMenu(activeMenu === getOrderDocId(order) ? null : getOrderDocId(order))} className="p-2 text-slate-400 shrink-0"><MoreHorizontal size={20} /></button></div><div className="space-y-3"><div className="flex items-center gap-3 text-xs text-slate-600 font-bold min-w-0"><Package size={16} className="text-slate-300 shrink-0" /> <span className="truncate">{order.product}</span> <span className="text-brand-primary shrink-0">x{order.quantity}</span></div><div className="flex justify-between items-center pt-3 border-t border-slate-50 gap-3"><span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border}`}>{statusInfo.label}</span><div className="text-lg font-black text-slate-900 font-display shrink-0">{formatMoney(order.amount)}</div></div></div></div>; })}</div>

            {activeMenuOrder && (
                <div className="lg:hidden fixed inset-0 z-[170]">
                    <div className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm" onClick={() => setActiveMenu(null)} />
                    <div className="absolute inset-x-0 bottom-0 rounded-t-[2rem] bg-slate-950 text-white shadow-2xl border-t border-white/10 p-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] animate-in slide-in-from-bottom duration-200">
                        <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-white/15" />
                        <div className="bg-white/5 px-4 py-4 rounded-2xl mb-3 border border-white/5">
                            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-brand-primary mb-1">Sipariş İşlemleri</p>
                            <h4 className="text-sm font-black text-white truncate">{activeMenuOrder.customer}</h4>
                        </div>
                        <div className="space-y-2">
                            <button onClick={() => handleOpenEdit(activeMenuOrder)} className="w-full text-left px-4 py-4 rounded-2xl text-xs font-black text-slate-100 bg-white/5 hover:bg-white/10 transition-all flex items-center gap-3">
                                <Edit2 size={18} className="text-brand-primary shrink-0" />
                                <span>Düzenle / Durum</span>
                            </button>
                            {!activeMenuOrder.hasInvoice && activeMenuOrder.status === 'Tamamlandı' && (
                                <button onClick={() => { handleCreateInvoice(activeMenuOrder); setActiveMenu(null); }} className="w-full text-left px-4 py-4 rounded-2xl text-xs font-black text-slate-100 bg-white/5 hover:bg-emerald-500/15 transition-all flex items-center gap-3">
                                    <FileText size={18} className="text-emerald-400 shrink-0" />
                                    <span>Fatura Oluştur</span>
                                </button>
                            )}
                            {activeMenuOrder.hasInvoice && (
                                <button onClick={() => { setInvoiceOrder(activeMenuOrder); setIsInvoiceDrawerOpen(true); setActiveMenu(null); }} className="w-full text-left px-4 py-4 rounded-2xl text-xs font-black text-slate-100 bg-white/5 hover:bg-blue-500/15 transition-all flex items-center gap-3">
                                    <FileText size={18} className="text-blue-400 shrink-0" />
                                    <span>Faturayı Görüntüle</span>
                                </button>
                            )}
                            <button onClick={() => handleDeleteOrder(activeMenuOrder)} className="w-full text-left px-4 py-4 rounded-2xl text-xs font-black text-rose-100 bg-rose-500/15 hover:bg-rose-500 transition-all flex items-center gap-3 border border-rose-500/20">
                                <Trash2 size={18} className="shrink-0" />
                                <span>Siparişi Sil</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className={`hidden lg:block print:block premium-card print:shadow-none print:border-none print:bg-transparent print:overflow-visible ${activeMenu ? 'overflow-visible z-50 relative' : 'overflow-hidden'}`}><div className={`scrollbar-hide print:overflow-visible ${activeMenu ? 'overflow-visible' : 'overflow-x-auto'}`}><table className="w-full text-left print:table-fixed"><thead className="bg-slate-50/50 border-b border-slate-100 text-slate-400 text-[10px] uppercase font-black tracking-[0.2em]"><tr><th className="px-8 py-6">Operasyon / Sipariş</th><th className="px-8 py-6">Sipariş Özeti</th><th className="px-8 py-6">Zamanlama</th><th className="px-8 py-6 text-center">Durum</th><th className="px-8 py-6 text-right">Mali Değer</th><th className="px-8 py-6 text-right print:hidden">Eylemler</th></tr></thead><tbody className="divide-y divide-slate-100/50 bg-white/30">{paginatedOrders.length === 0 ? <tr><td colSpan="6" className="px-10 py-24 text-center"><div className="flex flex-col items-center gap-6"><div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200"><ShoppingCart size={48} /></div><div><p className="text-xl font-black text-slate-800 font-display">Sipariş Kaydı Bulunamadı</p><p className="text-sm text-slate-400 font-medium mt-1">Sistemde henüz bu kriterlere uygun sipariş yok.</p></div></div></td></tr> : paginatedOrders.map((order, index) => { const statusInfo = STATUSES.find((status) => status.id === order.status) || STATUSES[0]; const date = order.timestamp ? new Date(order.timestamp).toLocaleDateString('tr-TR') : '-'; const time = order.timestamp ? new Date(order.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '-'; return <tr key={order.id} className="group relative transition-colors duration-200 hover:bg-slate-50/80"><td className="px-8 py-6"><div className="flex items-center gap-5"><div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-lg group-hover:bg-brand-primary transition-colors">{getInitial(order.customer)}</div><div><div className="font-black text-slate-900 group-hover:text-brand-primary transition-colors text-sm uppercase tracking-tight">{order.customer}</div><div className="flex items-center gap-2 mt-1"><span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1"><Hash size={10} /> {order.orderNumber || String(order.id).slice(-6).toUpperCase()}</span><span className={`text-[9px] font-black px-2 py-0.5 rounded-md border ${order.paymentMethod === 'Veresiye' ? 'bg-amber-50 text-amber-600 border-amber-100' : order.paymentMethod === 'Nakit' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>{(order.paymentMethod || 'Nakit').toUpperCase()}</span></div></div></div></td><td className="px-8 py-6 font-bold text-slate-600 text-xs"><div className="flex items-center gap-3"><Package size={14} className="text-slate-300" /><span className="line-clamp-1">{order.product}</span><span className="text-[10px] font-black bg-slate-100 px-2 py-0.5 rounded-lg text-slate-500">x{order.quantity}</span></div></td><td className="px-8 py-6"><div className="flex flex-col gap-0.5"><div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs uppercase tracking-tighter"><Calendar size={12} className="text-slate-400" /> {date}</div><div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-medium"><Clock size={12} className="text-slate-300" /> {time}</div></div></td><td className="px-8 py-6 text-center"><span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm inline-flex items-center gap-2 ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border}`}><statusInfo.icon size={12} />{statusInfo.label}</span></td><td className="px-8 py-6 text-right"><div className="font-black text-slate-900 text-lg font-display tracking-tight">{formatMoney(order.amount)}</div>{order.courier !== '-' && <div className="flex items-center justify-end gap-1.5 text-[10px] font-black text-slate-400 mt-1 uppercase tracking-tighter"><Truck size={12} className="text-blue-400" /> {order.courier}</div>}</td><td className="px-8 py-6 text-right print:hidden relative"><button onClick={() => setActiveMenu(activeMenu === getOrderDocId(order) ? null : getOrderDocId(order))} className={`p-3 rounded-2xl transition-all ${activeMenu === getOrderDocId(order) ? 'bg-slate-900 text-white shadow-xl rotate-90 scale-110' : 'text-slate-300 hover:text-slate-900 hover:bg-slate-100'}`}><MoreHorizontal size={20} /></button>{activeMenu === getOrderDocId(order) && <><div className="fixed inset-0 z-[55]" onClick={() => setActiveMenu(null)} /><div className={`absolute right-8 ${index > paginatedOrders.length - 3 ? 'bottom-0' : 'top-0'} glass-dark rounded-3xl shadow-2xl z-[60] w-64 overflow-hidden animate-in fade-in zoom-in duration-200 border border-white/10 p-2 text-left`}><div className="bg-white/5 px-4 py-3 rounded-2xl mb-2 border border-white/5"><p className="text-[9px] font-black uppercase tracking-widest text-brand-primary mb-0.5">Sipariş İşlemleri</p><h4 className="text-xs font-black text-white truncate">{order.customer}</h4></div><div className="space-y-1"><button onClick={() => handleOpenEdit(order)} className="w-full text-left px-4 py-2.5 rounded-xl text-[10px] font-black text-slate-300 hover:bg-white/5 hover:text-white transition-all flex items-center gap-3"><Edit2 size={16} className="text-brand-primary" /> DÜZENLE / DURUM</button>{!order.hasInvoice && order.status === 'Tamamlandı' && <button onClick={() => { handleCreateInvoice(order); setActiveMenu(null); }} className="w-full text-left px-4 py-2.5 rounded-xl text-[10px] font-black text-slate-300 hover:bg-emerald-500/10 hover:text-emerald-400 transition-all flex items-center gap-3"><FileText size={16} className="text-emerald-500" /> FATURA OLU\u015eTUR</button>}{order.hasInvoice && <button onClick={() => { setInvoiceOrder(order); setIsInvoiceDrawerOpen(true); setActiveMenu(null); }} className="w-full text-left px-4 py-2.5 rounded-xl text-[10px] font-black text-slate-300 hover:bg-blue-500/10 hover:text-blue-400 transition-all flex items-center gap-3"><FileText size={16} className="text-blue-500" /> FATURAYI G\u00d6R\u00dcNT\u00dcLE</button>}<div className="h-px bg-white/5 mx-2 my-1" /><button onClick={() => handleDeleteOrder(order)} className="w-full text-left px-4 py-2.5 rounded-xl text-[10px] font-black text-rose-100 bg-rose-500/10 hover:bg-rose-500 hover:text-white transition-all flex items-center gap-3 border border-rose-500/10"><Trash2 size={16} /> Siparişi Sil</button></div></div></>}</td></tr>; })}</tbody></table></div></div>

            {filteredOrders.length > visibleCount && <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-center print:hidden"><button onClick={() => setVisibleCount((previous) => previous + 50)} className="bg-white border-2 border-slate-200 text-slate-600 hover:border-brand-primary hover:text-brand-primary hover:bg-brand-primary/5 font-black py-4 px-10 rounded-2xl transition-all uppercase tracking-[0.2em] text-xs shadow-sm shadow-slate-200/50 active:scale-95 flex items-center gap-3">DAHA FAZLA S\u0130PAR\u0130\u015e Y\u00dcKLE<span className="bg-slate-100 text-slate-500 px-2 py-1 rounded-lg text-[9px]">+50</span></button></div>}

            {isCreateDrawerOpen && (
                <div className="fixed inset-0 z-[160] flex justify-end">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsCreateDrawerOpen(false)} />
                    <div className="relative w-full max-w-lg h-full bg-white shadow-2xl flex flex-col">
                        <div className="p-5 sm:p-8 border-b border-slate-100 flex justify-between items-center bg-white/50 gap-3">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-xl">
                                    <ShoppingCart size={24} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight font-display uppercase leading-tight">YENİ SİPARİŞ</h3>
                                </div>
                            </div>
                            <button onClick={() => setIsCreateDrawerOpen(false)} className="p-3 bg-white rounded-2xl text-slate-400 hover:text-slate-600 shadow-sm transition-colors border border-slate-100">
                                <XCircle size={32} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateOrder} className="flex-1 overflow-y-auto p-5 sm:p-10 space-y-6 sm:space-y-8 scrollbar-hide">
                            <div className="space-y-4">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Müşteri Seçimi</label>
                                <div className="relative">
                                    <input type="text" placeholder="İsim, telefon veya eski no ile ara..." className="w-full p-6 bg-slate-50 border-2 border-transparent rounded-[2rem] outline-none focus:border-brand-primary focus:bg-white transition-all font-black text-slate-800 shadow-inner" value={customerSearch} onChange={(event) => { setCustomerSearch(event.target.value); setIsCustomerDropdownOpen(true); setNewOrder((previous) => ({ ...previous, customerId: '' })); }} onFocus={() => setIsCustomerDropdownOpen(true)} onBlur={() => setTimeout(() => setIsCustomerDropdownOpen(false), 200)} />
                                    {isCustomerDropdownOpen && <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-2xl z-50 max-h-60 overflow-y-auto border border-slate-100 p-2">{filteredCustomers.length > 0 ? filteredCustomers.map((subscriber) => <div key={subscriber.id} className="p-4 hover:bg-slate-50 cursor-pointer rounded-xl transition-colors" onMouseDown={() => { setNewOrder((previous) => ({ ...previous, customerId: subscriber.id })); setCustomerSearch(`${subscriber.name} - ${subscriber.phone || ''}`); setIsCustomerDropdownOpen(false); }}><div className="font-bold text-slate-800">{subscriber.name}</div><div className="text-xs text-slate-500 font-medium">{subscriber.phone} | {subscriber.address}</div></div>) : <div className="p-4 text-center text-slate-500 text-sm font-medium">Müşteri bulunamadı</div>}</div>}
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Sipariş İçeriği</label><button type="button" onClick={addOrderItem} className="w-full sm:w-auto text-[11px] font-black text-brand-primary uppercase tracking-widest bg-brand-primary/10 px-6 py-3 rounded-2xl hover:bg-brand-primary hover:text-white transition-all shadow-sm">+ Ürün Ekle</button></div>
                                {newOrder.items.map((item, index) => {
                                    const selectedProduct = products.find((product) => product.id === item.productId);
                                    const hasDeposit = Number(selectedProduct?.depositFee || 0) > 0;
                                    return <div key={index} className="flex flex-col gap-3 bg-white p-4 rounded-[2rem] border-2 border-slate-50"><div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center"><div className="flex-1"><select required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-brand-primary transition-all text-[11px] font-black uppercase tracking-tight" value={item.productId} onChange={(event) => updateOrderItem(index, 'productId', event.target.value)}><option value="">Ürün Seçiniz...</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name} - {formatMoney(product.price)}</option>)}</select></div><div className="w-full sm:w-24"><input type="number" min="1" required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-brand-primary transition-all text-sm font-black text-center" value={item.quantity} onChange={(event) => updateOrderItem(index, 'quantity', Number(event.target.value || 1))} /></div>{newOrder.items.length > 1 && <button type="button" onClick={() => removeOrderItem(index)} className="w-full sm:w-auto p-4 text-rose-500 bg-rose-50 hover:bg-rose-500 hover:text-white rounded-2xl transition-all flex items-center justify-center"><Trash2 size={20} /></button>}</div>{hasDeposit && <label className="flex items-center justify-between gap-4 rounded-2xl border border-orange-100 bg-orange-50/60 px-4 py-3 text-[11px] font-black uppercase tracking-wider text-orange-600"><span>Depozito Var</span><input type="checkbox" className="h-5 w-5 accent-orange-500" checked={Boolean(item.includeDeposit)} onChange={(event) => updateOrderItem(index, 'includeDeposit', event.target.checked)} /></label>}</div>;
                                })}
                            </div>
                        </form>
                        <div className="p-5 sm:p-8 border-t border-slate-100 bg-white"><button onClick={handleCreateOrder} className="w-full bg-slate-900 text-white font-black py-5 sm:py-7 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl hover:bg-brand-primary transition-all flex items-center justify-center gap-4 tracking-[0.25em] sm:tracking-[0.3em] text-xs uppercase"><ShoppingCart size={24} /> SİPARİŞ OLUŞTUR</button></div>
                    </div>
                </div>
            )}

            {isEditDrawerOpen && selectedOrder && (
                <div className="fixed inset-0 z-[160] flex justify-end">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsEditDrawerOpen(false)} />
                    <div className="relative w-full max-w-lg h-full bg-white shadow-2xl flex flex-col">
                        <div className="p-5 sm:p-8 border-b border-slate-100 flex justify-between items-center bg-white/50 gap-3">
                            <div className="flex items-center gap-4"><div className="w-12 h-12 bg-brand-primary text-white rounded-2xl flex items-center justify-center shadow-xl"><Edit2 size={24} /></div><div><h3 className="text-2xl font-black text-slate-900 tracking-tight font-display uppercase leading-tight">DÜZENLE</h3><p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">{selectedOrder.customer}</p></div></div>
                            <button onClick={() => setIsEditDrawerOpen(false)} className="p-4 bg-slate-100 rounded-2xl text-slate-500 hover:text-slate-900 shadow-sm transition-all border border-slate-200"><XCircle size={32} /></button>
                        </div>
                        <form onSubmit={handleUpdateOrder} className="flex-1 overflow-y-auto p-5 sm:p-10 space-y-6 sm:space-y-8 scrollbar-hide">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{STATUSES.map((status) => <button key={status.id} type="button" onClick={() => setEditOrderData((previous) => ({ ...previous, status: status.id }))} className={`p-5 sm:p-6 rounded-[2rem] border-2 text-[10px] font-black transition-all flex flex-col items-center gap-4 uppercase tracking-[0.2em] ${editOrderData.status === status.id ? `${status.bg} ${status.color} ${status.border.replace('100', '500')} shadow-xl scale-[1.05]` : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'}`}><status.icon size={24} />{status.label}</button>)}</div>
                            <textarea className="w-full p-6 bg-slate-50 border-2 border-transparent rounded-[2rem] outline-none focus:border-brand-primary focus:bg-white transition-all font-black text-sm text-slate-800 shadow-inner resize-none h-24" value={editOrderData.address} onChange={(event) => setEditOrderData((previous) => ({ ...previous, address: event.target.value }))} />
                            <div className="space-y-4"><div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Sipariş İçeriği</label><button type="button" onClick={addEditItem} className="w-full sm:w-auto text-[11px] font-black text-brand-primary uppercase tracking-widest bg-brand-primary/10 px-6 py-3 rounded-2xl hover:bg-brand-primary hover:text-white transition-all shadow-sm">+ Ürün Ekle</button></div>{editOrderData.items.map((item, index) => { const matchedProduct = products.find((product) => product.id === (item.productId || products.find((productEntry) => productEntry.name === item.name)?.id || '')); const hasDeposit = Number(matchedProduct?.depositFee || item.depositFee || 0) > 0; return <div key={index} className="space-y-3 bg-slate-50 p-4 rounded-2xl"><div className="grid grid-cols-2 sm:grid-cols-[minmax(0,1fr)_72px_88px_40px] gap-3 items-end"><div className="min-w-0 col-span-2 sm:col-span-1"><p className="text-[10px] font-black text-slate-400 uppercase mb-1">Ürün</p><select className="w-full min-w-0 bg-transparent font-black text-slate-900 border-b border-slate-200 outline-none focus:border-brand-primary" value={item.productId || products.find((product) => product.name === item.name)?.id || ''} onChange={(event) => updateEditProduct(index, event.target.value)}><option value="">Ürün seçiniz...</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></div><div><p className="text-[10px] font-black text-slate-400 uppercase mb-1 text-center">Adet</p><input type="number" className="w-full bg-transparent font-black text-slate-900 border-b border-slate-200 outline-none focus:border-brand-primary text-center" value={item.quantity} onChange={(event) => updateEditItem(index, 'quantity', Number(event.target.value || 0))} /></div><div><p className="text-[10px] font-black text-slate-400 uppercase mb-1 text-center">Fiyat</p><input type="number" step="0.01" className="w-full bg-transparent font-black text-slate-900 border-b border-slate-200 outline-none focus:border-brand-primary text-center" value={item.price} onChange={(event) => updateEditItem(index, 'price', Number(event.target.value || 0))} /></div><button type="button" onClick={() => removeEditItem(index)} className="col-span-2 sm:col-span-1 p-3 sm:p-2 text-rose-400 hover:text-rose-600 transition-colors self-center flex items-center justify-center"><Trash2 size={16} /></button></div>{hasDeposit && <label className="flex items-center justify-between gap-4 rounded-2xl border border-orange-100 bg-white px-4 py-3 text-[11px] font-black uppercase tracking-wider text-orange-600"><span>Depozito Var</span><input type="checkbox" className="h-5 w-5 accent-orange-500" checked={Boolean(item.includeDeposit)} onChange={(event) => updateEditItem(index, 'includeDeposit', event.target.checked)} /></label>}</div>; })}</div>
                        </form>
                        <div className="p-5 sm:p-8 border-t border-slate-100 bg-white"><button onClick={handleUpdateOrder} className="w-full bg-slate-900 text-white font-black py-5 sm:py-7 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-4 tracking-[0.25em] sm:tracking-[0.3em] text-xs uppercase"><CheckCircle size={24} /> DEĞİŞİKLİKLERİ KAYDET</button></div>
                    </div>
                </div>
            )}

            {isMapDrawerOpen && selectedOrder && (
                <div className="fixed inset-0 z-[160] flex justify-end">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsMapDrawerOpen(false)} />
                    <div className="relative w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white/50"><div className="flex items-center gap-4"><div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20"><Map size={24} /></div><div><h3 className="text-2xl font-black text-slate-900 tracking-tight font-display uppercase leading-tight">CANLI TAKİP</h3><p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">{selectedOrder.customer}</p></div></div><button onClick={() => setIsMapDrawerOpen(false)} className="p-3 bg-white rounded-2xl text-slate-400 hover:text-slate-600 shadow-sm transition-colors border border-slate-100"><XCircle size={32} /></button></div>
                        <div className="flex-1 p-8 flex flex-col"><div className="flex-1 rounded-[3rem] overflow-hidden shadow-2xl border-4 border-slate-50 relative group"><GoogleMapTracker courierLocation={couriers.find((courier) => courier.userId === selectedOrder.courierId || courier.name === selectedOrder.courier)?.location || selectedOrder.courierLocation} customerAddress={selectedOrder.address || 'İstanbul Merkez'} customerLocation={selectedOrder.customerLocation || subscribers.find((subscriber) => subscriber.id === selectedOrder.customerId)?.location} businessAddress={currentUser?.address || 'İstanbul Merkez'} businessLocation={currentUser?.location} onTimeEstimate={(time) => setEta((previous) => (previous === time ? previous : time))} />{eta && <div className="absolute top-8 left-8 bg-slate-900/90 backdrop-blur-xl px-8 py-4 rounded-[2rem] text-sm shadow-2xl font-black border border-white/10 text-white flex items-center gap-3"><div className="w-3 h-3 bg-blue-500 rounded-full animate-ping" /><span className="uppercase tracking-[0.2em]">Varış: {eta}</span></div>}</div></div>
                    </div>
                </div>
            )}
            <InvoiceViewerDrawer isOpen={isInvoiceDrawerOpen} onClose={() => { setIsInvoiceDrawerOpen(false); setInvoiceOrder(null); }} order={invoiceOrder} />
        </div>
    );
};

export default Orders;






