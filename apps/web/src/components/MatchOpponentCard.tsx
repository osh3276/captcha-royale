import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

interface MatchOpponentCardProps {
    opponent: {
        id: number;
        name: string;
    };
}

export default function MatchOpponentCard({ opponent }: MatchOpponentCardProps) {
    return (
        // <div className="w-full h-full flex flex-col items-center justify-center">
        //     <div className="w-1/2 h-1/2 bg-gray-200 rounded-lg shadow-lg flex items-center justify-center">
        //         {/* Placeholder for opponent card content */}
        //         <p className="text-gray-700">{opponent.name}</p>
        //     </div>
        // </div>

        <Card className="max-h-[20rem]">
            <CardHeader>
                <CardTitle>{opponent.name}</CardTitle>
            </CardHeader>
            <CardContent>
                <CardDescription>
                    {/* Placeholder for opponent card content */}
                </CardDescription>
            </CardContent>
            <CardFooter>
                <CardAction>
                    {/* Placeholder for opponent card action */}
                </CardAction>
            </CardFooter>
        </Card>
    );
}
