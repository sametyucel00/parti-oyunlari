import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { PlayerStorage, GroupStorage } from '../utils/storage';
import { GAMES } from '../data/gameList';
import TurnScreen from './TurnScreen';
import GameOver from './GameOver';
import { Button } from '../components/Button';
import { FaPause, FaTimes, FaPlay } from 'react-icons/fa';

import Taboo from '../games/Taboo';
import Casus from '../games/Casus';
import HeadsUp from '../games/HeadsUp';
import Bomba from '../games/Bomba';
import KimDaha from '../games/KimDaha';
import DudakOkuma from '../games/DudakOkuma';
import MirildanBul from '../games/MirildanBul';
import SessizSinema from '../games/SessizSinema';
import KelimeZinciri from '../games/KelimeZinciri';
import DogrulukCesaret from '../games/DogrulukCesaret';
import IkiGercek from '../games/IkiGercek';
import CizTahminEt from '../games/CizTahminEt';
import HikayeZinciri from '../games/HikayeZinciri';
import HizliParmaklar from '../games/HizliParmaklar';
import KelimeIliski from '../games/KelimeIliski';
import TerstenOku from '../games/TerstenOku';
import Anketor from '../games/Anketor';
import Telepati from '../games/Telepati';
import SifreliKonusma from '../games/SifreliKonusma';
import EmojiBulmacasi from '../games/EmojiBulmacasi';
import VampirKoylu from '../games/VampirKoylu';
import BesSaniye from '../games/BesSaniye';
import SicakSoguk from '../games/SicakSoguk';
import SarkiTamamlama from '../games/SarkiTamamlama';
import Dilemma from '../games/Dilemma';
import MansetAt from '../games/MansetAt';
import YuzIfadesi from '../games/YuzIfadesi';
import TekHece from '../games/TekHece';
import Heykel from '../games/Heykel';
import KodAdi from '../games/KodAdi';
import GulmemeChallenge from '../games/GulmemeChallenge';

const GAME_COMPONENTS = {
    'tabu': Taboo,
    'casus': Casus,
    'alnina-koy': HeadsUp,
    'bomba': Bomba,
    'kim-daha': KimDaha,
    'dudak-okuma': DudakOkuma,
    'mirildan-bul': MirildanBul,
    'sessiz-sinema': SessizSinema,
    'kelime-zinciri': KelimeZinciri,
    'dogruluk-cesaret': DogrulukCesaret,
    'iki-gercek-bir-yalan': IkiGercek,
    'ciz-tahmin-et': CizTahminEt,
    'hikaye-zinciri': HikayeZinciri,
    'hizli-parmaklar': HizliParmaklar,
    'kelime-iliski': KelimeIliski,
    'tersten-oku': TerstenOku,
    'anketor': Anketor,
    'akil-okuma': Telepati,
    'sifreli-konusma': SifreliKonusma,
    'emoji-bulmacasi': EmojiBulmacasi,
    'vampir-koylu': VampirKoylu,
    'bes-saniye': BesSaniye,
    'sicak-soguk': SicakSoguk,
    'sarki-tamamlama': SarkiTamamlama,
    'bunu-yapar-miydin': Dilemma,
    'manset-at': MansetAt,
    'yuz-ifadesi': YuzIfadesi,
    'tek-hece': TekHece,
    'heykel': Heykel,
    'kod-adi': KodAdi,
    'gulmeme-challenge': GulmemeChallenge,
};

const GamePlay = () => {
    const { gameId } = useParams();
    const [searchParams] = useSearchParams();
    const mode = searchParams.get('mode') || 'individual';
    const navigate = useNavigate();

    const [players, setPlayers] = useState([]);
    const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
    const [gameState, setGameState] = useState('turn_screen');
    const [round, setRound] = useState(1);
    const [showQuitModal, setShowQuitModal] = useState(false);
    const maxRounds = parseInt(searchParams.get('rounds')) || 5;

    const gameMeta = GAMES.find(g => g.id === gameId);
    const GameComponent = GAME_COMPONENTS[gameId];

    useEffect(() => {
        const loaded = mode === 'individual' ? PlayerStorage.getPlayers() : GroupStorage.getGroups();
        const initialized = loaded.map(p => ({ ...p, score: p.score || 0 }));
        if (initialized.length === 0) navigate(`/setup/${gameId}`);
        else setPlayers(initialized);
    }, [mode, gameId, navigate]);

    if (players.length === 0 || !gameMeta) return null;

    const currentPlayer = players[currentTurnIndex];

    const handleScoreUpdate = (points) => {
        const updated = [...players];
        updated[currentTurnIndex].score += points;
        setPlayers(updated);
    };

    const handleTurnEnd = () => {
        if (currentTurnIndex + 1 >= players.length) {
            if (round >= maxRounds) setGameState('game_over');
            else {
                setRound(r => r + 1);
                setCurrentTurnIndex(0);
                setGameState('turn_screen');
            }
        } else {
            setCurrentTurnIndex(i => i + 1);
            setGameState('turn_screen');
        }
    };

    if (gameState === 'game_over') {
        return <GameOver gameId={gameId} mode={mode} players={players} rounds={round} />;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', width: '100%', overflow: 'hidden' }}>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr auto',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0.75rem',
                background: 'rgba(0,0,0,0.6)',
                borderBottom: `2px solid ${gameMeta.color}`,
                backdropFilter: 'blur(15px)',
                zIndex: 50
            }}>
                <Button variant="outline" onClick={() => setGameState(gameState === 'playing' ? 'paused' : 'playing')} style={{ padding: '0.4rem', border: 'none', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem' }}>
                    {gameState === 'paused' ? <FaPlay size={14} /> : <FaPause size={14} />}
                </Button>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden' }}>
                    <div style={{ fontWeight: '800', fontSize: '0.9rem', color: gameMeta.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                        {gameMeta.title}
                    </div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                        Tur {round}/{maxRounds}
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'flex-end' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', overflow: 'hidden' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold', lineHeight: '1.1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>{currentPlayer.name}</span>
                        <span style={{ color: 'var(--success-color)', fontSize: '0.7rem', fontWeight: 'bold' }}>Puan: {currentPlayer.score}</span>
                    </div>
                    <span style={{ fontSize: '1.25rem' }}>{currentPlayer.avatar}</span>
                </div>
            </div>

            <div style={{ flex: 1, display: 'flex', position: 'relative', overflowY: 'auto' }}>
                {gameState === 'paused' && !showQuitModal && (
                    <div className="glass-panel" style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem',
                        background: 'rgba(15, 23, 42, 0.95)'
                    }}>
                        <h2>Oyun Duraklatıldı</h2>
                        <Button variant="primary" onClick={() => setGameState('playing')} style={{ width: '200px' }}>Devam Et</Button>
                        <Button variant="danger" onClick={() => setShowQuitModal(true)} style={{ width: '200px' }}>
                            <FaTimes /> Çıkış Yap
                        </Button>
                    </div>
                )}

                {showQuitModal && (
                    <div className="glass-panel" style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 110,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem',
                        background: 'rgba(15, 23, 42, 0.95)',
                        textAlign: 'center', padding: '2rem'
                    }}>
                        <h2 style={{ color: 'var(--danger-color)', fontSize: '2rem' }}>Emin misiniz?</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Mevcut oyun puanları kaydedilmeyecek ve oyun sonlanacak.</p>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', width: '100%', maxWidth: '300px' }}>
                            <Button variant="outline" onClick={() => setShowQuitModal(false)} style={{ flex: 1, padding: '1rem' }}>İptal</Button>
                            <Button variant="danger" onClick={() => navigate('/')} style={{ flex: 1, padding: '1rem' }}>Çıkış Yap</Button>
                        </div>
                    </div>
                )}

                {gameState === 'turn_screen' && <TurnScreen player={currentPlayer} onStart={() => setGameState('playing')} />}

                {gameState === 'playing' && (
                    <div style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column' }}>
                        {GameComponent ? (
                            <GameComponent player={currentPlayer} onScore={handleScoreUpdate} onEndTurn={handleTurnEnd} />
                        ) : (
                            <div className="flex-center" style={{ flex: 1, flexDirection: 'column' }}>
                                <h3>Yapım Aşamasında</h3>
                                <p>Oyun motoru bu oyun için entegre ediliyor.</p>
                                <Button onClick={handleTurnEnd} style={{ marginTop: '2rem' }}>Turu Geç</Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default GamePlay;
