import React, { useState } from 'react';
import { Button } from '../components/Button';
import dcData from '../data/games/dogrulukcesaret.json';
import { useGameData } from '../hooks/useGameData';

const DogrulukCesaret = ({ onScore, onEndTurn }) => {
    const [phase, setPhase] = useState('menu');
    const [prompt, setPrompt] = useState('');

    const [, getNextTruth] = useGameData('dc_truth_v2', dcData.dogruluk);
    const [, getNextDare] = useGameData('dc_dare_v2', dcData.cesaret);

    const handleChoice = (type) => {
        setPrompt(type === 'dogruluk' ? getNextTruth() : getNextDare());
        setPhase(type);
    };

    const handleFinish = (success) => {
        onScore(success ? 1 : -1);
        onEndTurn();
    };

    if (phase === 'menu') {
        return (
            <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '2rem', flex: 1, textAlign: 'center' }}>
                <h2 style={{ fontSize: '2.5rem' }}>Doğruluk mu Cesaret mi?</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Birini seç ve devam et.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '320px' }}>
                    <Button variant="primary" onClick={() => handleChoice('dogruluk')} style={{ padding: '1.4rem', fontSize: '1.2rem' }}>
                        DOĞRULUK
                    </Button>
                    <Button variant="danger" onClick={() => handleChoice('cesaret')} style={{ padding: '1.4rem', fontSize: '1.2rem' }}>
                        CESARET
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '2rem', flex: 1, textAlign: 'center' }}>
            <h3 style={{ color: phase === 'dogruluk' ? 'var(--info-color)' : 'var(--danger-color)', fontSize: '2rem' }}>
                {phase === 'dogruluk' ? 'DOĞRULUK' : 'CESARET'}
            </h3>
            <div className="glass-panel" style={{ padding: '2rem', margin: '0 1rem', width: '90%' }}>
                <h1 style={{ fontSize: '1.6rem', color: 'var(--primary-color)' }}>{prompt}</h1>
            </div>
            <div style={{ display: 'flex', gap: '1rem', width: '90%' }}>
                <Button variant="outline" onClick={() => handleFinish(false)} style={{ flex: 1, borderColor: 'var(--danger-color)', color: 'var(--danger-color)' }}>
                    Yapamadım (-1)
                </Button>
                <Button variant="primary" onClick={() => handleFinish(true)} style={{ flex: 1, background: 'var(--success-color)' }}>
                    Yaptım (+1)
                </Button>
            </div>
        </div>
    );
};

export default DogrulukCesaret;
