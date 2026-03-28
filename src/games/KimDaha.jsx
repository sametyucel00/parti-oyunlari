import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import { useGameData } from '../hooks/useGameData';
import kimdahaData from '../data/games/kimdaha.json';

const KimDaha = ({ onScore, onEndTurn }) => {
    const [question] = useGameData('kimdaha', kimdahaData);
    const [countdown, setCountdown] = useState(null);

    useEffect(() => {
        let timer;
        if (countdown !== null && countdown > 0) {
            timer = setTimeout(() => setCountdown(c => c - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [countdown]);

    if (countdown === 0) {
        return (
            <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '2rem', flex: 1, textAlign: 'center' }}>
                <h2 style={{ fontSize: '4rem', color: 'var(--danger-color)' }}>GÖSTER!</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Herkes parmağıyla birini göstersin.</p>
                <p style={{ marginTop: '1rem' }}>En çok gösterilen kişi -1 ceza puanı alır.</p>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                    <Button variant="danger" onClick={() => { onScore(-1); onEndTurn(); }}>
                        O Kişi Benim (-1)
                    </Button>
                    <Button variant="outline" onClick={onEndTurn}>
                        Başka Biri
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '3rem', flex: 1, textAlign: 'center', padding: '1rem' }}>
            <div className="glass-panel" style={{ width: '100%' }}>
                <h2 style={{ fontSize: '2rem', color: 'var(--primary-color)' }}>Kim Daha...?</h2>
                <h1 style={{ fontSize: '2.5rem', marginTop: '2rem' }}>{question}</h1>
            </div>

            {countdown === null ? (
                <Button onClick={() => setCountdown(3)} style={{ padding: '1.5rem 3rem', fontSize: '1.5rem' }}>
                    3'ten Geri Say
                </Button>
            ) : (
                <div style={{ fontSize: '6rem', fontWeight: 'bold', color: 'var(--warning-color)' }}>
                    {countdown}
                </div>
            )}
        </div>
    );
};

export default KimDaha;
