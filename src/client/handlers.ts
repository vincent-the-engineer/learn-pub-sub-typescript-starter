import {
  type ArmyMove,
} from "../internal/gamelogic/gamedata.js";
import {
  GameState,
  type PlayingState,
} from "../internal/gamelogic/gamestate.js";
import {
  handleMove,
  MoveOutcome,
} from "../internal/gamelogic/move.js";
import { handlePause } from "../internal/gamelogic/pause.js";
import { AckType } from "../internal/pubsub/json.js";


function printPrompt(): void {
  process.stdout.write("> ");
}

export function handlerMove(gs: GameState): (move: ArmyMove) => AckType {
  return function (move: ArmyMove): AckType {
    try {
      const moveOutcome = handleMove(gs, move);
      if (moveOutcome === MoveOutcome.Safe
          || moveOutcome === MoveOutcome.MakeWar) {
        return AckType.Ack;
      } else {
        return AckType.NackDiscard;
      }
    } finally {
      printPrompt();
    }
  };
}

export function handlerPause(gs: GameState): (ps: PlayingState) => AckType {
  return function (ps: PlayingState): AckType {
    handlePause(gs, ps);
    printPrompt();
    return AckType.Ack;
  };
}

