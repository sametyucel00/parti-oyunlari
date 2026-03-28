import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../components/Button';
import cizTahminEtData from '../data/games/ciztahminet.json';
import { audioManager } from '../utils/audio';
import { useAppContext } from '../context/AppContext';
import { FaTrash, FaEye, FaEyeSlash } from 'react-icons/fa';

const ROUND_TIME = 90;

const CizTahminEt = ({ player, onScore, onEndTurn }) => {
    const { settings } = useAppContext();
    const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
    const [words, setWords] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [showWord, setShowWord] = useState(false);

    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        let available = JSON.parse(localStorage.getItem('game_pool_ciztahmin_v2') || '[]');

        if (!Array.isArray(available) || available.length < 5) {
            available = [...cizTahminEtData].sort(() => 0.5 - Math.random());
        }

        setWords(available);
        localStorage.setItem('game_pool_ciztahmin_v2', JSON.stringify(available));
    }, [player]);

    useEffect(() => {
        const updateCanvasSize = () => {
            const canvas = canvasRef.current;
            const container = containerRef.current;
            if (!canvas || !container) return;

            const rect = container.getBoundingClientRect();
            canvas.width = rect.width * window.devicePixelRatio;
            canvas.height = rect.height * window.devicePixelRatio;
            const ctx = canvas.getContext('2d');
            ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
        };

        if (isActive) {
            setTimeout(updateCanvasSize, 100);
            window.addEventListener('resize', updateCanvasSize);
        }

        return () => window.removeEventListener('resize', updateCanvasSize);
    }, [isActive]);

    useEffect(() => {
        let interval = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
        } else if (timeLeft === 0 && isActive) {
            setIsActive(false);
            if (settings.soundEnabled) audioManager.playWrong();
        }

        return () => clearInterval(interval);
    }, [isActive, timeLeft, settings.soundEnabled]);

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    const handleAction = (correct) => {
        if (correct) {
            if (settings.soundEnabled) audioManager.playCorrect();
            setScore(s => s + 1);
            onScore(1);
        } else if (settings.soundEnabled) {
            audioManager.playWrong();
        }

        const nextWords = [...words];
        nextWords.splice(currentIndex, 1);

        if (nextWords.length === 0) {
            const fresh = [...cizTahminEtData].sort(() => 0.5 - Math.random());
            setWords(fresh);
            localStorage.setItem('game_pool_ciztahmin_v2', JSON.stringify(fresh));
            setCurrentIndex(0);
        } else {
            setWords(nextWords);
            localStorage.setItem('game_pool_ciztahmin_v2', JSON.stringify(nextWords));
            setCurrentIndex(prev => prev % nextWords.length);
        }

        clearCanvas();
        setShowWord(false);
    };

    const getCoordinates = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const hasTouch = e.touches && e.touches.length > 0;

        const clientX = hasTouch ? e.touches[0].clientX : e.clientX;
        const clientY = hasTouch ? e.touches[0].clientY : e.clientY;

        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const startDrawing = (e) => {
        const { x, y } = getCoordinates(e);
        const ctx = canvasRef.current.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const { x, y } = getCoordinates(e);
        const ctx = canvasRef.current.getContext('2d');
        ctx.lineTo(x, y);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 4;
        ctx.stroke();
    };

    const finishDrawing = () => setIsDrawing(false);

    if (timeLeft === 0) {
        return (
            <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '2rem', flex: 1, textAlign: 'center' }}>
                <h2 style={{ fontSize: '3rem', color: 'var(--danger-color)' }}>Süre Bitti!</h2>
                <div style={{ fontSize: '2rem' }}>Bilinen Cizim: <strong style={{ color: 'var(--success-color)' }}>{score}</strong></div>
                <Button onClick={onEndTurn} style={{ padding: '1rem 3rem' }}>Sıradaki Oyuncu</Button>
            </div>
        );
    }

    if (!isActive) {
        return (
            <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '2rem', flex: 1, textAlign: 'center' }}>
                <h2 style={{ fontSize: '2.5rem' }}>Ciz ve Tahmin Et</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Ekranda beliren kelimeyi dijital tahtaya cizerek anlat. Yazi yazmak ve konusmak yasak.</p>
                <p style={{ fontSize: '1.2rem', color: 'var(--danger-color)' }}>Süren: {ROUND_TIME} saniye</p>
                <Button variant="primary" onClick={() => setIsActive(true)} style={{ padding: '2rem 4rem', fontSize: '1.5rem', marginTop: '1rem' }}>
                    Başla
                </Button>
            </div>
        );
    }

    const currentWord = words[currentIndex] || '';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: timeLeft <= 15 ? 'var(--danger-color)' : 'white' }}>⏱ {timeLeft}s</div>
                <Button
                    variant="outline"
                    onClick={() => setShowWord(prev => !prev)}
                    style={{
                        minWidth: '160px',
                        maxWidth: '50vw',
                        minHeight: '38px',
                        padding: '0.4rem 0.75rem',
                        fontSize: '0.9rem',
                        borderRadius: '0.7rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }}
                >
                    {showWord ? <FaEyeSlash /> : <FaEye />} {showWord ? 'Kelimeyi Gizle' : 'Kelimeyi Göster'}
                </Button>
                <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Puan: <span style={{ color: 'var(--success-color)' }}>{score}</span></div>
            </div>

            <div
                style={{
                    minHeight: '44px',
                    borderRadius: '0.7rem',
                    background: 'rgba(255,255,255,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.4rem 0.8rem',
                    border: '1px solid rgba(255,255,255,0.08)'
                }}
            >
                <span
                    style={{
                        fontWeight: 700,
                        color: showWord ? 'var(--warning-color)' : 'var(--text-secondary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        width: '100%',
                        textAlign: 'center'
                    }}
                >
                    {showWord ? currentWord : 'Kelime gizli'}
                </span>
            </div>

            <div ref={containerRef} style={{ flex: 1, position: 'relative', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '2px dashed var(--surface-border)' }}>
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={finishDrawing}
                    onMouseOut={finishDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={finishDrawing}
                    style={{ width: '100%', height: '100%', touchAction: 'none' }}
                />
                <Button onClick={clearCanvas} style={{ position: 'absolute', top: '10px', right: '10px', padding: '0.5rem', background: 'var(--danger-color)' }}>
                    <FaTrash />
                </Button>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', height: '60px', marginTop: '0.5rem' }}>
                <Button variant="outline" onClick={() => handleAction(false)} style={{ flex: 1 }}>Pas</Button>
                <Button variant="primary" onClick={() => handleAction(true)} style={{ flex: 1, background: 'var(--success-color)' }}>Bildiler!</Button>
            </div>
        </div>
    );
};

export default CizTahminEt;
