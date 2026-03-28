import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import sinemaData from '../data/games/sinema.json';
import { audioManager } from '../utils/audio';
import { useAppContext } from '../context/AppContext';
import { useGameData } from '../hooks/useGameData';
import { FaCheck, FaForward } from 'react-icons/fa';

const ROUND_TIME = 90; // Longer time for charades

const SessizSinema = ({ player, onScore, onEndTurn }) => {
    const { settings } = useAppContext();
    const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
    const [currentPhrase, getNextPhrase] = useGameData('sinema', sinemaData);
    const [score, setScore] = useState(0);
    const [isActive, setIsActive] = useState(false);

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
        } else {
            if (settings.soundEnabled) audioManager.playWrong();
        }

        getNextPhrase();
    };

    if (timeLeft === 0) {
        return (
            <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '2rem', flex: 1, textAlign: 'center' }}>
                <h2 style={{ fontSize: '3rem', color: 'var(--danger-color)' }}>Süre Bitti!</h2>
                <div style={{ fontSize: '2rem' }}>Bilinen Film: <strong style={{ color: 'var(--success-color)' }}>{score}</strong></div>
                <Button onClick={onEndTurn} style={{ padding: '1rem 3rem' }}>Sıradaki Oyuncu</Button>
            </div>
        );
    }

    if (!isActive) {
        return (
            <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '2rem', flex: 1, textAlign: 'center' }}>
                <h2 style={{ fontSize: '2.5rem' }}>Sessiz Sinema 2.0</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Ekranda grecein film isimlerini konu_madan anlat! Ses 1karmak ve kelimeleri dudakla sylemek kesinlikle YASAK.</p>
                <p style={{ fontSize: '1.2rem', color: 'var(--danger-color)' }}>Süren: {ROUND_TIME} Saniye</p>
                <Button variant="primary" onClick={() => setIsActive(true)} style={{ padding: '2rem 4rem', fontSize: '1.5rem', marginTop: '1rem' }}>
                    Başla
                </Button>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: timeLeft <= 15 ? 'var(--danger-color)' : 'white' }}> {timeLeft}s</div>
                <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Puan: <span style={{ color: 'var(--success-color)' }}>{score}</span></div>
            </div>

            <div className="glass-panel animate-slide-up" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Bunu Anlat:</span>
                <h1 style={{ fontSize: '3rem', textAlign: 'center', color: 'var(--primary-color)' }}>
                    {currentPhrase}
                </h1>
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

export default SessizSinema;
