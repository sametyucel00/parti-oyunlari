import { db } from "../lib/firebase";
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    orderBy,
    where,
    getDocs,
    writeBatch,
    setDoc
} from "firebase/firestore";

// Protected where wrapper to prevent "Unsupported field value: undefined" crash
const hasUndefinedDeep = (value) => {
    if (value === undefined) return true;
    if (Array.isArray(value)) return value.some(hasUndefinedDeep);
    if (value && typeof value === 'object') {
        return Object.values(value).some(hasUndefinedDeep);
    }
    return false;
};

const safeWhere = (...args) => {
    const field = args[0];
    const operator = args.length === 2 ? '==' : args[1];
    const value = args.length === 2 ? args[1] : args[2];

    if (!field || value === undefined || hasUndefinedDeep(value)) {
        console.warn(`Firestore: 'where' called with undefined value for field '${field}'. Skipping filter locally.`);
        return null;
    }

    try {
        return where(field, operator, value);
    } catch (error) {
        console.warn(`Firestore: failed to create 'where' filter for field '${field}'. Skipping filter locally.`, error);
        return null;
    }
};

const buildSafeQuery = (collectionRef, ...constraints) => {
    const validConstraints = constraints.filter(Boolean);
    return query(collectionRef, ...validConstraints);
};

const normalizeText = (value) => String(value ?? "").trim();

export const normalizeUsername = (value) => normalizeText(value).toLocaleLowerCase('tr-TR');

export const normalizeEmail = (value) => normalizeText(value).toLocaleLowerCase('tr-TR');

export const normalizePhone = (value) => {
    const digits = String(value ?? "").replace(/\D/g, "");
    if (!digits) return "";

    let normalized = digits;

    if (normalized.startsWith("0090") && normalized.length > 10) {
        normalized = normalized.slice(4);
    } else if (normalized.startsWith("90") && normalized.length > 10) {
        normalized = normalized.slice(2);
    } else if (normalized.startsWith("0") && normalized.length === 11) {
        normalized = normalized.slice(1);
    }

    if (normalized.length > 10) {
        normalized = normalized.slice(-10);
    }

    return normalized;
};

const withNormalizedUserFields = (user = {}) => {
    const normalizedUser = { ...user };

    if (user.username !== undefined) {
        normalizedUser.username = normalizeText(user.username);
        normalizedUser.normalizedUsername = normalizeUsername(user.username);
    }

    if (user.email !== undefined) {
        normalizedUser.email = normalizeText(user.email);
        normalizedUser.normalizedEmail = normalizeEmail(user.email);
    }

    if (user.phone !== undefined) {
        normalizedUser.phone = normalizeText(user.phone);
        normalizedUser.normalizedPhone = normalizePhone(user.phone);
    }

    return normalizedUser;
};

const withNormalizedSubscriberFields = (subscriber = {}) => {
    const normalizedSubscriber = { ...subscriber };

    if (subscriber.phone !== undefined) {
        normalizedSubscriber.phone = normalizeText(subscriber.phone);
        normalizedSubscriber.normalizedPhone = normalizePhone(subscriber.phone);
    }

    if (subscriber.email !== undefined) {
        normalizedSubscriber.email = normalizeText(subscriber.email);
        normalizedSubscriber.normalizedEmail = normalizeEmail(subscriber.email);
    }

    if (subscriber.username !== undefined) {
        normalizedSubscriber.username = normalizeText(subscriber.username);
        normalizedSubscriber.normalizedUsername = normalizeUsername(subscriber.username);
    }

    return normalizedSubscriber;
};

export const checkUserRegistrationConflicts = async ({ username, email, phone }, excludeUserId = null) => {
    const normalizedTargetUsername = normalizeUsername(username);
    const normalizedTargetEmail = normalizeEmail(email);
    const normalizedTargetPhone = normalizePhone(phone);
    const snapshot = await getDocs(collection(db, "users"));

    const conflicts = {
        username: null,
        email: null,
        phone: null
    };

    snapshot.forEach((userDoc) => {
        if (excludeUserId && userDoc.id === excludeUserId) return;

        const userData = userDoc.data();
        const normalizedUserUsername = userData.normalizedUsername || normalizeUsername(userData.username);
        const normalizedUserEmail = userData.normalizedEmail || normalizeEmail(userData.email);
        const normalizedUserPhone = userData.normalizedPhone || normalizePhone(userData.phone);

        if (!conflicts.username && normalizedTargetUsername && normalizedUserUsername === normalizedTargetUsername) {
            conflicts.username = { id: userDoc.id, ...userData };
        }

        if (!conflicts.email && normalizedTargetEmail && normalizedUserEmail === normalizedTargetEmail) {
            conflicts.email = { id: userDoc.id, ...userData };
        }

        if (!conflicts.phone && normalizedTargetPhone && normalizedUserPhone === normalizedTargetPhone) {
            conflicts.phone = { id: userDoc.id, ...userData };
        }
    });

    return conflicts;
};

export const findMatchingSubscriberForCustomer = async ({ phone, email }) => {
    const normalizedTargetPhone = normalizePhone(phone);
    const normalizedTargetEmail = normalizeEmail(email);

    if (!normalizedTargetPhone && !normalizedTargetEmail) {
        return null;
    }

    const snapshot = await getDocs(collection(db, "subscribers"));
    let phoneMatch = null;
    let emailMatch = null;

    snapshot.forEach((subscriberDoc) => {
        const subscriberData = subscriberDoc.data();
        const normalizedSubscriberPhone = subscriberData.normalizedPhone || normalizePhone(subscriberData.phone);
        const normalizedSubscriberEmail = subscriberData.normalizedEmail || normalizeEmail(subscriberData.email);

        if (!phoneMatch && normalizedTargetPhone && normalizedSubscriberPhone === normalizedTargetPhone) {
            phoneMatch = { docId: subscriberDoc.id, ...subscriberData };
        }

        if (!emailMatch && normalizedTargetEmail && normalizedSubscriberEmail === normalizedTargetEmail) {
            emailMatch = { docId: subscriberDoc.id, ...subscriberData };
        }
    });

    return phoneMatch || emailMatch;
};

export const syncCustomerRegistrationWithSubscriber = async (user, matchedSubscriber = null) => {
    if (!user?.id) return null;

    const subscriber = matchedSubscriber || await findMatchingSubscriberForCustomer(user);
    if (!subscriber?.docId) return null;

    const subscriberRef = doc(db, "subscribers", subscriber.docId);
    const subscriberUpdates = withNormalizedSubscriberFields({
        name: user.name || subscriber.name || "",
        address: user.address || subscriber.address || "",
        phone: user.phone || subscriber.phone || "",
        email: user.email || subscriber.email || "",
        username: user.username || subscriber.username || "",
        businessId: subscriber.businessId || user.businessId || "",
        linkedUserId: user.id,
        customerUserId: user.id
    });

    await setDoc(subscriberRef, subscriberUpdates, { merge: true });

    return {
        ...subscriber,
        ...subscriberUpdates,
        docId: subscriber.docId
    };
};

// Generic collection listeners
export const subscribeToCollection = (collectionName, callback, orderField = 'timestamp', filterParams = null) => {
    const collectionRef = collection(db, collectionName);
    let filter = null;
    let q = null;

    try {
        if (filterParams && filterParams.field && filterParams.value !== undefined) {
            filter = safeWhere(filterParams.field, filterParams.operator || '==', filterParams.value);
        } else if (filterParams && (filterParams.field || filterParams.value !== undefined)) {
            console.warn(`subscribeToCollection: skip filter for [${filterParams?.field}] because value or field is missing`, filterParams);
        }

        // Removing orderBy from Firestore query to avoid requiring composite indexes
        // Sorting will be done on the client side below.
        q = buildSafeQuery(collectionRef, filter);
    } catch (error) {
        console.error(`Firestore query setup error [${collectionName}]:`, error);
        if (filterParams?.onError) filterParams.onError(error);
        callback([]);
        return () => { };
    }

    try {
        return onSnapshot(q, (snapshot) => {
            let data = snapshot.docs.map(doc => ({
                ...doc.data(),
                firestoreId: doc.id,
                id: doc.data().id ?? doc.id
            }));

            if (orderField) {
                data.sort((a, b) => {
                    const dateA = new Date(a[orderField] || 0).getTime();
                    const dateB = new Date(b[orderField] || 0).getTime();
                    return dateB - dateA; // Descending
                });
            }

            callback(data);
        }, (error) => {
            if (error.code === 'permission-denied') {
                console.warn(`Firestore permission denied for collection [${collectionName}]. Check your security rules.`);
            } else {
                console.error(`Firestore subscribeToCollection error [${collectionName}]:`, error);
            }
            if (filterParams?.onError) filterParams.onError(error);
            callback([]);
        });
    } catch (error) {
        console.error(`Firestore subscribeToCollection setup crash [${collectionName}]:`, error);
        if (filterParams?.onError) filterParams.onError(error);
        callback([]);
        return () => { };
    }
};

export const subscribeToUser = (userId, callback, onError) => {
    if (!userId) return () => {};
    return onSnapshot(doc(db, "users", userId), (doc) => {
        if (doc.exists()) {
            callback({ id: doc.id, ...doc.data() });
        }
    }, (error) => {
        if (error.code === 'permission-denied') {
            console.warn(`Firestore permission denied for user [${userId}]. Check your security rules.`);
        } else {
            console.error("Firestore subscribeToUser error:", error);
        }
        if (onError) onError(error);
    });
};

export const registerUserToFirestore = async (user) => {
    try {
        const userRef = await addDoc(collection(db, "users"), {
            ...withNormalizedUserFields(user),
            timestamp: new Date().toISOString()
        });

        if (user.role === 'courier') {
            await addDoc(collection(db, "couriers"), {
                name: user.name,
                username: user.username,
                password: user.password,
                businessId: user.businessId,
                userId: userRef.id,
                vehicle: user.vehicle || 'Motor',
                phone: user.phone || '',
                cash: 0,
                currentStock: { water: 0, tube: 0 },
                status: 'Müsait',
                timestamp: new Date().toISOString()
            });
        }

        return userRef;
    } catch (error) {
        console.error("Error in registerUserToFirestore:", error);
        throw error;
    }
};

export const getBusinessesFromFirestore = async () => {
    const q = buildSafeQuery(collection(db, "users"), safeWhere("role", "==", "admin"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getBusinessByCourierCode = async (code) => {
    if (!code) return null;
    const q = buildSafeQuery(collection(db, "users"),
        safeWhere("courierCode", "==", code || ""), 
        safeWhere("role", "==", "admin")
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    }
    return null;
};

export const getUserByCredentials = async (username, password) => {
    if (!username || !password) return null;
    const trimmedUsername = normalizeText(username);
    const q = buildSafeQuery(collection(db, "users"),
        safeWhere("username", "==", trimmedUsername || ""),
        safeWhere("password", "==", password || "")
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    }
    return null;
};

export const checkUsernameExists = async (username) => {
    if (!username) return false;
    const q = buildSafeQuery(collection(db, "users"), safeWhere("username", "==", normalizeText(username)));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
};

export const getUserByUsername = async (username) => {
    if (!username) return null;
    const q = buildSafeQuery(collection(db, "users"), safeWhere("username", "==", normalizeText(username)));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    }
    return null;
};

export const updateUserInFirestore = async (userId, data) => {
    try {
        const userRef = doc(db, "users", userId);
        return await setDoc(userRef, withNormalizedUserFields(data), { merge: true });
    } catch (error) {
        console.error("Error in updateUserInFirestore:", error);
        throw error;
    }
};

export const updateLocationInFirestore = async (userId, lat, lng) => {
    try {
        if (!userId) {
            console.warn("updateLocationInFirestore: userId is missing, skipping location update");
            return;
        }
        const userRef = doc(db, "users", userId);
        await setDoc(userRef, {
            location: {
                lat,
                lng,
                lastUpdate: new Date().toISOString()
            }
        }, { merge: true });

        // Also update courier collection if it's a courier
        const couriersQuery = buildSafeQuery(collection(db, "couriers"), safeWhere("userId", "==", userId));
        const courierSnapshot = await getDocs(couriersQuery);
        if (!courierSnapshot.empty) {
            const courierDoc = courierSnapshot.docs[0];
            const courierRef = doc(db, "couriers", courierDoc.id);
            await updateDoc(courierRef, {
                location: {
                    lat,
                    lng,
                    lastUpdate: new Date().toISOString()
                }
            });
        }
    } catch (error) {
        // Silent failing for location updates to avoid spamming the UI
        console.warn("Location update failed (Firestore):", error.message);
    }
};

export const addActivationCodeToFirestore = async (codeStr) => {
    return await addDoc(collection(db, "activationCodes"), {
        code: codeStr,
        used: false,
        usedBy: null,
        usedAt: null,
        createdAt: new Date().toISOString(),
        timestamp: new Date().toISOString()
    });
};

export const deleteActivationCodeFromFirestore = async (codeId) => {
    const codeRef = doc(db, "activationCodes", codeId);
    return await deleteDoc(codeRef);
};

export const bulkDeleteActivationCodesFromFirestore = async (codeIds) => {
    const batch = writeBatch(db);
    codeIds.forEach(id => {
        const ref = doc(db, "activationCodes", id);
        batch.delete(ref);
    });
    return await batch.commit();
};

export const checkActivationCode = async (codeStr) => {
    if (!codeStr) return false;
    const q = buildSafeQuery(collection(db, "activationCodes"), safeWhere("code", "==", codeStr), safeWhere("used", "==", false));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
};

export const validateAndUseActivationCodeToFirestore = async (codeStr, businessId) => {
    try {
        if (!codeStr) return false;
        const q = buildSafeQuery(collection(db, "activationCodes"), safeWhere("code", "==", codeStr), safeWhere("used", "==", false));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            return false;
        }
        const codeDoc = snapshot.docs[0];
        const codeRef = doc(db, "activationCodes", codeDoc.id);
        await updateDoc(codeRef, {
            used: true,
            usedBy: businessId || null,
            usedAt: new Date().toISOString()
        });
        return true;
    } catch (error) {
        console.error("Error in validateAndUseActivationCodeToFirestore:", error);
        throw error;
    }
};

// CRUD for Subscribers
export const addSubscriberToFirestore = async (subscriber) => {
    try {
        return await addDoc(collection(db, "subscribers"), {
            ...withNormalizedSubscriberFields(subscriber),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error("Error in addSubscriberToFirestore:", error);
        throw error;
    }
};

export const updateSubscriberInFirestore = async (subscriberId, data) => {
    try {
        const subscriberRef = doc(db, "subscribers", subscriberId);
        return await updateDoc(subscriberRef, withNormalizedSubscriberFields(data));
    } catch (error) {
        console.error("Error in updateSubscriberInFirestore:", error);
        throw error;
    }
};

export const deleteSubscriberFromFirestore = async (subscriberId) => {
    const subscriberRef = doc(db, "subscribers", subscriberId);
    return await deleteDoc(subscriberRef);
};

export const bulkUpdateSubscribersInFirestore = async (subscriberIds, data) => {
    const batch = writeBatch(db);
    subscriberIds.forEach(id => {
        const ref = doc(db, "subscribers", id);
        batch.update(ref, data);
    });
    return await batch.commit();
};

export const bulkDeleteSubscribersFromFirestore = async (subscriberIds) => {
    const batch = writeBatch(db);
    subscriberIds.forEach(id => {
        const ref = doc(db, "subscribers", id);
        batch.delete(ref);
    });
    return await batch.commit();
};

// CRUD for Products
export const addProductToFirestore = async (product) => {
    try {
        return await addDoc(collection(db, "products"), {
            ...product,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error("Error in addProductToFirestore:", error);
        throw error;
    }
};

export const updateProductInFirestore = async (productId, data) => {
    const productRef = doc(db, "products", productId);
    return await updateDoc(productRef, data);
};

export const deleteProductFromFirestore = async (productId) => {
    const productRef = doc(db, "products", productId);
    return await deleteDoc(productRef);
};

// CRUD for Suppliers
export const addSupplierToFirestore = async (supplier) => {
    return await addDoc(collection(db, "suppliers"), {
        ...supplier,
        timestamp: new Date().toISOString()
    });
};

export const updateSupplierInFirestore = async (supplierId, data) => {
    const supplierRef = doc(db, "suppliers", supplierId);
    return await updateDoc(supplierRef, data);
};

export const addCourierToFirestore = async (courier) => {
    return await addDoc(collection(db, "couriers"), {
        ...courier,
        timestamp: new Date().toISOString(),
        cash: 0,
        currentStock: { water: 0, tube: 0 },
        status: 'Müsait'
    });
};

export const updateCourierInFirestore = async (courierId, data) => {
    const courierRef = doc(db, "couriers", courierId);
    return await updateDoc(courierRef, data);
};

export const deleteCourierFromFirestore = async (courierId) => {
    const courierRef = doc(db, "couriers", courierId);
    return await deleteDoc(courierRef);
};

// CRUD for Expenses
export const addExpenseToFirestore = async (expense) => {
    try {
        return await addDoc(collection(db, "expenses"), {
            ...expense,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error("Error in addExpenseToFirestore:", error);
        throw error;
    }
};

export const updateExpenseInFirestore = async (expenseId, data) => {
    const expenseRef = doc(db, "expenses", expenseId);
    return await updateDoc(expenseRef, data);
};

export const deleteExpenseFromFirestore = async (expenseId) => {
    const expenseRef = doc(db, "expenses", expenseId);
    return await deleteDoc(expenseRef);
};

// CRUD for Orders
export const addOrderToFirestore = async (order) => {
    try {
        return await addDoc(collection(db, "orders"), {
            ...order,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error("Error in addOrderToFirestore:", error);
        throw error;
    }
};

export const updateOrderInFirestore = async (orderId, data) => {
    const orderRef = doc(db, "orders", orderId);
    return await updateDoc(orderRef, data);
};

export const deleteOrderFromFirestore = async (orderId) => {
    const orderRef = doc(db, "orders", orderId);
    return await deleteDoc(orderRef);
};
export const updateOrderStatusInFirestore = async (orderId, status) => {
    const orderRef = doc(db, "orders", orderId);
    return await updateDoc(orderRef, { status });
};

// CRUD for Categories
export const addCategoryToFirestore = async (category) => {
    return await addDoc(collection(db, "categories"), {
        ...category,
        timestamp: new Date().toISOString()
    });
};

export const deleteCategoryFromFirestore = async (categoryId) => {
    const categoryRef = doc(db, "categories", categoryId);
    return await deleteDoc(categoryRef);
};

// Reconciliation Sync
export const addReconciliationToFirestore = async (data) => {
    return await addDoc(collection(db, "reconciliations"), {
        ...data,
        timestamp: new Date().toISOString()
    });
};

// Incoming Calls Sync
export const addIncomingCallToFirestore = async (call) => {
    try {
        return await addDoc(collection(db, "incoming_calls"), {
            ...call,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error("Error in addIncomingCallToFirestore:", error);
    }
};

export const deleteIncomingCallFromFirestore = async (id) => {
    try {
        await deleteDoc(doc(db, "incoming_calls", id));
    } catch (error) {
        console.error("Error in deleteIncomingCallFromFirestore:", error);
    }
};

export const clearIncomingCallsFromFirestore = async (businessId) => {
    try {
        if (!businessId) {
            console.warn("clearIncomingCallsFromFirestore: businessId is missing");
            return;
        }
        const q = buildSafeQuery(collection(db, "incoming_calls"), safeWhere("businessId", "==", businessId));
        const snapshot = await getDocs(q);
        const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
    } catch (error) {
        console.error("Error in clearIncomingCallsFromFirestore:", error);
    }
};

export const sendDeviceCommand = async (deviceId, command, payload = {}) => {
    try {
        return await addDoc(collection(db, "device_commands"), {
            deviceId,
            command,
            payload,
            status: 'pending',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error("Error in sendDeviceCommand:", error);
    }
};
