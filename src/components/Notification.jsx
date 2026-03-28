import React from 'react';
import { useAppContext } from '../context/AppContext';

export const Notification = () => {
    const { notification } = useAppContext();

    if (!notification) return null;

    const { message, type } = notification;

    const bgColors = {
        info: 'var(--primary-color)',
        success: 'var(--success-color)',
        error: 'var(--danger-color)',
        warning: 'var(--warning-color)'
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            pointerEvents: 'none',
            padding: '2rem'
        }}>
            <div className="glass-panel animate-pop-in" style={{
                background: bgColors[type] || bgColors.info,
                color: 'white',
                padding: '1.5rem 2rem',
                borderRadius: '1.5rem',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                textAlign: 'center',
                fontWeight: '800',
                fontSize: '1.2rem',
                border: '2px solid rgba(255,255,255,0.3)',
                maxWidth: '400px',
                width: '100%'
            }}>
                {message}
            </div>
        </div>
    );
};
