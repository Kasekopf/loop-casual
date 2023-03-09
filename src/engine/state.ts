import { Location, Monster, print, toLocation, toMonster, visitUrl } from "kolmafia";
import { get } from "libram";
import { BanishState } from "./resources";
import { AbsorbState } from "../tasks/absorb";
import { args } from "../args";

class GameState {
  private _banishes?: BanishState;
  private _absorb?: AbsorbState;
  private _orb?: OrbState;

  banishes(): BanishState {
    if (this._banishes === undefined) {
      this._banishes = new BanishState();
    }
    return this._banishes;
  }

  absorb(): AbsorbState {
    if (this._absorb === undefined) {
      this._absorb = new AbsorbState();
    }
    return this._absorb;
  }

  orb(): OrbState {
    if (this._orb === undefined) {
      this._orb = new OrbState();
    }
    return this._orb;
  }

  invalidate() {
    this._banishes = undefined;
    this._absorb = undefined;
    this._orb = undefined;
  }
}

class OrbState {
  predictions: Map<Location, Monster>;

  constructor() {
    const initialPrediction = get("crystalBallPredictions");
    visitUrl("inventory.php?ponder=1", false);
    if (get("crystalBallPredictions") !== initialPrediction && args.debug.verbose) {
      print(`Verbose: Tracking misalignment on orb.`);
    }
    this.predictions = new Map(
      get("crystalBallPredictions")
        .split("|")
        .map((element) => element.split(":") as [string, string, string])
        .map(
          ([, location, monster]) =>
            [toLocation(location), toMonster(monster)] as [Location, Monster]
        )
    );
  }

  prediction(loc: Location): Monster | undefined {
    return this.predictions.get(loc);
  }
}

export const globalStateCache = new GameState();
