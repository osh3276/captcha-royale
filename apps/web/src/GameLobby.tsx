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

export function GameLobby({ currentPlayer }: GameLobbyProps) {
    const { socket, sendMessage } = useWebSocket();
    const location = useLocation();
    const gameData = location.state.gameData.game;
    const navigate = useNavigate();

    const [session, setSession] = React.useState<GameSession>(gameData);

    useEffect(() => {
        if (!socket) return;
        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === "sessionUpdate") setSession(data.session);
        }
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

    // Mock additional players for demo
    const mockPlayers: Player[] = session.players.map(p => ({
        id: p.player_id,
        name: p.player_name,
        score: 0,
        captchasSolved: 0,
        status: 'waiting',
        isReady: false,
        isHost: p.player_id === session.creator.player_id,
    }));

    const readyPlayers = mockPlayers.filter(p => p.isReady).length;
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
                                    <span>{readyPlayers}/{mockPlayers.length}</span>
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
                                <CardTitle>Players ({mockPlayers.length})</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {mockPlayers.map((player) => (
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
