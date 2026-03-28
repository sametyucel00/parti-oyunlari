import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import { audioManager } from '../utils/audio';

const GulmemeChallenge = ({ onScore, onEndTurn }) => {
    const [phase, setPhase] = useState('start');

    const jokes = [
        'Geçen gün taksi çevirdim, hâlâ dönüyor.',
        'Sinemada on dakika ara dediler, aradım aradım açmadılar.',
        'Masada hangi örtü olmaz? Bitki örtüsü.',
        'En neşeli çiçek hangisi? Gül.',
        'Adamın biri kızmış, istemeye gelmişler.',
        'Dün spora yazıldım, bugün dinlenme günü ilan ettim.',
        'Telefonun şarjı yüzde yüzdü, moralim sıfırdı.',
        'Kahve içtim, uykum kaçtı; faturası kaldı.'
    ];

    const [joke, setJoke] = useState('');

    useEffect(() => {
        setJoke(jokes[Math.floor(Math.random() * jokes.length)]);
    }, []);

    const handleResult = (laughed) => {
        if (!laughed) {
            audioManager.playCorrect();
            onScore(1);
        } else {
            audioManager.playWrong();
        }
        onEndTurn();
    };

    if (phase === 'start') {
        return (
            <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '2rem', flex: 1, textAlign: 'center' }}>
                <h2 style={{ fontSize: '2.5rem' }}>Gülmeme Challenge</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Ekrandaki şakayı oku. Gülmeden kalabilirsen puan alırsın.</p>
                <Button variant="primary" onClick={() => setPhase('challenge')} style={{ padding: '2rem 4rem', fontSize: '1.5rem', marginTop: '1rem' }}>
                    Challenge'ı Başlat
                </Button>
            </div>
        );
    }

    return (
        <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '2rem', flex: 1, textAlign: 'center' }}>
            <h2 style={{ fontSize: '2rem', color: 'var(--warning-color)' }}>SAKIN GÜLME</h2>
            <div className="glass-panel" style={{ padding: '2rem', width: '90%' }}>
                <p style={{ fontSize: '1.5rem' }}>'{joke}'</p>
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>Sonucu dürüstçe işaretle.</p>
            <div style={{ display: 'flex', gap: '1rem', width: '90%' }}>
                <Button variant="danger" onClick={() => handleResult(true)} style={{ flex: 1 }}>Güldüm</Button>
                <Button variant="primary" onClick={() => handleResult(false)} style={{ flex: 1, background: 'var(--success-color)' }}>Gülmedim (+1)</Button>
            </div>
        </div>
    );
};

export default GulmemeChallenge;
