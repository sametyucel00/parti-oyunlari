import { useState, useEffect, useCallback } from 'react';
import { PoolStorage } from '../utils/storage';

/**
 * Custom hook to manage a pool of questions/items for a game.
 * Ensures items are shuffled and don't repeat until the pool is exhausted.
 * 
 * @param {string} gameId Unique identifier for the game
 * @param {Array} originalData The full list of questions from JSON
 * @returns {Array} [currentItem, nextItem, resetPool]
 */
export const useGameData = (gameId, originalData) => {
    const [item, setItem] = useState(null);

    const getNextItem = useCallback(() => {
        let pool = PoolStorage.getPool(gameId);

        if (!pool || pool.length === 0) {
            // Shuffle original data and create new pool
            pool = [...originalData].sort(() => 0.5 - Math.random());
        }

        const nextItem = pool.pop();
        PoolStorage.savePool(gameId, pool);
        setItem(nextItem);
        return nextItem;
    }, [gameId, originalData]);

    const resetPool = useCallback(() => {
        PoolStorage.clearPool(gameId);
        getNextItem();
    }, [gameId, getNextItem]);

    // Initialize with first item if null
    useEffect(() => {
        if (!item) {
            getNextItem();
        }
    }, [item, getNextItem]);

    return [item, getNextItem, resetPool];
};
