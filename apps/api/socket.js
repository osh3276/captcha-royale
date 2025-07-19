import { WebSocketServer } from "ws";
import { game } from "./game.js";

const CAPTCHA_POOL = ["captcha1", "captcha2", "captcha3", "captcha4", "captcha5", "captcha6", "captcha7", "captcha8", "captcha9", "captcha10"];

class SocketHandler {
    clients = new Map(); // id -> { gameId, ws }
    games = new Map(); // gameId -> Game instance

    constructor(server) {
        this.wss = new WebSocketServer({ server, path: '/ws' });
        console.log('WebSocket server created and listening on /ws');

        this.wss.on('connection', (ws) => {
            
            this.clients.set(ws.id, user)
            console.log('New client connected with id: ', ws.id)

            ws.on('message', (message) => {
                console.log('Received message: ', message)
                this.handleMessage(ws, message)
            })

            ws.on('error', (error) => {
                console.error('WebSocket error: ', error)
                if (ws.id) {
                    this.clients.delete(ws.id)
                }
                this.handleMessage(ws, data);
            });
            ws.on('close', () => {
                if (ws.id) this.clients.delete(ws.id);
            });
        });
    }

    handleMessage(ws, message) {
        try {
            const data = JSON.parse(message)

            if (data.type === message.auth) {
                // The user is sending gameId and their token 
                const decoded = jwt.verify(data.token, process.env.JWT_SECRET)

                if (!decoded) {
                    ws.send(JSON.stringify({ type: 'auth_error', message: 'Invalid token' }))
                    return
                }

                ws.user = decoded
                ws.gameId = data.gameId
                ws.game = this.games.get(data.gameId)
                ws.isAuthenticated = true

                // Send the auth success message 
                ws.send(JSON.stringify({ type: 'auth_success' }))
            }

            if (!ws.isAuthenticated) {
                ws.send(JSON.stringify({ type: 'auth_error', message: 'Not authenticated' }))
                return
            }
            
            if (data.type === message.create_game) {
                const gameId = getAvailableGameId(this.games)
                const game = new game(gameId, ws.id, [])
                this.games.set(gameId, game)
                ws.send(JSON.stringify({ type: 'game_created', gameId: gameId }))
            }
            
        } catch (error) {
            console.error('Error handling message: ', error)
        }
    }
}

export default SocketHandler;