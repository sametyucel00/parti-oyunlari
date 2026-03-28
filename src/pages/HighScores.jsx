import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { ScoreStorage } from '../utils/storage';
import { FaArrowLeft, FaTrophy, FaUser, FaUsers } from 'react-icons/fa';
import { GAMES } from '../data/gameList';

const HighScores = () => {
    const navigate = useNavigate();
    const [scores, setScores] = useState({});

    useEffect(() => {
        setScores(ScoreStorage.getHighScores());
    }, []);

    const gameIds = Object.keys(scores).filter(id => scores[id] && scores[id].length > 0);

    return (
        <div className="container animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="page-header">
                <Button variant="outline" onClick={() => navigate('/')} style={{ padding: '0.5rem', minWidth: '40px' }}>
                    <FaArrowLeft />
                </Button>
                <h2>Yüksek Puanlar</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', flex: 1, paddingBottom: '2rem' }}>
                {gameIds.length === 0 ? (
                    <div className="glass-panel flex-center" style={{ flex: 1, color: 'var(--text-secondary)' }}>
                        <p>Henüz hiç puan kaydedilmedi.</p>
                    </div>
                ) : (
                    gameIds.map(gameId => {
                        const gameMeta = GAMES.find(g => g.id === gameId);
                        const gameTitle = gameMeta ? gameMeta.title : gameId;
                        const gameColor = gameMeta ? gameMeta.color : 'var(--primary-color)';

                        return (
                            <div key={gameId} className="glass-panel" style={{ borderLeft: `8px solid ${gameColor}`, padding: '1rem' }}>
                                <h3 style={{ color: gameColor, margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <FaTrophy /> {gameTitle}
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {scores[gameId].slice(0, 10).map((score, index) => (
                                        <div key={score.id} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '0.5rem',
                                            background: 'rgba(255,255,255,0.05)',
                                            borderRadius: '0.5rem',
                                            borderLeft: index < 3 ? `4px solid ${index === 0 ? '#fbbf24' : index === 1 ? '#9ca3af' : '#b45309'}` : '4px solid transparent'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--text-secondary)', width: '20px' }}>
                                                    {index + 1}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                                                    {score.isGroup ? <FaUsers size={14} color="var(--primary-color)" /> : <FaUser size={14} color="var(--accent-color)" />}
                                                    {score.name}
                                                </div>
                                            </div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--success-color)' }}>
                                                {score.score}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default HighScores;
