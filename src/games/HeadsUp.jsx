import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import headsupData from '../data/games/headsup.json';
import { useAppContext } from '../context/AppContext';
import { audioManager } from '../utils/audio';
import { useGameData } from '../hooks/useGameData';

const ROUND_TIME = 60;

const HeadsUp = ({ player, onScore, onEndTurn }) => {
    const { settings } = useAppContext();
    const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
    const [currentWord, getNextWord] = useGameData('headsup', headsupData);
    const [score, setScore] = useState(0);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        let interval = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(t => t - 1);
            }, 1000);
        } else if (timeLeft === 0 && isActive) {
            setIsActive(false);
            if (settings.soundEnabled) audioManager.playWrong();
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft, settings.soundEnabled]);

    const handleAction = (isCorrect) => {
        if (isCorrect) {
            if (settings.soundEnabled) audioManager.playCorrect();
            setScore(s => s + 1);
            onScore(1);
        } else {
            if (settings.soundEnabled) audioManager.playWrong();
        }

        getNextWord();
    };

    if (timeLeft === 0) {
        return (
            <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '2rem', flex: 1 }}>
                <h2 style={{ fontSize: '3rem', color: 'var(--danger-color)' }}>{'S\u00fcre Bitti!'}</h2>
                <div style={{ fontSize: '2rem' }}>Bulunan Kelime: <strong style={{ color: 'var(--success-color)' }}>{score}</strong></div>
                <Button onClick={onEndTurn} style={{ padding: '1rem 3rem' }}>{'S\u0131radaki Oyuncu'}</Button>
            </div>
        );
    }

    if (!isActive) {
        return (
            <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '2rem', flex: 1, textAlign: 'center' }}>
                <h2 style={{ fontSize: '2rem' }}>{'Telefonu Aln\u0131na Koy!'}</h2>
                <p style={{ color: 'var(--text-secondary)' }}>{'Ekran arkada\u015flar\u0131na d\u00f6n\u00fck olsun.'}</p>
                <p style={{ color: 'var(--text-secondary)' }}>{'Haz\u0131r olunca arkada\u015flar\u0131n BA\u015eLA\u0027ya bass\u0131n!'}</p>
                <Button variant="primary" onClick={() => setIsActive(true)} style={{ padding: '2rem 4rem', fontSize: '1.5rem', marginTop: '1rem' }}>
                    {'BA\u015eLA!'}
                </Button>
            </div>
        );
    }

    return (
        <div className="animate-slide-up" style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            width: '100%',
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'var(--bg-color)',
            zIndex: 50
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', fontSize: '1.5rem', fontWeight: 'bold' }}>
                <span style={{ color: 'var(--danger-color)' }}>{timeLeft}s</span>
                <span style={{ color: 'var(--success-color)' }}>{score} Puan</span>
            </div>

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <h1 style={{ fontSize: '4rem', textAlign: 'center', padding: '0 1rem', wordBreak: 'break-word' }}>
                    {currentWord}
                </h1>
            </div>

            <div style={{ display: 'flex', height: '150px' }}>
                <div
                    onClick={() => handleAction(false)}
                    style={{ flex: 1, background: 'var(--danger-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', cursor: 'pointer', fontWeight: 'bold' }}>
                    PAS
                </div>
                <div
                    onClick={() => handleAction(true)}
                    style={{ flex: 1, background: 'var(--success-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', cursor: 'pointer', fontWeight: 'bold' }}>
                    {'DO\u011eRU'}
                </div>
            </div>
        </div>
    );
};

export default HeadsUp;
