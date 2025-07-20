import './MainMenu.css';
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
    Card,
    CardAction,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from 'react-router';

const onCreateGame = async (playerName: string, rounds: number) => {
    // Logic to create a game session
    console.log(`Creating game for player: ${playerName}`);
    const response = await fetch('http://localhost:3001/create_game', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ player_name: playerName, rounds: rounds }),
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return await data;
}

const onJoinGame = async (inviteCode: string, playerName: string) => {
    // Logic to join a game session
    console.log(`Joining game with code: ${inviteCode} for player: ${playerName}`);
    let response;
    try {
        response = await fetch('http://localhost:3001/join_game', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ game_code: inviteCode, player_name: playerName }),
        });
    } catch (error) {
        console.error(error);
        throw new Error('Network error while joining game');
    }

    if (!response || !response.ok) {
        let msg = `HTTP error! status: ${response?.status}`;
        try {
            const errData = await response.json();
            msg += `: ${errData?.error || ''}`;
        } catch { }
        throw new Error(msg);
    }

    const data = await response.json();
    // Defensive: ensure player_id is always found
    if (!data?.game?.players || !Array.isArray(data.game.players)) {
        throw new Error('No players found in game data');
    }
    return data;
}

export default function MainMenu() {
    const [playerName, setPlayerName] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [rounds, setRounds] = useState<number | null>(null);

    const navigate = useNavigate();

    const handleCreateGame = async () => {
        if (playerName.trim() !== '' && rounds) {
            const newGameData = await onCreateGame(playerName.trim(), rounds);
            // Find the player_id and player_name from the response
            const player_id = newGameData?.game?.creator?.player_id || newGameData?.game?.players?.[0]?.player_id;
            const player_name = newGameData?.game?.creator?.player_name || playerName.trim();
            navigate("/lobby", {
                state: {
                    gameData: newGameData,
                    currentPlayer: {
                        id: player_id,
                        name: player_name,
                        score: 0,
                        isReady: false,
                        isHost: true,
                        captchasSolved: 0,
                        status: "waiting"
                    }
                },
            });
        }
    }

    const handleJoinGame = async () => {
        if (inviteCode.trim() && playerName.trim()) {
            const joinGameData = await onJoinGame(inviteCode.trim().toLowerCase(), playerName.trim());
            // Find the player_id for the joining player
            let player_id = null;
            if (joinGameData?.game?.players) {
                // Find by player_name match (case-insensitive)
                const found = joinGameData.game.players.find(
                    (p: { player_id: string; player_name: string }) => p.player_name.toLowerCase() === playerName.trim().toLowerCase()
                );
                player_id = found?.player_id;
            }
            navigate("/lobby", {
                state: {
                    gameData: joinGameData,
                    currentPlayer: {
                        id: player_id,
                        name: playerName.trim(),
                        score: 0,
                        isReady: false,
                        isHost: joinGameData?.game?.creator?.player_id === player_id,
                        captchasSolved: 0,
                        status: "waiting"
                    }
                }
            });
        }
    }

    return (
        <>
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="max-w-2xL w-full space-y-8">
                    <div className="text-center space-y-4">
                        <h1 className="text-4xl text-primary">Captcha Royale</h1>
                        <p className="text-muted-foreground">Compete with other players in real-time captcha challenges</p>
                        <div className="w-full flex flex-col items-center space-y-4">
                            <Card className="w-full max-w-lg">
                                <CardHeader>
                                    <CardTitle className="text-center">Play Captcha Royale!</CardTitle>
                                </CardHeader>
                                <CardContent className="text-left">
                                    <form>
                                        <div className="space-y-4">
                                            <Label className="block mb-2">Your Username</Label>
                                            <Input
                                                placeholder="Enter your display name"
                                                value={playerName}
                                                onChange={(e) => setPlayerName(e.target.value)}
                                                maxLength={20}
                                            />
                                        </div>

                                        {/* <div className = "space-y-4">
                                            <h3>Join Game</h3>
                                            <Input
                                                placeholder = "Enter invite code"
                                                value = {inviteCode}
                                                onChange = {(e) => setInviteCode(e.target.value.toLowerCase())}
                                                maxLength = {6}
                                            />
                                            <Button
                                                onClick={handleJoinGame}
                                                disabled={!inviteCode.trim() || !playerName.trim()}
                                                variant="outline"
                                                className = "w-full"
                                            > Join Game</Button>
                                        </div> */}
                                    </form>
                                </CardContent>
                            </Card>

                            <div className="w-full flex flex-col md:flex-row items-center md:items-start justify-center gap-4">
                                <Card className="w-full max-w-sm ">
                                    <CardHeader>
                                        <CardTitle className="text-center">Create Game</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <p className="text-muted-foreground">Start a game and invite friends</p>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline">{rounds ? `Round Count: ${rounds}` : '# of Rounds'}</Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                {Array.from({ length: 18 }, (_, i) => i + 3).map((number) => (
                                                    <DropdownMenuItem key={number} onClick={() => setRounds(number)}>
                                                        {number}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                        <Button
                                            type="submit"
                                            onClick={handleCreateGame}
                                            disabled={!playerName.trim() || !rounds}
                                            className="w-full"
                                        > Create Game Code</Button>
                                    </CardContent>
                                </Card>

                                <Card className="w-full max-w-sm">
                                    <CardHeader>
                                        <CardTitle className="text-center">Join Game</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <p className="text-muted-foreground">Enter game code to join</p>
                                        <Input
                                            placeholder="Enter invite code"
                                            value={inviteCode}
                                            onChange={(e) => setInviteCode(e.target.value.toLowerCase())}
                                            maxLength={6}
                                        />
                                        <Button
                                            onClick={handleJoinGame}
                                            disabled={!inviteCode.trim() || !playerName.trim()}
                                            variant="outline"
                                            className="w-full"
                                        > Join Game</Button>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
