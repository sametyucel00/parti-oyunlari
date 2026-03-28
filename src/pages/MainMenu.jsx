import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { FaPlay, FaTrophy, FaCog, FaInfoCircle } from 'react-icons/fa';

const MainMenu = () => {
    const navigate = useNavigate();

    return (
        <div className="container flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '2rem' }}>
            <div style={{ textAlign: 'center' }}>
                <h1 style={{
                    fontSize: 'clamp(2.5rem, 10vw, 3.5rem)',
                    background: 'linear-gradient(135deg, var(--primary-color), var(--accent-color))',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                    marginBottom: '0.5rem',
                    lineHeight: '1.1'
                }}>
                    PARTİ<br />OYUNLARI
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Eğlenceye Hazır Olun!</p>
            </div>

            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', width: '100%', maxWidth: '340px' }}>
                <Button onClick={() => navigate('/games')} style={{ width: '100%' }}>
                    <FaPlay /> Oyun Oyna
                </Button>
                <Button variant="outline" onClick={() => navigate('/scores')} style={{ width: '100%' }}>
                    <FaTrophy /> Yüksek Puanlar
                </Button>
                <Button variant="outline" onClick={() => navigate('/settings')} style={{ width: '100%' }}>
                    <FaCog /> Ayarlar
                </Button>
                <Button variant="outline" onClick={() => navigate('/credits')} style={{ width: '100%' }}>
                    <FaInfoCircle /> Jenerik
                </Button>
            </div>

            <div style={{
                textAlign: 'center',
                color: 'var(--text-secondary)',
                fontSize: '0.85rem',
                opacity: 0.6,
                marginTop: '-1rem'
            }}>
                Samet Yücel &copy; 2026
            </div>
        </div>
    );
};

export default MainMenu;
