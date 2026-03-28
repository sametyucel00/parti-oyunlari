import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import { PlayerStorage, GroupStorage } from '../utils/storage';
import { useSearchParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

const VampirKoylu = ({ onScore, onEndTurn }) => {
    const [searchParams] = useSearchParams();
    const mode = searchParams.get('mode') || 'individual';
    const { showNotification } = useAppContext();

    const [allPlayers, setAllPlayers] = useState([]);
    const [phase, setPhase] = useState('assignment');
    const [roles, setRoles] = useState({});
    const [assignIndex, setAssignIndex] = useState(0);
    const [showRole, setShowRole] = useState(false);
    const [victim, setVictim] = useState(null);
    const [protectedPerson, setProtectedPerson] = useState(null);
    const [deadPerson, setDeadPerson] = useState(null);

    useEffect(() => {
        const loaded = mode === 'individual' ? PlayerStorage.getPlayers() : GroupStorage.getGroups();
        setAllPlayers(loaded);

        if (loaded.length >= 3) {
            const shuffled = [...loaded].sort(() => 0.5 - Math.random());
            const newRoles = {};
            shuffled.forEach((p, i) => {
                if (i === 0) newRoles[p.name] = 'vampire';
                else if (i === 1) newRoles[p.name] = 'doctor';
                else newRoles[p.name] = 'villager';
            });
            setRoles(newRoles);
        }
    }, [mode]);

    if (allPlayers.length < 3) {
        return (
            <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '2rem', flex: 1, textAlign: 'center' }}>
                <h2>Bu oyun için en az 3 oyuncu gerekli.</h2>
                <Button onClick={onEndTurn}>Geç</Button>
            </div>
        );
    }

    if (phase === 'assignment') {
        const p = allPlayers[assignIndex];
        if (!p) {
            return (
                <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '2rem', flex: 1, textAlign: 'center' }}>
                    <h2>Herkes rolünü öğrendi</h2>
                    <p style={{ color: 'var(--danger-color)' }}>Herkes gözünü kapatsın.</p>
                    <Button onClick={() => setPhase('night_vampire')} style={{ padding: '1rem 3rem' }}>Geceye Başla</Button>
                </div>
            );
        }

        const role = roles[p.name];
        const roleText = role === 'vampire' ? 'VAMPİRSİN' : role === 'doctor' ? 'DOKTORSUN' : 'KÖYLÜSÜN';

        return (
            <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '2rem', flex: 1, textAlign: 'center' }}>
                <h2 style={{ fontSize: '2rem' }}>Gizli Rol Dağıtımı</h2>
                <p>Telefonu {p.name} alsın.</p>

                {!showRole ? (
                    <Button variant="primary" onClick={() => setShowRole(true)} style={{ padding: '2rem 4rem', fontSize: '1.2rem' }}>
                        Rolümü Göster
                    </Button>
                ) : (
                    <div className="glass-panel animate-pop-in" style={{ padding: '2rem', background: role === 'vampire' ? 'rgba(255,0,0,0.2)' : 'rgba(255,255,255,0.1)' }}>
                        <h1 style={{ color: role === 'vampire' ? 'var(--danger-color)' : role === 'doctor' ? 'var(--success-color)' : 'white' }}>{roleText}</h1>
                        <Button onClick={() => { setShowRole(false); setAssignIndex(i => i + 1); }} style={{ marginTop: '2rem' }}>
                            Anladım, Gizle
                        </Button>
                    </div>
                )}
            </div>
        );
    }

    if (phase === 'night_vampire') {
        return (
            <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '2rem', flex: 1, textAlign: 'center' }}>
                <h2 style={{ color: 'var(--danger-color)', fontSize: '2.5rem' }}>VAMPİR UYANDI</h2>
                <p>Sadece vampir seçim yapsın.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '90%', maxHeight: '40vh', overflowY: 'auto' }}>
                    {allPlayers.filter(p => roles[p.name] !== 'vampire').map((p, i) => (
                        <Button key={i} variant="outline" onClick={() => { setVictim(p.name); setPhase('night_doctor'); }}>
                            {p.avatar} {p.name}
                        </Button>
                    ))}
                </div>
            </div>
        );
    }

    if (phase === 'night_doctor') {
        return (
            <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '2rem', flex: 1, textAlign: 'center' }}>
                <h2 style={{ color: 'var(--success-color)', fontSize: '2.5rem' }}>DOKTOR UYANDI</h2>
                <p>Sadece doktor seçim yapsın.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '90%', maxHeight: '40vh', overflowY: 'auto' }}>
                    {allPlayers.map((p, i) => (
                        <Button key={i} variant="outline" onClick={() => { setProtectedPerson(p.name); setPhase('morning'); }}>
                            {p.avatar} {p.name}
                        </Button>
                    ))}
                </div>
            </div>
        );
    }

    if (phase === 'morning') {
        const isVictimSaved = victim === protectedPerson;
        return (
            <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '2rem', flex: 1, textAlign: 'center' }}>
                <h2 style={{ color: 'white', fontSize: '3rem' }}>SABAH OLDU</h2>
                <div className="glass-panel" style={{ padding: '2rem', width: '90%' }}>
                    {isVictimSaved ? (
                        <h3 style={{ color: 'var(--success-color)' }}>Bu gece kimse ölmedi.</h3>
                    ) : (
                        <h3 style={{ color: 'var(--danger-color)' }}>{victim} elendi.</h3>
                    )}
                </div>
                <Button variant="primary" onClick={() => { setDeadPerson(isVictimSaved ? null : victim); setPhase('voting'); }}>
                    Oylamaya Geç
                </Button>
            </div>
        );
    }

    return (
        <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '2rem', flex: 1, textAlign: 'center' }}>
            <h2 style={{ fontSize: '2.5rem' }}>VAMPİRİ BULUN</h2>
            <p>Topluca tartışın ve birini seçin.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '90%', maxHeight: '40vh', overflowY: 'auto' }}>
                {allPlayers.filter(p => p.name !== deadPerson).map((p, i) => (
                    <Button
                        key={i}
                        variant="danger"
                        onClick={() => {
                            if (roles[p.name] === 'vampire') {
                                showNotification(`Doğru seçim: ${p.name} vampirdi!`, 'success', 4000);
                                onScore(1);
                            } else {
                                showNotification(`${p.name} masumdu.`, 'error', 4000);
                            }
                            onEndTurn();
                        }}
                    >
                        Seç: {p.avatar} {p.name}
                    </Button>
                ))}
            </div>
        </div>
    );
};

export default VampirKoylu;
