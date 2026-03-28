export const STORAGE_KEYS = {
    PLAYERS: 'party_games_players',
    GROUPS: 'party_games_groups',
    HIGH_SCORES: 'party_games_high_scores',
    SETTINGS: 'party_games_settings',
    POOLS: 'party_games_pools_v2_'
};

const defaultSettings = {
    soundEnabled: true,
    musicEnabled: true
};

export const StorageArea = {
    get: (key, defaultValue = null) => {
        try {
            const item = localStorage.getItem(key);
            if (item) return JSON.parse(item);
            return defaultValue;
        } catch (e) {
            console.error(`Error reading from localStorage (${key}):`, e);
            return defaultValue;
        }
    },

    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error(`Error writing to localStorage (${key}):`, e);
        }
    },

    remove: (key) => {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.error(`Error removing from localStorage (${key}):`, e);
        }
    },

    clearAll: () => {
        localStorage.clear();
    }
};

export const PlayerStorage = {
    getPlayers: () => StorageArea.get(STORAGE_KEYS.PLAYERS, []),
    addPlayer: (player) => {
        const players = PlayerStorage.getPlayers();
        players.push(player);
        StorageArea.set(STORAGE_KEYS.PLAYERS, players);
    },
    savePlayers: (players) => StorageArea.set(STORAGE_KEYS.PLAYERS, players)
};

export const GroupStorage = {
    getGroups: () => StorageArea.get(STORAGE_KEYS.GROUPS, []),
    saveGroups: (groups) => StorageArea.set(STORAGE_KEYS.GROUPS, groups)
};

export const ScoreStorage = {
    getHighScores: () => {
        let scores = StorageArea.get(STORAGE_KEYS.HIGH_SCORES, {});
        if (Array.isArray(scores)) {
            const newScores = {};
            scores.forEach(s => {
                if (!newScores[s.gameId]) newScores[s.gameId] = [];
                newScores[s.gameId].push(s);
            });
            scores = newScores;
            StorageArea.set(STORAGE_KEYS.HIGH_SCORES, scores);
        }
        return scores;
    },
    addHighScore: (gameId, name, score, isGroup = false) => {
        const scores = ScoreStorage.getHighScores();
        if (!scores[gameId]) scores[gameId] = [];

        const isDuplicate = scores[gameId].some(s => s.name === name && s.score === score && (Date.now() - s.id < 2000));
        if (isDuplicate) return;

        scores[gameId].push({ id: Date.now(), name, score, isGroup, date: new Date().toISOString() });
        scores[gameId].sort((a, b) => b.score - a.score);

        if (scores[gameId].length > 50) {
            scores[gameId].length = 50;
        }

        StorageArea.set(STORAGE_KEYS.HIGH_SCORES, scores);
    }
};

export const SettingsStorage = {
    getSettings: () => StorageArea.get(STORAGE_KEYS.SETTINGS, defaultSettings),
    updateSetting: (key, value) => {
        const settings = SettingsStorage.getSettings();
        settings[key] = value;
        StorageArea.set(STORAGE_KEYS.SETTINGS, settings);
    }
};

export const PoolStorage = {
    getPool: (gameId) => StorageArea.get(STORAGE_KEYS.POOLS + gameId, []),
    savePool: (gameId, pool) => StorageArea.set(STORAGE_KEYS.POOLS + gameId, pool),
    clearPool: (gameId) => StorageArea.remove(STORAGE_KEYS.POOLS + gameId)
};
