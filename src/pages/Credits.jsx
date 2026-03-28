import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { FaArrowLeft } from 'react-icons/fa';

const Credits = () => {
    const navigate = useNavigate();

    return (
        <div className="container animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="page-header">
                <Button variant="outline" onClick={() => navigate('/')} style={{ padding: '0.5rem', minWidth: '40px' }}>
                    <FaArrowLeft />
                </Button>
                <h2>Jenerik</h2>
            </div>

            <div className="glass-panel flex-center" style={{ flexDirection: 'column', gap: '1rem', textAlign: 'center', flex: 1 }}>
                <h3 style={{ fontSize: '2rem', margin: 0, color: 'var(--primary-color)' }}>PARTİ OYUNLARI</h3>
                <p style={{ color: 'var(--text-secondary)' }}>V1.0.0</p>

                <div style={{ marginTop: '2rem' }}>
                    <p>Mükemmel bir deneyim için özel olarak tasarlandı.</p>
                    <br />
                    <p style={{ color: 'var(--text-secondary)' }}>Geliştirici</p>
                    <p style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Samet Yücel</p>

                    <div style={{ marginTop: '4.5rem', padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>İstek, öneri ve hata bildirimi için:</p>
                        <a href="mailto:sametyucel52@gmail.com" style={{ color: 'var(--primary-color)', fontWeight: 'bold', textDecoration: 'none' }}>sametyucel52@gmail.com</a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Credits;
