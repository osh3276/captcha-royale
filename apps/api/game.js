import { message, gameState } from "./message.js";
import pool from "./db.js";

const getAvailableGameId = (games) => {
	const newId =
		Math.random().toString(36).substring(2, 15) +
		Math.random().toString(36).substring(2, 15);
	if (games.has(newId)) {
		return getAvailableGameId(games);
	}
	return newId;
};

class Game {
	constructor(id, creatorId, players = []) {
		this.id = id;
		this.creatorId = creatorId;
		this.state = gameState.waiting;
		this.players = new Map(); // userId -> playerState
		players.forEach((userId) => {
			this.players.set(userId, {
				solved: 0,
				left: 10, // or whatever the starting number is
				captchaQueue: [], // array of captcha ids
				targetting: [], // array of userIds
				currentCaptcha: null, // id of the current captcha
			});
		});
		this.startTime = null;
		this.endTime = null;
		this.winner = null;
		this.saveToDatabase();
	}

	addPlayer(userId) {
		if (this.state === gameState.waiting && !this.players.has(userId)) {
			this.players.set(userId, {
				solved: 0,
				left: 10,
				captchaQueue: [],
				targetting: [],
				currentCaptcha: null,
			});
		}
	}

	// Initialize all player queues with random captcha IDs
	initializeCaptchaQueues(captchaPool, queueLength = 10) {
		for (const player of this.players.values()) {
			player.captchaQueue = [];
			for (let i = 0; i < queueLength; i++) {
				const captchaId =
					captchaPool[Math.floor(Math.random() * captchaPool.length)];
				player.captchaQueue.push(captchaId);
			}
			player.currentCaptcha = player.captchaQueue[0];
		}
	}

	// Handle a captcha submission from a user
	handleCaptchaSubmission(userId, captchaId, isCorrect) {
		const player = this.players.get(userId);
		if (!player) return { correct: false };
		if (player.currentCaptcha !== captchaId) return { correct: false };
		if (isCorrect) {
			player.solved += 1;
			player.left -= 1;
			player.captchaQueue.shift();
			player.currentCaptcha = player.captchaQueue[0] || null;
			if (player.left <= 0) {
				this.winner = userId;
				this.finishGame();
			}
			return { correct: true };
		} else {
			return { correct: false };
		}
	}

	getGameState() {
		const state = {};
		for (const [userId, player] of this.players.entries()) {
			state[userId] = {
				solved: player.solved,
				left: player.left,
				currentCaptcha: player.currentCaptcha,
				targetting: player.targetting,
			};
		}
		return {
			gameId: this.id,
			state: this.state,
			players: state,
		};
	}

	async finishGame() {
		if (this.state === gameState.ended) return; // Game already finished
		this.state = gameState.ended;
		this.endTime = Date.now();

		const query = `
            UPDATE games
            SET winner = $1, state = $2, ended_at = NOW()
            WHERE game_code = $3;
        `;

		try {
			await pool.query(query, [this.winner, this.state, this.id]);
			console.log(`Game ${this.id} finished and state updated in DB.`);
		} catch (error) {
			console.error("Failed to update game on finish", error);
		}
	}

	async saveToDatabase() {
		// This is called on game creation
		const query = `
            INSERT INTO games (game_code, user1, state)
            VALUES ($1, $2, $3)
            ON CONFLICT (game_code) DO NOTHING;
        `;
		try {
			await pool.query(query, [this.id, this.creatorId, this.state]);
			console.log(`Game ${this.id} saved to database.`);
		} catch (error) {
			console.error("Error saving game to database:", error);
		}
	}

	startGame(captchaPool, queueLength = 10) {
		this.state = gameState.started;
		this.startTime = Date.now();
		this.initializeCaptchaQueues(captchaPool, queueLength);
	}
}

export { Game, getAvailableGameId };
