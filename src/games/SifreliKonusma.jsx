import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import sifreliData from '../data/games/sifrelikonusma.json';
import { audioManager } from '../utils/audio';
import { useAppContext } from '../context/AppContext';
import { FaCheck, FaForward } from 'react-icons/fa';

const ROUND_TIME = 60;

const SifreliKonusma = ({ onScore, onEndTurn }) => {
    const { settings } = useAppContext();
    const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
    const [phrases, setPhrases] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [isActive, setIsActive] = useState(false);

    const vowels = ['a', 'e', 'ı', 'i', 'u', 'ü', 'o', 'ö', 'A', 'E', 'I', 'İ', 'U', 'Ü', 'O', 'Ö'];

    useEffect(() => {
        let pool = JSON.parse(localStorage.getItem('game_pool_sifreli_v2') || '[]');
        if (pool.length < 5) pool = [...sifreliData].sort(() => 0.5 - Math.random());
        setPhrases(pool);
        localStorage.setItem('game_pool_sifreli_v2', JSON.stringify(pool));
    }, []);

    useEffect(() => {
        let interval = null;
        if (isActive && timeLeft > 0) interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
        else if (timeLeft === 0 && isActive) {
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
        } else if (settings.soundEnabled) audioManager.playWrong();

        const nextPool = [...phrases];
        nextPool.splice(currentIndex, 1);
        if (nextPool.length === 0) {
            const fresh = [...sifreliData].sort(() => 0.5 - Math.random());
            setPhrases(fresh);
            localStorage.setItem('game_pool_sifreli_v2', JSON.stringify(fresh));
            setCurrentIndex(0);
        } else {
            setPhrases(nextPool);
            localStorage.setItem('game_pool_sifreli_v2', JSON.stringify(nextPool));
            setCurrentIndex(prev => prev % nextPool.length);
        }
    };

    if (timeLeft === 0) {
        return (
            <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '2rem', flex: 1, textAlign: 'center' }}>
                <h2 style={{ fontSize: '3rem', color: 'var(--danger-color)' }}>Süre Bitti!</h2>
                <div style={{ fontSize: '2rem' }}>Çözülen Cümle: <strong style={{ color: 'var(--success-color)' }}>{score}</strong></div>
                <Button onClick={onEndTurn} style={{ padding: '1rem 3rem' }}>Sıradaki Oyuncu</Button>
            </div>
        );
    }

    if (!isActive) {
        return (
            <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '2rem', flex: 1, textAlign: 'center' }}>
                <h2 style={{ fontSize: '2.5rem' }}>Şifreli Konuşma</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Cümleyi tüm sesli harfleri "o" yaparak oku.</p>
                <p style={{ color: 'var(--text-secondary)' }}>(Örnek: "Merhaba" -&gt; "Morhobo")</p>
                <Button variant="primary" onClick={() => setIsActive(true)} style={{ padding: '2rem 4rem', fontSize: '1.5rem' }}>Başla</Button>
            </div>
        );
    }

    let cipheredText = '';
    const currentPhrase = phrases[currentIndex] || '';
    for (const char of currentPhrase) {
        if (vowels.includes(char)) cipheredText += char === char.toUpperCase() ? 'O' : 'o';
        else cipheredText += char;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: timeLeft <= 10 ? 'var(--danger-color)' : 'white' }}>⏱ {timeLeft}s</div>
                <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Puan: <span style={{ color: 'var(--success-color)' }}>{score}</span></div>
            </div>
            <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Bunu Oku:</span>
                <h1 style={{ fontSize: '2.6rem', textAlign: 'center', color: 'var(--primary-color)' }}>{cipheredText}</h1>
                <p style={{ fontSize: '1.1rem', color: 'var(--success-color)', marginTop: '1rem' }}>Gerçek Cümle: {currentPhrase}</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', height: '80px', marginTop: '1rem' }}>
                <Button variant="outline" onClick={() => handleAction(false)} style={{ flex: 1, flexDirection: 'column', gap: '0.2rem' }}>
                    <FaForward size={20} /><span>Pas</span>
                </Button>
                <Button variant="primary" onClick={() => handleAction(true)} style={{ flex: 1, flexDirection: 'column', gap: '0.2rem', background: 'var(--success-color)' }}>
                    <FaCheck size={20} /><span>Bildiler (+1)</span>
                </Button>
            </div>
        </div>
    );
};

export default SifreliKonusma;
