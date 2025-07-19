import {
  createBrowserRouter,
  RouterProvider,
} from "react-router";

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import MainMenu from './MainMenu.tsx'
import GamePage from "./GamePage.tsx";
import { GameLobby } from "./GameLobby.tsx";
import { WebSocketProvider } from "./WebSocketProvider.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/main-menu",
    element: <MainMenu onCreateGame={() => { }} onJoinGame={() => { }} />,
  },
  {
    path: "/lobby",
    element: <GameLobby
      currentPlayer={{
        id: "player-1",
        name: "DemoPlayer",
        score: 0,
        isReady: true,
        isHost: true,
        captchasSolved: 0,
        status: "waiting"
      }}
    />,
  },
  {
    path: "/play",
    element: <GamePage />,
  }
]);

const root = document.getElementById("root");

createRoot(root!).render(
  <StrictMode>
    <WebSocketProvider>
      <RouterProvider router={router} />
    </WebSocketProvider>
  </StrictMode>,
)
