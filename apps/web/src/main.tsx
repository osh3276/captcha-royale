import {
  createBrowserRouter,
  RouterProvider,
} from "react-router";

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
]);

const root = document.getElementById("root");

createRoot(root!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
