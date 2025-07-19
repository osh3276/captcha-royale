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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MainMenuProps {
    onCreateGame : (playerName: string) => void;
    onJoinGame : (inviteCode: string, playerName: string) => void;
}

export default function MainMenu({ onCreateGame, onJoinGame }: MainMenuProps) {
    const[playerName, setPlayerName] = useState('');
    const[inviteCode, setInviteCode] = useState('');

    const handleCreateGame = () => {
        if (playerName.trim() !== '') {
            onCreateGame(playerName.trim());
        }
    }

    const handleJoinGame = () => {
        if (inviteCode.trim() && playerName.trim()) {
            onJoinGame(inviteCode.trim().toLowerCase(), playerName.trim());
        }
    }

    return (
        <>
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className ="max-w-2xL w-full space-y-8">
                    <div className="text-center space-y-4">
                        <h1 className = "text-4xl text-primary">Captcha Royale</h1>
                        <p className = "text-muted-foreground">Compete with other players in real-time captcha challenges</p>
                        <div className = "w-full flex justify-center">
                            <Card className = "w-full max-w-lg">
                                <CardHeader>
                                    <CardTitle className = "text-center">Play Captcha Royale!</CardTitle>
                                </CardHeader>
                                    <CardContent className = "text-left">
                                        <form>
                                            <div className = "space-y-4">
                                                <Label className = "block mb-2">Your Username</Label>
                                                <Input
                                                    placeholder = "Enter your display name"
                                                    value = {playerName}
                                                    onChange = {(e) => setPlayerName(e.target.value)}
                                                    maxLength = {20}
                                                />
                                                {/* <div className = "grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className = "space-y-4">
                                                        <h3>Create Game</h3>
                                                        <p className = "text-muted-foreground">Start a game and invite friends</p>
                                                        <Button
                                                            onClick={handleCreateGame}
                                                            disabled={!playerName.trim()}
                                                            className = "w-full"
                                                        > Create Game Code</Button>
                                                    </div>

                                                    <div className = "space-y-4">
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
                                                    </div>
                                                </div> */}
                                            </div>
                                        </form>
                                    </CardContent>
                            </Card>
                            <Card className = "w-full max-w-md">
                                <CardHeader>
                                    <CardTitle className = "text-center">Create Game</CardTitle>
                                </CardHeader>
                                    

                            </Card>
                        </div>
                    </div>
                </div>
            </div>          
        </>
    );
}
