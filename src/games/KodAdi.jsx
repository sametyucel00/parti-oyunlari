import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import kodadiData from '../data/games/kodadi.json';
import { audioManager } from '../utils/audio';
import { useAppContext } from '../context/AppContext';

const KodAdi = ({ onScore, onEndTurn }) => {
    const { showNotification } = useAppContext();
    const [phase, setPhase] = useState('spymaster_ready');
    const [board, setBoard] = useState([]);

    useEffect(() => {
        const shuffledWords = [...kodadiData].sort(() => 0.5 - Math.random()).slice(0, 9);
        const colors = ['blue', 'blue', 'blue', 'blue', 'red', 'red', 'red', 'red', 'black'];
        const shuffledColors = colors.sort(() => 0.5 - Math.random());

        const newBoard = shuffledWords.map((w, i) => ({ word: w, color: shuffledColors[i], revealed: false }));
        setBoard(newBoard);
    }, []);

    const handleCardClick = (index) => {
        if (phase !== 'operatives' || board[index].revealed) return;

        const newBoard = [...board];
        newBoard[index].revealed = true;
        setBoard(newBoard);

        if (newBoard[index].color === 'black') {
            audioManager.playWrong();
            showNotification('Suikastçı seçildi! Tur bitti.', 'error', 5000);
            onScore(-2);
            onEndTurn();
        } else {
            audioManager.playClick();
        }
    };

    if (phase === 'spymaster_ready') {
        return (
            <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '2rem', flex: 1, textAlign: 'center' }}>
                <h2 style={{ fontSize: '2.5rem' }}>Kod Adı (Mini)</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Telefonu istihbarat şefi alsın ve kart renklerini görsün.</p>
                <Button variant="danger" onClick={() => setPhase('spymaster_view')} style={{ padding: '2rem 4rem', fontSize: '1.5rem' }}>
                    Şef Benim
                </Button>
            </div>
        );
    }

    if (phase === 'spymaster_view') {
        return (
            <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '1rem', flex: 1, textAlign: 'center' }}>
                <h2 style={{ fontSize: '2rem' }}>Şefin Haritası</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Tek kelimelik ipucu ver ve telefonu ajanlara devret.</p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', width: '90%', maxWidth: '400px', marginTop: '1rem' }}>
                    {board.map((card, idx) => (
                        <div key={idx} style={{
                            background: card.color === 'blue' ? '#3498db' : card.color === 'red' ? '#e74c3c' : '#2d3436',
                            color: 'white', padding: '1rem', borderRadius: '8px', fontWeight: 'bold', minHeight: '80px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem'
                        }}>
                            {card.word}
                        </div>
                    ))}
                </div>

                <Button variant="primary" onClick={() => setPhase('operatives')} style={{ padding: '1.5rem', marginTop: '1rem' }}>
                    Ajanlara Geç
                </Button>
            </div>
        );
    }

    return (
        <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '1rem', flex: 1, textAlign: 'center' }}>
            <h2 style={{ fontSize: '2rem' }}>Ajanlar Görevde</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Doğru kartları seçin, suikastçıdan kaçının.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', width: '90%', maxWidth: '400px' }}>
                {board.map((card, idx) => (
                    <Button key={idx} variant="outline" onClick={() => handleCardClick(idx)} style={{
                        background: card.revealed ? (card.color === 'blue' ? '#3498db' : card.color === 'red' ? '#e74c3c' : '#2d3436') : 'rgba(255,255,255,0.1)',
                        color: card.revealed ? 'white' : 'var(--text-primary)',
                        padding: '1rem 0.5rem', minHeight: '80px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        {card.word}
                    </Button>
                ))}
            </div>

            <Button variant="primary" onClick={() => { onScore(1); onEndTurn(); }} style={{ padding: '1.5rem', marginTop: '1rem', background: 'var(--success-color)' }}>
                Tahminler Bitti
            </Button>
        </div>
    );
};

export default KodAdi;
