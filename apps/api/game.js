import { message, gameState } from "./message.js"

const getAvailableGameId = (games) => {
    const newId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    if (games.has(newId)) {
        return getAvailableGameId(games)
    }
    return newId
}

class Game {
    constructor(id, creatorId, players = []) {
        this.id = id;
        this.creatorId = creatorId;
        this.state = gameState.waiting;
        this.players = new Map(); // userId -> playerState
        players.forEach(userId => {
            this.players.set(userId, {
                solved: 0,
                left: 10, // or whatever the starting number is
                captchaQueue: [], // array of captcha ids
                targetting: [], // array of userIds
                currentCaptcha: null // id of the current captcha
            });
        });
        this.startTime = null;
        this.endTime = null;
        this.saveToDatabase();
    }

    addPlayer(userId) {
        if (this.state === gameState.waiting && !this.players.has(userId)) {
            this.players.set(userId, {
                solved: 0,
                left: 10,
                captchaQueue: [],
                targetting: [],
                currentCaptcha: null
            });
        }
    }

    // Initialize all player queues with random captcha IDs
    initializeCaptchaQueues(captchaPool, queueLength = 10) {
        for (const player of this.players.values()) {
            player.captchaQueue = [];
            for (let i = 0; i < queueLength; i++) {
                const captchaId = captchaPool[Math.floor(Math.random() * captchaPool.length)];
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
                targetting: player.targetting
            };
        }
        return {
            gameId: this.id,
            state: this.state,
            players: state
        };
    }

    finishGame() {
        // Loop through all users and update their scores in the database
        // (to be implemented)
    }

    saveToDatabase() {
        // (to be implemented)
    }

    startGame(captchaPool, queueLength = 10) {
        this.state = gameState.started;
        this.startTime = Date.now();
        this.initializeCaptchaQueues(captchaPool, queueLength);
    }
}

// Test function to demonstrate Game logic
function testGame() {
    const captchaPool = ["captcha1", "captcha2", "captcha3", "captcha4", "captcha5", "captcha6", "captcha7", "captcha8", "captcha9", "captcha10"];
    const playerIds = ["user1", "user2", "user3"];
    const game = new Game("game1", "user1", playerIds);
    console.log("Initial game state:", game.getGameState());

    // Start the game (fills queues)
    game.startGame(captchaPool, 5);
    console.log("After startGame:", game.getGameState());

    // Simulate user1 solving their first captcha correctly
    let user1 = game.players.get("user1");
    let firstCaptcha = user1.currentCaptcha;
    let result = game.handleCaptchaSubmission("user1", firstCaptcha, true);
    console.log("user1 solved first captcha:", result, game.getGameState());

    // Simulate user2 submitting wrong captcha
    let user2 = game.players.get("user2");
    let wrongCaptcha = "not_in_queue";
    result = game.handleCaptchaSubmission("user2", wrongCaptcha, false);
    console.log("user2 wrong captcha:", result, game.getGameState());

    // Simulate user3 solving two captchas
    let user3 = game.players.get("user3");
    let captchaA = user3.currentCaptcha;
    result = game.handleCaptchaSubmission("user3", captchaA, true);
    let captchaB = user3.currentCaptcha;
    result = game.handleCaptchaSubmission("user3", captchaB, true);
    console.log("user3 solved two captchas:", result, game.getGameState());
}

// Uncomment to run the test
testGame();

export { Game, getAvailableGameId };