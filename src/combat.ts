import { $item, $skill, get, getBanishedMonsters, have, Macro } from "libram";
import { debug } from "./lib";

enum MonsterStrategy {
  RunAway,
  Kill,
  KillHard,
  KillBanish,
  Banish,
  Abort,
}

export type BanishSource = {
  name: string;
  available: () => boolean;
  do: Item | Skill;
  equip?: Item;
};

const banishSources: BanishSource[] = [
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
];

export class BuiltCombatStrategy {
  macro: Macro = new Macro();
  equip: Item[] = [];
  can_run_away = false;

  constructor(abstract: CombatStrategy) {
    // Setup the macro for non-banish targets
    abstract.macros.forEach((value, key) => {
      this.macro = this.macro.if_(key, value);
    });
    abstract.strategy.forEach((strat, monster) => {
      if (strat !== MonsterStrategy.Banish) {
        this.macro = this.macro.if_(monster, this.prepare_macro(strat, monster));
      }
    });

    this.assign_banishes(abstract.strategy);

    if (abstract.default_macro) this.macro = this.macro.step(abstract.default_macro);
    this.macro = this.macro.step(this.prepare_macro(abstract.default_strategy));
  }

  assign_banishes(strategy: Map<Monster, MonsterStrategy>): void {
    const used_banishes: Set<Item | Skill> = new Set<Item | Skill>();
    const to_banish: Monster[] = [];
    const already_banished = new Map(
      Array.from(getBanishedMonsters(), (entry) => [entry[1], entry[0]])
    );

    // Record monsters that still need to be banished, and the banishes used
    strategy.forEach((strat, monster) => {
      if (strat === MonsterStrategy.Banish) {
        const banished_with = already_banished.get(monster);
        if (banished_with === undefined) {
          to_banish.push(monster);
        } else {
          used_banishes.add(banished_with);
        }
      }
    });
    if (to_banish.length === 0) return; // All monsters banished.
    debug(`Banish targets: ${to_banish}`);
    debug(`Banishes used: ${used_banishes}`);

    // Choose the next banish to use
    const banishes_available = banishSources.filter(
      (banish) => banish.available() && !used_banishes.has(banish.do)
    );
    if (banishes_available.length === 0) {
      throw `Out of banishes; unable to banish ${to_banish}`;
    }

    // Prepare to use the banish on all needed monsters
    const banish = banishes_available[0];
    debug(`Banish chosen: ${banish}`);
    const use_banish =
      banish.do instanceof Item ? new Macro().item(banish.do) : new Macro().skill(banish.do);
    if (banish.equip) this.equip.push(banish.equip);
    for (const monster of to_banish) {
      this.macro = this.macro.if_(monster, use_banish);
    }
  }

  prepare_macro(strategy: MonsterStrategy, monster?: Monster): Macro {
    switch (strategy) {
      case MonsterStrategy.RunAway:
        this.can_run_away = true;
        return new Macro().runaway();
      case MonsterStrategy.Kill:
        if (monster && monster.physicalResistance > 10)
          return new Macro().skill($skill`Saucegeyser`).repeat();
        else return new Macro().attack().repeat();
      case MonsterStrategy.KillHard:
        return new Macro().skill($skill`Saucegeyser`).repeat();
      case MonsterStrategy.KillBanish:
        this.equip.push($item`Pantsgiving`);
        return new Macro().skill($skill`Talk About Politics`);
      case MonsterStrategy.Banish:
        throw `Banishes should be assigned by assign_banishes`;
      case MonsterStrategy.Abort:
        return new Macro().abort();
    }
  }
}

export class CombatStrategy {
  default_strategy: MonsterStrategy = MonsterStrategy.RunAway;
  default_macro?: Macro;
  strategy: Map<Monster, MonsterStrategy> = new Map(); //  { [id: number]: MonsterStrategy } = {};
  macros: Map<Monster, Macro> = new Map(); // { [id: number]: Macro } = {};

  apply(strategy: MonsterStrategy, ...monsters: Monster[]): CombatStrategy {
    if (monsters.length === 0) {
      this.default_strategy = strategy;
    }
    for (const monster of monsters) {
      this.strategy.set(monster, strategy);
    }
    return this;
  }
  public kill(...monsters: Monster[]): CombatStrategy {
    return this.apply(MonsterStrategy.Kill, ...monsters);
  }
  public killHard(...monsters: Monster[]): CombatStrategy {
    return this.apply(MonsterStrategy.KillHard, ...monsters);
  }
  public banish(...monsters: Monster[]): CombatStrategy {
    if (monsters.length === 0) throw `Must specify list of monsters to banish`;
    return this.apply(MonsterStrategy.Banish, ...monsters);
  }
  public killBanish(...monsters: Monster[]): CombatStrategy {
    if (monsters.length === 0) throw `Must specify list of monsters to banish`;
    return this.apply(MonsterStrategy.KillBanish, ...monsters);
  }
  public flee(...monsters: Monster[]): CombatStrategy {
    return this.apply(MonsterStrategy.RunAway, ...monsters);
  }
  public item(item: Item, ...monsters: Monster[]): CombatStrategy {
    return this.macro(new Macro().item(item), ...monsters);
  }
  public abort(...monsters: Monster[]): CombatStrategy {
    return this.apply(MonsterStrategy.Abort, ...monsters);
  }
  public macro(strategy: Macro, ...monsters: Monster[]): CombatStrategy {
    if (monsters.length === 0) {
      this.default_macro = strategy;
    }
    for (const monster of monsters) {
      this.macros.set(monster, strategy);
    }
    return this;
  }
  public build(): BuiltCombatStrategy {
    return new BuiltCombatStrategy(this);
  }
}
