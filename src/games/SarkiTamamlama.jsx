import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import sarkiData from '../data/games/sarkitamamlama.json';
import { audioManager } from '../utils/audio';
import { useAppContext } from '../context/AppContext';

const ROUND_TIME = 15;

const normalizeSong = (item) => {
    if (item && typeof item === 'object') {
        const song = typeof item.song === 'string' ? item.song : 'Bilinmeyen Şarkı';
        const artist = typeof item.artist === 'string' ? item.artist : 'Bilinmeyen Sanatçı';
        const start = typeof item.start === 'string' ? item.start : '';
        const finish = typeof item.finish === 'string' ? item.finish : '';
        return { song, artist, start, finish };
    }

    if (typeof item === 'string') {
        return { song: item, artist: 'Bilinmiyor', start: `${item} şarkısından bir giriş`, finish: `${item} şarkısının devamı` };
    }

    return { song: 'Bilinmeyen Şarkı', artist: 'Bilinmiyor', start: '-', finish: '-' };
};

const SarkiTamamlama = ({ onScore, onEndTurn }) => {
    const { settings } = useAppContext();
    const [phase, setPhase] = useState('start');
    const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
    const [currentSong, setCurrentSong] = useState(null);

    useEffect(() => {
        let timer = null;
        if (phase === 'active' && timeLeft > 0) {
            timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
        } else if (phase === 'active' && timeLeft === 0) {
            setPhase('reveal');
            if (settings.soundEnabled) audioManager.playWrong();
        }
        return () => clearInterval(timer);
    }, [phase, timeLeft, settings.soundEnabled]);

    const getNextSong = () => {
        let pool = JSON.parse(localStorage.getItem('game_pool_sarki_v3') || '[]');
        pool = (Array.isArray(pool) ? pool : []).map(normalizeSong).filter(Boolean);

        if (pool.length === 0) {
            pool = [...sarkiData].map(normalizeSong).sort(() => 0.5 - Math.random());
        }

        const song = pool.pop();
        localStorage.setItem('game_pool_sarki_v3', JSON.stringify(pool));
        return song;
    };

    const handleStart = () => {
        setCurrentSong(getNextSong());
        setTimeLeft(ROUND_TIME);
        setPhase('active');
    };

    const handleScore = (success) => {
        if (success) {
            if (settings.soundEnabled) audioManager.playCorrect();
            onScore(1);
        } else if (settings.soundEnabled) {
            audioManager.playWrong();
        }
        onEndTurn();
    };

    if (phase === 'start') {
        return (
            <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '2rem', flex: 1, textAlign: 'center' }}>
                <h2 style={{ fontSize: '2.5rem' }}>Şarkı Tamamlama</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Ekrandaki sözün devamını getir. {ROUND_TIME} saniyen var.</p>
                <Button variant="primary" onClick={handleStart} style={{ padding: '2rem 4rem', fontSize: '1.5rem' }}>
                    Hazırım
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
                    <p style={{ color: 'var(--text-secondary)' }}>Sözler:</p>
                    <h2 style={{ fontSize: '1.8rem', color: 'var(--warning-color)', fontStyle: 'italic', whiteSpace: 'pre-line', lineHeight: '1.4' }}>
                        "{currentSong?.start || '-'}"
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>Devamı nedir?</p>
                </div>

                <Button variant="primary" onClick={() => setPhase('reveal')} style={{ padding: '2rem 4rem', fontSize: '1.5rem' }}>
                    Cevabı Göster
                </Button>
            </div>
        );
    }

    return (
        <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '2rem', flex: 1, textAlign: 'center' }}>
            <h2 style={{ fontSize: '2rem', color: 'var(--primary-color)' }}>Doğru Cevap</h2>

            <div className="glass-panel" style={{ padding: '2rem', width: '90%' }}>
                <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                    <h3 style={{ color: 'var(--primary-color)', fontSize: '1.2rem', marginBottom: '0.3rem' }}>{currentSong?.song || '-'}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 'bold' }}>{currentSong?.artist || '-'}</p>
                </div>

                <h2 style={{ fontSize: '1.2rem', color: 'var(--warning-color)', fontStyle: 'italic', opacity: 0.8, marginBottom: '1rem', whiteSpace: 'pre-line' }}>
                    "{currentSong?.start || '-'}"
                </h2>
                <h1 style={{ fontSize: '1.5rem', color: 'var(--success-color)', fontStyle: 'italic', whiteSpace: 'pre-line', lineHeight: '1.4' }}>
                    "{currentSong?.finish || '-'}"
                </h1>
            </div>

            <div style={{ display: 'flex', gap: '1rem', width: '90%' }}>
                <Button variant="outline" onClick={() => handleScore(false)} style={{ flex: 1, borderColor: 'var(--danger-color)', color: 'var(--danger-color)' }}>
                    Yanlış (0)
                </Button>
                <Button variant="primary" onClick={() => handleScore(true)} style={{ flex: 1, background: 'var(--success-color)' }}>
                    Doğru (+1)
                </Button>
            </div>
        </div>
    );
};

export default SarkiTamamlama;
