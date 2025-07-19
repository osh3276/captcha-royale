const message = {
	auth: "auth",
	auth_success: "auth_success",
	auth_error: "auth_error",
	game_created: "game_created",
	game_joined: "game_joined",
	game_ended: "game_ended", // This is when the game is over and th winner is decided
	target_player: "target_player",
	game_message: "game_message", // This will send the solutions to questions ...
	game_state: "game_state", // This is going to have the current state of the game so that you can see all of the other players' moves
	captchaCorrect: "captchaCorrect",
	captchaWrong: "captchaWrong",
};

const gameState = {
	waiting: "waiting", // This is when the game is waiting for players to join
	started: "started", // This is when the game has started
	ended: "ended", // This is when the game is over and the winner is decided
};

export { message, gameState };
