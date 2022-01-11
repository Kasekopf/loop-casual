import { myLevel } from "kolmafia";
import { $item, $monster, $skill, get, getKramcoWandererChance, have } from "libram";

export type BanishSource = {
  name: string;
  available: () => boolean;
  do: Item | Skill;
  equip?: Item;
};

export const banishSources: BanishSource[] = [
  {
    name: "Bowl Curveball",
    // eslint-disable-next-line libram/verify-constants
    available: () => have($item`cosmic bowling ball`),
    // eslint-disable-next-line libram/verify-constants
    do: $skill`Bowl a Curveball`,
  },
  {
    name: "Louder Than Bomb",
    available: () => have($item`Louder Than Bomb`),
    do: $item`Louder Than Bomb`,
  },
  {
    name: "Feel Hatred",
    available: () => get("_feelHatredUsed") < 3 && have($skill`Emotionally Chipped`),
    do: $skill`Feel Hatred`,
  },
  {
    name: "Reflex Hammer",
    available: () => get("_reflexHammerUsed") < 3 && have($item`Lil' Doctor™ bag`),
    do: $skill`Reflex Hammer`,
    equip: $item`Lil' Doctor™ bag`,
  },
  {
    name: "Snokebomb",
    available: () => get("_snokebombUsed") < 3 && have($skill`Snokebomb`),
    do: $skill`Snokebomb`,
  },
  {
    name: "KGB dart",
    available: () =>
      get("_kgbTranquilizerDartUses") < 3 && have($item`Kremlin's Greatest Briefcase`),
    do: $skill`KGB tranquilizer dart`,
    equip: $item`Kremlin's Greatest Briefcase`,
  },
  {
    name: "Latte",
    available: () => !get("_latteBanishUsed") && have($item`latte lovers member's mug`),
    do: $skill`Throw Latte on Opponent`,
    equip: $item`latte lovers member's mug`,
  },
  {
    name: "Middle Finger",
    available: () => !get("_mafiaMiddleFingerRingUsed") && have($item`mafia middle finger ring`),
    do: $skill`Show them your ring`,
    equip: $item`mafia middle finger ring`,
  },
  {
    name: "Crystal Skull",
    available: () => have($item`crystal skull`),
    do: $item`crystal skull`,
  },
];

export type WandererSource = {
  name: string;
  available: () => boolean;
  equip?: Item;
  monster: Monster;
};

export const wandererSources: WandererSource[] = [
  {
    name: "Kramco",
    available: () => getKramcoWandererChance() === 1 && myLevel() >= 10,
    equip: $item`Kramco Sausage-o-Matic™`,
    monster: $monster`sausage goblin`,
  },
];
