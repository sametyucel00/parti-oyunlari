import React, { useState } from 'react';
import { Button } from '../components/Button';
import hikayeData from '../data/games/hikayezinciri.json';

const ROUND_TIME = 15;

const HikayeZinciri = ({ onScore, onEndTurn }) => {
    const [isActive, setIsActive] = useState(false);
    const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
    const [storyStarted, setStoryStarted] = useState(false);
    const [prompt, setPrompt] = useState('');

    React.useEffect(() => {
        let interval = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
        } else if (isActive && timeLeft === 0) {
            setIsActive(false);
            onScore(-1);
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft, onScore]);

    const startStory = () => {
        setPrompt(hikayeData[Math.floor(Math.random() * hikayeData.length)]);
        setStoryStarted(true);
        setIsActive(true);
        setTimeLeft(ROUND_TIME);
    };

    const handleNext = () => {
        onScore(1);
        onEndTurn();
    };

    if (timeLeft === 0) {
        return (
            <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '2rem', flex: 1, textAlign: 'center' }}>
                <h2 style={{ fontSize: '3rem', color: 'var(--danger-color)' }}>SÜRE BİTTİ!</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Hikâye senin yüzünden koptu! (-1 puan)</p>
                <Button onClick={onEndTurn} style={{ padding: '1rem 3rem' }}>Sıradaki Oyuncu</Button>
            </div>
        );
    }

    if (!storyStarted) {
        return (
            <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '2rem', flex: 1, textAlign: 'center' }}>
                <h2 style={{ fontSize: '2.5rem' }}>Hikâye Zinciri</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Telefon sana gelince hikâyeye mantıklı (veya komik) bir cümle ekle ve telefonu hızlıca devret.</p>
                <Button variant="danger" onClick={startStory} style={{ padding: '2rem 4rem', fontSize: '1.5rem', marginTop: '1rem' }}>
                    Hikâyeyi Başlat
                </Button>
            </div>
        );
    }

    return (
        <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '2rem', flex: 1, textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '0 1rem' }}>
                <div style={{ fontWeight: 'bold', fontSize: '1.5rem', color: timeLeft <= 5 ? 'var(--danger-color)' : 'white' }}>⏱ {timeLeft}s</div>
            </div>

            <div className="glass-panel" style={{ padding: '2rem' }}>
                <h3 style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Hikâye Girişi:</h3>
                <h1 style={{ fontSize: '2rem', color: 'var(--primary-color)' }}>{prompt}</h1>
                <p style={{ marginTop: '2rem', fontSize: '1.2rem', color: 'var(--info-color)' }}>Hemen bir cümle ekle ve pasla!</p>
            </div>

            <Button variant="primary" onClick={handleNext} style={{ padding: '2rem 4rem', fontSize: '1.5rem', marginTop: '2rem' }}>
                Ekledim, Geçebiliriz (+1)
            </Button>
        </div>
    );
};

export default HikayeZinciri;
