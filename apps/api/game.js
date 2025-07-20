import { message, gameState } from "./message.js";
import pool from "./db.js";

const getAvailableGameId = (games) => {
	let newId;
	do {
		newId = Math.random().toString(36).substring(2, 6).toUpperCase();
	} while (games.has(newId));
	return newId;
};


class Game {
	constructor(id, createdAt, creatorId, gameCode, rounds, players = [], saveToDb = true) {
		this.id = id;
		this.createdAt = createdAt;
		this.creatorId = creatorId;
		this.game_code = gameCode;
		this.rounds = rounds;
		this.state = gameState.waiting;
		this.players = new Map(); // userId -> playerState
		if (players) {
			players.forEach((player) => {
				// player can be userId or { player_id, player_name }
				if (typeof player === 'object' && player.player_id && player.player_name) {
					this.players.set(player.player_id, {
						player_name: player.player_name,
						solved: 0,
						left: 10,
						captchaQueue: [],
						targetting: [],
						currentCaptcha: null,
					});
				} else {
					this.players.set(player, {
						player_name: undefined,
						solved: 0,
						left: 10,
						captchaQueue: [],
						targetting: [],
						currentCaptcha: null,
					});
				}
			});
		}
		this.startTime = null;
		this.endTime = null;
		this.winner = null;
		if (saveToDb) {
			this.saveToDatabase();
		}
	}

	addPlayer(userId, playerName) {
		if (this.state === gameState.waiting && !this.players.has(userId)) {
			this.players.set(userId, {
				player_name: playerName,
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
				player_name: player.player_name,
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
			INSERT INTO games (id, creator, state)
			VALUES ($1, $2, $3);
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
