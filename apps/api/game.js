import { message } from "./message.js"

const getAvailableGameId = (games) => {
    // Make sure its not already in the map of games 
    const newId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    if (games.has(newId)) {
        return getAvailableGameId(games)
    }
    return newId
}

class game {
    constructor(id, creatorId, players) {
        this.id = id
        this.creatorId = creatorId
        this.players = players
        this.state = gameState.waiting

        // Attach to the databsae 
        this.saveToDatabase()
    }

    addPlayer(playerId) {
        if (this.state === gameState.waiting) {
            this.players.push(playerId)
        } else {
            console.log(`Game ${this.id} is not in the waiting state`)
        }
    }

    saveToDatabase() {

    }

    startGame() {
        this.state = gameState.started

    }
    
}


export { game }