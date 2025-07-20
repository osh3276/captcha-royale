export type GameState = 'menu' | 'lobby' | 'playing' | 'finished';

export interface Player {
  id: string;
  name: string;
  score: number;
  isReady: boolean;
  isHost: boolean;
  captchasSolved: number;
  status: 'waiting' | 'solving' | 'finished';
}

// export interface GameSession {
//   id: string;
//   players: Player[];
//   maxPlayers: number;
//   gameState: GameState;
//   rounds: number;
//   inviteCode: string;
// }
export interface GameSession {
  id: string;
  created_at: string; // ISO string
  game_code: string;
  rounds: number;
  creator: {
    player_id: string;
    player_name: string;
  };
  players: Array<{
    player_id: string;
    player_name: string;
  }>;
}
