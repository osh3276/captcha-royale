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

export interface GameSession {
  id: string;
  players: Player[];
  maxPlayers: number;
  gameState: GameState;
  rounds: number;
  inviteCode: string;
}
