import {
  type ArmyMove,
} from "../internal/gamelogic/gamedata.js";
import {
  GameState,
  type PlayingState,
} from "../internal/gamelogic/gamestate.js";
import { handleMove } from "../internal/gamelogic/move.js";
import { handlePause } from "../internal/gamelogic/pause.js";


function printPrompt(): void {
  process.stdout.write("> ");
}

export function handlerMove(gs: GameState): (move: ArmyMove) => void {
  return function (move: ArmyMove): void {
    handleMove(gs, move);
    printPrompt();
  };
}

export function handlerPause(gs: GameState): (ps: PlayingState) => void {
  return function (ps: PlayingState): void {
    handlePause(gs, ps);
    printPrompt();
  };
}

