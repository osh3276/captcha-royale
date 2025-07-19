import { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import { message } from "./message.js";
import { Game, getAvailableGameId } from "./game.js";
import pool from "./db.js";

const CAPTCHA_POOL = [
	"captcha1",
	"captcha2",
	"captcha3",
	"captcha4",
	"captcha5",
	"captcha6",
	"captcha7",
	"captcha8",
	"captcha9",
	"captcha10",
];

class SocketHandler {
	clients = new Map(); // id -> { gameId, ws }
	games = new Map(); // gameId -> Game instance

	constructor(server) {
		this.wss = new WebSocketServer({ server, path: "/ws" });
		console.log("WebSocket server created and listening on /ws");

		this.wss.on("connection", (ws) => {
			ws.isAuthenticated = false;
			ws.on("message", async (messageStr) => {
				let data;
				try {
					data = JSON.parse(messageStr);
				} catch (e) {
					ws.send(
						JSON.stringify({
							type: "error",
							message: "Invalid JSON",
						}),
					);
					return;
				}
				if (!ws.isAuthenticated) {
					if (data.type === message.auth && data.token) {
						// JWT code structure, but do not check token for now
						let decoded = {};
						try {
							decoded = jwt.decode(data.token) || {};
						} catch (err) {
							// ignore error, allow any user for now
						}
						ws.id =
							decoded.id ||
							Math.random().toString(36).substring(2, 15); // If this is not set then for testing

						ws.isAuthenticated = true;
						this.clients.set(ws.id, { ws });
						ws.send(JSON.stringify({ type: message.auth_success }));
					} else {
						ws.send(
							JSON.stringify({
								type: message.auth_error,
								message: "Authentication required",
							}),
						);
						ws.close();
					}
					return;
				}
				await this.handleMessage(ws, data);
			});
			ws.on("close", () => {
				if (ws.id) this.clients.delete(ws.id);
			});
		});
	}

	async handleMessage(ws, data) {
		switch (data.type) {
			case message.join_game: {
				const { gameId } = data;
				const game = this.games.get(gameId);
				if (game) {
					if (game.players.size >= 2 && !game.players.has(ws.id)) {
						return ws.send(
							JSON.stringify({
								type: "error",
								message: "Game is full",
							}),
						);
					}

					game.addPlayer(ws.id);
					this.clients.get(ws.id).gameId = gameId;

					// Persist the new player if they are the second player
					if (game.players.size === 2 && game.creatorId !== ws.id) {
						try {
							const query = `
                                UPDATE games
                                SET user2 = $1
                                WHERE game_code = $2 AND user2 IS NULL;
                            `;
							await pool.query(query, [ws.id, gameId]);
						} catch (error) {
							console.error(
								"Failed to add player to game in DB",
								error,
							);
						}
					}

					ws.send(
						JSON.stringify({ type: message.game_joined, gameId }),
					);
				} else {
					ws.send(
						JSON.stringify({
							type: "error",
							message: "Game not found",
						}),
					);
				}
				break;
			}
			case message.start_game: {
				const { gameId } = this.clients.get(ws.id);
				const game = this.games.get(gameId);
				if (game && game.creatorId === ws.id) {
					game.startGame(CAPTCHA_POOL, 10);
					// Broadcast to all players
					for (const playerId of game.players.keys()) {
						const client = this.clients.get(playerId)?.ws;
						if (client) {
							client.send(
								JSON.stringify({
									type: message.game_started,
									gameState: game.getGameState(),
								}),
							);
						}
					}
				}
				break;
			}
			case message.game_message: {
				// Handle captcha submission
				const { captchaId, isCorrect } = data;
				const { gameId } = this.clients.get(ws.id);
				const game = this.games.get(gameId);
				if (game) {
					const result = game.handleCaptchaSubmission(
						ws.id,
						captchaId,
						isCorrect,
					);
					if (result.correct) {
						ws.send(
							JSON.stringify({ type: message.captchaCorrect }),
						);
					} else {
						ws.send(JSON.stringify({ type: message.captchaWrong }));
					}
					// Optionally broadcast updated game state
					for (const playerId of game.players.keys()) {
						const client = this.clients.get(playerId)?.ws;
						if (client) {
							client.send(
								JSON.stringify({
									type: message.game_state,
									gameState: game.getGameState(),
								}),
							);
						}
					}
				}
				break;
			}
			case message.game_state: {
				// Send current game state to the requester
				const { gameId } = this.clients.get(ws.id);
				const game = this.games.get(gameId);
				if (game) {
					ws.send(
						JSON.stringify({
							type: message.game_state,
							gameState: game.getGameState(),
						}),
					);
				}
				break;
			}
			default:
				ws.send(
					JSON.stringify({
						type: "error",
						message: "Unknown message type",
					}),
				);
		}
	}
}

export default SocketHandler;
