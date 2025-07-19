

const message = {
    auth: "auth", 
    auth_success: "auth_success",
    create_game: "create_game", // This will create a new game and then return the id so the creator can join it 
    join_game: "join_game", 
    game_created: "game_created",
    game_joined: "game_joined",
    game_started: "game_started", // This is when the game starts we have to display the new page 
    game_ended: "game_ended", // This is when the game is over and th winner is decided 
    game_message: "game_message",
    game_state: "game_state", // This is going to have the current state of the game so that you can see all of the other players' moves 
}

const gameState = {
    waiting: "waiting", // This is when the game is waiting for players to join 
    started: "started", // This is when the game has started 
    ended: "ended", // This is when the game is over and the winner is decided 
}
