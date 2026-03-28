import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../components/Button';
import { audioManager } from '../utils/audio';

const HizliParmaklar = ({ onScore, onEndTurn }) => {
    const [phase, setPhase] = useState('start');
    const [reactionTime, setReactionTime] = useState(0);
    const startTime = useRef(0);

    useEffect(() => {
        let timeout = null;
        if (phase === 'waiting') {
            const waitTime = Math.floor(Math.random() * 4000) + 2000;
            timeout = setTimeout(() => {
                setPhase('ready');
                startTime.current = performance.now();
            }, waitTime);
        }
        return () => clearTimeout(timeout);
    }, [phase]);

    const handleTap = () => {
        if (phase === 'waiting') {
            setPhase('complete');
            setReactionTime('Hatalı çıkış!');
            onScore(-1);
            return;
        }

        if (phase === 'ready') {
            const ms = Math.floor(performance.now() - startTime.current);
            setReactionTime(`${ms} ms`);

            let points = 0;
            if (ms < 300) points = 3;
            else if (ms < 500) points = 2;
            else if (ms < 800) points = 1;

            if (points > 0) audioManager.playCorrect();
            else audioManager.playWrong();

            onScore(points);
            setPhase('complete');
        }
    };

    if (phase === 'start') {
        return (
            <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '2rem', flex: 1, textAlign: 'center' }}>
                <h2 style={{ fontSize: '2.5rem' }}>Hızlı Parmaklar</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Ekran kırmızı iken bekle. Yeşil olunca en hızlı şekilde ekrana dokun!</p>
                <Button variant="primary" onClick={() => setPhase('waiting')} style={{ padding: '2rem 4rem', fontSize: '1.5rem', marginTop: '1rem' }}>
                    Hazırım
                </Button>
            </div>
        );
    }

    if (phase === 'complete') {
        return (
            <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '2rem', flex: 1, textAlign: 'center' }}>
                <h2 style={{ fontSize: '3rem', color: 'var(--primary-color)' }}>Sonuç:</h2>
                <div style={{ fontSize: '4rem', fontWeight: 'bold', color: reactionTime === 'Hatalı çıkış!' ? 'var(--danger-color)' : 'var(--success-color)' }}>
                    {reactionTime}
                </div>
                <Button onClick={onEndTurn} style={{ padding: '1rem 3rem', marginTop: '2rem' }}>Sıradaki Oyuncu</Button>
            </div>
        );
    }

    const isReady = phase === 'ready';
    const bgColor = isReady ? 'var(--success-color)' : 'var(--danger-color)';
    const text = isReady ? 'DOKUN!' : 'BEKLE...';

    return (
        <div
            onClick={handleTap}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'absolute',
                top: '-1rem',
                left: '-1rem',
                right: '-1rem',
                bottom: '-1rem',
                background: bgColor,
                cursor: 'pointer',
                zIndex: 40,
                borderRadius: 'inherit'
            }}
        >
            <h1 style={{ fontSize: '5rem', color: 'white', userSelect: 'none' }}>{text}</h1>
        </div>
    );
};

export default HizliParmaklar;
