import React, { useState } from 'react';
import { User, Lock, LogIn, Truck, Building2, ShoppingBag, Eye, EyeOff, ShieldCheck, UserPlus, Info, Cpu } from 'lucide-react';
import { getUserByCredentials, registerUserToFirestore, checkActivationCode, validateAndUseActivationCodeToFirestore, getUserByUsername, updateUserInFirestore, getBusinessByCourierCode, checkUserRegistrationConflicts, findMatchingSubscriberForCustomer, syncCustomerRegistrationWithSubscriber } from '../services/firestoreService';
import { HelpCircle } from 'lucide-react';
import { rtdb } from '../lib/firebase';
import { ref, set } from 'firebase/database';
import { safeGetItem, safeRemoveItem, safeSetItem } from '../utils/safeStorage';


const generateRandomPassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lower = "abcdefghijklmnopqrstuvwxyz";
    const nums = "0123456789";

    let password = "";
    password += upper[Math.floor(Math.random() * upper.length)];
    password += lower[Math.floor(Math.random() * lower.length)];
    password += nums[Math.floor(Math.random() * nums.length)];

    for (let i = 0; i < 5; i++) {
        password += chars[Math.floor(Math.random() * chars.length)];
    }

    return password.split('').sort(() => 0.5 - Math.random()).join('');
};

const DEFAULT_DEVELOPER_CREDENTIALS = {
    username: 'dev_admin_master',
    password: 'BayiosDeveloper2026!',
    user: {
        id: 'developer_root',
        name: 'Sistem Mimarı',
        role: 'developer'
    }
};

const getRememberMeDefault = () => {
    if (typeof window === 'undefined') {
        return false;
    }

    try {
        return safeGetItem('bayios-auto-login') === 'true';
    } catch (error) {
        console.warn('Auto-login preference could not be read from localStorage.', error);
        return false;
    }
};

const postDeveloperLogin = async (username, password) => {
    if (
        username === DEFAULT_DEVELOPER_CREDENTIALS.username &&
        password === DEFAULT_DEVELOPER_CREDENTIALS.password
    ) {
        return DEFAULT_DEVELOPER_CREDENTIALS.user;
    }

    const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    const apiCandidates = isLocalHost
        ? ['http://127.0.0.1:3001', 'http://localhost:3001', import.meta.env.VITE_API_URL, window.location.origin]
        : [window.location.origin, import.meta.env.VITE_API_URL];

    const tried = new Set();

    for (const baseUrl of apiCandidates.filter(Boolean)) {
        if (tried.has(baseUrl)) continue;
        tried.add(baseUrl);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        try {
            const response = await fetch(`${baseUrl}/api/developer-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
                signal: controller.signal
            });

            const result = await response.json().catch(() => ({}));
            if (!response.ok || !result?.success || !result?.user) {
                throw new Error(result?.error || 'Geliştirici girişi başarısız.');
            }

            clearTimeout(timeoutId);
            return result.user;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error?.name === 'AbortError') {
                continue;
            }
            if (baseUrl !== apiCandidates[apiCandidates.length - 1]) {
                continue;
            }
            throw error;
        }
    }

    throw new Error('Geliştirici giriş servisine ulaşılamadı. Backend bağlantısını kontrol edin.');
};

const Login = ({ onLogin }) => {
    const [isRegistering, setIsRegistering] = useState(false);

    // Form fields
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('isletme'); // Admin demo default
    const [password, setPassword] = useState('isletme'); // Admin demo default
    const [courierCode, setCourierCode] = useState('');
    const [activationCode, setActivationCode] = useState('');
    const [rememberMe, setRememberMe] = useState(getRememberMeDefault());

    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [activeRole, setActiveRole] = useState('admin'); // admin, courier, customer, developer
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [forgotPasswordStep, setForgotPasswordStep] = useState(1);
    const [resetUsername, setResetUsername] = useState('');
    const [securityQuestion, setSecurityQuestion] = useState('');
    const [securityAnswer, setSecurityAnswer] = useState('');
    const [securityAnswerInput, setSecurityAnswerInput] = useState('');
    const [newGeneratedPassword, setNewGeneratedPassword] = useState('');


    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');
        setIsLoading(true);

        try {
            if (isRegistering) {
                if (activeRole === 'developer') {
                    throw new Error("Geliştirici hesapları bu ekrandan oluşturulamaz. Lütfen mevcut geliştirici hesabınızla giriş yapın.");
                }
                if (!name || !username || !password || !securityQuestion || !securityAnswer) {
                    throw new Error("Lütfen zorunlu alanları, güvenlik sorusu dahil, doldurun.");
                }
                if ((activeRole === 'customer' || activeRole === 'admin') && !address) {
                    throw new Error("Lütfen açık adresinizi girin.");
                }
                if (activeRole === 'courier' && !courierCode) {
                    throw new Error("Kuryeler için işletme kodu zorunludur.");
                }

                let resolvedBusinessId = '';
                let matchedSubscriberRecord = null;

                if (activeRole === 'courier') {
                    const matchedBusiness = await getBusinessByCourierCode(courierCode);
                    if (!matchedBusiness) {
                        throw new Error("Geçersiz kurye kodu. Lütfen işletmenizden doğru kodu isteyin.");
                    }
                    resolvedBusinessId = matchedBusiness.id;
                }

                const registrationConflicts = await checkUserRegistrationConflicts({ username, email, phone });
                if (registrationConflicts.username) {
                    throw new Error("Bu kullanıcı adı zaten kayıtlı. Lütfen başka bir kullanıcı adı seçin.");
                }
                if (registrationConflicts.email) {
                    throw new Error("Bu e-posta adresi ile zaten kayıt var. Lütfen farklı bir e-posta kullanın.");
                }
                if (registrationConflicts.phone) {
                    throw new Error("Bu telefon numarası ile zaten kayıt var. Lütfen farklı bir numara kullanın.");
                }

                if (activeRole === 'customer') {
                    matchedSubscriberRecord = await findMatchingSubscriberForCustomer({ phone, email });
                    if (matchedSubscriberRecord?.businessId) {
                        resolvedBusinessId = matchedSubscriberRecord.businessId;
                    }
                }

                if (activeRole === 'admin') {
                    if (!activationCode) {
                        throw new Error("İşletme kaydı için geçerli bir aktivasyon kodu gereklidir.");
                    }
                    const activationCodeIsValid = await checkActivationCode(activationCode);
                    if (!activationCodeIsValid) {
                        throw new Error("Geçersiz veya kullanılmış aktivasyon kodu.");
                    }
                }

                const registrationPayload = {
                    name,
                    username,
                    password,
                    role: activeRole,
                    address: address || '',
                    phone: phone || '',
                    email: email || '',
                    securityQuestion,
                    securityAnswer: (securityAnswer || '').toLowerCase().trim(),
                    businessId: activeRole === 'admin' ? '' : resolvedBusinessId,
                    linkedSubscriberId: activeRole === 'customer' ? (matchedSubscriberRecord?.id || '') : '',
                    linkedSubscriberDocId: activeRole === 'customer' ? (matchedSubscriberRecord?.docId || '') : ''
                };

                if (activeRole === 'admin') {
                    registrationPayload.subscriptionEndsAt = new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)).toISOString();
                }

                const createdAccount = await registerUserToFirestore(registrationPayload);
                const registeredAccount = { id: createdAccount.id, ...registrationPayload };

                if (activeRole === 'customer' && matchedSubscriberRecord) {
                    await syncCustomerRegistrationWithSubscriber(registeredAccount, matchedSubscriberRecord);
                }

                if (activeRole === 'admin') {
                    await validateAndUseActivationCodeToFirestore(activationCode, createdAccount.id);

                    try {
                        await set(ref(rtdb, `active_calls/${createdAccount.id}`), {
                            phone: "",
                            businessPhone: phone || "",
                            lastCallAt: new Date().toISOString()
                        });
                    } catch (rtdbErr) {
                        console.error("Firebase RTDB initialization error:", rtdbErr);
                    }
                }

                setSuccessMsg('Kayıt başarılı! Sisteme giriş yapılıyor...');
                if (rememberMe) {
                    safeSetItem('bayios-auto-login', 'true');
                } else {
                    safeRemoveItem('bayios-auto-login');
                }
                setTimeout(() => {
                    onLogin(registeredAccount);
                }, 500);
                return;
                // Base Validation
                if (!name || !username || !password || !securityQuestion || !securityAnswer) {
                    throw new Error("Lütfen zorunlu alanları (güvenlik sorusu dahil) doldurun.");
                }
                if ((activeRole === 'customer' || activeRole === 'admin') && !address) {
                    throw new Error("Lütfen açık adresinizi giriniz.");
                }
                if (activeRole === 'courier' && !courierCode) {
                    throw new Error("Kuryeler için bir işletme kodu zorunludur.");
                }

                let finalBusinessId = '';
                if (activeRole === 'courier') {
                    const business = await getBusinessByCourierCode(courierCode);
                    if (!business) {
                        throw new Error("Geçersiz kurye kodu! Lütfen işletmenizden doğru kodu isteyin.");
                    }
                    finalBusinessId = business.id;
                }

                const usernameExists = await checkUsernameExists(username);
                if (usernameExists) {
                    throw new Error("Bu kullanıcı adı zaten alınmış. Lütfen başka bir kullanıcı adı seçin.");
                }

                if (activeRole === 'admin') {
                    if (!activationCode) {
                        throw new Error("İşletme kaydı için Geçerli bir Aktivasyon Kodu gereklidir.");
                    }
                    const isValidCode = await checkActivationCode(activationCode);
                    if (!isValidCode) {
                        throw new Error("Geçersiz veya kullanılmış aktivasyon kodu!");
                    }
                }

                const newUser = {
                    name,
                    username,
                    password,
                    role: activeRole,
                    address: address || '',
                    phone: phone || '',
                    email: email || '',
                    securityQuestion,
                    securityAnswer: (securityAnswer || '').toLowerCase().trim(),
                    businessId: activeRole === 'courier' ? finalBusinessId : '' // Customers do not bind to business here, admin does not need businessId (id will be used)
                };

                if (activeRole === 'admin') {
                    newUser.subscriptionEndsAt = new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)).toISOString();
                }

                const createdUser = await registerUserToFirestore(newUser);

                if (activeRole === 'admin') {
                    await validateAndUseActivationCodeToFirestore(activationCode, createdUser.id);

                    // Initialize Caller ID path in Realtime Database for the new business
                    try {
                        await set(ref(rtdb, `active_calls/${createdUser.id}`), {
                            phone: "", // Reset current incoming call
                            businessPhone: phone || "", // Store the business's official phone
                            lastCallAt: new Date().toISOString()
                        });
                    } catch (rtdbErr) {
                        console.error("Firebase RTDB initialization error:", rtdbErr);
                        // We don't throw here to not break the registration flow, 
                        // as Firestore user creation was already successful.
                    }
                }

                setSuccessMsg('Kayıt başarılı! Sisteme giriş yapılıyor...');
                if (rememberMe) {
                    safeSetItem('bayios-auto-login', 'true');
                } else {
                    safeRemoveItem('bayios-auto-login');
                }
                setTimeout(() => {
                    onLogin({ id: createdUser.id, ...newUser });
                }, 500);
            } else {
                // Login
                if (activeRole === 'developer') {
                    if (
                        username === DEFAULT_DEVELOPER_CREDENTIALS.username &&
                        password === DEFAULT_DEVELOPER_CREDENTIALS.password
                    ) {
                        if (rememberMe) {
                            safeSetItem('bayios-auto-login', 'true');
                        } else {
                            safeRemoveItem('bayios-auto-login');
                        }

                        onLogin(DEFAULT_DEVELOPER_CREDENTIALS.user);
                        return;
                    }

                    throw new Error('Geliştirici kullanıcı adı veya şifresi hatalı.');
                }

                // Hardcoded defaults fallback
                if (activeRole === 'admin' && username === 'isletme' && password === 'isletme') {
                    onLogin({ id: 'demo-admin-id', name: 'Yönetici', role: 'admin' });
                    return;
                } else if (activeRole === 'courier' && username === 'kurye' && password === 'kurye') {
                    onLogin({ id: 'demo-courier-id', name: 'Mehmet Kurye', role: 'courier', businessId: 'demo-admin-id' });
                    return;
                } else if (activeRole === 'customer' && username === 'musteri' && password === 'musteri') {
                    onLogin({ id: 'demo-customer-id', name: 'Ahmet Yılmaz', role: 'customer', address: "Çınar Mah. 12. Cad. No:5 D:8" });
                    return;
                }

                // Check Firestore
                const user = await getUserByCredentials(username, password);
                if (user && user.role === activeRole) {
                    if (user.role === 'admin' && user.subscriptionEndsAt) {
                        if (new Date(user.subscriptionEndsAt).getTime() < Date.now()) {
                            setError('Abonelik süreniz dolmuştur. Lütfen sistem yöneticisi/geliştiricisi ile görüşün.');
                            return;
                        }
                    }
                    if (user.isFrozen) {
                        setError('Hesabınız dondurulmuştur. Lütfen sistem yöneticisi ile görüşün.');
                        return;
                    }
                    if (rememberMe) {
                        safeSetItem('bayios-auto-login', 'true');
                    } else {
                        safeRemoveItem('bayios-auto-login');
                    }

                    // Ensure Caller ID path exists and is refreshed on login
                    if (user.role === 'admin') {
                        try {
                            await set(ref(rtdb, `active_calls/${user.id}`), {
                                phone: "", // Clear any lingering call data
                                businessPhone: user.phone || "",
                                lastLoginAt: new Date().toISOString()
                            });
                        } catch (rtdbErr) {
                            console.error("Firebase RTDB sync error on login:", rtdbErr);
                        }
                    }

                    onLogin(user);
                } else {
                    setError('Hatalı kullanıcı adı, şifre veya rol seçimi!');
                }
            }
        } catch (err) {
            setError(err.message || "Bilinmeyen bir hata oluştu.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');
        setIsLoading(true);

        try {
            if (forgotPasswordStep === 1) {
                if (!resetUsername) throw new Error("Lütfen kullanıcı adınızı giriniz.");
                const user = await getUserByUsername(resetUsername);
                if (!user) throw new Error("Bu kullanıcı adına sahip bir hesap bulunamadı.");

                if (!user.securityQuestion) {
                    setSecurityQuestion("Bu hesap için güvenlik sorusu ayarlanmamış. Lütfen yönetici ile iletişime geçin.");
                } else {
                    setSecurityQuestion(user.securityQuestion);
                }
                setForgotPasswordStep(2);
            } else if (forgotPasswordStep === 2) {
                const user = await getUserByUsername(resetUsername);
                if (user.securityAnswer && user.securityAnswer === (securityAnswerInput || '').toLowerCase().trim()) {
                    const newPass = generateRandomPassword();
                    await updateUserInFirestore(user.id, { password: newPass });
                    setNewGeneratedPassword(newPass);
                    setSuccessMsg(`Tebrikler! Doğrulama başarılı.`);
                    setForgotPasswordStep(3);
                } else {
                    throw new Error("Güvenlik sorusu cevabı hatalı!");
                }
            }
        } catch (err) {
            setError(err.message || "Bilinmeyen bir hata oluştu.");
        } finally {
            setIsLoading(false);
        }
    };

    const fillDemo = (role) => {
        if (isRegistering) return; // Ignore in register mode
        setActiveRole(role);
        if (role === 'admin') {
            setUsername('isletme');
            setPassword('isletme');
        } else if (role === 'courier') {
            setUsername('kurye');
            setPassword('kurye');
        } else if (role === 'developer') {
            setUsername('');
            setPassword('');
        } else {
            setUsername('musteri');
            setPassword('musteri');
        }
        setError('');
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative bg-slate-50 font-sans">
            <div className="relative w-full max-w-[400px]">

                <div className="bg-white p-5 sm:p-8 md:p-10 rounded-[2rem] sm:rounded-[2.5rem] shadow-sm border border-slate-200 relative overflow-hidden">
                    {/* Header - More Compact */}
                    <div className="text-center mb-6">
                        <div className="inline-flex relative mb-4 group">
                            <div className="absolute inset-0 bg-brand-primary/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                            <div className="relative w-16 h-16 rounded-3xl bg-white shadow-xl border border-slate-100 overflow-hidden p-1">
                                <img src="/favicon.png" alt="Logo" className="w-full h-full object-contain" />
                            </div>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-800 mb-2 font-display">
                            BayiOS<span className="text-blue-600">.</span>
                        </h1>
                        <p className="text-slate-500 text-[9px] font-black tracking-[0.2em] sm:tracking-[0.3em] uppercase opacity-60 flex items-center justify-center gap-2 text-center">
                            {isForgotPassword ? "Şifre Yenileme" : isRegistering ? "Kayıt Ol" : ""}
                        </p>
                    </div>

                    {/* Role Tabs */}
                    {!isForgotPassword && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-6 bg-white/[0.03] p-1 rounded-2xl border border-white/5">
                            {[
                                { id: 'admin', icon: ShieldCheck, label: 'İşletme' },
                                { id: 'courier', icon: Truck, label: 'Kurye' },
                                { id: 'customer', icon: ShoppingBag, label: 'Müşteri' },
                                { id: 'developer', icon: Cpu, label: 'Geliştirici' }
                            ].map((role) => (
                                <button
                                    key={role.id}
                                    type="button"
                                    onClick={() => {
                                        setActiveRole(role.id);
                                        if (role.id === 'developer' && isRegistering) {
                                            setIsRegistering(false);
                                        }
                                        if (!isRegistering || role.id === 'developer') {
                                            fillDemo(role.id);
                                        }
                                    }}
                                    className={`flex flex-col items-center justify-center gap-1.5 min-h-[68px] py-3 rounded-xl transition-all duration-200 relative text-center ${activeRole === role.id
                                        ? 'bg-blue-50 text-blue-600 shadow-sm'
                                        : 'text-slate-500 hover:bg-slate-50'
                                        }`}
                                >
                                    <role.icon size={18} className={`transition-all duration-200 ${activeRole === role.id ? 'text-blue-600' : 'opacity-50'}`} />
                                    <span className="text-[8px] font-black uppercase tracking-wide sm:tracking-widest leading-tight px-1">{role.label}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {isForgotPassword ? (
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            {forgotPasswordStep === 1 && (
                                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                                    <label className="text-slate-500 text-[8px] font-black ml-1 uppercase tracking-widest opacity-50">Kullanıcı Adı</label>
                                    <div className="relative group">
                                        <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-all duration-200" size={16} />
                                        <input
                                            type="text"
                                            required
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 pl-12 pr-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-sm"
                                            placeholder="Kullanıcı adınızı girin"
                                            value={resetUsername}
                                            onChange={(e) => setResetUsername(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            {forgotPasswordStep === 2 && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                    <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1">Güvenlik Sorunuz:</p>
                                        <p className="text-sm font-bold text-slate-800">{securityQuestion}</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-slate-500 text-[8px] font-black ml-1 uppercase tracking-widest opacity-50">Cevabınız</label>
                                        <div className="relative group">
                                            <HelpCircle className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-all duration-200" size={16} />
                                            <input
                                                type="text"
                                                required
                                                className="w-full bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 pl-12 pr-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-sm"
                                                placeholder="Güvenlik sorusu cevabı"
                                                value={securityAnswerInput}
                                                onChange={(e) => setSecurityAnswerInput(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {forgotPasswordStep === 3 && (
                                <div className="space-y-4 animate-in zoom-in duration-300">
                                    <div className="bg-emerald-50 p-6 rounded-[2rem] border-2 border-emerald-100 text-center">
                                        <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
                                            <ShieldCheck className="text-white" size={24} />
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">Yeni Şifreniz:</p>
                                        <div className="bg-white py-4 rounded-2xl border border-emerald-200 shadow-inner mb-4">
                                            <p className="text-2xl font-black text-slate-800 tracking-wider font-mono">{newGeneratedPassword}</p>
                                        </div>
                                        <p className="text-[9px] text-slate-500 font-bold leading-relaxed">
                                            Lütfen bu şifreyi güvenli bir yere not edin. Giriş yaptıktan sonra ayarlar panelinden şifrenizi değiştirebilirsiniz.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="bg-rose-500/10 text-rose-400 p-4 rounded-xl text-[10px] font-black flex items-center justify-center gap-2 animate-shake uppercase tracking-widest border border-rose-500/20 mt-2">
                                    <Info size={14} /> {error}
                                </div>
                            )}

                            {successMsg && (
                                <div className="bg-emerald-500/10 text-emerald-400 p-4 rounded-xl text-[10px] font-black flex items-center justify-center gap-2 uppercase tracking-widest border border-emerald-500/20 mt-2">
                                    <ShieldCheck size={14} /> {successMsg}
                                </div>
                            )}

                            {forgotPasswordStep <= 2 && (
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-4.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.15em] shadow-sm flex items-center justify-center gap-3 transition-all active:scale-[0.98] mt-6 bg-slate-900 text-white hover:bg-slate-800"
                                >
                                    {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (forgotPasswordStep === 1 ? "DEVAM ET" : "ŞİFREYİ SIFIRLA")}
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => {
                                    setIsForgotPassword(false);
                                    setForgotPasswordStep(1);
                                    setError('');
                                    setSuccessMsg('');
                                    setResetUsername('');
                                    setSecurityQuestion('');
                                    setSecurityAnswer('');
                                }}
                                className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all font-bold ${forgotPasswordStep === 3 ? 'bg-slate-900 text-white hover:bg-slate-800 mt-4' : 'text-slate-500 hover:text-slate-800'}`}
                            >
                                {forgotPasswordStep === 3 ? "GİRİŞ EKRANINA GİT" : "Giriş Ekranına Dön"}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {isRegistering && (
                                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                                    <label className="text-slate-500 text-[8px] font-black ml-1 uppercase tracking-widest opacity-50">Ad Soyad {activeRole === 'admin' ? '/ İşletme Adı' : ''}</label>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            required
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 px-4 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-sm"
                                            placeholder="Tam adınız veya ünvanınız"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            {isRegistering && (
                                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                                    <label className="text-slate-500 text-[8px] font-black ml-1 uppercase tracking-widest opacity-50">Telefon Numarası</label>
                                    <div className="relative group">
                                        <input
                                            type="tel"
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 px-4 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-sm"
                                            placeholder="İletişim Numaranız"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            {isRegistering && (
                                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                                    <label className="text-slate-500 text-[8px] font-black ml-1 uppercase tracking-widest opacity-50">E-Posta Adresi</label>
                                    <div className="relative group">
                                        <input
                                            type="email"
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 px-4 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-sm"
                                            placeholder="E-Posta Adresiniz"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            {isRegistering && (activeRole === 'customer' || activeRole === 'admin') && (
                                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                                    <label className="text-slate-500 text-[8px] font-black ml-1 uppercase tracking-widest opacity-50">Adres</label>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            required
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 px-4 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-sm"
                                            placeholder="Açık Adresiniz"
                                            value={address}
                                            onChange={(e) => setAddress(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            {isRegistering && activeRole === 'courier' && (
                                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                                    <label className="text-slate-500 text-[8px] font-black ml-1 uppercase tracking-widest opacity-50">Kurye Kodu (İşletmeden Alınan)</label>
                                    <div className="relative group">
                                        <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-all duration-200" size={16} />
                                        <input
                                            type="text"
                                            required
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 pl-12 pr-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-sm"
                                            placeholder="İşletme kurye kodunu girin"
                                            value={courierCode}
                                            onChange={(e) => setCourierCode(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            {isRegistering && activeRole === 'admin' && (
                                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                                    <label className="text-slate-500 text-[8px] font-black ml-1 uppercase tracking-widest opacity-50 text-blue-600">Sistem Aktivasyon Kodu</label>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            required
                                            className="w-full bg-blue-50 border border-blue-200 text-slate-800 placeholder-slate-400 px-4 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-bold text-sm"
                                            placeholder="BAYIOS-XXXX-YYYY"
                                            value={activationCode}
                                            onChange={(e) => setActivationCode(e.target.value)}
                                        />
                                        <Info className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500/50" size={16} />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-slate-500 text-[8px] font-black ml-1 uppercase tracking-widest opacity-50">Kullanıcı Adı</label>
                                <div className="relative group">
                                    <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-all duration-200" size={16} />
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 pl-12 pr-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-sm"
                                        placeholder="Kullanıcı adı"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5 border-b border-transparent">
                                <label className="text-slate-500 text-[8px] font-black ml-1 uppercase tracking-widest opacity-50">Şifre</label>
                                <div className="relative group">
                                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-all duration-200" size={16} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 pl-12 pr-12 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-sm"
                                        placeholder="Şifreniz"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-all duration-200"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {isRegistering && (
                                <div className="space-y-4 pt-2 border-t border-slate-100 animate-in fade-in slide-in-from-top-2">
                                    <div className="space-y-1.5">
                                        <label className="text-blue-600 text-[8px] font-black ml-1 uppercase tracking-widest">Güvenlik Sorusu (Şifre kurtarma için)</label>
                                        <div className="relative group">
                                            <HelpCircle className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-400 group-focus-within:text-blue-500 transition-all duration-200" size={16} />
                                            <input
                                                type="text"
                                                required
                                                className="w-full bg-blue-50/50 border border-blue-100 text-slate-800 placeholder-slate-400 pl-12 pr-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-sm"
                                                placeholder="Örn: İlk evcil hayvanınızın adı?"
                                                value={securityQuestion}
                                                onChange={(e) => setSecurityQuestion(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-blue-600 text-[8px] font-black ml-1 uppercase tracking-widest">Güvenlik Cevabı</label>
                                        <div className="relative group">
                                            <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-400 group-focus-within:text-blue-500 transition-all duration-200" size={16} />
                                            <input
                                                type="text"
                                                required
                                                className="w-full bg-blue-50/50 border border-blue-100 text-slate-800 placeholder-slate-400 pl-12 pr-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-sm"
                                                placeholder="Cevabınız"
                                                value={securityAnswer}
                                                onChange={(e) => setSecurityAnswer(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {!isRegistering && (
                                <div className="flex items-center justify-between px-1">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <div className="relative flex items-center justify-center">
                                            <input
                                                type="checkbox"
                                                className="peer appearance-none w-5 h-5 rounded-lg border-2 border-slate-200 checked:bg-blue-600 checked:border-blue-600 transition-all duration-200"
                                                checked={rememberMe}
                                                onChange={(e) => setRememberMe(e.target.checked)}
                                            />
                                            <ShieldCheck className="absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" size={12} />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-700 transition-colors">Beni Hatırla</span>
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => { setIsForgotPassword(true); setError(''); setSuccessMsg(''); }}
                                        className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 transition-colors"
                                    >
                                        Şifremi Unuttum
                                    </button>
                                </div>
                            )}

                            {error && (
                                <div className="bg-rose-500/10 text-rose-400 p-4 rounded-xl text-[10px] font-black flex items-center justify-center gap-2 animate-shake uppercase tracking-widest border border-rose-500/20 mt-2">
                                    <Info size={14} /> {error}
                                </div>
                            )}

                            {successMsg && (
                                <div className="bg-emerald-500/10 text-emerald-400 p-4 rounded-xl text-[10px] font-black flex items-center justify-center gap-2 uppercase tracking-widest border border-emerald-500/20 mt-2">
                                    <ShieldCheck size={14} /> {successMsg}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`w-full py-4.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.15em] shadow-sm flex items-center justify-center gap-3 transition-all active:scale-[0.98] mt-6 relative overflow-hidden group ${activeRole === 'admin' ? 'bg-slate-900 text-white hover:bg-slate-800' :
                                    activeRole === 'courier' ? 'bg-blue-600 text-white hover:bg-blue-700' :
                                    activeRole === 'developer' ? 'bg-slate-950 text-white hover:bg-slate-900' :
                                        'bg-orange-600 text-white hover:bg-orange-700'
                                    }`}
                            >
                                {isLoading ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <span className="relative z-10">{isRegistering ? 'KAYIT OL' : 'GİRİŞ YAP'}</span>
                                        {isRegistering ? <UserPlus size={16} /> : <LogIn size={16} />}
                                    </>
                                )}
                            </button>

                            {activeRole !== 'developer' && (
                                <div className="text-center pt-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsRegistering(!isRegistering);
                                            setError('');
                                            setSuccessMsg('');
                                            setUsername('');
                                            setPassword('');
                                            setSecurityQuestion('');
                                            setSecurityAnswer('');
                                        }}
                                        className="w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800 border border-slate-200 shadow-sm transition-all active:scale-[0.98]"
                                    >
                                        {isRegistering ? "Zaten hesabınız var mı? Giriş Yapın" : "Hesabınız yok mu? Yeni Kayıt Oluşturun"}
                                    </button>
                                </div>
                            )}
                        </form>
                    )}

                    {/* Footer */}
                    <div className="mt-8 pt-6 border-t border-white/[0.05] text-center">
                        <p className="text-[9px] font-black text-slate-600 tracking-[0.2em]">
                            bilgi@bayios.com
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Login;




