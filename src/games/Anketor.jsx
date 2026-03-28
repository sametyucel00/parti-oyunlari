import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import anketorData from '../data/games/anketor.json';
import { PlayerStorage, GroupStorage } from '../utils/storage';
import { useSearchParams } from 'react-router-dom';

const Anketor = ({ onScore, onEndTurn }) => {
    const [searchParams] = useSearchParams();
    const mode = searchParams.get('mode') || 'individual';
    const [allPlayers, setAllPlayers] = useState([]);

    const [question, setQuestion] = useState('');
    const [votes, setVotes] = useState({});
    const [phase, setPhase] = useState('announce');
    const [currentPlayerVoterIndex, setCurrentPlayerVoterIndex] = useState(0);

    useEffect(() => {
        const loaded = mode === 'individual' ? PlayerStorage.getPlayers() : GroupStorage.getGroups();
        setAllPlayers(loaded);

        let pool = JSON.parse(localStorage.getItem('game_pool_anketor_v2') || '[]');
        if (pool.length === 0) pool = [...anketorData].sort(() => 0.5 - Math.random());

        const q = pool.pop();
        setQuestion(q);
        localStorage.setItem('game_pool_anketor_v2', JSON.stringify(pool));

        const initialVotes = {};
        loaded.forEach(p => { initialVotes[p.name] = 0; });
        setVotes(initialVotes);
    }, [mode]);

    const handleVote = (targetName) => {
        const newVotes = { ...votes };
        newVotes[targetName] += 1;
        setVotes(newVotes);

        if (currentPlayerVoterIndex + 1 >= allPlayers.length) {
            setPhase('results');
        } else {
            setCurrentPlayerVoterIndex(i => i + 1);
            setPhase('announce');
        }
    };

    const handleEndRound = () => {
        onScore(1);
        onEndTurn();
    };

    if (allPlayers.length === 0) return null;

    if (phase === 'announce') {
        const voter = allPlayers[currentPlayerVoterIndex];
        return (
            <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '2rem', flex: 1, textAlign: 'center' }}>
                <h2 style={{ fontSize: '2rem' }}>Anketör (Gizli Oylama)</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Telefonu {voter.name} alsın ve gizlice oy versin.</p>
                <Button variant="primary" onClick={() => setPhase('voting')} style={{ padding: '2rem 4rem', fontSize: '1.5rem' }}>
                    Ben Hazırım
                </Button>
            </div>
        );
    }

    if (phase === 'voting') {
        return (
            <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '2rem', flex: 1, textAlign: 'center' }}>
                <div className="glass-panel" style={{ padding: '2rem', width: '90%' }}>
                    <h2 style={{ fontSize: '1.5rem', color: 'var(--warning-color)' }}>{question}</h2>
                </div>
                <p style={{ color: 'var(--text-secondary)' }}>Kime oy veriyorsun?</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '90%', maxHeight: '40vh', overflowY: 'auto' }}>
                    {allPlayers.map((p, i) => (
                        <Button key={i} variant="outline" onClick={() => handleVote(p.name)} style={{ padding: '1rem' }}>
                            {p.avatar} {p.name}
                        </Button>
                    ))}
                </div>
            </div>
        );
    }

    const sortedVotes = Object.entries(votes).sort((a, b) => b[1] - a[1]);

    return (
        <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '2rem', flex: 1, textAlign: 'center' }}>
            <h2 style={{ fontSize: '2.5rem', color: 'var(--primary-color)' }}>SONUÇLAR</h2>
            <div className="glass-panel" style={{ padding: '1.5rem', width: '90%' }}>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--warning-color)', marginBottom: '1rem' }}>Soru: {question}</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {sortedVotes.map(([name, count], i) => (
                        <li key={i} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                            <span style={{ fontWeight: 'bold' }}>{name}</span>
                            <span style={{ color: 'var(--success-color)', fontWeight: 'bold' }}>{count} oy</span>
                        </li>
                    ))}
                </ul>
            </div>
            <Button onClick={handleEndRound} style={{ padding: '1.5rem 3rem' }}>Devam Et</Button>
        </div>
    );
};

export default Anketor;
