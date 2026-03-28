import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { useAppContext } from '../context/AppContext';
import { FaArrowLeft, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';

const Settings = () => {
    const navigate = useNavigate();
    const { settings, toggleSound } = useAppContext();

    return (
        <div className="container animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="page-header">
                <Button variant="outline" onClick={() => navigate('/')} style={{ padding: '0.5rem', minWidth: '40px' }}>
                    <FaArrowLeft />
                </Button>
                <h2>Ayarlar</h2>
            </div>

            <div className="glass-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Oyun Sesleri</h3>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Doğru/yanlış ve tıklama sesleri</p>
                    </div>

                    <Button
                        variant={settings.soundEnabled ? 'primary' : 'outline'}
                        onClick={toggleSound}
                        style={{ minWidth: '120px' }}
                    >
                        {settings.soundEnabled ? <><FaVolumeUp /> Açık</> : <><FaVolumeMute /> Kapalı</>}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Settings;
