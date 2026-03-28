import React, { useState } from 'react';
import { Button } from '../components/Button';
import mansetData from '../data/games/mansetat.json';
import { audioManager } from '../utils/audio';

const MansetAt = ({ onScore, onEndTurn }) => {
    const [phase, setPhase] = useState('start');
    const [prompt, setPrompt] = useState('');

    const handleStart = () => {
        let pool = JSON.parse(localStorage.getItem('game_pool_manset_v2') || '[]');
        if (!Array.isArray(pool) || pool.length === 0) {
            pool = [...mansetData].sort(() => 0.5 - Math.random());
        }
        const item = pool.pop();
        localStorage.setItem('game_pool_manset_v2', JSON.stringify(pool));

        setPrompt(item);
        setPhase('active');
    };

    const handleScore = (success) => {
        if (success) {
            audioManager.playCorrect();
            onScore(1);
        } else {
            audioManager.playWrong();
            onScore(0);
        }
        onEndTurn();
    };

    if (phase === 'start') {
        return (
            <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '2rem', flex: 1, textAlign: 'center' }}>
                <h2 style={{ fontSize: '2.5rem' }}>Manşet At (Fake News)</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Ekranda çıkan tuhaf konuya tıklanma rekoru kıracak, komik ve abartılı bir haber manşeti uydur!</p>
                <Button variant="danger" onClick={handleStart} style={{ padding: '2rem 4rem', fontSize: '1.5rem', marginTop: '1rem' }}>
                    Haberi Getir
                </Button>
            </div>
        );
    }

    return (
        <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '2rem', flex: 1, textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.5rem', color: 'var(--danger-color)' }}>SON DAKİKA HABERİ</h2>

            <div className="glass-panel" style={{ padding: '2rem', width: '90%' }}>
                <h1 style={{ fontSize: '2rem', color: 'var(--warning-color)' }}>Konu: {prompt}</h1>
                <p style={{ marginTop: '2rem', fontSize: '1.2rem', color: 'white' }}>Yüksek sesle uyduruk manşetini oku!</p>
            </div>

            <p style={{ color: 'var(--text-secondary)' }}>Grup komik/yaratıcı buldu mu?</p>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', width: '90%' }}>
                <Button variant="outline" onClick={() => handleScore(false)} style={{ flex: 1, borderColor: 'var(--danger-color)', color: 'var(--danger-color)' }}>
                    Çok Kötüydü (0)
                </Button>
                <Button variant="primary" onClick={() => handleScore(true)} style={{ flex: 1, background: 'var(--success-color)' }}>
                    Harikaydı! (+1)
                </Button>
            </div>
        </div>
    );
};

export default MansetAt;
