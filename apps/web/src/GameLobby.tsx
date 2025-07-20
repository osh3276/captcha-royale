import React, { useEffect } from 'react';
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Copy, Crown, Users, ArrowLeft, Repeat } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import type { GameSession, Player } from './types';
import { useWebSocket } from "./WebSocketProvider";
import { useLocation, useNavigate } from 'react-router';

interface GameLobbyProps {
    currentPlayer: Player;
}

export function GameLobby(props: GameLobbyProps) {
    const { socket, sendMessage } = useWebSocket();
    const location = useLocation();
    console.log("GameLobby location state:", location.state);
    // Use currentPlayer from location.state if present, else from props
    const currentPlayer = location.state?.currentPlayer || props.currentPlayer;
    const gameData = location.state.gameData.game;
    const navigate = useNavigate();

    const [session, setSession] = React.useState<GameSession>(gameData);
    console.log("SESSION", session);

    // On mount, fetch the latest game state from the backend (for hard refreshes)
    useEffect(() => {
        const fetchLatestSession = async () => {
            try {
                const res = await fetch(`/game_state?game_code=${gameData.game_code}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.game) setSession(data.game);
                }
            } catch (err) {
                console.error("Failed to fetch latest game state", err);
            }
        };
        fetchLatestSession();

        // Subscribe to game updates via WebSocket
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "subscribe", game_code: gameData.game_code }));
        } else if (socket) {
            // If socket not open yet, subscribe on open
            socket.onopen = () => {
                socket.send(JSON.stringify({ type: "subscribe", game_code: gameData.game_code }));
            };
        }
    }, [gameData.game_code, socket]);

    useEffect(() => {
        if (!socket) return;
        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === "sessionUpdate") setSession(data.session);
            // On game_joined or game_state, update the entire session object if possible
            if ((data.type === "game_joined" || data.type === "game_state") && data.gameState) {
                setSession(prev => ({
                    ...prev,
                    ...((data.game && typeof data.game === 'object') ? data.game : {}),
                    players: Object.keys(data.gameState.players).map((id, idx) => ({
                        player_id: id,
                        player_name: data.gameState.players[id].player_name || `Player ${idx + 1}`
                    })),
                    creator: (data.game && data.game.creator) || prev.creator,
                    rounds: (data.game && data.game.rounds) || prev.rounds,
                    game_code: (data.game && data.game.game_code) || prev.game_code,
                }));
            }
        };
    }, [socket]);

    const copyInviteCode = () => {
        navigator.clipboard.writeText(session.game_code);
        toast.success('Invite code copied to clipboard!');
    };

    const onStartGame = () => {
        // Logic to start the game
        toast.success('Game is starting!');
        sendMessage(JSON.stringify({ type: "startGame", sessionId: session.id }));
    }

    const onLeaveGame = () => {
        // Logic to leave the game
        toast.info('You have left the game lobby.');
        sendMessage(JSON.stringify({ type: "leaveGame", sessionId: session.id }));
        navigate("/main-menu");
    };

    // Use real players from session
    const realPlayers: Player[] = session.players.map(p => ({
        id: p.player_id,
        name: p.player_name,
        score: 0,
        captchasSolved: 0,
        status: 'waiting',
        isReady: false,
        isHost: p.player_id === session.creator.player_id,
    }));

    const readyPlayers = realPlayers.filter(p => p.isReady).length;
    const canStart = readyPlayers >= 2 && currentPlayer.isHost;

    return (
        <div className="min-h-screen p-4">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={onLeaveGame}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Leave Game
                        </Button>
                        <div>
                            <h1 className="text-2xl">Game Lobby</h1>
                            <p className="text-muted-foreground">Waiting for players...</p>
                        </div>
                    </div>

                    <div className="text-right">
                        <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-lg px-3 py-1">
                                {session.game_code}
                            </Badge>
                            <Button variant="ghost" size="sm" onClick={copyInviteCode}>
                                <Copy className="w-4 h-4" />
                            </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">Share this code with friends</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Game Info */}
                    <div className="lg:col-span-1 space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="w-5 h-5" />
                                    Game Info
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between">
                                    <span>Ready:</span>
                                    <span>{readyPlayers}/{realPlayers.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Round Count:</span>
                                    <span className="flex items-center gap-1">
                                        <Repeat className="w-4 h-4" />
                                        {session.rounds}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Game Rules</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <p>• Solve captchas as quickly as possible</p>
                                <p>• Each correct answer earns points</p>
                                <p>• Wrong answers give penalties</p>
                                <p>• Last player standing wins!</p>
                            </CardContent>
                        </Card>

                        {currentPlayer.isHost && (
                            <Button
                                onClick={onStartGame}
                                disabled={!canStart}
                                className="w-full"
                                size="lg"
                            >
                                {readyPlayers < 2 ? 'Need at least 2 players' : 'Start Game'}
                            </Button>
                        )}
                    </div>

                    {/* Players List */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Players ({realPlayers.length})</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {realPlayers.map((player) => (
                                        <div
                                            key={player.id}
                                            className={`flex items-center gap-3 p-3 rounded-lg border ${player.id === currentPlayer.id ? 'bg-accent border-primary' : 'bg-card'
                                                }`}
                                        >
                                            {/* <Avatar>
                                                <AvatarFallback> */}
                                            {player.name.substring(0, 2).toUpperCase()}
                                            {/* </AvatarFallback>
                                            </Avatar> */}

                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span>{player.name}</span>
                                                    {player.isHost && (
                                                        <Crown className="w-4 h-4 text-yellow-500" />
                                                    )}
                                                    {player.id === currentPlayer.id && (
                                                        <Badge variant="secondary" className="text-xs">You</Badge>
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                {player.isReady ? (
                                                    <Badge variant="default" className="bg-green-500">Ready</Badge>
                                                ) : (
                                                    <Badge variant="secondary">Waiting</Badge>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            <Toaster />
        </div>
    );
}
