import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import emojibulmacaData from '../data/games/emojibulmaca.json';
import { audioManager } from '../utils/audio';
import { useAppContext } from '../context/AppContext';
import { useGameData } from '../hooks/useGameData';
import { PoolStorage } from '../utils/storage';
import { FaCheck, FaForward } from 'react-icons/fa';

const ROUND_TIME = 60;

const isValidPuzzle = (item) => item && typeof item.emojis === 'string' && item.emojis.trim() && typeof item.answer === 'string' && item.answer.trim();

const EmojiBulmacasi = ({ onScore, onEndTurn }) => {
    const { settings } = useAppContext();
    const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
    const [currentPuzzle, getNextPuzzle, resetPool] = useGameData('emojibulmaca_v2', emojibulmacaData);
    const [score, setScore] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [showAnswer, setShowAnswer] = useState(false);

    useEffect(() => {
        const storedPool = PoolStorage.getPool('emojibulmaca_v2');
        if (Array.isArray(storedPool) && storedPool.length > 0 && !storedPool.every(isValidPuzzle)) {
            PoolStorage.clearPool('emojibulmaca_v2');
            resetPool();
        }
    }, [resetPool]);

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
        getNextPuzzle();
    };

    if (timeLeft === 0) {
        return (
            <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '2rem', flex: 1, textAlign: 'center' }}>
                <h2 style={{ fontSize: '3rem', color: 'var(--danger-color)' }}>Süre Bitti!</h2>
                <div style={{ fontSize: '2rem' }}>Bilinen Bulmaca: <strong style={{ color: 'var(--success-color)' }}>{score}</strong></div>
                <Button onClick={onEndTurn} style={{ padding: '1rem 3rem' }}>Sıradaki Oyuncu</Button>
            </div>
        );
    }

    if (!isActive) {
        return (
            <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '2rem', flex: 1, textAlign: 'center' }}>
                <h2 style={{ fontSize: '2.5rem' }}>Emoji Bulmacasi</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Ekrandaki emojilerin anlattigi kelimeyi veya ifadeyi bul.</p>
                <p style={{ fontSize: '1.2rem', color: 'var(--danger-color)' }}>Süren: {ROUND_TIME} saniye</p>
                <Button variant="primary" onClick={() => setIsActive(true)} style={{ padding: '2rem 4rem', fontSize: '1.5rem', marginTop: '1rem' }}>
                    Başla
                </Button>
            </div>
        );
    }

    const puzzle = isValidPuzzle(currentPuzzle) ? currentPuzzle : { emojis: '❓', answer: 'Veri hazırlanıyor...' };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: timeLeft <= 10 ? 'var(--danger-color)' : 'white' }}>⏱ {timeLeft}s</div>
                <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Puan: <span style={{ color: 'var(--success-color)' }}>{score}</span></div>
            </div>

            <div className="glass-panel animate-slide-up" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Bu hangi kelime?</span>
                <h1 style={{ fontSize: '3.2rem', textAlign: 'center', lineHeight: 1.3 }}>{puzzle.emojis}</h1>

                {showAnswer ? (
                    <h2 style={{ color: 'var(--success-color)', textAlign: 'center' }}>{puzzle.answer}</h2>
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

export default EmojiBulmacasi;
