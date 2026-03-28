import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import heykelData from '../data/games/heykel.json';
import { audioManager } from '../utils/audio';

const Heykel = ({ onScore, onEndTurn }) => {
    const [phase, setPhase] = useState('start');
    const [timeLeft, setTimeLeft] = useState(30);
    const [prompt, setPrompt] = useState('');

    useEffect(() => {
        let timer = null;
        if (phase === 'active' && timeLeft > 0) {
            timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
        } else if (phase === 'active' && timeLeft === 0) {
            setPhase('result');
            audioManager.playWrong();
        }
        return () => clearInterval(timer);
    }, [phase, timeLeft]);

    const handleStart = () => {
        setPrompt(heykelData[Math.floor(Math.random() * heykelData.length)]);
        setTimeLeft(30);
        setPhase('active');
    };

    const handleSuccess = () => {
        setPhase('result');
        audioManager.playCorrect();
        onScore(1);
    };

    const handleFail = () => {
        setPhase('result');
        audioManager.playWrong();
    };

    if (phase === 'start') {
        return (
            <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '2rem', flex: 1, textAlign: 'center' }}>
                <h2 style={{ fontSize: '2.5rem' }}>Heykel (Don!)</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Ekranda çıkan kelimenin heykeli ol. Hiç hareket etme ve ses çıkarma. Sadece poz ver! (30 saniye)</p>
                <Button variant="danger" onClick={handleStart} style={{ padding: '2rem 4rem', fontSize: '1.5rem', marginTop: '1rem' }}>
                    Pozu Göster
                </Button>
            </div>
        );
    }

    if (phase === 'active') {
        return (
            <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '2rem', flex: 1, textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '0 1rem' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '1.5rem', color: timeLeft <= 5 ? 'var(--danger-color)' : 'white' }}>⏱ {timeLeft}s</div>
                </div>

                <div className="glass-panel" style={{ padding: '2rem', width: '90%' }}>
                    <h2 style={{ fontSize: '2.5rem', color: 'var(--warning-color)' }}>{prompt}</h2>
                </div>

                <p style={{ color: 'var(--text-secondary)', marginTop: '2rem' }}>Pozunu bozma! Grup tahmin etsin.</p>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', width: '90%' }}>
                    <Button variant="outline" onClick={handleFail} style={{ flex: 1 }}>Bilemediler</Button>
                    <Button variant="success" onClick={handleSuccess} style={{ flex: 1, background: 'var(--success-color)' }}>Bildiler! (+1)</Button>
                </div>
            </div>
        );
    }

    const success = timeLeft > 0;
    return (
        <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '2rem', flex: 1, textAlign: 'center' }}>
            <h2 style={{ fontSize: '3rem', color: success ? 'var(--success-color)' : 'var(--danger-color)' }}>
                {success ? 'SÜPER POZ!' : 'SÜRE BİTTİ'}
            </h2>
            <Button variant="primary" onClick={onEndTurn} style={{ padding: '2rem 4rem', fontSize: '1.5rem', marginTop: '2rem' }}>
                Sıradaki Oyuncu
            </Button>
        </div>
    );
};

export default Heykel;
