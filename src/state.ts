import { Location, Monster, toLocation, toMonster, visitUrl } from "kolmafia";
import { get } from "libram";
import { BanishState } from "./resources";
import { AbsorbState } from "./tasks/absorb";

export class GameState {
  banishes: BanishState;
  absorb: AbsorbState;
  orb: OrbState;

  constructor() {
    this.banishes = new BanishState();
    this.absorb = new AbsorbState();
    this.orb = new OrbState();
  }
}

class OrbState {
  predictions: Map<Location, Monster>;

  constructor() {
    visitUrl("inventory.php?ponder=1", false);
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
