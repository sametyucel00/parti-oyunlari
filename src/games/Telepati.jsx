import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import telepatiData from '../data/games/telepati.json';
import { PlayerStorage, GroupStorage } from '../utils/storage';
import { useSearchParams } from 'react-router-dom';
import { audioManager } from '../utils/audio';
import { useAppContext } from '../context/AppContext';

const Telepati = ({ player, onScore, onEndTurn }) => {
    const { settings } = useAppContext();
    const [searchParams] = useSearchParams();
    const mode = searchParams.get('mode') || 'individual';

    const [partner, setPartner] = useState(null);
    const [category, setCategory] = useState('');
    const [phase, setPhase] = useState('select_partner');
    const [count, setCount] = useState(3);

    const currentName = player.name;
    const allLoaded = mode === 'individual' ? PlayerStorage.getPlayers() : GroupStorage.getGroups();
    const potentialPartners = allLoaded.filter(p => p.name !== currentName);

    useEffect(() => {
        let pool = JSON.parse(localStorage.getItem('game_pool_telepati_v2') || '[]');
        if (pool.length === 0) {
            pool = [...telepatiData].sort(() => 0.5 - Math.random());
        }
        const cat = pool.pop();
        setCategory(cat);
        localStorage.setItem('game_pool_telepati_v2', JSON.stringify(pool));
    }, []);

    useEffect(() => {
        let timer = null;
        if (phase === 'countdown' && count > 0) {
            timer = setTimeout(() => setCount(c => c - 1), 1000);
        } else if (phase === 'countdown' && count === 0) {
            setPhase('result');
        }
        return () => clearTimeout(timer);
    }, [phase, count]);

    const handleResult = (matched) => {
        if (matched) {
            if (settings.soundEnabled) audioManager.playCorrect();
            onScore(2);
        } else if (settings.soundEnabled) {
            audioManager.playWrong();
        }
        onEndTurn();
    };

    if (phase === 'select_partner') {
        return (
            <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '2rem', flex: 1, textAlign: 'center' }}>
                <h2 style={{ fontSize: '2.5rem' }}>Akıl Okuma (Telepati)</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Bu turu kiminle oynayacaksın? Bir partner seç.</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '90%', maxHeight: '40vh', overflowY: 'auto' }}>
                    {potentialPartners.map((p, i) => (
                        <Button key={i} variant="outline" onClick={() => { setPartner(p); setPhase('ready'); }} style={{ padding: '1rem' }}>
                            {p.avatar} {p.name}
                        </Button>
                    ))}
                </div>
            </div>
        );
    }

    if (phase === 'ready') {
        return (
            <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '2rem', flex: 1, textAlign: 'center' }}>
                <h2 style={{ fontSize: '2rem', color: 'var(--primary-color)' }}>{player.name} & {partner.name}</h2>
                <div className="glass-panel" style={{ padding: '2rem', width: '90%' }}>
                    <h3 style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Kategori:</h3>
                    <h1 style={{ fontSize: '2.5rem', color: 'var(--warning-color)' }}>{category}</h1>
                </div>
                <p style={{ color: 'var(--text-secondary)' }}>Göz göze gelin. Sayım bitince aynı anda ilk aklınıza gelen kelimeyi söyleyin.</p>

                <Button variant="primary" onClick={() => setPhase('countdown')} style={{ padding: '2rem 4rem', fontSize: '1.5rem', marginTop: '1rem' }}>
                    Hazırız, Başlat!
                </Button>
            </div>
        );
    }

    if (phase === 'countdown') {
        return (
            <div className="flex-center animate-slide-up" style={{ flex: 1 }}>
                <h1 style={{ fontSize: '8rem', color: 'var(--danger-color)' }}>{count}</h1>
            </div>
        );
    }

    return (
        <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '2rem', flex: 1, textAlign: 'center' }}>
            <h1 style={{ fontSize: '4rem', color: 'var(--info-color)' }}>SÖYLEYİN!</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '2rem' }}>Aynı kelimeyi mi söylediniz?</p>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', width: '90%' }}>
                <Button variant="outline" onClick={() => handleResult(false)} style={{ flex: 1, borderColor: 'var(--danger-color)', color: 'var(--danger-color)' }}>
                    Farklı
                </Button>
                <Button variant="primary" onClick={() => handleResult(true)} style={{ flex: 1, background: 'var(--success-color)' }}>
                    Aynı (+2)
                </Button>
            </div>
        </div>
    );
};

export default Telepati;
