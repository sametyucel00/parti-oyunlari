import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { GAMES } from '../data/gameList';
import { FaArrowLeft } from 'react-icons/fa';
// Dynamic icon import using a helper
import * as Icons from 'react-icons/fa';

const GameList = () => {
    const navigate = useNavigate();

    return (
        <div className="container animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="page-header">
                <Button variant="outline" onClick={() => navigate('/')} style={{ padding: '0.5rem', minWidth: '40px' }}>
                    <FaArrowLeft />
                </Button>
                <h2>Oyunlar</h2>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                gap: '0.75rem',
                paddingBottom: '2rem'
            }}>
                {GAMES.map((game, index) => {
                    const Icon = Icons[game.icon] || Icons.FaGamepad;

                    return (
                        <div
                            key={game.id}
                            className="glass-panel"
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '1rem',
                                cursor: 'pointer',
                                padding: '1.5rem 1rem',
                                borderTop: `4px solid ${game.color}`
                            }}
                            onClick={() => {
                                // Play sound here ideally, but navigate handles routing
                                navigate(`/games/${game.id}`);
                            }}
                        >
                            <div style={{
                                background: `linear-gradient(135deg, ${game.color}40, transparent)`,
                                padding: '1rem',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Icon size={32} color={game.color} />
                            </div>
                            <h3 style={{
                                margin: 0,
                                fontSize: '1rem',
                                textAlign: 'center',
                                color: 'var(--text-primary)'
                            }}>
                                {game.title}
                            </h3>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default GameList;
