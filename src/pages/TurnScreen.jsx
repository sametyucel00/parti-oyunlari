import React from 'react';
import { Button } from '../components/Button';
import { FaHandPointer } from 'react-icons/fa';

const TurnScreen = ({ player, onStart }) => {
    return (
        <div className="flex-center" style={{
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '1.5rem',
            flex: 1,
            textAlign: 'center',
            padding: '1.5rem',
            width: '100%'
        }}>
            <h2 style={{ fontSize: '1.5rem', color: 'var(--text-secondary)' }}>Sıra Sende!</h2>

            <div className="glass-panel" style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '2rem 1.5rem',
                border: '2px solid var(--primary-color)',
                width: '100%',
                maxWidth: '280px'
            }}>
                <div style={{ fontSize: '4rem' }}>{player?.avatar || '🙂'}</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', wordBreak: 'break-word' }}>{player?.name || 'Bilinmiyor'}</div>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', padding: '0 0.5rem' }}>
                Telefonu <strong>{player?.name || 'oyuncu'}</strong> alsın ve hazır olduğunda başlat butonuna bassın.
            </p>

            <Button variant="primary" onClick={onStart} style={{ padding: '1rem 2rem', fontSize: '1.2rem', marginTop: '1rem', width: '100%', maxWidth: '300px' }}>
                <FaHandPointer /> Hazırım, Başlat!
            </Button>
        </div>
    );
};

export default TurnScreen;
