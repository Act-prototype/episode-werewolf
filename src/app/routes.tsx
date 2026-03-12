import { createBrowserRouter } from "react-router";
import ModeSelection from "./pages/ModeSelection";
import Setup from "./pages/Setup";
import CardSetup from "./pages/CardSetup";
import RoleReveal from "./pages/RoleReveal";
import Game from "./pages/Game";
import Duel from "./pages/Duel";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: ModeSelection,
  },
  {
    path: "/setup-normal",
    Component: Setup,
  },
  {
    path: "/setup-card",
    Component: CardSetup,
  },
  {
    path: "/role-reveal",
    Component: RoleReveal,
  },
  {
    path: "/game",
    Component: Game,
  },
  {
    path: "/card-game",
    Component: Duel,
  },
]);
