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
                        <div className = "w-full flex flex-col items-center space-y-4">
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
                            
                            <div className = "w-full flex flex-col md:flex-row items-center md:items-start justify-center gap-4">
                                <Card className = "w-full max-w-sm ">
                                    <CardHeader>
                                        <CardTitle className = "text-center">Create Game</CardTitle>
                                    </CardHeader>
                                    <CardContent className = "space-y-3">
                                            <p className = "text-muted-foreground">Start a game and invite friends</p>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant = "outline"># of Rounds</Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    {Array.from({length: 18}, (_, i) => i + 3).map((number) => (
                                                        <DropdownMenuItem key = {number} onClick = {() => console.log({number})}>
                                                            {number}
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu> 
                                            <Button
                                                type = "submit"
                                                onClick={handleCreateGame}
                                                disabled={!playerName.trim()}
                                                className = "w-full"
                                            > Create Game Code</Button>
                                    </CardContent>                                                    
                                </Card>

                                <Card className = "w-full max-w-sm">
                                    <CardHeader>
                                        <CardTitle className = "text-center">Join Game</CardTitle>
                                    </CardHeader>
                                    <CardContent className = "space-y-3">
                                        <p className = "text-muted-foreground">Enter game code to join</p>
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
