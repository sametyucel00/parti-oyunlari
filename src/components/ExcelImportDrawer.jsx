import React, { useState } from 'react';
import { XCircle, Upload, FileSpreadsheet, CheckCircle, AlertTriangle, ChevronRight, Search, User, Phone, Hash, ArrowRight, ShieldCheck, Download, Trash2, Info, Zap } from 'lucide-react';
import * as XLSX from 'xlsx';
import useStore from '../store/useStore';

const ExcelImportDrawer = ({ isOpen, onClose, onImport, subscribers }) => {
    const [step, setStep] = useState('upload'); // upload, preview, results
    const [data, setData] = useState([]);
    const [stats, setStats] = useState({ total: 0, duplicates: 0, new: 0 });
    const [isLoading, setIsLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragover" || e.type === "dragenter") {
            setIsDragging(true);
        } else if (e.type === "dragleave" || e.type === "dragend") {
            setIsDragging(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload({ target: { files: e.dataTransfer.files } });
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsLoading(true);
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const rawData = XLSX.utils.sheet_to_json(ws);

                if (rawData.length > 0) {
                    const firstRow = rawData[0];
                    const requiredHeaders = ['Abone Bilgisi', 'Adres', 'Telefon'];
                    const missing = requiredHeaders.filter(h => !Object.keys(firstRow).some(key => key.trim() === h));

                    if (missing.length > 0) {
                        useStore.getState().addNotification(`Hata: Dosyada şu başlıklar eksik: ${missing.join(', ')}`, "error");
                        setIsLoading(false);
                        return;
                    }
                }

                const processed = rawData.map(row => ({
                    name: row['Abone Bilgisi'] || '',
                    phone: String(row['Telefon'] || '').replace(/\D/g, ''),
                    address: String(row['Adres'] || ''),
                    product: row['Ürün'] || row['Paket'] || row['Plan'] || 'Damacana Su',
                    quantity: parseInt(row['Adet'] || row['Miktar']) || 1,
                    legacyId: row['Eski No'] || row['Abone No'] || row['ID'] || '',
                    notes: String(row['Notlar'] || row['Not'] || row['Açıklama'] || row['Aciklama'] || ''),
                    plan: row['Plan'] || row['Paket'] || 'Haftalık',
                    limit: row['Limit'] || 2000,
                    status: 'Active',
                    isCorporate: row['İşletme'] === 'Evet' || row['Kurumsal'] === 'Evet' || row['İşletme'] === true || row['Kurumsal'] === true || false
                }));

                const duplicates = processed.filter(newItem =>
                    subscribers.some(oldItem =>
                        (oldItem.phone === newItem.phone && newItem.phone !== '') ||
                        (oldItem.legacyId === newItem.legacyId && newItem.legacyId !== '')
                    )
                );

                setData(processed);
                setStats({
                    total: processed.length,
                    duplicates: duplicates.length,
                    new: processed.length - duplicates.length
                });
                setStep('preview');
            } catch (err) {
                console.error(err);
                useStore.getState().addNotification("Dosya okunamadı!", "error");
            } finally {
                setIsLoading(false);
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleProcessImport = () => {
        const uniqueData = data.filter(newItem =>
            !subscribers.some(oldItem =>
                (oldItem.phone === newItem.phone && newItem.phone !== '') ||
                (oldItem.legacyId === newItem.legacyId && newItem.legacyId !== '')
            )
        );
        onImport(uniqueData);
        setStep('results');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[160] flex justify-end">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}></div>

            <div className="relative w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
                {/* Header */}
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white/50">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-xl transition-transform hover:scale-110 hover:rotate-3">
                            <FileSpreadsheet size={32} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight font-display uppercase leading-tight">Veri Aktarim Sihirbazi</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">HIZLI EXCEL & CSV İŞLEME PANELİ</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 bg-white rounded-2xl text-slate-400 hover:text-slate-600 shadow-sm transition-colors border border-slate-100">
                        <XCircle size={32} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-10 scrollbar-hide">
                    {step === 'upload' && (
                        <div className="flex flex-col items-center py-10 space-y-12">
                            <label
                                className="w-full cursor-pointer group"
                                onDragOver={handleDrag}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDrop={handleDrop}
                            >
                                <div className={`border-4 border-dashed rounded-[3rem] p-16 flex flex-col items-center gap-8 transition-all duration-300 hover:shadow-2xl ${isDragging ? 'border-brand-primary bg-brand-primary/10 scale-[1.02]' : 'border-slate-100 bg-slate-50/50 group-hover:border-brand-primary group-hover:bg-brand-primary/5'}`}>
                                    <div className="w-24 h-24 bg-white rounded-[2.5rem] shadow-2xl flex items-center justify-center text-slate-400 group-hover:scale-125 group-hover:rotate-12 group-hover:text-brand-primary transition-all duration-300">
                                        <Upload size={48} />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-black text-slate-900 tracking-tight font-display mb-3">DOSYAYI BURAYA BIRAKIN</p>
                                        <p className="text-sm font-medium text-slate-400 mb-6 uppercase tracking-widest">veya tıklayarak bilgisayarınızdan seçin</p>
                                        <div className="inline-flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-lg">
                                            <Download size={16} className="text-brand-primary" />
                                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Format: .xlsx, .xls, .csv</span>
                                        </div>
                                    </div>
                                </div>
                                <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} />
                            </label>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                                {[
                                    { icon: User, label: 'Otomatik', desc: 'Sütun Eşleme', color: 'indigo' },
                                    { icon: Search, label: 'Mükerrer', desc: 'Kayıt Analizi', color: 'amber' },
                                    { icon: Zap, label: 'Anlık', desc: 'Veri Aktarımı', color: 'emerald' }
                                ].map((item, idx) => (
                                    <div key={idx} className="text-center p-6 border-2 border-slate-50 rounded-[2rem] bg-white transition-all hover:border-brand-primary/20 hover:shadow-xl hover:-translate-y-1">
                                        <div className={`w-12 h-12 bg-${item.color}-50 text-${item.color}-500 rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                                            <item.icon size={24} />
                                        </div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.desc}</p>
                                        <p className="text-xs font-black text-slate-800 mt-1 uppercase">{item.label}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="w-full bg-slate-900 p-8 rounded-[2.5rem] relative overflow-hidden group shadow-2xl">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-brand-primary/20 transition-all"></div>
                                <h4 className="text-[10px] font-black text-brand-primary uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                    <Info size={14} /> ŞABLON STANDARTLARI
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    {['Abone Bilgisi', 'Telefon', 'Adres', 'Ürün', 'Adet', 'Eski No', 'İşletme', 'Notlar'].map(field => (
                                        <div key={field} className="flex items-center gap-3 text-white/60">
                                            <div className="w-1.5 h-1.5 rounded-full bg-brand-primary"></div>
                                            <span className="text-[11px] font-black uppercase tracking-widest">{field}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'preview' && (
                        <div className="space-y-10 animate-in slide-in-from-right duration-300">
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { val: stats.total, label: 'OKUNAN', sub: 'TOPLAM KAYIT', color: 'slate', icon: FileSpreadsheet },
                                    { val: stats.duplicates, label: 'MÜKERRER', sub: 'ATLANACAK', color: 'amber', icon: AlertTriangle },
                                    { val: stats.new, label: 'YENİ', sub: 'EKLENECEK', color: 'emerald', icon: CheckCircle }
                                ].map((s, idx) => (
                                    <div key={idx} className={`p-6 rounded-[2rem] border-2 border-${s.color}-100 bg-${s.color}-50/30 transition-all hover:scale-[1.02]`}>
                                        <div className="flex justify-between items-start mb-4">
                                            <div className={`p-3 bg-${s.color}-100 rounded-xl text-${s.color}-600`}>
                                                <s.icon size={20} />
                                            </div>
                                            <span className={`text-[9px] font-black bg-${s.color}-100 px-3 py-1 rounded-full text-${s.color}-600 uppercase tracking-widest`}>{s.label}</span>
                                        </div>
                                        <h4 className={`text-3xl font-black text-${s.color}-900 font-display`}>{s.val}</h4>
                                        <p className={`text-[9px] font-black text-${s.color}-400 mt-1 uppercase tracking-widest`}>{s.sub}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="premium-card overflow-hidden rounded-[2.5rem] border-2 border-slate-100">
                                <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">VERİ ÖNİZLEME (İLK 10 KAYIT)</h5>
                                    <div className="flex items-center gap-2 text-[10px] font-black text-brand-primary bg-brand-primary/10 px-4 py-2 rounded-xl border border-brand-primary/20 uppercase tracking-[0.2em]">
                                        <ShieldCheck size={14} /> ANALİZ TAMAMLANDI
                                    </div>
                                </div>
                                <div className="max-h-[400px] overflow-y-auto overflow-x-auto scrollbar-hide">
                                    <table className="w-full text-left">
                                        <thead className="bg-white border-b border-slate-100 text-[10px] uppercase font-black tracking-widest text-slate-400 sticky top-0 z-10">
                                            <tr>
                                                <th className="px-8 py-5">ABONE BİLGİSİ</th>
                                                <th className="px-8 py-5">TELEFON</th>
                                                <th className="px-8 py-5">ADRES</th>
                                                <th className="px-8 py-5">ÜRÜN</th>
                                                <th className="px-8 py-5">ADET</th>
                                                <th className="px-8 py-5">İŞLETME</th>
                                                <th className="px-8 py-5">NOT</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100/50 bg-white">
                                            {data.slice(0, 10).map((row, i) => (
                                                <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="px-8 py-5 text-[11px] font-black text-slate-900 group-hover:text-brand-primary transition-colors">{row.name}</td>
                                                    <td className="px-8 py-5 text-[11px] font-bold text-slate-500">{row.phone}</td>
                                                    <td className="px-8 py-5 text-[10px] font-bold text-slate-400 truncate max-w-[150px]">{row.address}</td>
                                                    <td className="px-8 py-5 text-[11px] font-bold text-slate-600 uppercase tracking-wider">{row.product}</td>
                                                    <td className="px-8 py-5 text-[11px] font-black text-slate-900">{row.quantity}</td>
                                                    <td className="px-8 py-5">
                                                        {row.isCorporate ? (
                                                            <span className="text-[9px] font-black bg-emerald-100 text-emerald-600 px-3 py-1.5 rounded-lg uppercase tracking-widest">KURUMSAL</span>
                                                        ) : (
                                                            <span className="text-[9px] font-black bg-slate-50 text-slate-300 px-3 py-1.5 rounded-lg uppercase tracking-widest">BİREYSEL</span>
                                                        )}
                                                    </td>
                                                    <td className="px-8 py-5 text-[10px] font-bold text-slate-400 max-w-[180px]">
                                                        <span className="line-clamp-2 break-words">{row.notes || '-'}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    onClick={() => setStep('upload')}
                                    className="flex-1 py-7 border-2 border-slate-100 rounded-[2rem] font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all active:scale-95 shadow-lg"
                                >
                                    FARKLI DOSYA SEÇ
                                </button>
                                <button
                                    onClick={handleProcessImport}
                                    className="flex-[2] py-7 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-brand-primary transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-4"
                                >
                                    <ShieldCheck size={24} />
                                    {stats.new} KAYDI SİSTEME AKTAR
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'results' && (
                        <div className="flex flex-col items-center py-20 text-center animate-in zoom-in duration-300">
                            <div className="w-48 h-48 bg-emerald-50 text-emerald-500 rounded-[4rem] flex items-center justify-center mb-12 shadow-2xl relative group">
                                <CheckCircle size={96} className="group-hover:scale-110 transition-transform" />
                                <div className="absolute -top-6 -right-6 w-16 h-16 bg-white rounded-full border-8 border-emerald-500 flex items-center justify-center text-emerald-500 font-black text-2xl shadow-xl">
                                    ✓
                                </div>
                            </div>
                            <h3 className="text-4xl font-black text-slate-900 tracking-tight font-display mb-6 uppercase leading-tight">YENİ ÜYELERİNİZ<br />SİSTEME DAHİL EDİLDİ!</h3>
                            <div className="bg-slate-50 p-8 rounded-[2.5rem] border-2 border-slate-100 max-w-sm mb-12 shadow-inner">
                                <p className="text-slate-500 font-bold leading-relaxed">
                                    <span className="text-emerald-600 text-xl font-black block mb-2">{stats.new} Yeni Abone</span>
                                    Kaydı başarıyla tamamlandı. Mükerrer olan {stats.duplicates} kayıt korunarak atlandı.
                                </p>
                            </div>
                                <button
                                    onClick={onClose}
                                    className="w-full max-w-sm py-8 bg-slate-900 text-white rounded-[2.5rem] font-black text-sm uppercase tracking-[0.3em] hover:bg-brand-primary transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-4 group"
                                >
                                    <Zap size={24} /> KONTROL PANELİNE DÖN <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
                                </button>
                        </div>
                    )}
                </div>

                {isLoading && (
                    <div className="absolute inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                        <div className="flex flex-col items-center gap-8">
                            <div className="relative">
                                <div className="w-24 h-24 border-8 border-white/20 border-t-brand-primary rounded-full animate-spin" />
                                <FileSpreadsheet className="absolute inset-0 m-auto text-white" size={32} />
                            </div>
                            <div className="text-center">
                                <p className="text-white font-black tracking-[0.3em] uppercase text-sm mb-2">VERİLER İŞLENİYOR</p>
                                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Lütfen tarayıcıyı kapatmayın...</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExcelImportDrawer;




