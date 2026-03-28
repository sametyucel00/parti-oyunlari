import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import besSaniyeData from '../data/games/bessaniye.json';
import { audioManager } from '../utils/audio';
import { useGameData } from '../hooks/useGameData';

const BesSaniye = ({ onScore, onEndTurn }) => {
    const [phase, setPhase] = useState('start');
    const [timeLeft, setTimeLeft] = useState(5);
    const [question, getNextQuestion] = useGameData('bessaniye_v2', besSaniyeData);

    useEffect(() => {
        let timer = null;
        if (phase === 'active' && timeLeft > 0) timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
        else if (phase === 'active' && timeLeft === 0) {
            setPhase('result');
            audioManager.playWrong();
        }
        return () => clearInterval(timer);
    }, [phase, timeLeft]);

    const handleStart = () => {
        getNextQuestion();
        setTimeLeft(5);
        setPhase('active');
    };

    if (phase === 'start') {
        return (
            <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '2rem', flex: 1, textAlign: 'center' }}>
                <h2 style={{ fontSize: '2.5rem' }}>5 Saniye Kuralı</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Sorunun cevabı olan 3 şeyi 5 saniyede söyle.</p>
                <Button variant="primary" onClick={handleStart} style={{ padding: '2rem 4rem', fontSize: '1.5rem' }}>Hazırım</Button>
            </div>
        );
    }

    if (phase === 'active') {
        return (
            <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '2rem', flex: 1, textAlign: 'center' }}>
                <h1 style={{ fontSize: '6rem', color: timeLeft <= 2 ? 'var(--danger-color)' : 'white' }}>{timeLeft}</h1>
                <div className="glass-panel" style={{ padding: '2rem', width: '90%' }}>
                    <h2 style={{ fontSize: '2rem', color: 'var(--warning-color)' }}>{question}</h2>
                </div>
                <Button variant="primary" onClick={() => { setPhase('result'); audioManager.playCorrect(); }} style={{ padding: '2rem 4rem', fontSize: '1.5rem', background: 'var(--success-color)' }}>
                    Hepsini Söyledim
                </Button>
            </div>
        );
    }

    const success = timeLeft > 0;
    return (
        <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '2rem', flex: 1, textAlign: 'center' }}>
            <h2 style={{ fontSize: '3rem', color: success ? 'var(--success-color)' : 'var(--danger-color)' }}>
                {success ? 'HARİKA! (+1)' : 'SÜRE BİTTİ! (0)'}
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>Grup kararıyla puanı onaylayın.</p>
            <div style={{ display: 'flex', gap: '1rem', width: '90%' }}>
                <Button variant="outline" onClick={() => { onScore(0); onEndTurn(); }} style={{ flex: 1, borderColor: 'var(--danger-color)', color: 'var(--danger-color)' }}>
                    Geçersiz
                </Button>
                <Button variant="primary" onClick={() => { onScore(1); onEndTurn(); }} style={{ flex: 1, background: 'var(--success-color)' }}>
                    Geçerli (+1)
                </Button>
            </div>
        </div>
    );
};

export default BesSaniye;
