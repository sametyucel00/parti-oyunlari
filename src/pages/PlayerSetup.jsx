import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { PlayerStorage, GroupStorage } from '../utils/storage';
import { useAppContext } from '../context/AppContext';
import { FaArrowLeft, FaUserPlus, FaUsers, FaUser, FaTrash, FaPlay } from 'react-icons/fa';

const AVATARS = ['😀', '😎', '🤠', '🦊', '🐼', '🐯', '🦁', '🐸', '🐵', '🐧', '🐨', '🦄', '🐙', '🐬', '🦉'];

const PlayerSetup = () => {
    const { gameId } = useParams();
    const navigate = useNavigate();
    const { showNotification } = useAppContext();

    const [mode, setMode] = useState('individual');
    const [players, setPlayers] = useState([]);
    const [groups, setGroups] = useState([]);
    const [newName, setNewName] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
    const [rounds, setRounds] = useState(5);

    const handleAddEntity = () => {
        if (!newName.trim()) return;

        if (mode === 'individual') {
            setPlayers([...players, { id: Date.now(), name: newName.trim(), avatar: selectedAvatar }]);
        } else {
            setGroups([...groups, { id: Date.now(), name: newName.trim(), avatar: selectedAvatar, score: 0 }]);
        }

        setNewName('');
        setSelectedAvatar(AVATARS[Math.floor(Math.random() * AVATARS.length)]);
    };

    const removeEntity = (id) => {
        if (mode === 'individual') setPlayers(players.filter(p => p.id !== id));
        else setGroups(groups.filter(g => g.id !== id));
    };

    const startGame = () => {
        if (mode === 'individual' && players.length < 2) {
            showNotification('En az 2 oyuncu gerekli!', 'error');
            return;
        }
        if (mode === 'group' && groups.length < 2) {
            showNotification('En az 2 grup gerekli!', 'error');
            return;
        }

        if (mode === 'individual') PlayerStorage.savePlayers(players);
        else GroupStorage.saveGroups(groups);

        navigate(`/play/${gameId}?mode=${mode}&rounds=${rounds}`);
    };

    const currentList = mode === 'individual' ? players : groups;

    return (
        <div className="container animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="page-header">
                <Button variant="outline" onClick={() => navigate(-1)} style={{ padding: '0.5rem', minWidth: '40px' }}>
                    <FaArrowLeft />
                </Button>
                <h2>Oyuncuları Belirle</h2>
            </div>

            <div className="glass-panel" style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem' }}>
                <Button variant={mode === 'individual' ? 'primary' : 'outline'} style={{ flex: 1, padding: '0.5rem' }} onClick={() => setMode('individual')}>
                    <FaUser /> Bireysel
                </Button>
                <Button variant={mode === 'group' ? 'primary' : 'outline'} style={{ flex: 1, padding: '0.5rem' }} onClick={() => setMode('group')}>
                    <FaUsers /> Grup
                </Button>
            </div>

            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="avatar-grid player-avatar-grid" style={{ paddingBottom: '0.5rem' }}>
                    {AVATARS.map(avatar => (
                        <div
                            key={avatar}
                            onClick={() => setSelectedAvatar(avatar)}
                            className="avatar-item"
                            style={{
                                fontSize: '1.1rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                padding: '0.4rem',
                                textAlign: 'center',
                                border: selectedAvatar === avatar ? '2px solid var(--primary-color)' : '2px solid transparent',
                                background: selectedAvatar === avatar ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                borderRadius: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                aspectRatio: '1/1'
                            }}
                        >
                            {avatar}
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddEntity()}
                        placeholder={mode === 'individual' ? 'İsim...' : 'Grup...'}
                        style={{
                            flex: 1,
                            minWidth: 0,
                            padding: '0.6rem 0.75rem',
                            borderRadius: '0.75rem',
                            border: '1px solid var(--surface-border)',
                            background: 'rgba(0,0,0,0.3)',
                            color: 'white',
                            fontSize: '1rem',
                            outline: 'none'
                        }}
                    />
                    <Button onClick={handleAddEntity} style={{ padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}>
                        <FaUserPlus /> <span className="btn-text-hide">Ekle</span>
                    </Button>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                {currentList.map(entity => (
                    <div key={entity.id} className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span style={{ fontSize: '1.6rem', fontWeight: 800 }}>{entity.avatar}</span>
                            <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{entity.name}</span>
                        </div>
                        <Button variant="danger" onClick={() => removeEntity(entity.id)} style={{ padding: '0.5rem 1rem' }}>
                            <FaTrash size={12} />
                        </Button>
                    </div>
                ))}
            </div>

            <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', marginTop: 'auto' }}>
                <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>Turlar:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Button variant="outline" onClick={() => setRounds(r => Math.max(1, r - 1))} style={{ padding: '0.4rem 0.8rem' }}>-</Button>
                    <span style={{ fontSize: '1.1rem', fontWeight: 'bold', width: '25px', textAlign: 'center' }}>{rounds}</span>
                    <Button variant="outline" onClick={() => setRounds(r => Math.min(50, r + 1))} style={{ padding: '0.4rem 0.8rem' }}>+</Button>
                </div>
            </div>

            <div style={{ paddingTop: '1rem' }}>
                <Button variant="primary" style={{ width: '100%', fontSize: '1.2rem', padding: '1rem' }} onClick={startGame}>
                    <FaPlay /> Başla!
                </Button>
            </div>
        </div>
    );
};

export default PlayerSetup;
