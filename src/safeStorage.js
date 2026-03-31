const getStorage = () => {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        return window.localStorage;
    } catch (error) {
        console.warn('localStorage is unavailable.', error);
        return null;
    }
};

export const safeGetItem = (key, fallback = null) => {
    const storage = getStorage();
    if (!storage) {
        return fallback;
    }

    try {
        const value = storage.getItem(key);
        return value ?? fallback;
    } catch (error) {
        console.warn(`Could not read localStorage key: ${key}`, error);
        return fallback;
    }
};

export const safeSetItem = (key, value) => {
    const storage = getStorage();
    if (!storage) {
        return false;
    }

    try {
        storage.setItem(key, value);
        return true;
    } catch (error) {
        console.warn(`Could not write localStorage key: ${key}`, error);
        return false;
    }
};

export const safeRemoveItem = (key) => {
    const storage = getStorage();
    if (!storage) {
        return false;
    }

    try {
        storage.removeItem(key);
        return true;
    } catch (error) {
        console.warn(`Could not remove localStorage key: ${key}`, error);
        return false;
    }
};
