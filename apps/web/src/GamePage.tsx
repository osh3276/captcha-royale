import { useEffect, useState } from "react";
import MatchOpponentCard from "./components/MatchOpponentCard";
import { Card } from "./components/ui/card";
import CaptchaGrid from "./components/CaptchaGrid";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { useNavigate } from "react-router";

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
            <div className="w-full h-[4rem] text-white p-4 flex justify-between items-center">
                <div className="flex gap-4">
                    {/* Exit button */}
                    <Button onClick={handleExit}>Exit</Button>

                    {/* Timer */}
                    <Badge variant={"destructive"}>00:30</Badge>

                    {/* Match position */}
                    <Badge>Position: 1st</Badge>

                    {/* Point counter */}
                    <Badge>Points: 100</Badge>
                </div>


                <div className="flex gap-1">
                    {/* Players remaining */}
                    <Badge>Players Remaining: {opponents.length}</Badge>
                </div>
            </div>

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
                    <div className="h-full flex-6/12 p-4">
                        {currentUserCaptcha.target}
                        <Card className="w-full h-full flex items-center justify-center">
                            <CaptchaGrid
                                gridSize={4}
                                image={`http://captcha-royale-images-3598237489.s3-website-us-east-1.amazonaws.com/required_images_output/${currentUserCaptcha.image}`}
                                correctIndexes={correctIndexes} // Example: correct tiles
                                onSubmit={(selected) => {
                                    // TODO: handle submission
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
