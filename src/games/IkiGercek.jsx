import React, { useState } from 'react';
import { Button } from '../components/Button';
import { useAppContext } from '../context/AppContext';
import { audioManager } from '../utils/audio';

const IkiGercekBirYalan = ({ onScore, onEndTurn }) => {
    const { settings } = useAppContext();
    const [phase, setPhase] = useState('teller');

    const handleFinish = (groupFoundLie) => {
        if (!groupFoundLie) {
            if (settings.soundEnabled) audioManager.playCorrect();
            onScore(1);
        } else {
            if (settings.soundEnabled) audioManager.playWrong();
            onScore(0);
        }
        onEndTurn();
    };

    if (phase === 'teller') {
        return (
            <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '2rem', flex: 1, textAlign: 'center' }}>
                <h2 style={{ fontSize: '2.5rem' }}>İki Gerçek Bir Yalan</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Telefon sende. Gruba kendinle ilgili 3 şey söyle.</p>
                <p style={{ color: 'var(--text-secondary)' }}>İkisi doğru, biri tamamen yalan olsun.</p>

                <div className="glass-panel" style={{ padding: '2rem', margin: '1rem', border: '1px solid var(--warning-color)' }}>
                    <h3 style={{ color: 'var(--warning-color)', marginBottom: '1rem' }}>Söyledin mi?</h3>
                    <p>Yalanını herkes duyduğuna göre şimdi grubun tartışmasına izin ver.</p>
                </div>

                <Button variant="primary" onClick={() => setPhase('voting')} style={{ padding: '2rem 4rem', fontSize: '1.5rem', marginTop: '1rem' }}>
                    Oylamaya Geç
                </Button>
            </div>
        );
    }

    return (
        <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '2rem', flex: 1, textAlign: 'center' }}>
            <h2 style={{ fontSize: '3rem', color: 'var(--danger-color)' }}>Hangisi Yalan?</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Grup kararını versin. Sonra doğru cevabı açıklayın.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '400px', marginTop: '2rem' }}>
                <Button variant="outline" onClick={() => handleFinish(true)} style={{ padding: '1.5rem', borderColor: 'var(--danger-color)', color: 'var(--danger-color)' }}>
                    Grup Yalanı Bildi (Sen: 0 Puan)
                </Button>
                <Button variant="primary" onClick={() => handleFinish(false)} style={{ padding: '1.5rem', background: 'var(--success-color)' }}>
                    Kandırdım! Bilemediler (Sen: +1 Puan)
                </Button>
            </div>
        </div>
    );
};

export default IkiGercekBirYalan;
