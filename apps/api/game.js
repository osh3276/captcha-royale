

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
        // This is TBD 
    }

    startGame() {
        this.state = gameState.started
        // Initialize the questions, each 
    }
    
}