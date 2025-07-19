import { WebSocketServer } from "ws";


class SocketHandler {

    clients = new Map(); // This is the list of active clients, it will store the client id, the game id, and the websocket instance    
    games = new Map(); // This is the list of active games, it will store the game id, the game instance, and the list of clients in the game

    constructor(server) {
        this.wss = new WebSocketServer({ server, path: '/ws' });
        console.log('WebSocket server created and listening on /ws');

        this.wss.on('connection', (ws) => {
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
            })
            ws.on('close', () => {
                console.log('Client disconnected with id: ', ws.id)
            })
        })
    }

    handleMessage(ws, message) {
        try {
            const data = JSON.parse(message)
            if (data.type === 'auth') {
                ws.id = data.id
                this.clients.set(ws.id, {
                    gameId: data.gameId,
                    ws: ws
                })
                ws.send(JSON.stringify({ type: 'auth_success' }))
            }
            
        } catch (error) {
            console.error('Error handling message: ', error)
        }
    }
}

export default SocketHandler;