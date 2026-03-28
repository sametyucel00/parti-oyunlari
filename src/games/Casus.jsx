import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import { useAppContext } from '../context/AppContext';
import { audioManager } from '../utils/audio';
import { useGameData } from '../hooks/useGameData';
import spyfallData from '../data/games/spyfall.json';

const GAME_TIME = 300;

const Casus = ({ onScore, onEndTurn }) => {
    const { settings } = useAppContext();
    const [phase, setPhase] = useState('distribute');
    const [timeLeft, setTimeLeft] = useState(GAME_TIME);
    const [viewedCount, setViewedCount] = useState(0);
    const [rolesDistributed, setRolesDistributed] = useState([]);
    const [currentLocation] = useGameData('spyfall_v2', spyfallData);
    const [allPlayers, setAllPlayers] = useState([]);
    const [showRole, setShowRole] = useState(false);

    useEffect(() => {
        const p = JSON.parse(localStorage.getItem('party_games_players')) || [];
        setAllPlayers(p);

        if (p.length > 0 && currentLocation) {
            const spyIndex = Math.floor(Math.random() * p.length);
            const dist = p.map((player, idx) => {
                if (idx === spyIndex) return { ...player, role: 'Casus', isSpy: true };
                const roles = currentLocation.roles || ['Oyuncu'];
                const role = roles[Math.floor(Math.random() * roles.length)];
                return { ...player, role, isSpy: false };
            });
            setRolesDistributed(dist);
        }
    }, [currentLocation]);

    useEffect(() => {
        let interval = null;
        if (phase === 'timer' && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
        } else if (timeLeft === 0 && phase === 'timer') {
            setPhase('voting');
            if (settings.soundEnabled) audioManager.playWrong();
        }
        return () => clearInterval(interval);
    }, [phase, timeLeft, settings.soundEnabled]);

    if (rolesDistributed.length === 0) return <div>Yükleniyor...</div>;

    if (phase === 'distribute') {
        const currentPlayerObj = rolesDistributed[viewedCount];

        if (!currentPlayerObj) {
            return (
                <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '2rem', flex: 1, textAlign: 'center' }}>
                    <h2>Roller Dağıtıldı</h2>
                    <Button variant="primary" onClick={() => setPhase('timer')} style={{ padding: '1rem 2rem' }}>Sorguya Başla</Button>
                </div>
            );
        }

        return (
            <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '2rem', flex: 1, textAlign: 'center' }}>
                <h2>Telefonu {currentPlayerObj.name} alsın</h2>
                {!showRole ? (
                    <Button variant="primary" onClick={() => setShowRole(true)} style={{ padding: '2rem' }}>Rolümü Göster</Button>
                ) : (
                    <div className="glass-panel" style={{ padding: '2rem', border: '2px solid var(--primary-color)' }}>
                        {currentPlayerObj.isSpy ? (
                            <>
                                <h1 style={{ color: 'var(--danger-color)', fontSize: '2.2rem' }}>CASUSSUN</h1>
                                <p>Mekanı bilmiyorsun. Sorularla bulmaya çalış.</p>
                            </>
                        ) : (
                            <>
                                <p>Mekan:</p>
                                <h2 style={{ fontSize: '2rem', color: 'var(--success-color)' }}>{currentLocation.name || currentLocation.location}</h2>
                                <p style={{ marginTop: '1rem' }}>Rolün:</p>
                                <h3 style={{ color: 'var(--primary-color)' }}>{currentPlayerObj.role}</h3>
                            </>
                        )}
                        <Button onClick={() => { setShowRole(false); setViewedCount(c => c + 1); }} style={{ marginTop: '1.5rem', width: '100%' }}>
                            Anladım, Devret
                        </Button>
                    </div>
                )}
            </div>
        );
    }

    if (phase === 'timer') {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        return (
            <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '2rem', flex: 1 }}>
                <h2>Sorgu Vakti</h2>
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Sırayla mekanla ilgili sorular sorun.</p>
                <div style={{ fontSize: '5rem', fontWeight: 'bold', color: timeLeft < 60 ? 'var(--danger-color)' : 'white' }}>
                    {minutes}:{seconds < 10 ? '0' : ''}{seconds}
                </div>
                <Button variant="danger" onClick={() => setPhase('voting')}>Oylamaya Geç</Button>
            </div>
        );
    }

    return (
        <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '2rem', flex: 1, textAlign: 'center' }}>
            <h2 style={{ color: 'var(--danger-color)' }}>Kim Casus?</h2>
            <p>Grup kararını verin.</p>
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                <Button variant="outline" onClick={() => { onScore(3); onEndTurn(); }} style={{ borderColor: 'var(--danger-color)', color: 'var(--danger-color)' }}>
                    Casus Kazandı (+3)
                </Button>
                <Button variant="outline" onClick={() => { onScore(1); onEndTurn(); }} style={{ borderColor: 'var(--success-color)', color: 'var(--success-color)' }}>
                    Grup Kazandı (+1)
                </Button>
            </div>
        </div>
    );
};

export default Casus;
