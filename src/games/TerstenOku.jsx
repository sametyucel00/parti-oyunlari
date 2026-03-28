import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import terstenOkuData from '../data/games/terstenoku.json';
import { audioManager } from '../utils/audio';
import { useAppContext } from '../context/AppContext';
import { FaCheck, FaForward } from 'react-icons/fa';

const ROUND_TIME = 60;

const normalizeWord = (item) => {
    if (item && typeof item === 'object') {
        const normal = typeof item.normal === 'string' ? item.normal : '';
        const reversed = typeof item.reversed === 'string' ? item.reversed : normal.split('').reverse().join('');
        return { normal, reversed };
    }

    if (typeof item === 'string') {
        return { normal: item, reversed: item.split('').reverse().join('') };
    }

    return { normal: '', reversed: '' };
};

const TerstenOku = ({ onScore, onEndTurn }) => {
    const { settings } = useAppContext();
    const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
    const [words, setWords] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [showAnswer, setShowAnswer] = useState(false);

    useEffect(() => {
        let pool = JSON.parse(localStorage.getItem('game_pool_tersten_v2') || '[]');
        pool = Array.isArray(pool) ? pool.map(normalizeWord).filter(w => w.normal) : [];

        if (pool.length < 5) {
            pool = [...terstenOkuData].map(normalizeWord).sort(() => 0.5 - Math.random());
        }

        setWords(pool);
        localStorage.setItem('game_pool_tersten_v2', JSON.stringify(pool));
    }, []);

    useEffect(() => {
        let interval = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
        } else if (timeLeft === 0 && isActive) {
            setIsActive(false);
            if (settings.soundEnabled) audioManager.playWrong();
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft, settings.soundEnabled]);

    const handleAction = (correct) => {
        if (correct) {
            if (settings.soundEnabled) audioManager.playCorrect();
            setScore(s => s + 1);
            onScore(1);
        } else if (settings.soundEnabled) {
            audioManager.playWrong();
        }

        setShowAnswer(false);

        const nextPool = [...words];
        nextPool.splice(currentIndex, 1);

        if (nextPool.length === 0) {
            const fresh = [...terstenOkuData].map(normalizeWord).sort(() => 0.5 - Math.random());
            setWords(fresh);
            localStorage.setItem('game_pool_tersten_v2', JSON.stringify(fresh));
            setCurrentIndex(0);
        } else {
            setWords(nextPool);
            localStorage.setItem('game_pool_tersten_v2', JSON.stringify(nextPool));
            setCurrentIndex(prev => prev % nextPool.length);
        }
    };

    if (timeLeft === 0) {
        return (
            <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '2rem', flex: 1, textAlign: 'center' }}>
                <h2 style={{ fontSize: '3rem', color: 'var(--danger-color)' }}>Süre Bitti!</h2>
                <div style={{ fontSize: '2rem' }}>Bulunan Kelime: <strong style={{ color: 'var(--success-color)' }}>{score}</strong></div>
                <Button onClick={onEndTurn} style={{ padding: '1rem 3rem' }}>Sıradaki Oyuncu</Button>
            </div>
        );
    }

    if (!isActive) {
        return (
            <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '2rem', flex: 1, textAlign: 'center' }}>
                <h2 style={{ fontSize: '2.5rem' }}>Tersten Oku</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Ekrandaki ters kelimeyi oku, grup doğru kelimeyi bulsun.</p>
                <p style={{ fontSize: '1.2rem', color: 'var(--danger-color)' }}>Süren: {ROUND_TIME} saniye</p>
                <Button variant="primary" onClick={() => setIsActive(true)} style={{ padding: '2rem 4rem', fontSize: '1.5rem', marginTop: '1rem' }}>
                    Başla
                </Button>
            </div>
        );
    }

    const current = words[currentIndex] || { reversed: '', normal: '' };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: timeLeft <= 10 ? 'var(--danger-color)' : 'white' }}>⏱ {timeLeft}s</div>
                <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Puan: <span style={{ color: 'var(--success-color)' }}>{score}</span></div>
            </div>

            <div className="glass-panel animate-slide-up" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.25rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Bunu Oku:</span>
                <h1 style={{ fontSize: '3rem', textAlign: 'center', color: 'var(--primary-color)' }}>{current.reversed}</h1>

                {showAnswer ? (
                    <h2 style={{ color: 'var(--success-color)' }}>Gerçek Kelime: {current.normal}</h2>
                ) : (
                    <Button variant="outline" onClick={() => setShowAnswer(true)}>Cevabı Göster</Button>
                )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', height: '80px', marginTop: '1rem' }}>
                <Button variant="outline" onClick={() => handleAction(false)} style={{ flex: 1, flexDirection: 'column', gap: '0.2rem' }}>
                    <FaForward size={20} /><span>Pas</span>
                </Button>
                <Button variant="primary" onClick={() => handleAction(true)} style={{ flex: 1, flexDirection: 'column', gap: '0.2rem', background: 'var(--success-color)' }}>
                    <FaCheck size={20} /><span>Doğru (+1)</span>
                </Button>
            </div>
        </div>
    );
};

export default TerstenOku;
