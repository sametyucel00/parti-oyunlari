import React, { useMemo, useState } from 'react';
import { Button } from '../components/Button';
import dilemmaData from '../data/games/dilemma.json';
import { useGameData } from '../hooks/useGameData';

const parseOptions = (question) => {
    if (!question || typeof question !== 'string') {
        return { text: 'İkilem yükleniyor...', a: 'Seçenek A', b: 'Seçenek B' };
    }

    const clean = question.trim();
    const split = clean.split(/\s+yoksa\s+/i);

    if (split.length >= 2) {
        return {
            text: clean,
            a: split[0].trim().replace(/,\s*$/, ''),
            b: split.slice(1).join(' yoksa ').trim().replace(/\?\s*$/, '')
        };
    }

    return { text: clean, a: 'Seçenek A', b: 'Seçenek B' };
};

const Dilemma = ({ onScore, onEndTurn }) => {
    const [phase, setPhase] = useState('start');
    const [rawQuestion, getNextQuestion] = useGameData('dilemma_v2', dilemmaData);

    const options = useMemo(() => parseOptions(rawQuestion), [rawQuestion]);

    const handleStart = () => {
        getNextQuestion();
        setPhase('question');
    };

    const handleChoice = () => {
        setPhase('result');
    };

    const handleFinish = () => {
        onScore(1);
        onEndTurn();
    };

    if (phase === 'start') {
        return (
            <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '2rem', flex: 1, textAlign: 'center' }}>
                <h2 style={{ fontSize: '2.5rem' }}>Bunu Yapar Mıydın?</h2>
                <p style={{ color: 'var(--text-secondary)' }}>İki seçenekten birini seçeceksin. Ortası yok.</p>
                <Button variant="primary" onClick={handleStart} style={{ padding: '2rem 4rem', fontSize: '1.5rem', marginTop: '1rem' }}>
                    Soruyu Getir
                </Button>
            </div>
        );
    }

    if (phase === 'question') {
        return (
            <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '2rem', flex: 1, textAlign: 'center' }}>
                <h2 style={{ fontSize: '2rem', color: 'var(--warning-color)' }}>Hangisini Seçerdin?</h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '90%', maxWidth: '440px', marginTop: '1rem' }}>
                    <Button variant="outline" onClick={handleChoice} style={{ padding: '1.5rem', fontSize: '1.1rem', whiteSpace: 'normal' }}>
                        A: {options.a}
                    </Button>
                    <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--text-secondary)' }}>VEYA</div>
                    <Button variant="outline" onClick={handleChoice} style={{ padding: '1.5rem', fontSize: '1.1rem', borderColor: 'var(--danger-color)', color: 'var(--danger-color)', whiteSpace: 'normal' }}>
                        B: {options.b}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-center animate-slide-up" style={{ flexDirection: 'column', gap: '2rem', flex: 1, textAlign: 'center' }}>
            <h2 style={{ fontSize: '2.3rem', color: 'var(--primary-color)' }}>Karar Verildi</h2>
            <div className="glass-panel" style={{ padding: '1.5rem', width: '90%' }}>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--warning-color)' }}>{options.text}</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>Kısa tartışın ve neden bu seçimi yaptığını anlat.</p>
            <Button variant="primary" onClick={handleFinish} style={{ padding: '1.2rem 2.4rem', marginTop: '0.5rem' }}>
                Sıradaki Oyuncu (+1)
            </Button>
        </div>
    );
};

export default Dilemma;
