import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import kelimeIliskiData from '../data/games/kelimeiliski.json';
import { audioManager } from '../utils/audio';
import { useAppContext } from '../context/AppContext';

const KelimeIliskilendirme = ({ onScore, onEndTurn }) => {
    const { settings } = useAppContext();
    const [isActive, setIsActive] = useState(false);
    const [timeLeft, setTimeLeft] = useState(10);
    const [currentWord, setCurrentWord] = useState('');

    useEffect(() => {
        let interval = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
        } else if (isActive && timeLeft === 0) {
            setIsActive(false);
            if (settings.soundEnabled) audioManager.playWrong();
            onScore(-1);
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft, onScore, settings.soundEnabled]);

    const startGame = () => {
        let pool = JSON.parse(localStorage.getItem('game_pool_iliski_v2') || '[]');
        if (!Array.isArray(pool) || pool.length === 0) {
            pool = [...kelimeIliskiData].sort(() => 0.5 - Math.random());
        }
        const word = pool.pop();
        localStorage.setItem('game_pool_iliski_v2', JSON.stringify(pool));

        setCurrentWord(word);
        setTimeLeft(10);
        setIsActive(true);
    };

    const handleNext = () => {
        if (settings.soundEnabled) audioManager.playCorrect();
        onScore(1);
        onEndTurn();
    };

    if (timeLeft === 0) {
        return (
            <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '2rem', flex: 1, textAlign: 'center' }}>
                <h2 style={{ fontSize: '3rem', color: 'var(--danger-color)' }}>SÜRE BİTTİ!</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Kelime bulmakta geç kaldın. (-1 puan)</p>
                <Button onClick={onEndTurn} style={{ padding: '1rem 3rem' }}>Sıradaki Oyuncu</Button>
            </div>
        );
    }

    if (!isActive) {
        return (
            <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '2rem', flex: 1, textAlign: 'center' }}>
                <h2 style={{ fontSize: '2.5rem' }}>Kelime İlişkilendirme</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Ekranda çıkan kelimeyle ilgili aklına gelen ilk kelimeyi söyle ve telefonu devret. 10 saniyen var.</p>
                <Button variant="danger" onClick={startGame} style={{ padding: '2rem 4rem', fontSize: '1.5rem', marginTop: '1rem' }}>Başla</Button>
            </div>
        );
    }

    return (
        <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '2rem', flex: 1, textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '0 1rem' }}>
                <div style={{ fontWeight: 'bold', fontSize: '1.5rem', color: timeLeft <= 3 ? 'var(--danger-color)' : 'white' }}>⏱ {timeLeft}s</div>
            </div>

            <div className="glass-panel" style={{ padding: '2rem', width: '90%' }}>
                <h3 style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Sıradaki Kelime:</h3>
                <h1 style={{ fontSize: '4rem', color: 'var(--primary-color)' }}>{currentWord}</h1>
                <p style={{ marginTop: '2rem', fontSize: '1.2rem', color: 'var(--info-color)' }}>Söyle ve devret!</p>
            </div>

            <Button variant="primary" onClick={handleNext} style={{ padding: '2rem 4rem', fontSize: '1.5rem', marginTop: '2rem' }}>
                Söyledim (+1)
            </Button>
        </div>
    );
};

export default KelimeIliskilendirme;
