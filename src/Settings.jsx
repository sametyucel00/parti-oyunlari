import React, { useState } from 'react';
import { Settings as SettingsIcon, Building2, Bell, Globe, Banknote, Shield, Save, User as UserIcon, Mail, Phone, MapPin, DatabaseBackup, RefreshCw, HelpCircle, Lock, Monitor, Hash, Cpu, Truck, Eye, EyeOff, Navigation } from 'lucide-react';
import { updateUserInFirestore } from '../services/firestoreService';
import useStore from '../store/useStore';
import { safeGetItem, safeSetItem } from '../utils/safeStorage';


const Settings = ({ user, onLogout }) => {
    const { couriers } = useStore();
    const [activeTab, setActiveTab] = useState('profile');
    const [isSaving, setIsSaving] = useState(false);
    const [visiblePasswords, setVisiblePasswords] = useState({});

    const [autoBackupEnabled, setAutoBackupEnabled] = useState(user?.settings?.autoBackupEnabled ?? true);
    const [preferences, setPreferences] = useState({
        email: user?.settings?.emailNotifications ?? false,
        sms: user?.settings?.smsNotifications ?? false,
        soundAlerts: user?.settings?.soundAlerts ?? true
    });
    const lastBackupDate = user?.settings?.lastBackupDate || 'Henüz Yedek Alınmadı';

    const [saveStatus, setSaveStatus] = useState(null); // 'success', 'error', null
    const [confirmFreeze, setConfirmFreeze] = useState(false);
    const [confirmActionId, setConfirmActionId] = useState(null); // 'wpLogout', 'restoreBackup', 'logoutAll'

    // Auth & Security States
    const [password, setPassword] = useState(user?.password || '');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [securityQuestion, setSecurityQuestion] = useState(user?.securityQuestion || '');
    const [securityAnswer, setSecurityAnswer] = useState(user?.securityAnswer || '');
    const [inputQuestion, setInputQuestion] = useState('');
    const [inputAnswer, setInputAnswer] = useState('');
    const [name, setName] = useState(user?.name || '');
    const [zoomLevel, setZoomLevel] = useState(user?.settings?.zoomLevel || '100');
    const [phone, setPhone] = useState(user?.phone || '');
    const [address, setAddress] = useState(user?.address || '');

    const [wpStatus, setWpStatus] = useState('NOT_INITIALIZED');
    const [wpQr, setWpQr] = useState(null);
    const businessId = user?.role === 'admin' ? user?.id : (user?.businessId || 'default_business');

    // Sync local states when user prop changes from store (e.g. after successful sync)
    React.useEffect(() => {
        if (user) {
            setName(user.name || '');
            setPhone(user.phone || '');
            setAddress(user.address || '');
            setZoomLevel(user.settings?.zoomLevel || '100');
            setPassword(user.password || '');
            setSecurityQuestion(user.securityQuestion || '');
            setSecurityAnswer(user.securityAnswer || '');
            setPreferences({
                email: user.settings?.emailNotifications ?? false,
                sms: user.settings?.smsNotifications ?? false,
                soundAlerts: user.settings?.soundAlerts ?? true
            });
            setAutoBackupEnabled(user.settings?.autoBackupEnabled ?? true);
        }
    }, [user]);

    React.useEffect(() => {
        let interval;
        if (activeTab === 'system' && preferences.sms) {
            const checkStatus = () => {
                fetch(`${import.meta.env.VITE_API_URL}/api/whatsapp/status?clientId=${businessId}`)
                    .then(res => res.json())
                    .then(data => {
                        setWpStatus(data.status);
                        if (data.qr) setWpQr(data.qr);

                        if (data.status === 'NOT_INITIALIZED' || data.status === 'OFFLINE_HAS_SESSION') {
                            setWpStatus('INITIALIZING');
                            fetch(`${import.meta.env.VITE_API_URL}/api/whatsapp/init`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ clientId: businessId })
                            }).catch(() => setWpStatus('SERVER_DOWN'));
                        }
                    }).catch(() => setWpStatus('SERVER_DOWN'));
            };
            checkStatus();
            interval = setInterval(checkStatus, 3000);
        }
        return () => clearInterval(interval);
    }, [activeTab, preferences.sms, businessId]);

    const handleToggleBackup = async () => {
        const newValue = !autoBackupEnabled;
        setAutoBackupEnabled(newValue);
        if (user?.id) {
            await useStore.getState().updateUserSettings({
                "settings.autoBackupEnabled": newValue
            });
        }
    };

    const handleTogglePreference = async (key, currentVal) => {
        const newVal = !currentVal;
        const updatedPrefs = { ...preferences, [key]: newVal };
        setPreferences(updatedPrefs);

        if (user?.id) {
            const updateField = key === 'email' ? 'emailNotifications' :
                key === 'sms' ? 'smsNotifications' :
                    key;

            await useStore.getState().updateUserSettings({
                [`settings.${updateField}`]: newVal
            });
        }

        if (newVal) {
            if (key === 'email') {
                useStore.getState().addNotification("E-posta Bildirimleri Aktif Edildi!", "success");
            }
        }
    };

    const handleWpInit = () => {
        setWpStatus('INITIALIZING');
        fetch(`${import.meta.env.VITE_API_URL}/api/whatsapp/init`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientId: businessId })
        }).catch(() => setWpStatus('SERVER_DOWN'));
    };

    const handleWpLogout = () => {
        if (confirmActionId === 'wpLogout') {
            setWpStatus('NOT_INITIALIZED');
            setWpQr(null);
            fetch(`${import.meta.env.VITE_API_URL}/api/whatsapp/logout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clientId: businessId })
            }).catch(() => setWpStatus('SERVER_DOWN'));
            setConfirmActionId(null);
            useStore.getState().addNotification("WhatsApp bağlantısı kesildi.", "info");
        } else {
            setConfirmActionId('wpLogout');
            useStore.getState().addNotification("WhatsApp bağlantısını kesmek için tekrar tıklayın.", "warning");
            setTimeout(() => setConfirmActionId(null), 3000);
        }
    };

    const handleZoomChange = async (level) => {
        setZoomLevel(level);
        document.body.style.zoom = `${level}%`;
        if (level === '75') {
            document.body.classList.add('zoom-75');
        } else {
            document.body.classList.remove('zoom-75');
        }

        if (user?.id) {
            await useStore.getState().updateUserSettings({
                "settings.zoomLevel": level
            });
        }
    };

    const handleRestoreBackup = () => {
        const backupData = safeGetItem('bayios-auto-backup');
        if (!backupData) {
            useStore.getState().addNotification("Sistemde kayıtlı bir yedek bulunmuyor.", "error");
            return;
        }

        if (confirmActionId === 'restoreBackup') {
            safeSetItem('bayios-storage', backupData);
            useStore.getState().addNotification("Yedek başarıyla geri yüklendi. Sayfa yenileniyor...", "success");
            setConfirmActionId(null);
            setTimeout(() => window.location.reload(), 1500);
        } else {
            setConfirmActionId('restoreBackup');
            useStore.getState().addNotification("Verileri geri yüklemek için tekrar tıklayın. DİKKAT: Mevcut verileriniz silinecektir!", "warning");
            setTimeout(() => setConfirmActionId(null), 4000);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveStatus(null);
        try {
            if (user?.id === 'demo-admin-id' || user?.id === 'demo-courier-id' || user?.id === 'demo-customer-id') {
                throw new Error("Demo hesap bilgilerini güncelleyemezsiniz. Lütfen kendi hesabınızı oluşturun.");
            }

            if (newPassword && newPassword !== confirmPassword) {
                throw new Error("Yeni parolalar eşleşmiyor!");
            }

            const finalQuestion = inputQuestion || securityQuestion;
            const finalAnswer = inputAnswer || securityAnswer;

            const updateData = {
                name,
                phone,
                address,
                password: newPassword || password,
                securityQuestion: finalQuestion,
                securityAnswer: finalAnswer ? finalAnswer.toLowerCase().trim() : '',
                "settings.emailNotifications": preferences.email,
                "settings.smsNotifications": preferences.sms,
                "settings.autoBackupEnabled": autoBackupEnabled,
                "settings.zoomLevel": zoomLevel,
                "settings.soundAlerts": preferences.soundAlerts
            };

            if (user?.id) {
                // Use the store action for better state management
                await useStore.getState().updateUserSettings(updateData);
                
                // Extra sync for RTDB if it's an admin changing their business phone
                if (user.role === 'admin') {
                    const { rtdb } = await import('../lib/firebase');
                    const { ref, update } = await import('firebase/database');
                    try {
                        await update(ref(rtdb, `active_calls/${user.id}`), {
                            businessPhone: phone
                        });
                    } catch (rtdbErr) {
                        console.error("RTDB sync error:", rtdbErr);
                    }
                }

                setSaveStatus('success');
                useStore.getState().addNotification("Ayarlar başarıyla güncellendi.", "success");
                setNewPassword('');
                setConfirmPassword('');
                setInputQuestion('');
                setInputAnswer('');
                
                setTimeout(() => setSaveStatus(null), 3000);
            }
        } catch (error) {
            console.error(error);
            useStore.getState().addNotification(error.message || "Kaydedilirken bir hata oluştu.", "error");
            setSaveStatus('error');
            setTimeout(() => setSaveStatus(null), 3000);
        } finally {
            setIsSaving(false);
        }
    };

    const handleFreezeAccount = () => {
        setConfirmFreeze(true);
    };

    const executeFreezeAccount = async () => {
        setIsSaving(true);
        try {
            if (user?.id) {
                await updateUserInFirestore(user.id, { isFrozen: true, frozenAt: new Date().toISOString() });
                useStore.getState().addNotification("Hesabınız donduruldu. Oturum kapatılıyor...", "info");
                setTimeout(() => { if (onLogout) onLogout(); }, 2000);
            }
        } catch (error) {
            console.error(error);
            useStore.getState().addNotification("Hesap dondurulurken bir hata oluştu.", "error");
            setConfirmFreeze(false);
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogoutAllDevices = () => {
        if (confirmActionId === 'logoutAll') {
            if (onLogout) onLogout();
            setConfirmActionId(null);
        } else {
            setConfirmActionId('logoutAll');
            useStore.getState().addNotification("Tüm cihazlardan çıkış yapmak için tekrar tıklayın.", "warning");
            setTimeout(() => setConfirmActionId(null), 3000);
        }
    };

    const isCustomer = user?.role === 'customer';

    const tabs = [
        { id: 'profile', label: isCustomer ? 'Profil Bilgilerim' : 'İşletme Profili', icon: Building2 },
        ...(!isCustomer ? [{ id: 'couriers', label: 'Kurye Yönetimi', icon: Truck }] : []),
        { id: 'system', label: 'Sistem Tercihleri', icon: SettingsIcon },
        { id: 'security', label: 'Güvenlik', icon: Shield },
    ];

    return (
        <div className="p-4 md:p-8 bg-slate-50 min-h-screen pb-24 md:pb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight font-display">Sistem Ayarları</h1>
                    <p className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-widest mt-1">Konfigürasyon ve Profil Yönetimi</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="flex-1 md:min-w-[120px] flex justify-end">
                        {saveStatus === 'success' && (
                            <span className="block text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border border-emerald-100 animate-in fade-in slide-in-from-right-4">
                                Kaydedildi ✅
                            </span>
                        )}
                        {saveStatus === 'error' && (
                            <span className="block text-rose-600 bg-rose-50 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border border-rose-100 animate-in shake">
                                Hata ❌
                            </span>
                        )}
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-slate-900 text-white px-5 py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-brand-primary shadow-lg shadow-slate-900/10 font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-70 whitespace-nowrap"
                    >
                        {isSaving ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Save size={16} /> KAYDET
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-8">
                <div className="lg:col-span-1">
                    <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-4 lg:pb-0 scrollbar-hide sticky lg:top-8 z-20 bg-slate-50 lg:bg-transparent -mx-4 px-4 lg:-mx-0 lg:px-0">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`shrink-0 flex items-center gap-3 lg:gap-4 px-5 lg:px-5 py-3 lg:py-4 rounded-xl lg:rounded-2xl transition-all font-black text-[9px] lg:text-[10px] uppercase tracking-widest ${activeTab === tab.id
                                    ? 'bg-slate-900 text-white shadow-lg lg:shadow-xl shadow-slate-900/20'
                                    : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50 hover:border-slate-200'
                                    }`}
                            >
                                <tab.icon size={18} className={`transition-colors ${activeTab === tab.id ? 'text-white' : 'text-slate-300'}`} />
                                <span className="whitespace-nowrap">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="lg:col-span-3">
                    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-5 md:p-8">
                        <>
                        {activeTab === 'profile' && (
                            <div className="space-y-8 animate-in fade-in duration-200">
                                <div>
                                    <h3 className="text-lg font-black text-slate-800 mb-6 uppercase tracking-widest text-xs">
                                        {isCustomer ? 'Kişisel Bilgiler' : 'İşletme Bilgileri'}
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                                {isCustomer ? 'Ad Soyad' : 'Bayi Adı'}
                                            </label>
                                            <div className="relative group">
                                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500" size={18} />
                                                <input
                                                    type="text"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3.5 pl-12 pr-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Telefon</label>
                                            <div className="relative group">
                                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500" size={18} />
                                                <input
                                                    type="tel"
                                                    value={phone}
                                                    onChange={(e) => setPhone(e.target.value)}
                                                    placeholder="Telefon numarası eklenmemiş"
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3.5 pl-12 pr-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                                />
                                            </div>
                                        </div>
                                        <div className="md:col-span-2 space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Adres</label>
                                            <div className="relative group">
                                                <MapPin className="absolute left-4 top-4 text-slate-400 group-focus-within:text-blue-500" size={18} />
                                                <textarea
                                                    rows="3"
                                                    value={address}
                                                    onChange={(e) => setAddress(e.target.value)}
                                                    placeholder="Adres bilgisi eklenmemiş"
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3.5 pl-12 pr-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                                                ></textarea>
                                            </div>
                                            {!isCustomer && (
                                                <button
                                                    onClick={() => {
                                                        if (navigator.geolocation) {
                                                            navigator.geolocation.getCurrentPosition(async (pos) => {
                                                                const { latitude, longitude } = pos.coords;
                                                                if (user?.id) {
                                                                    const { updateLocationInFirestore } = await import('../services/firestoreService');
                                                                    await updateLocationInFirestore(user.id, latitude, longitude);
                                                                    useStore.getState().addNotification("İşletme konumu GPS üzerinden güncellendi!", "success");
                                                                }
                                                            }, (err) => {
                                                                useStore.getState().addNotification("Konum alınamadı: " + err.message, "error");
                                                            }, { enableHighAccuracy: true });
                                                        }
                                                    }}
                                                    className="mt-2 flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-100 hover:bg-blue-600 hover:text-white transition-all w-full sm:w-auto justify-center"
                                                >
                                                    <Navigation size={14} /> ŞU ANKI KONUMU İŞLETME KONUMU YAP
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Business ID Section for Caller ID */}
                                {!isCustomer && (
                                    <div className="pt-8 border-t border-slate-50">
                                        <div className="flex items-center gap-2 mb-4">
                                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest text-xs">Arayan Kimliği (Caller ID) Bilgileri</h3>
                                            <div className="group relative">
                                                <HelpCircle size={14} className="text-slate-400 cursor-help" />
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-900 text-white text-[10px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl leading-relaxed">
                                                    Bu kimlik numarası (ID), Caller ID cihazınızın veya yönlendirme uygulamanızın çağrıları doğru şubeye iletmesini sağlar.
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-blue-50 flex items-center justify-center text-blue-500">
                                                    <Hash size={24} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none mb-1">İŞLETME KİMLİK NUMARASI (ID)</p>
                                                    <p className="font-mono font-bold text-slate-700 text-lg tracking-wider">{businessId}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(businessId);
                                                        useStore.getState().addNotification("İşletme ID kopyalandı!", "info");
                                                    }}
                                                    className="px-6 py-3 bg-white text-blue-600 border border-blue-100 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95 flex items-center gap-2"
                                                >
                                                    Kopyala
                                                </button>
                                            </div>
                                        </div>
                                        <p className="mt-3 text-[10px] text-slate-400 font-medium px-1">
                                            * Caller ID cihazınıza bu kodu tanıtarak sadece kendi şubenizin çağrılarını alabilirsiniz. 
                                        </p>
                                    </div>
                                )}

                                <div className="pt-8 border-t border-slate-50">
                                    <h3 className="text-lg font-black text-slate-800 mb-6 uppercase tracking-widest text-xs">Hesap {isCustomer ? 'Detayları' : 'Yöneticisi'}</h3>
                                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="w-16 h-16 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-400">
                                            <UserIcon size={24} />
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-800 text-sm">{user?.name || (isCustomer ? 'Müşteri' : 'Yönetici')}</p>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{user?.role === 'customer' ? 'Müşteri Hesabı' : user?.role}</p>
                                        </div>
                                        <div className="ml-auto relative w-full sm:w-auto">
                                            <input
                                                type="file"
                                                id="profile-upload"
                                                className="sr-only"
                                                accept="image/*"
                                                onChange={(e) => { if (e.target.files?.[0]) useStore.getState().addNotification("Yeni profil fotoğrafı seçildi: " + e.target.files[0].name, "info"); }}
                                            />
                                            <label
                                                htmlFor="profile-upload"
                                                className="cursor-pointer flex items-center justify-center px-4 py-3 bg-slate-900 text-white hover:bg-blue-600 rounded-xl transition-all shadow-lg shadow-slate-900/10 font-black text-[9px] uppercase tracking-widest active:scale-95 w-full sm:w-auto"
                                            >
                                                FOTOĞRAF DEĞİŞTİR
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'couriers' && !isCustomer && (
                            <div className="space-y-8 animate-in fade-in duration-200">
                                <div>
                                    <h3 className="text-lg font-black text-slate-800 mb-6 uppercase tracking-widest text-xs">Kurye Erişim Bilgileri</h3>
                                    <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-3xl mb-8 flex items-start gap-4">
                                        <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white shrink-0 mt-1">
                                            <Shield size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-blue-900 tracking-tight leading-tight">Güvenlik Uyarısı</p>
                                            <p className="text-[10px] text-blue-600 font-bold mt-1">
                                                Aşağıdaki bilgiler kuryelerinizin sisteme giriş yapabilmesi için gereklidir. Lütfen bu bilgileri sadece ilgili kurye ile paylaşın.
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {couriers.map(courier => (
                                            <div key={courier.id} className="p-6 bg-slate-50 border border-slate-100 rounded-3xl hover:border-slate-300 transition-all flex flex-col gap-4 group relative overflow-hidden">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-800 shadow-sm border border-slate-100">
                                                        <Truck size={20} />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-slate-900 text-sm tracking-tight">{courier.name}</h4>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{courier.vehicle}</p>
                                                    </div>
                                                </div>
                                                <div className="space-y-3 pt-3 border-t border-slate-200">
                                                    <div>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 mb-1">Kullanıcı Adı</p>
                                                        <div className="bg-white/60 p-3 rounded-xl border border-slate-200 font-mono text-sm font-black tracking-wider text-slate-700">
                                                            {courier.username || 'Henüz atanmadı'}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="flex justify-between items-center mb-1 px-1">
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Şifre</p>
                                                            {courier.password && (
                                                                <button 
                                                                    onClick={() => setVisiblePasswords({...visiblePasswords, [courier.id]: !visiblePasswords[courier.id]})}
                                                                    className="text-slate-400 hover:text-blue-500 transition-colors"
                                                                >
                                                                    {visiblePasswords[courier.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                                                                </button>
                                                            )}
                                                        </div>
                                                        <div className="bg-white/60 p-3 rounded-xl border border-slate-200 font-mono text-sm font-black tracking-wider text-slate-700">
                                                            {courier.password ? 
                                                                (visiblePasswords[courier.id] ? courier.password : '••••••••') : 
                                                                'Henüz atanmadı (Yeni sürüm öncesi kurye olabilir)'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        
                                        {couriers.length === 0 && (
                                            <div className="col-span-full py-10 text-center text-slate-400">
                                                <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                                    <Truck size={28} className="text-slate-300" />
                                                </div>
                                                <p className="text-sm font-black uppercase tracking-widest">Kayıtlı Kurye Bulunamadı</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'system' && (
                            <div className="space-y-8 animate-in fade-in duration-200">
                                <div>
                                    <h3 className="text-lg font-black text-slate-800 mb-6 uppercase tracking-widest text-xs">Uygulama Tercihleri</h3>
                                    <div className="space-y-4">
                                        {[
                                            { id: 'email', label: 'E-posta Bildirimleri', desc: isCustomer ? 'Siparişlerinizle ilgili güncellemeler e-posta ile gelsin.' : 'Yeni sipariş ve stok uyarıları e-posta ile gelsin.', icon: Mail },
                                            { id: 'sms', label: 'WhatsApp Uyarıları', desc: isCustomer ? 'Sipariş durumunuz WhatsApp üzerinden bildirilsin.' : 'Müşterilere teslimat anında WhatsApp mesajı gönderilsin.', icon: Phone },
                                            { id: 'soundAlerts', label: 'Sesli Uyarılar', desc: 'Yeni bildirimlerde ve görevlerde sesli uyarı verilsin.', icon: Bell }
                                        ].map((item) => (
                                            <div key={item.id} className="flex justify-between items-center p-4 hover:bg-slate-50 rounded-2xl transition-colors group">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-blue-500 transition-all">
                                                        <item.icon size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800 text-sm">{item.label}</p>
                                                        <p className="text-[10px] text-slate-500 font-medium">{item.desc}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleTogglePreference(item.id, preferences[item.id])}
                                                    className={`w-12 h-6 rounded-full relative transition-colors ${preferences[item.id] ? 'bg-blue-500' : 'bg-slate-200'}`}
                                                >
                                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${preferences[item.id] ? 'left-7' : 'left-1'}`}></div>
                                                </button>
                                            </div>
                                        ))}

                                        {!isCustomer && (
                                            <>
                                                {/* WhatsApp Quick Link Render */}
                                                {preferences.sms && (
                                                    <div className="pt-8 mt-8 border-t border-slate-50">
                                                        <h3 className="text-lg font-black text-slate-800 mb-6 uppercase tracking-widest text-xs">WhatsApp Bağlantısı</h3>
                                                        <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-6 animate-in fade-in slide-in-from-top-4">
                                                            <div>
                                                                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2"><Phone size={18} className="text-emerald-500" /> WhatsApp Bağlantı Durumu</h4>
                                                                <p className="text-[10px] text-slate-500 font-medium mt-1 max-w-sm">
                                                                    Müşterilerinize otomatik mesaj gidebilmesi için işletme veya kurye numaranızı doğrudan okutunuz.
                                                                </p>
                                                                <div className="mt-4">
                                                                    {wpStatus === 'READY' ? (
                                                                        <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-xl border border-emerald-200 text-[10px] font-black tracking-widest uppercase">Bağlantı Kuruldu ✅</span>
                                                                    ) : wpStatus === 'QR_READY' ? (
                                                                        <span className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-xl border border-amber-200 text-[10px] font-black tracking-widest uppercase animate-pulse">QR Kodu Okutun 📲</span>
                                                                    ) : wpStatus === 'INITIALIZING' ? (
                                                                        <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-xl border border-blue-200 text-[10px] font-black tracking-widest uppercase flex items-center gap-2 w-max animate-pulse">Sunucu Hazırlanıyor <RefreshCw size={12} className="animate-spin" /></span>
                                                                    ) : wpStatus === 'SERVER_DOWN' ? (
                                                                        <span className="px-3 py-1.5 bg-rose-100 text-rose-700 rounded-xl border border-rose-200 text-[10px] font-black tracking-widest uppercase">Servis Çevrimdışı ❌</span>
                                                                    ) : wpStatus === 'OFFLINE_HAS_SESSION' ? (
                                                                        <span className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-xl border border-indigo-200 text-[10px] font-black tracking-widest uppercase">Oturum Yükleniyor...</span>
                                                                    ) : (
                                                                        <span className="px-3 py-1.5 bg-slate-200 text-slate-600 rounded-xl border border-slate-300 text-[10px] font-black tracking-widest uppercase">Bağlantı Bekleniyor</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex-shrink-0 flex flex-col items-center">
                                                                {wpStatus === 'QR_READY' && wpQr ? (
                                                                    <div className="bg-white p-2 border-2 border-slate-100 rounded-3xl shadow-lg shadow-slate-200/50 relative group hover:border-brand-primary transition-colors">
                                                                        <img src={wpQr} alt="WhatsApp QR Code" className="w-44 h-44 rounded-xl" />
                                                                        <p className="text-[10px] font-bold text-center text-slate-500 mt-2 bg-slate-50 p-2 rounded-xl">Telefonunuzdan "Bağlı Cihazlar"<br />kısmını açıp taratın.</p>
                                                                        <div className="absolute inset-0 bg-white/80 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm cursor-pointer" onClick={handleWpInit}>
                                                                            <button className="text-xs font-black text-slate-800 flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-lg border border-slate-200"><RefreshCw size={14} /> Kodu Yenile</button>
                                                                        </div>
                                                                    </div>
                                                                ) : wpStatus === 'READY' ? (
                                                                    <button onClick={handleWpLogout} className={`px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${confirmActionId === 'wpLogout' ? 'bg-rose-600 text-white shadow-lg' : 'bg-rose-50 border-2 border-rose-100 text-rose-600 hover:bg-rose-100 hover:shadow-lg'}`}>
                                                                        <Phone size={16} /> {confirmActionId === 'wpLogout' ? 'ONAYLA VE KAPAT' : 'Oturumu Kapat'}
                                                                    </button>
                                                                ) : (
                                                                    <div className="flex flex-col items-center justify-center h-44 w-44 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
                                                                        <RefreshCw size={24} className="text-slate-400 animate-spin mb-4" />
                                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center px-4">QR Kod<br />Bekleniyor...</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex justify-between items-center p-4 hover:bg-slate-50 rounded-2xl transition-colors group">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-blue-500 transition-all">
                                                            <DatabaseBackup size={20} />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-800 text-sm">Otomatik Yedekleme</p>
                                                            <p className="text-[10px] text-slate-500 font-medium">Verileriniz her gün otomatik olarak yedeklenir. (1 gün tutulur)</p>
                                                        </div>
                                                    </div>
                                                    <button onClick={handleToggleBackup} className={`w-12 h-6 rounded-full relative transition-colors ${autoBackupEnabled ? 'bg-blue-500' : 'bg-slate-200'}`}>
                                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${autoBackupEnabled ? 'left-7' : 'left-1'}`}></div>
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {!isCustomer && (
                                    <div className="pt-8 border-t border-slate-50">
                                        <h3 className="text-lg font-black text-slate-800 mb-6 uppercase tracking-widest text-xs">Veri Yönetimi</h3>
                                        <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl flex justify-between items-center">
                                            <div>
                                                <p className="font-bold text-slate-800 text-sm">Sistemi Geri Yükle</p>
                                                <p className="text-[10px] text-slate-500 font-medium mt-1">Son yedekleme: <span className="font-bold">{lastBackupDate || 'Yedek Bulunmuyor'}</span></p>
                                            </div>
                                            <button
                                                onClick={handleRestoreBackup}
                                                disabled={!lastBackupDate}
                                                className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${confirmActionId === 'restoreBackup' ? 'bg-rose-600 text-white shadow-lg' : 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100'}`}
                                            >
                                                <RefreshCw size={14} /> {confirmActionId === 'restoreBackup' ? 'ONAYLA VE YÜKLE' : 'GERİ YÜKLE'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="pt-8 border-t border-slate-50">
                                    <h3 className="text-lg font-black text-slate-800 mb-6 uppercase tracking-widest text-xs">Görünüm (Web)</h3>
                                    <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl">
                                        <div className="flex flex-col md:flex-row gap-4">
                                            <button
                                                onClick={() => handleZoomChange('100')}
                                                className={`flex-1 py-4 px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex flex-col items-center gap-2 ${zoomLevel === '100' ? 'bg-slate-900 text-white shadow-xl translate-y-[-2px]' : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-100'}`}
                                            >
                                                <Monitor size={20} className={zoomLevel === '100' ? 'text-blue-400' : 'text-slate-400'} />
                                                Varsayılan (%100)
                                            </button>
                                            <button
                                                onClick={() => handleZoomChange('75')}
                                                className={`flex-1 py-4 px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex flex-col items-center gap-2 ${zoomLevel === '75' ? 'bg-slate-900 text-white shadow-xl translate-y-[-2px]' : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-100'}`}
                                            >
                                                <Monitor size={20} className={zoomLevel === '75' ? 'text-blue-400' : 'text-slate-400'} />
                                                Geniş Ekran (%75)
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-bold mt-4 text-center">
                                            Yüksek çözünürlüklü ekranlar için "Geniş Ekran" modu daha geniş bir portal görünümü sağlar.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="space-y-8 animate-in fade-in duration-200">
                                <div>
                                    <h3 className="text-lg font-black text-slate-800 mb-6 uppercase tracking-widest text-xs">Parola İşlemleri</h3>
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mevcut Parola</label>
                                            <div className="relative group">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                <input
                                                    type="text"
                                                    value={password}
                                                    readOnly
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3.5 pl-12 pr-4 text-sm font-bold text-slate-400 outline-none cursor-not-allowed"
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Yeni Parola</label>
                                                <input
                                                    type="password"
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    className="w-full bg-slate-100/50 border border-slate-200 rounded-xl py-3.5 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
                                                    placeholder="Yeni şifrenizi girin"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Yeni Parola Tekrar</label>
                                                <input
                                                    type="password"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    className="w-full bg-slate-100/50 border border-slate-200 rounded-xl py-3.5 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
                                                    placeholder="Şifreyi onaylayın"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-8 border-t border-slate-100">
                                    <h3 className="text-lg font-black text-blue-600 mb-6 uppercase tracking-widest text-xs">Şifre Kurtarma Ayarları</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2 group">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Güvenlik Sorusu</label>
                                            <div className="relative">
                                                <HelpCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500" size={18} />
                                                <input
                                                    type="text"
                                                    value={inputQuestion}
                                                    onChange={(e) => setInputQuestion(e.target.value)}
                                                    className="w-full bg-blue-50/30 border border-blue-100 rounded-xl py-3.5 pl-12 pr-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400 placeholder:font-bold"
                                                    placeholder={securityQuestion || "Örn: İlk evcil hayvanınızın adı?"}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2 group">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cevap</label>
                                            <div className="relative">
                                                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500" size={18} />
                                                <input
                                                    type="text"
                                                    value={inputAnswer}
                                                    onChange={(e) => setInputAnswer(e.target.value)}
                                                    className="w-full bg-blue-50/30 border border-blue-100 rounded-xl py-3.5 pl-12 pr-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400 placeholder:font-bold"
                                                    placeholder={securityAnswer || "Cevabınız"}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <p className="mt-4 text-[10px] text-slate-500 font-bold leading-relaxed">
                                        Not: Bu bilgiler şifrenizi unuttuğunuzda yeni şifre alabilmeniz için kullanılır. Lütfen unutmayacağınız bir soru ve cevap belirleyin.
                                    </p>
                                </div>
                                <div className="pt-8 border-t border-red-50">
                                    <h3 className="text-lg font-black text-red-600 mb-6 uppercase tracking-widest text-xs">Kritik İşlemler</h3>
                                    <div className="flex flex-col md:flex-row gap-4">
                                        <button
                                            onClick={handleLogoutAllDevices}
                                            className={`flex-1 font-black text-[10px] uppercase tracking-widest py-4 rounded-2xl transition-all border ${confirmActionId === 'logoutAll' ? 'bg-rose-600 text-white border-rose-700 shadow-lg' : 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100'}`}
                                        >
                                            {confirmActionId === 'logoutAll' ? 'ONAYLA VE ÇIKIŞ YAP' : 'Tüm Cihazlardan Çıkış Yap'}
                                        </button>

                                        {confirmFreeze ? (
                                            <div className="flex-1 flex gap-2 animate-in slide-in-from-bottom-2">
                                                <button
                                                    onClick={executeFreezeAccount}
                                                    className="flex-1 bg-red-600 text-white font-black text-[10px] uppercase tracking-widest py-4 rounded-2xl hover:bg-red-700 transition-all shadow-lg"
                                                >
                                                    EVET, DONDUR
                                                </button>
                                                <button
                                                    onClick={() => setConfirmFreeze(false)}
                                                    className="flex-1 bg-slate-100 text-slate-600 font-black text-[10px] uppercase tracking-widest py-4 rounded-2xl hover:bg-slate-200 transition-all"
                                                >
                                                    İPTAL
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={handleFreezeAccount}
                                                className="flex-1 bg-white text-slate-400 font-black text-[10px] uppercase tracking-widest py-4 rounded-2xl hover:bg-slate-50 transition-all border border-slate-100"
                                            >
                                                Hesabı Dondur
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                        </>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
