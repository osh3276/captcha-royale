import React, { useState } from "react";

interface CaptchaGridProps {
    gridSize?: 3 | 4; // 3x3 or 4x4
    image: string;
    correctIndexes: number[]; // Indexes of correct tiles
    onSubmit?: (selected: number[]) => void;
}

export default function CaptchaGrid({
    gridSize = 4,
    image,
    correctIndexes,
    onSubmit,
}: CaptchaGridProps) {
    const [selected, setSelected] = useState<number[]>([]);
    const totalTiles = gridSize * gridSize;

    const handleTileClick = (idx: number) => {
        setSelected((prev) =>
            prev.includes(idx)
                ? prev.filter((i) => i !== idx)
                : [...prev, idx]
        );
    };

    const handleSubmit = () => {
        if (onSubmit) onSubmit(selected);
    };

    return (
        <div className="flex flex-col items-center w-full">
            <div
                className={`grid gap-1 mb-4`}
                style={{
                    gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
                    width: gridSize === 3 ? 300 : 400,
                    height: gridSize === 3 ? 300 : 400,
                    backgroundImage: `url('${image}')`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                }}
            >
                {Array.from({ length: 16 }, (_, idx) => (
                    <button
                        key={idx}
                        className={`border-2 rounded-md overflow-hidden focus:outline-none transition-all duration-150
              ${selected.includes(idx) ? "border-blue-500 ring-2 ring-blue-400" : "border-gray-300"}
            `}
                        style={{ aspectRatio: "1/1", width: "100%", height: "100%" }}
                        onClick={() => handleTileClick(idx)}
                        type="button"
                    >
                        <div className="object-cover w-full h-full"></div>
                    </button>
                ))}
            </div>
            <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={handleSubmit}
                type="button"
            >
                Submit
            </button>
        </div>
    );
}
