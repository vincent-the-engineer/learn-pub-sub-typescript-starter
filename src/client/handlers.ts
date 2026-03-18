import { type ConfirmChannel } from "amqplib";

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
import {
  handleWar,
  WarOutcome,
  type RecognitionOfWar,
  type WarResolution,
} from "../internal/gamelogic/war.js";
import {
  AckType,
  publishJSON,
} from "../internal/pubsub/json.js";
import {
  ExchangePerilTopic,
  WarRecognitionsPrefix,
} from "../internal/routing/routing.js";


function printPrompt(): void {
  process.stdout.write("> ");
}

export function handlerMove(
  gs: GameState,
  ch: ConfirmChannel
): (move: ArmyMove) => Promise<AckType> {
  return async function (move: ArmyMove): Promise<AckType> {
    try {
      const moveOutcome = handleMove(gs, move);
      if (moveOutcome === MoveOutcome.MakeWar) {
        const username = gs.getUsername();
        const rw: RecognitionOfWar = {
          attacker: move.player,
          defender: gs.getPlayerSnap(),
        };
        try {
          await publishJSON<RecognitionOfWar>(
            ch,
            ExchangePerilTopic,
            `${WarRecognitionsPrefix}.${username}`,
            rw
          );
          return AckType.Ack;
        } catch (err) {
          console.error("Error publishing war recgonition:", err);
          return AckType.NackRequeue;
        }
      } else if (moveOutcome === MoveOutcome.Safe) {
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

export function handlerWar(gs: GameState): (ps: PlayingState) => Promise<AckType> {
  return async function (rw: RecognitionOfWar): Promise<AckType> {
    try {
      const wr = handleWar(gs, rw);
      if (wr.result === WarOutcome.NotInvolved) {
        return AckType.NackRequeue;
      } else if (wr.result === WarOutcome.NoUnits) {
        return AckType.NackDiscard;
      } else if (
        wr.result === WarOutcome.OpponentWon
        || wr.result === WarOutcome.YouWon
        || wr.result === WarOutcome.Draw
      ) {
        return AckType.Ack;
      } else {
        console.error("Unknown war resolution");
        return AckType.NackDiscard;
      }
    } finally {
      printPrompt();
    }
  }
}

