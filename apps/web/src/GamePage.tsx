import { useEffect, useState } from "react";
import MatchOpponentCard from "./components/MatchOpponentCard";
import { Card } from "./components/ui/card";
import CaptchaGrid from "./components/CaptchaGrid";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { useNavigate } from "react-router";
import { Separator } from "./components/ui/separator";
import { FaArrowLeft, FaRegClock } from "react-icons/fa";
import { LuTrophy } from "react-icons/lu";

function getTrueIndices(arr: boolean[]): number[] {
    return arr
        .map((val, idx) => (val ? idx : -1))
        .filter(idx => idx !== -1);
}

function arraysEqualUnordered(a: any[], b: any[]): boolean {
    return a.length === b.length && a.every(val => b.includes(val));
}

export default function GamePage() {
    const navigate = useNavigate();

    const [opponents, setOpponents] = useState([
        { id: 1, name: "Opponent 1" },
        { id: 2, name: "Opponent 2" },
        { id: 3, name: "Opponent 3" },
        { id: 4, name: "Opponent 4" },
    ]);

    const [currentUserCaptcha, setCurrentUserCaptcha] = useState({
        "image": "Bicycle/Bicycle (100).png",
        "target": "bicycle",
        "answer": [
            false,
            false,
            false,
            false,
            true,
            true,
            true,
            false,
            true,
            true,
            true,
            false,
            false,
            false,
            false,
            false
        ]
    });

    const [correctIndexes, setCorrectIndexes] = useState(getTrueIndices(currentUserCaptcha.answer));

    useEffect(() => {
        setCorrectIndexes(getTrueIndices(currentUserCaptcha.answer));
    }, [currentUserCaptcha.answer]);

    const handleExit = () => {
        navigate("/");
    }

    return (
        <div className="h-screen w-screen flex flex-col">
            {/* Top bar */}


            <div className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="sm" onClick={handleExit}>
                                <FaArrowLeft className="w-4 h-4 mr-2" />
                                Exit
                            </Button>
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <FaRegClock className="w-4 h-4 text-destructive" />
                                    <span className="text-lg">{"00:30"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <LuTrophy className="w-4 h-4 text-yellow-500" />
                                    <span>#{1}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <LuTrophy className="w-4 h-4 text-blue-500" />
                                    <span>{123} pts</span>
                                </div>
                            </div>
                        </div>

                        <Badge variant="outline" className="text-sm">
                            {opponents.length} opponents remaining
                        </Badge>
                    </div>
                </div>
            </div>

            <Separator orientation="horizontal" />

            {/* Main gameplay area */}
            <div className="w-full h-full flex flex-col items-center justify-center">
                <div className="w-full h-full flex flex-row items-center justify-center">
                    {/* Left hand side player previews */}
                    <div className="h-full flex-1/4 grid grid-cols-2 gap-2 p-4">
                        {opponents.slice(0, Math.ceil(opponents.length / 2)).map((opponent) => (
                            <MatchOpponentCard key={opponent.id} opponent={opponent} />
                        ))}
                    </div>

                    {/* Gameplay area */}
                    <div className="h-full flex-6/12 p-4 flex flex-col items-center justify-center gap-4">
                        <Card className="w-full h-full flex items-center justify-center bg-muted/80 rounded-xl shadow-lg border border-border p-6">
                            <div className="text-xl font-semibold text-foreground mb-2 tracking-wide">
                                Select all: <span className="capitalize text-primary font-bold">{currentUserCaptcha.target}</span>
                            </div>
                            <CaptchaGrid
                                gridSize={4}
                                image={`http://captcha-royale-images-3598237489.s3-website-us-east-1.amazonaws.com/required_images_output/${currentUserCaptcha.image}`}
                                correctIndexes={correctIndexes}
                                onSubmit={(selected) => {
                                    alert(arraysEqualUnordered(selected, correctIndexes) ? "Correct!" : "Try again!");
                                }}
                            />
                        </Card>
                    </div>

                    {/* Right hand side player previews */}
                    <div className="h-full flex-1/4 grid grid-cols-2 gap-2 p-4">
                        {opponents.slice(Math.ceil(opponents.length / 2), opponents.length).map((opponent) => (
                            <MatchOpponentCard key={opponent.id} opponent={opponent} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
