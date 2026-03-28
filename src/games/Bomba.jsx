import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import bombaData from '../data/games/bomba.json';
import { useAppContext } from '../context/AppContext';
import { audioManager } from '../utils/audio';
import { useGameData } from '../hooks/useGameData';

const Bomba = ({ onScore, onEndTurn }) => {
    const { settings } = useAppContext();
    const [isActive, setIsActive] = useState(false);
    const [category, getNextCategory] = useGameData('bomba', bombaData);
    const [timeLeft, setTimeLeft] = useState(0);
    const [exploded, setExploded] = useState(false);

    useEffect(() => {
        let timeout = null;
        if (isActive && timeLeft > 0) {
            timeout = setTimeout(() => setTimeLeft(t => t - 1), 1000);
        } else if (isActive && timeLeft === 0) {
            setIsActive(false);
            setExploded(true);
            if (settings.soundEnabled) audioManager.playWrong();
        }
        return () => clearTimeout(timeout);
    }, [isActive, timeLeft, settings.soundEnabled]);

    const startBomb = () => {
        const explosionTime = Math.floor(Math.random() * 30) + 15;
        setTimeLeft(explosionTime);
        getNextCategory();
        setIsActive(true);
        setExploded(false);
    };

    const handleExplode = () => {
        onScore(-1);
        onEndTurn();
    };

    if (exploded) {
        return (
            <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '2rem', flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: '6rem' }}>💣</div>
                <h2 style={{ fontSize: '3rem', color: 'var(--danger-color)' }}>BOMBA PATLADI!</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Telefon kimin elindeyse -1 puan alır.</p>
                <Button onClick={handleExplode} style={{ padding: '1rem 3rem' }}>Sıradaki Oyuncu</Button>
            </div>
        );
    }

    if (!isActive) {
        return (
            <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '2rem', flex: 1, textAlign: 'center' }}>
                <h2 style={{ fontSize: '2.5rem' }}>Bomba (Hot Potato)</h2>
                <p style={{ color: 'var(--text-secondary)', padding: '0 2rem' }}>
                    Geri sayım başlayınca kategoriden bir kelime söyle ve telefonu yanındakine pasla. Süre rastgele biter.
                </p>
                <Button variant="danger" onClick={startBomb} style={{ padding: '2rem 4rem', fontSize: '1.5rem', borderRadius: '50px' }}>
                    Bombayı Ateşle
                </Button>
            </div>
        );
    }

    return (
        <div className="flex-center animate-slide-up" style={{
            flexDirection: 'column',
            gap: '2rem',
            flex: 1,
            textAlign: 'center',
            background: timeLeft < 10 ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
            transition: 'background 0.5s',
            borderRadius: '1rem'
        }}>
            <h3 style={{ color: 'var(--text-secondary)' }}>Kategori</h3>
            <h1 style={{ fontSize: '3rem', color: 'var(--warning-color)', wordBreak: 'break-word', padding: '0 1rem' }}>{category}</h1>

            <div className="animate-pulse" style={{ fontSize: '8rem', marginTop: '2rem' }}>💣</div>

            <p style={{ color: 'var(--danger-color)', fontSize: '1.2rem', marginTop: '2rem', fontWeight: 'bold' }}>
                {timeLeft < 10 ? 'Çok az zaman kaldı!' : 'Zaman geçiyor...'}
            </p>
        </div>
    );
};

export default Bomba;
