import { Location, Monster } from "kolmafia";
import { CrystalBall } from "libram";
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
    this.predictions = CrystalBall.ponder();
  }

  prediction(loc: Location): Monster | undefined {
    return this.predictions.get(loc);
  }
}
