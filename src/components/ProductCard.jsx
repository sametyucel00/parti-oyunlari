import React from 'react';
import { Package, Info, PlusCircle, Edit, Trash2 } from 'lucide-react';

const ProductCard = ({ product, onAddStock, onEdit, onDelete, categoryLabel }) => {
    return (
        <div className="premium-card group overflow-hidden flex flex-col h-full bg-white transition-all duration-300 hover:scale-[1.02] border border-slate-100">
            <div className="h-40 md:h-56 bg-slate-50 flex items-center justify-center relative overflow-hidden">
                {product.imageUrl ? (
                    <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                ) : (
                    <div className="flex flex-col items-center gap-3">
                        <Package size={40} className="text-slate-200 group-hover:scale-110 transition-transform duration-300" />
                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em]">Resim Yok</span>
                    </div>
                )}

                {product.depositFee > 0 && (
                    <span className="absolute top-3 right-3 bg-orange-500 text-white text-[8px] md:text-[10px] font-black px-2 md:px-3 py-1 md:py-1.5 rounded-xl flex items-center gap-1.5 md:gap-2 shadow-xl shadow-orange-500/30 border border-white/20 uppercase tracking-tighter z-10">
                        <Info size={10} />
                        Depozito: ₺{product.depositFee}
                    </span>
                )}

                <div className="absolute top-2 left-2 px-2 py-1 bg-white/80 backdrop-blur-md rounded-lg border border-slate-100 text-[8px] font-black text-slate-500 uppercase tracking-widest z-10">
                    {categoryLabel || 'Genel'}
                </div>
            </div>

            <div className="p-4 md:p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-3 md:mb-4 gap-4">
                    <h3 className="text-base md:text-lg font-black text-slate-900 leading-tight group-hover:text-brand-primary transition-colors line-clamp-2" title={product.name}>{product.name}</h3>
                </div>

                <div className="mt-auto">
                    <div className="flex justify-between items-end mb-4 md:mb-6">
                        <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Fiyat</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl md:text-2xl font-black text-slate-900 font-display">₺{product.price}</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Stok Durumu</p>
                            <div className="flex flex-col items-end gap-1">
                                <span className={`text-[10px] md:text-xs font-black flex items-center justify-end gap-1.5 ${product.stock < 20 ? 'text-rose-500' : 'text-emerald-600'}`}>
                                    {product.stock || 0} Dolu
                                </span>
                                {(categoryLabel.toLowerCase().includes('damacana') || categoryLabel.toLowerCase().includes('tüp')) && (
                                    <span className="text-[10px] md:text-xs font-black text-slate-400 flex items-center justify-end gap-1.5">
                                        {product.emptyStock || 0} Boş
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-5 gap-2">
                        <button
                            onClick={() => onAddStock(product)}
                            className="col-span-3 bg-brand-primary text-white font-black py-3 rounded-xl text-[10px] flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand-primary/10 active:scale-95 uppercase"
                        >
                            <PlusCircle size={16} /> Stok Ekle
                        </button>
                        <button
                            onClick={() => onEdit(product)}
                            className="col-span-1 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center transition-all hover:bg-slate-200 active:scale-90 border border-slate-200"
                        >
                            <Edit size={16} />
                        </button>
                        <button
                            onClick={() => onDelete(product)}
                            className="col-span-1 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center transition-all hover:bg-rose-500 hover:text-white active:scale-90 border border-rose-100"
                            title="Ürünü Sil"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
