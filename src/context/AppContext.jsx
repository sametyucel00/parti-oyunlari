import React, { createContext, useContext, useState, useEffect } from 'react';
import { SettingsStorage } from '../utils/storage';
import { audioManager } from '../utils/audio';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [settings, setSettings] = useState(SettingsStorage.getSettings());
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        // Sync audio manager with settings
        audioManager.setSoundEnabled(settings.soundEnabled);
    }, [settings.soundEnabled]);

    const toggleSound = () => {
        const newSettings = { ...settings, soundEnabled: !settings.soundEnabled };
        setSettings(newSettings);
        SettingsStorage.updateSetting('soundEnabled', newSettings.soundEnabled);
    };

    const playClick = () => {
        audioManager.playClick();
    };

    const showNotification = (message, type = 'info', duration = 3000) => {
        setNotification({ message, type });
        setTimeout(() => {
            setNotification(null);
        }, duration);
    };

    return (
        <AppContext.Provider value={{
            settings,
            toggleSound,
            playClick,
            notification,
            showNotification
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => useContext(AppContext);
