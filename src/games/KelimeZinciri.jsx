import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import kelimeZinciriData from '../data/games/kelimezinciri.json';

const ROUND_TIME = 60;

const KelimeZinciri = ({ onScore, onEndTurn }) => {
    const [currentWord, setCurrentWord] = useState('');
    const [chainCount, setChainCount] = useState(0);
    const [gameTime, setGameTime] = useState(ROUND_TIME);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        let interval = null;
        if (isActive && gameTime > 0) {
            interval = setInterval(() => setGameTime(t => t - 1), 1000);
        } else if (isActive && gameTime === 0) {
            setIsActive(false);
        }
        return () => clearInterval(interval);
    }, [isActive, gameTime]);

    const startGame = () => {
        const word = kelimeZinciriData[Math.floor(Math.random() * kelimeZinciriData.length)];
        setCurrentWord(word);
        setChainCount(0);
        setGameTime(ROUND_TIME);
        setIsActive(true);
    };

    const handleSaidWord = () => {
        setChainCount(c => c + 1);
        onScore(1);
    };

    if (gameTime === 0 && !isActive && currentWord !== '') {
        return (
            <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '2rem', flex: 1, textAlign: 'center' }}>
                <h2 style={{ fontSize: '3rem', color: 'var(--danger-color)' }}>Süre Bitti!</h2>
                <div style={{ fontSize: '2rem' }}>Zincir Uzunluğu: <strong style={{ color: 'var(--success-color)' }}>{chainCount}</strong></div>
                <Button onClick={onEndTurn} style={{ padding: '1rem 3rem' }}>Sıradaki Oyuncu</Button>
            </div>
        );
    }

    if (!isActive) {
        return (
            <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '2rem', flex: 1, textAlign: 'center' }}>
                <h2 style={{ fontSize: '2.5rem' }}>Kelime Zinciri</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Ekranda görünen kelimenin son harfiyle başlayan bir kelime söyle. Sonra onun son harfiyle devam et.</p>
                <p style={{ color: 'var(--text-secondary)' }}>60 saniyede kaç doğru kelime üretebildiğini sayıyoruz.</p>
                <Button variant="primary" onClick={startGame} style={{ padding: '2rem 4rem', fontSize: '1.5rem', marginTop: '1rem' }}>
                    Başla (60 Saniye)
                </Button>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: gameTime <= 10 ? 'var(--danger-color)' : 'white' }}>⏱ {gameTime}s</div>
                <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Puan: <span style={{ color: 'var(--success-color)' }}>{chainCount}</span></div>
            </div>

            <div className="glass-panel animate-slide-up" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Başlangıç Kelimesi:</span>
                <h1 style={{ fontSize: '3rem', textAlign: 'center', color: 'var(--primary-color)' }}>{currentWord}</h1>
                <p style={{ fontSize: '1.2rem', marginTop: '2rem', color: 'var(--warning-color)' }}>Yeni kelimeyi söyle ve butona bas.</p>
            </div>

            <Button variant="primary" onClick={handleSaidWord} style={{ padding: '2rem', fontSize: '1.5rem', marginTop: '1rem', background: 'var(--success-color)' }}>
                Söyledim (+1)
            </Button>
        </div>
    );
};

export default KelimeZinciri;
