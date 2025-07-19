import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { message } from "../../api/message.js";


// setup process

type WebSocketContextType = {
    socket: WebSocket | null;
    sendMessage: (msg: string) => void;
};

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [socket, setSocket] = useState<WebSocket | null>(null);

    useEffect(() => {
        const host = "localhost"
        const ws = new WebSocket(`ws://${host}:3001/ws`); // Replace with your server URL
        setSocket(ws);

        ws.onopen = () => console.log("WebSocket connected");
        ws.onclose = () => console.log("WebSocket disconnected");

        return () => ws.close();
    }, []);

    const sendMessage = (msg: string) => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(msg);
        }
    };

    return (
        <WebSocketContext.Provider value={{ socket, sendMessage }}>
            {children}
        </WebSocketContext.Provider>
    );
};

export function useWebSocket() {
    const ctx = useContext(WebSocketContext);
    if (!ctx) throw new Error("useWebSocket must be used within a WebSocketProvider");
    return ctx;
}
