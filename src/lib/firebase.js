import { initializeApp } from "firebase/app";
import {
    getFirestore,
    initializeFirestore,
    memoryLocalCache,
    persistentLocalCache,
    persistentSingleTabManager
} from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getMessaging } from "firebase/messaging";
import { Capacitor } from "@capacitor/core";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL
};

const app = initializeApp(firebaseConfig);

const createFirestore = () => {
    if (typeof window === 'undefined') {
        return getFirestore(app);
    }

    if (Capacitor.isNativePlatform()) {
        return initializeFirestore(app, {
            cache: memoryLocalCache()
        });
    }

    try {
        return initializeFirestore(app, {
            cache: persistentLocalCache({
                tabManager: persistentSingleTabManager(undefined)
            })
        });
    } catch (error) {
        console.warn('Firestore persistent cache could not be initialized, falling back to memory cache.', error);
        return initializeFirestore(app, {
            cache: memoryLocalCache()
        });
    }
};

export const db = createFirestore();
export const rtdb = getDatabase(app);
export const messaging = (() => {
    if (typeof window === 'undefined' || Capacitor.isNativePlatform()) {
        return null;
    }

    try {
        return getMessaging(app);
    } catch (error) {
        console.warn("Firebase messaging could not be initialized.", error);
        return null;
    }
})();

export default app;
