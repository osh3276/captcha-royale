import {
  createBrowserRouter,
  RouterProvider,
} from "react-router";

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import MainMenu from './MainMenu.tsx'

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />, 
  },
  {
    path: "/main-menu",
    element: <MainMenu onCreateGame={() => {}} onJoinGame={() => {}} />,
  },
]);

const root = document.getElementById("root");

createRoot(root!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
