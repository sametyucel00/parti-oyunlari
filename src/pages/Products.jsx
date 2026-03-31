import React, { useState } from 'react';
import { Plus, Search, Filter, Calculator, Truck, Banknote, RefreshCw, XCircle, Package, Image as ImageIcon, Edit2, Upload, Settings2, Trash2 } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import ProductExcelImportDrawer from '../components/ProductExcelImportDrawer';
import useStore from '../store/useStore';


const Products = () => {
    const { products, updateStock, addProduct, updateProduct, deleteProduct, categories: storeCategories, addCategory, deleteCategory } = useStore();

    // Prepare display categories
    const displayCategories = [
        { id: 'all', label: 'TÃ¼mÃ¼' },
        ...storeCategories.map(c => ({ id: c.id, label: c.label }))
    ];
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    const getCategoryLabel = (type) => {
        const legacy = {
            damacana: 'Damacana',
            pet: 'PET Grubu',
            bardak: 'Bardak Su',
            tube: 'TÃ¼p Grubu',
            filter: 'ArÄ±tma/Filtre',
            equipment: 'Ekipman'
        };
        return storeCategories.find(c => c.id === type)?.label || legacy[type] || type || 'Genel';
    };

    // Modal State
    const [isStockDrawerOpen, setIsStockDrawerOpen] = useState(false);
    const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
    const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
    const [isImportDrawerOpen, setIsImportDrawerOpen] = useState(false);
    const [isCategoryDrawerOpen, setIsCategoryDrawerOpen] = useState(false);
    const [newCategoryLabel, setNewCategoryLabel] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [entryData, setEntryData] = useState({
        quantity: '',
        buyPrice: '',
        transportCost: '0',
        depositFee: '0',
        price: ''
    });

    const [newProduct, setNewProduct] = useState({
        name: '',
        type: storeCategories[0]?.id || 'all',
        imageUrl: ''
    });

    const [editProductData, setEditProductData] = useState({
        name: '',
        price: '',
        type: '',
        stock: 0,
        emptyStock: 0,
        imageUrl: '',
        depositFee: 0
    });

    const handleOpenStockModal = (product) => {
        setSelectedProduct(product);
        setEntryData({
            quantity: '',
            buyPrice: '',
            transportCost: '0',
            depositFee: product.depositFee || '0',
            price: product.price || ''
        });
        setIsStockDrawerOpen(true);
    };

    const handleOpenEdit = (product) => {
        setSelectedProduct(product);
        setEditProductData({
            name: product.name,
            price: product.price,
            type: product.type || storeCategories[0]?.id || 'all',
            stock: product.stock,
            emptyStock: product.emptyStock || 0,
            imageUrl: product.imageUrl || '',
            depositFee: product.depositFee || 0
        });
        setIsEditDrawerOpen(true);
    };

    const handleCreateProduct = async (e) => {
        e.preventDefault();
        const productData = {
            ...newProduct,
            price: 0,
            stock: 0,
            emptyStock: 0,
            depositFee: 0
        };

        await addProduct(productData);

        setIsCreateDrawerOpen(false);
        setNewProduct({
            name: '', type: storeCategories[0]?.id || 'all', imageUrl: ''
        });
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (newCategoryLabel.trim()) {
            await addCategory({ label: newCategoryLabel.trim() });
            setNewCategoryLabel('');
            useStore.getState().addNotification('Kategori eklendi', 'success');
        }
    };

    // Keep newProduct type in sync with available categories
    React.useEffect(() => {
        if ((!newProduct.type || newProduct.type === 'all') && storeCategories.length > 0) {
            setNewProduct(prev => ({ ...prev, type: storeCategories[0].id }));
        }
    }, [storeCategories, newProduct.type]);

    const [deleteConfirmId, setDeleteConfirmId] = useState(null);

    const handleDeleteCategory = async (id) => {
        if (deleteConfirmId === id) {
            await deleteCategory(id);
            useStore.getState().addNotification('Kategori baÅŸarÄ±yla silindi.', 'success');
            setDeleteConfirmId(null);
        } else {
            setDeleteConfirmId(id);
            useStore.getState().addNotification('Silmek iÃ§in tekrar tÄ±klayÄ±n.', 'warning');
            setTimeout(() => setDeleteConfirmId(null), 3000);
        }
    };

    const handleDeleteProduct = async (product) => {
        if (!product?.id) return;

        if (deleteConfirmId === product.id) {
            await deleteProduct(product.id);
            useStore.getState().addNotification('ÃœrÃ¼n baÅŸarÄ±yla silindi.', 'success');
            setDeleteConfirmId(null);
        } else {
            setDeleteConfirmId(product.id);
            useStore.getState().addNotification('ÃœrÃ¼nÃ¼ silmek iÃ§in tekrar tÄ±klayÄ±n.', 'warning');
            setTimeout(() => {
                setDeleteConfirmId(current => current === product.id ? null : current);
            }, 3000);
        }
    };

    const handleUpdateProduct = async (e) => {
        e.preventDefault();
        if (!selectedProduct) return;

        await updateProduct(selectedProduct.id, {
            name: editProductData.name,
            price: parseFloat(editProductData.price),
            type: editProductData.type,
            stock: parseInt(editProductData.stock),
            emptyStock: parseInt(editProductData.emptyStock) || 0,
            imageUrl: editProductData.imageUrl,
            depositFee: parseFloat(editProductData.depositFee) || 0
        });
        setIsEditDrawerOpen(false);
    };

    const handleImportProducts = async (importedProducts) => {
        for (const productData of importedProducts) {
            await addProduct(productData);
        }
    };

    const handleStockEntry = async (e) => {
        e.preventDefault();
        const quantity = parseInt(entryData.quantity) || 0;
        const buyPrice = parseFloat(entryData.buyPrice) || 0;
        const transportCost = parseFloat(entryData.transportCost) || 0;
        const depositFee = parseFloat(entryData.depositFee) || 0;
        const salesPrice = parseFloat(entryData.price) || 0;

        if (quantity > 0 && selectedProduct) {
            // First update the product's general fields (deposit and price)
            await updateProduct(selectedProduct.id, {
                depositFee,
                price: salesPrice
            });

            // Then record the stock movement
            updateStock(selectedProduct.id, quantity, true, {
                buyPrice,
                transportCost
            });
            setIsStockDrawerOpen(false);
            setEntryData({
                quantity: '', buyPrice: '', transportCost: '0', depositFee: '0', price: ''
            });
        }
    };

    // Calculations for preview
    const calculatePreview = (data) => {
        const qty = parseFloat(data.quantity) || 0;
        const buy = parseFloat(data.buyPrice) || 0;
        const transport = parseFloat(data.transportCost) || 0;
        const salePrice = parseFloat(data.price) || 0;

        if (qty === 0) return { totalCost: 0, unitCost: 0, profitRate: 0 };

        const totalCost = (qty * buy) + transport;
        const unitCost = totalCost / qty;
        const profitRate = unitCost > 0 ? ((salePrice - unitCost) / unitCost) * 100 : 0;

        return { totalCost, unitCost, profitRate };
    };

    const stockEntryPreview = calculatePreview(entryData);

    const filteredProducts = products.filter(product => {
        const matchesCategory = selectedCategory === 'all' || product.type === selectedCategory;
        const lowerSearch = (searchTerm || '').toLowerCase();
        const matchesSearch = (product.name || '').toLowerCase().includes(lowerSearch);
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="p-4 md:p-10 bg-slate-50 min-h-screen pb-24 md:pb-10 w-full overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight font-display">ÃœrÃ¼n & Stok</h1>
                    <p className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-widest mt-1">Stok YÃ¼kleme ve Analiz Paneli</p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsCategoryDrawerOpen(true)}
                            className="flex-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-3 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest shadow-sm flex items-center justify-center gap-2 active:scale-95"
                        >
                            <Settings2 size={16} className="text-blue-500" /> AYARLAR
                        </button>
                        <button
                            onClick={() => setIsImportDrawerOpen(true)}
                            className="flex-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-3 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest shadow-sm flex items-center justify-center gap-2 active:scale-95"
                        >
                            <Upload size={16} className="text-emerald-500" /> AKTAR
                        </button>
                    </div>
                    <button
                        onClick={() => setIsCreateDrawerOpen(true)}
                        className="w-full bg-slate-900 text-white px-6 py-4 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-brand-primary active:scale-95 flex items-center justify-center gap-2"
                    >
                        <Plus size={18} /> YENÄ° ÃœRÃœN EKLE
                    </button>
                </div>
            </div>

            {/* Category Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-8">
                {storeCategories.map(cat => {
                    const catProducts = products.filter(p => p.type === cat.id);
                    const totalStock = catProducts.reduce((acc, p) => acc + (p.stock || 0), 0);
                    const isTracking = cat.label.toLowerCase().includes('damacana') || cat.label.toLowerCase().includes('tÃ¼p');
                    const totalEmpty = isTracking ? catProducts.reduce((acc, p) => acc + (p.emptyStock || 0), 0) : 0;

                    return (
                        <div key={cat.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
                            <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 truncate">{cat.label}</h4>
                            <div className="flex items-end justify-between">
                                <div>
                                    <div className="text-xl font-black text-slate-900 font-display">{catProducts.length} <span className="text-[10px] text-slate-400">ÃœrÃ¼n</span></div>
                                    <div className="text-xs font-bold text-brand-primary">{totalStock} <span className="text-[9px] uppercase tracking-tighter">Dolu</span></div>
                                </div>
                                {isTracking && (
                                    <div className="text-right">
                                        <div className="text-xs font-bold text-rose-500">{totalEmpty} <span className="text-[9px] uppercase tracking-tighter">BoÅŸ</span></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-100 shadow-sm group flex items-center gap-3 md:gap-5">
                    <div className="p-3 bg-brand-primary/5 text-brand-primary rounded-xl group-hover:scale-110 transition-transform">
                        <Package size={20} />
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Toplam ÃœrÃ¼n</p>
                        <h3 className="text-lg md:text-2xl font-black text-slate-900 font-display">{products.length}</h3>
                    </div>
                </div>
                <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-100 shadow-sm group flex items-center gap-3 md:gap-5">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
                        <Package size={20} />
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Toplam Dolu (Dolu)</p>
                        <h3 className="text-lg md:text-2xl font-black text-slate-900 font-display">{products.reduce((acc, p) => acc + (p.stock || 0), 0)}</h3>
                    </div>
                </div>
                <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-100 shadow-sm group flex items-center gap-3 md:gap-5">
                    <div className="p-3 bg-rose-50 text-rose-600 rounded-xl group-hover:scale-110 transition-transform">
                        <RefreshCw size={20} className="rotate-180" />
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Toplam BoÅŸ (Ä°ade)</p>
                        <h3 className="text-lg md:text-2xl font-black text-slate-900 font-display">
                            {products.reduce((acc, p) => acc + (p.emptyStock || 0), 0)}
                        </h3>
                    </div>
                </div>
                <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-100 shadow-sm group flex items-center gap-3 md:gap-5">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                        <Calculator size={20} />
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">KategorÄ° SayÄ±sÄ±</p>
                        <h3 className="text-lg md:text-2xl font-black text-slate-900 font-display">{storeCategories.length}</h3>
                    </div>
                </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-8 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="flex gap-2 overflow-x-auto p-1 bg-slate-50 rounded-xl border border-slate-100 w-full md:w-auto no-scrollbar">
                    {displayCategories.map(category => (
                        <button
                            key={category.id}
                            onClick={() => setSelectedCategory(category.id)}
                            className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedCategory === category.id
                                ? 'bg-slate-900 text-white shadow-lg'
                                : 'text-slate-400 hover:text-slate-600 hover:bg-white'
                                }`}
                        >
                            {category.label}
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-72 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors" size={16} />
                    <input
                        type="text"
                        placeholder="ÃœrÃ¼n ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-[11px] font-bold"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map(product => (
                    <ProductCard
                        key={product.id}
                        product={product}
                        categoryLabel={getCategoryLabel(product.type)}
                        onAddStock={handleOpenStockModal}
                        onEdit={handleOpenEdit}
                        onDelete={handleDeleteProduct}
                    />
                ))}
            </div>

            {filteredProducts.length === 0 && (
                <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Filter className="text-slate-400" size={24} />
                    </div>
                    <h3 className="text-lg font-medium text-slate-700">ÃœrÃ¼n bulunamadÄ±</h3>
                    <p className="text-slate-500">Arama kriterlerinize uygun Ã¼rÃ¼n yok.</p>
                </div>
            )}

            {isCreateDrawerOpen && (
                <div className="fixed inset-0 z-[150] flex justify-end">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsCreateDrawerOpen(false)}></div>
                    <div className="relative w-full max-w-xl h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white/50">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg">
                                    <Package size={28} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight font-display uppercase">YENÄ° ÃœRÃœN</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Sisteme yeni Ã¼rÃ¼n kaydÄ±</p>
                                </div>
                            </div>
                            <button onClick={() => setIsCreateDrawerOpen(false)} className="p-3 bg-white rounded-2xl text-slate-400 hover:text-slate-600 shadow-sm transition-colors border border-slate-100">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-10 scrollbar-hide">
                            <form onSubmit={handleCreateProduct} className="space-y-8">
                                <div>
                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">ÃœrÃ¼n AdÄ±</label>
                                    <input
                                        type="text" required
                                        placeholder="Ã–rn: 19L Damacana Su"
                                        className="w-full px-6 py-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:outline-none focus:border-brand-primary focus:bg-white transition-all text-sm font-bold shadow-inner"
                                        value={newProduct.name}
                                        onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Kategori</label>
                                    <select
                                        className="w-full px-6 py-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:outline-none focus:border-brand-primary focus:bg-white transition-all text-sm font-bold shadow-inner"
                                        value={newProduct.type}
                                        onChange={e => setNewProduct({ ...newProduct, type: e.target.value })}
                                    >
                                        {storeCategories.map(c => (
                                            <option key={c.id} value={c.id}>{c.label}</option>
                                        ))}
                                        {storeCategories.length === 0 && <option value="all">Kategori Yok</option>}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">ÃœrÃ¼n GÃ¶rseli (URL)</label>
                                    <div className="flex gap-4">
                                        <div className="flex-1 relative">
                                            <ImageIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                                            <input
                                                type="url"
                                                placeholder="https://..."
                                                className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:outline-none focus:border-brand-primary focus:bg-white transition-all text-sm font-bold shadow-inner"
                                                value={newProduct.imageUrl}
                                                onChange={e => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
                                            />
                                        </div>
                                        {newProduct.imageUrl && (
                                            <div className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-100 flex-shrink-0 bg-slate-50 shadow-sm">
                                                <img src={newProduct.imageUrl} alt="Ã–nizleme" className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="pt-6">
                                    <button type="submit" className="w-full bg-brand-primary text-white font-black py-6 rounded-[2rem] shadow-xl shadow-brand-primary/20 hover:shadow-brand-primary/30 transition-all hover:scale-[1.02] active:scale-95 uppercase tracking-widest text-xs">
                                        ÃœrÃ¼nÃ¼ Kaydet ve YayÄ±nla
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {isEditDrawerOpen && selectedProduct && (
                <div className="fixed inset-0 z-[150] flex justify-end">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsEditDrawerOpen(false)}></div>
                    <div className="relative w-full max-w-xl h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white/50">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg">
                                    <Edit2 size={24} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight font-display uppercase">DÃœZENLE</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{selectedProduct.name}</p>
                                </div>
                            </div>
                            <button onClick={() => setIsEditDrawerOpen(false)} className="p-3 bg-white rounded-2xl text-slate-400 hover:text-slate-600 shadow-sm transition-colors border border-slate-100">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-10 scrollbar-hide">
                            <form onSubmit={handleUpdateProduct} className="space-y-8">
                                <div>
                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">ÃœrÃ¼n AdÄ±</label>
                                    <input
                                        type="text" required
                                        className="w-full px-6 py-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:outline-none focus:border-brand-primary focus:bg-white transition-all text-sm font-bold shadow-inner"
                                        value={editProductData.name}
                                        onChange={e => setEditProductData({ ...editProductData, name: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Satış Fiyatı</label>
                                        <input
                                            type="number" step="0.01" required
                                            className="w-full px-6 py-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:outline-none focus:border-brand-primary focus:bg-white transition-all text-sm font-black shadow-inner text-brand-primary"
                                            value={editProductData.price}
                                            onChange={e => setEditProductData({ ...editProductData, price: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Depozito</label>
                                        <input
                                            type="number" step="0.01"
                                            className="w-full px-6 py-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:outline-none focus:border-brand-primary focus:bg-white transition-all text-sm font-black shadow-inner text-slate-500"
                                            value={editProductData.depositFee}
                                            onChange={e => setEditProductData({ ...editProductData, depositFee: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Kategori</label>
                                        <select
                                            className="w-full px-6 py-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:outline-none focus:border-brand-primary focus:bg-white transition-all text-sm font-bold shadow-inner"
                                            value={editProductData.type}
                                            onChange={e => setEditProductData({ ...editProductData, type: e.target.value })}
                                        >
                                            {storeCategories.map(c => (
                                                <option key={c.id} value={c.id}>{c.label}</option>
                                            ))}
                                            {storeCategories.length === 0 && <option value="all">Kategori Yok</option>}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Dolu Stok</label>
                                            <input
                                                type="number" required
                                                className="w-full px-6 py-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:outline-none focus:border-brand-primary focus:bg-white transition-all text-sm font-black shadow-inner"
                                                value={editProductData.stock}
                                                onChange={e => setEditProductData({ ...editProductData, stock: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">BoÅŸ Stok</label>
                                            <input
                                                type="number"
                                                className="w-full px-6 py-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:outline-none focus:border-brand-primary focus:bg-white transition-all text-sm font-black shadow-inner"
                                                value={editProductData.emptyStock}
                                                onChange={e => setEditProductData({ ...editProductData, emptyStock: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">ÃœrÃ¼n GÃ¶rseli (URL)</label>
                                    <div className="flex gap-4">
                                        <div className="flex-1 relative">
                                            <ImageIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                                            <input
                                                type="url"
                                                placeholder="https://..."
                                                className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:outline-none focus:border-brand-primary focus:bg-white transition-all text-sm font-bold shadow-inner"
                                                value={editProductData.imageUrl}
                                                onChange={e => setEditProductData({ ...editProductData, imageUrl: e.target.value })}
                                            />
                                        </div>
                                        {editProductData.imageUrl && (
                                            <div className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-100 flex-shrink-0 bg-slate-50 shadow-sm">
                                                <img src={editProductData.imageUrl} alt="Ã–nizleme" className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="pt-6">
                                    <button type="submit" className="w-full bg-slate-900 text-white font-black py-6 rounded-[2rem] shadow-xl hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest text-xs">
                                        DeÄŸiÅŸiklikleri Kaydet
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {isStockDrawerOpen && selectedProduct && (
                <div className="fixed inset-0 z-[150] flex justify-end">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsStockDrawerOpen(false)}></div>
                    <div className="relative w-full max-w-xl h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white/50">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-brand-primary text-white rounded-2xl flex items-center justify-center shadow-lg">
                                    <RefreshCw size={28} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight font-display uppercase">STOK YÜKLEME VE ANALİZ PANELİ</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{selectedProduct.name}</p>
                                </div>
                            </div>
                            <button onClick={() => setIsStockDrawerOpen(false)} className="p-3 bg-white rounded-2xl text-slate-400 hover:text-slate-600 shadow-sm transition-colors border border-slate-100">
                                <XCircle size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-10 scrollbar-hide">
                            <form onSubmit={handleStockEntry} className="space-y-8">
                                <div className="space-y-8">
                                    <div className="grid grid-cols-2 gap-8">
                                        <div>
                                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Gelen Miktar</label>
                                            <div className="relative">
                                                <Plus className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-primary" size={20} />
                                                <input
                                                    type="number" required min="1"
                                                    className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:outline-none focus:border-brand-primary focus:bg-white transition-all text-sm font-black shadow-inner"
                                                    placeholder="Adet"
                                                    value={entryData.quantity}
                                                    onChange={e => setEntryData({ ...entryData, quantity: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Nakliye / Ek</label>
                                            <div className="relative">
                                                <Truck className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                                <input
                                                    type="number" min="0" step="0.01"
                                                    className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:outline-none focus:border-brand-primary focus:bg-white transition-all text-sm font-black shadow-inner text-slate-500"
                                                    value={entryData.transportCost}
                                                    onChange={e => setEntryData({ ...entryData, transportCost: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-8">
                                        <div>
                                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Birim Alış (₺)</label>
                                            <div className="relative">
                                                <Banknote className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-accent" size={20} />
                                                <input
                                                    type="number" required min="0" step="0.01"
                                                    className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:outline-none focus:border-brand-primary focus:bg-white transition-all text-sm font-black shadow-inner"
                                                    placeholder="0.00"
                                                    value={entryData.buyPrice}
                                                    onChange={e => setEntryData({ ...entryData, buyPrice: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Satış Fiyatı</label>
                                            <div className="relative">
                                                <Banknote className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-primary" size={20} />
                                                <input
                                                    type="number" required step="0.01"
                                                    className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:outline-none focus:border-brand-primary focus:bg-white transition-all text-sm font-black shadow-inner text-brand-primary"
                                                    value={entryData.price}
                                                    onChange={e => setEntryData({ ...entryData, price: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Depozito</label>
                                        <div className="relative">
                                            <Banknote className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                            <input
                                                type="number" step="0.01"
                                                className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:outline-none focus:border-brand-primary focus:bg-white transition-all text-sm font-black shadow-inner text-slate-500"
                                                value={entryData.depositFee}
                                                onChange={e => setEntryData({ ...entryData, depositFee: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-900 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-10 text-white/5">
                                        <RefreshCw size={100} />
                                    </div>
                                    <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                                        <div className="w-2 h-2 bg-brand-primary rounded-full"></div>
                                        Maliyet & Fiyat Analizi
                                    </h4>
                                    <div className="grid grid-cols-2 gap-8 relative z-10">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Toplam Maliyet</p>
                                            <p className="text-2xl font-black text-white font-display">₺{stockEntryPreview.totalCost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Birim Maliyet</p>
                                            <p className="text-2xl font-black text-white font-display">₺{stockEntryPreview.unitCost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
                                        </div>
                                        <div className="col-span-2 bg-white/5 rounded-3xl p-6 border border-white/10 backdrop-blur-md">
                                            <p className="text-[11px] font-black text-brand-accent uppercase tracking-widest mb-2">Kâr Oranı</p>
                                            <p className="text-4xl font-black text-brand-accent font-display">%{stockEntryPreview.profitRate.toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-4 pt-6">
                                    <button
                                        type="button"
                                        onClick={() => setIsStockDrawerOpen(false)}
                                        className="flex-1 py-6 bg-slate-100 text-slate-500 font-black rounded-[2rem] hover:bg-slate-200 transition-all active:scale-95 uppercase tracking-widest text-xs"
                                    >
                                        İptal
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-[2] py-6 bg-brand-primary text-white font-black rounded-[2rem] shadow-xl shadow-brand-primary/20 hover:shadow-brand-primary/30 transition-all hover:scale-[1.02] active:scale-95 uppercase tracking-widest text-xs"
                                    >
                                        Stok Girişini Onayla
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {isCategoryDrawerOpen && (
                <div className="fixed inset-0 z-[160] flex justify-end">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsCategoryDrawerOpen(false)}></div>
                    <div className="relative w-full sm:max-w-xl h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
                        <div className="p-5 sm:p-8 border-b border-slate-100 flex justify-between items-center bg-white/50 sticky top-0 z-10 backdrop-blur-md">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                                    <Settings2 size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-display uppercase leading-tight">Kategorileri YÃ¶net</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">ÃœrÃ¼n gruplandÄ±rma ayarlarÄ±</p>
                                </div>
                            </div>
                            <button onClick={() => setIsCategoryDrawerOpen(false)} className="p-2 sm:p-3 bg-white rounded-2xl text-slate-400 hover:text-slate-600 shadow-sm transition-colors border border-slate-100">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5 sm:p-10 scrollbar-hide">
                            <form onSubmit={handleAddCategory} className="flex flex-col sm:flex-row gap-4 mb-10">
                                <div className="flex-1">
                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">YENÄ° KATEGORÄ°</label>
                                    <input
                                        type="text" required
                                        placeholder="Kategori adÄ±..."
                                        className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-[1.2rem] focus:outline-none focus:border-brand-primary focus:bg-white transition-all text-sm font-bold shadow-inner"
                                        value={newCategoryLabel}
                                        onChange={e => setNewCategoryLabel(e.target.value)}
                                    />
                                </div>
                                <button type="submit" className="sm:mt-8 bg-brand-primary text-white p-4 sm:p-5 rounded-2xl shadow-xl shadow-brand-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center">
                                    <Plus size={28} />
                                </button>
                            </form>

                            <div className="space-y-4 pb-20">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-1">MEVCUT KATEGORÄ°LER</h4>
                                {storeCategories.length === 0 ? (
                                    <div className="text-center py-10 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-slate-400 font-bold text-sm">
                                        HenÃ¼z kategori eklenmemiÅŸ.
                                    </div>
                                ) : (
                                    storeCategories.map(cat => (
                                        <div key={cat.id} className="flex items-center justify-between p-5 bg-white border-2 border-slate-50 rounded-[1.5rem] group hover:border-blue-100 hover:bg-blue-50/10 transition-all duration-300">
                                            <div className="flex items-center gap-4 min-w-0">
                                                <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></div>
                                                <span className="font-black text-slate-700 text-sm sm:text-base uppercase tracking-tight truncate">{cat.label}</span>
                                            </div>
                                             <button
                                                 onClick={() => handleDeleteCategory(cat.id)}
                                                 className={`p-3 rounded-2xl transition-all sm:opacity-0 group-hover:opacity-100 shrink-0 ${deleteConfirmId === cat.id ? 'bg-rose-600 text-white shadow-lg' : 'text-rose-400 hover:text-rose-600 hover:bg-rose-50'}`}
                                             >
                                                 <Trash2 size={20} />
                                             </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Excel Import Modal */}
            <ProductExcelImportDrawer
                isOpen={isImportDrawerOpen}
                onClose={() => setIsImportDrawerOpen(false)}
                onImport={handleImportProducts}
                products={products}
                categories={storeCategories}
            />
        </div>
    );
};

export default Products;


