import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { GAMES } from '../data/gameList';
import { FaArrowLeft, FaPlay, FaInfoCircle, FaGavel, FaTrophy } from 'react-icons/fa';
import * as Icons from 'react-icons/fa';

const GameDetail = () => {
    const { gameId } = useParams();
    const navigate = useNavigate();

    const game = GAMES.find(g => g.id === gameId);

    if (!game) {
        return <div className="flex-center" style={{ flex: 1 }}>Oyun bulunamadı.</div>;
    }

    const Icon = Icons[game.icon] || Icons.FaGamepad;

    return (
        <div className="container animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="page-header" style={{ marginBottom: '0.5rem' }}>
                <Button variant="outline" onClick={() => navigate('/games')} style={{ padding: '0.5rem', minWidth: '40px' }}>
                    <FaArrowLeft />
                </Button>
            </div>

            <div className="glass-panel" style={{ textAlign: 'center', borderTop: `6px solid ${game.color}`, position: 'relative', overflow: 'hidden' }}>
                <div style={{
                    position: 'absolute',
                    top: '-50px',
                    right: '-50px',
                    width: '150px',
                    height: '150px',
                    borderRadius: '50%',
                    background: game.color,
                    filter: 'blur(50px)',
                    opacity: 0.2,
                    zIndex: -1
                }} />

                <Icon size={48} color={game.color} style={{ marginBottom: '1rem' }} />
                <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>{game.title}</h2>
                <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.95rem' }}>{game.description}</p>
            </div>

            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-color)', fontSize: '1.2rem' }}>
                        <FaInfoCircle /> Nasıl Oynanır?
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: '1.5', fontSize: '0.95rem' }}>{game.howToPlay}</p>
                </div>

                <div>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--warning-color)' }}>
                        <FaGavel /> Kurallar
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: '1.5' }}>{game.rules}</p>
                </div>

                <div>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success-color)' }}>
                        <FaTrophy /> Puan Sistemi ve Kazanma
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '0.5rem' }}>{game.pointsSystem}</p>
                    <p style={{ fontWeight: 'bold' }}>{game.winCondition}</p>
                </div>
            </div>

            <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                <Button style={{ width: '100%', padding: '0.8rem' }} className="btn-primary" onClick={() => navigate(`/setup/${game.id}`)}>
                    <FaPlay /> Oyuna Başla
                </Button>
            </div>
        </div>
    );
};

export default GameDetail;
