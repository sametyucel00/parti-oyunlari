import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import { useAppContext } from '../context/AppContext';
import { audioManager } from '../utils/audio';
import { FaCheck, FaTimes, FaForward, FaFlagCheckered } from 'react-icons/fa';
import { useGameData } from '../hooks/useGameData';
import tabooData from '../data/games/taboo.json';

const ROUND_TIME = 60;

const Tabu = ({ player, onScore, onEndTurn }) => {
    const { settings } = useAppContext();
    const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
    const [currentCard, getNextCard] = useGameData('taboo_v2', tabooData);
    const [roundScore, setRoundScore] = useState(0);
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

    const handleCorrect = () => {
        if (settings.soundEnabled) audioManager.playCorrect();
        setRoundScore(s => s + 1);
        onScore(1);
        getNextCard();
    };

    const handleTaboo = () => {
        if (settings.soundEnabled) audioManager.playWrong();
        setRoundScore(s => s - 1);
        onScore(-1);
        getNextCard();
    };

    if (timeLeft === 0) {
        return (
            <div className="flex-center animate-slide-up" style={{ flex: 1, flexDirection: 'column', gap: '2rem', textAlign: 'center' }}>
                <h2 style={{ fontSize: '3rem', color: 'var(--danger-color)' }}>SÜRE BİTTİ!</h2>
                <div className="glass-panel" style={{ padding: '2rem 4rem' }}>
                    <FaFlagCheckered size={48} color="var(--primary-color)" />
                    <h3 style={{ fontSize: '2rem', margin: '1rem 0' }}>Bu Tur Kazancin</h3>
                    <p style={{ fontSize: '4rem', fontWeight: 'bold', color: roundScore >= 0 ? 'var(--success-color)' : 'var(--danger-color)', margin: 0 }}>
                        {roundScore > 0 ? `+${roundScore}` : roundScore}
                    </p>
                </div>
                <Button onClick={onEndTurn} style={{ fontSize: '1.2rem', padding: '1rem 3rem' }}>Turu Bitir</Button>
            </div>
        );
    }

    if (!isActive) {
        return (
            <div className="flex-center animate-slide-up" style={{ flex: 1, flexDirection: 'column', gap: '2rem' }}>
                <h2 style={{ fontSize: '2rem' }}>Hazır mısın {player.name}?</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Süren: {ROUND_TIME} saniye</p>
                <Button variant="primary" onClick={() => setIsActive(true)} style={{ padding: '1.5rem 3rem', fontSize: '1.5rem' }}>Başla!</Button>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.5rem 1rem', borderRadius: '1rem', fontSize: '1.2rem', fontWeight: 'bold', color: timeLeft <= 10 ? 'var(--danger-color)' : 'white' }}>
                    ⏱ {timeLeft}s
                </div>
                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.5rem 1rem', borderRadius: '1rem', fontSize: '1.2rem', fontWeight: 'bold' }}>
                    Tur Puanı: <span style={{ color: roundScore >= 0 ? 'var(--success-color)' : 'var(--danger-color)' }}>{roundScore}</span>
                </div>
            </div>

            {currentCard && (
                <div className="glass-panel animate-slide-up" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2rem', background: 'var(--bg-color)' }}>
                    <h2 style={{ fontSize: '3rem', color: 'var(--primary-color)', borderBottom: '2px solid var(--surface-border)', paddingBottom: '1rem', width: '100%', textAlign: 'center' }}>
                        {currentCard.word}
                    </h2>

                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {currentCard.forbidden.map((f, idx) => (
                            <li key={idx} style={{ fontSize: '1.5rem', color: 'var(--danger-color)', fontWeight: 'bold' }}>{f}</li>
                        ))}
                    </ul>
                </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', height: '80px', marginTop: '1rem' }}>
                <Button variant="danger" onClick={handleTaboo} style={{ flex: 1, flexDirection: 'column', gap: '0.2rem' }}>
                    <FaTimes size={20} /><span style={{ fontSize: '0.8rem' }}>Tabu (-1)</span>
                </Button>
                <Button variant="outline" onClick={getNextCard} style={{ flex: 1, flexDirection: 'column', gap: '0.2rem' }}>
                    <FaForward size={20} /><span style={{ fontSize: '0.8rem' }}>Pas (0)</span>
                </Button>
                <Button variant="primary" onClick={handleCorrect} style={{ flex: 1, flexDirection: 'column', gap: '0.2rem', background: 'var(--success-color)' }}>
                    <FaCheck size={20} /><span style={{ fontSize: '0.8rem' }}>Doğru (+1)</span>
                </Button>
            </div>
        </div>
    );
};

export default Tabu;
