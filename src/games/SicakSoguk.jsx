import React, { useState } from 'react';
import { Button } from '../components/Button';
import sicakSogukData from '../data/games/sicaksoguk.json';
import { audioManager } from '../utils/audio';
import { useAppContext } from '../context/AppContext';
import { useGameData } from '../hooks/useGameData';

const SicakSoguk = ({ onScore, onEndTurn }) => {
    const { settings } = useAppContext();
    const [phase, setPhase] = useState('start');
    const [targetObject, getNextObject] = useGameData('sicaksoguk_v2', sicakSogukData);

    const handleStart = () => {
        getNextObject();
        setPhase('active');
    };

    const playFeedback = (type) => {
        if (!settings.soundEnabled) return;

        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === 'hot') {
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.2);
        } else {
            osc.frequency.setValueAtTime(200, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
            gain.gain.setValueAtTime(1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.3);
        }
    };

    const handleFound = () => {
        if (settings.soundEnabled) audioManager.playCorrect();
        onScore(1);
        onEndTurn();
    };

    if (phase === 'start') {
        return (
            <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '2rem', flex: 1, textAlign: 'center' }}>
                <h2 style={{ fontSize: '2.5rem' }}>Sıcak mı Soğuk mu?</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Odadaki bir nesneyi seç ve saklı tut.</p>
                <p style={{ color: 'var(--text-secondary)' }}>Diğerleri yaklaştıkça sıcak, uzaklaştıkça soğuk de.</p>
                <Button variant="danger" onClick={handleStart} style={{ padding: '2rem 4rem', fontSize: '1.5rem' }}>
                    Başla
                </Button>
            </div>
        );
    }

    return (
        <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '1rem', flex: 1, textAlign: 'center', padding: '1rem' }}>
            <div className="glass-panel" style={{ padding: '1rem', width: '100%', marginBottom: '1rem' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Gizli nesne:</p>
                <h2 style={{ fontSize: '1.8rem', color: 'var(--warning-color)' }}>{targetObject}</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '300px' }}>
                <Button variant="danger" onClick={() => playFeedback('hot')} style={{ padding: '2.5rem', fontSize: '1.8rem', background: '#ff4757', border: 'none' }}>
                    SICAK
                </Button>
                <Button variant="outline" onClick={() => playFeedback('cold')} style={{ padding: '2.5rem', fontSize: '1.8rem', background: '#74b9ff', border: 'none', color: '#000' }}>
                    SOĞUK
                </Button>
            </div>

            <Button variant="outline" onClick={handleFound} style={{ padding: '1rem 3rem', borderColor: 'var(--success-color)', color: 'var(--success-color)' }}>
                Bulundu (+1)
            </Button>
        </div>
    );
};

export default SicakSoguk;
