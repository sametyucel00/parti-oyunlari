import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { ScoreStorage } from '../utils/storage';
import { FaRedo, FaHome, FaCrown } from 'react-icons/fa';

const GameOver = ({ gameId, mode, players }) => {
    const navigate = useNavigate();
    const [sorted, setSorted] = useState([]);

    useEffect(() => {
        const sortedPlayers = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));
        setSorted(sortedPlayers);

        sortedPlayers.slice(0, 3).forEach(p => {
            if (p.score > 0) {
                ScoreStorage.addHighScore(gameId, p.name, p.score, mode === 'group');
            }
        });
    }, [gameId, mode, players]);

    if (sorted.length === 0) return null;

    const winner = sorted[0];

    return (
        <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '2rem', flex: 1, padding: '1rem' }}>
            <div style={{ textAlign: 'center' }}>
                <FaCrown size={48} color="#fbbf24" style={{ marginBottom: '0.75rem' }} />
                <h1 style={{ fontSize: '2rem', margin: 0, color: 'var(--success-color)' }}>KAZANAN</h1>
                <h2 style={{ fontSize: '1.75rem', margin: '0.4rem 0' }}>{winner.avatar} {winner.name}</h2>
                <h3 style={{ fontSize: '1.5rem', color: '#fbbf24' }}>{winner.score} Puan</h3>
            </div>

            <div className="glass-panel" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <h3 style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Sıralama</h3>
                {sorted.map((p, idx) => (
                    <div key={p.id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '0.75rem',
                        background: idx === 0 ? 'rgba(251, 191, 36, 0.15)' : 'rgba(255,255,255,0.05)',
                        borderRadius: '0.5rem',
                        borderLeft: idx === 0 ? '4px solid #fbbf24' : idx === 1 ? '4px solid #9ca3af' : idx === 2 ? '4px solid #b45309' : '4px solid transparent'
                    }}>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            <span style={{ fontWeight: 'bold', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>#{idx + 1}</span>
                            <span style={{ fontSize: '1rem', fontWeight: '600' }}>{p.avatar} {p.name}</span>
                        </div>
                        <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>{p.score || 0}</span>
                    </div>
                ))}
            </div>

            <div style={{ display: 'flex', gap: '1rem', width: '100%', marginTop: 'auto' }}>
                <Button variant="outline" onClick={() => navigate('/')} style={{ flex: 1 }}>
                    <FaHome /> Ana Menü
                </Button>
                <Button variant="primary" onClick={() => window.location.reload()} style={{ flex: 1 }}>
                    <FaRedo /> Tekrar Oyna
                </Button>
            </div>
        </div>
    );
};

export default GameOver;
