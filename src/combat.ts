import { $item, $skill, get, have, Macro } from "libram";

enum MonsterStrategy {
  RunAway,
  Kill,
  KillBanish,
  Banish,
  Abort,
}

export type BanishSource = {
  name: string;
  available: () => boolean;
  do: Macro;
  equip?: Item;
};

const banishSources: BanishSource[] = [
  {
    name: "Bowl Curveball",
    // eslint-disable-next-line libram/verify-constants
    available: () => have($item`cosmic bowling ball`),
    // eslint-disable-next-line libram/verify-constants
    do: new Macro().skill($skill`Bowl a Curveball`),
  },
  {
    name: "Louder Than Bomb",
    available: () => have($item`Louder Than Bomb`),
    do: new Macro().item($item`Louder Than Bomb`),
  },
  {
    name: "Feel Hatred",
    available: () => get("_feelHatredUsed") < 3 && have($skill`Emotionally Chipped`),
    do: new Macro().skill($skill`Feel Hatred`),
  },
  {
    name: "Reflex Hammer",
    available: () => get("_reflexHammerUsed") < 3 && have($item`Lil' Doctor™ bag`),
    do: new Macro().skill($skill`Reflex Hammer`),
    equip: $item`Lil' Doctor™ bag`,
  },
  {
    name: "Snokebomb",
    available: () => get("_snokebombUsed") < 3 && have($skill`Snokebomb`),
    do: new Macro().skill($skill`Snokebomb`),
  },
  {
    name: "KGB dart",
    available: () =>
      get("_kgbTranquilizerDartUses") < 3 && have($item`Kremlin's Greatest Briefcase`),
    do: new Macro().skill($skill`KGB tranquilizer dart`),
    equip: $item`Kremlin's Greatest Briefcase`,
  },
  {
    name: "Latte",
    available: () => !get("_latteBanishUsed") && have($item`latte lovers member's mug`),
    do: new Macro().skill($skill`Throw Latte on Opponent`),
    equip: $item`latte lovers member's mug`,
  },
  {
    name: "Middle Finger",
    available: () => !get("_mafiaMiddleFingerRingUsed") && have($item`mafia middle finger ring`),
    do: new Macro().skill($skill`Show them your ring`),
    equip: $item`mafia middle finger ring`,
  },
];

export class BuiltCombatStrategy {
  macro: Macro = new Macro();
  equip: Item[] = [];
  can_run_away = false;
  used_banishes: Set<string> = new Set<string>();

  constructor(abstract: CombatStrategy) {
    abstract.macros.forEach((value, key) => {
      this.macro = this.macro.if_(key, value);
    });
    abstract.strategy.forEach((value, key) => {
      this.macro = this.macro.if_(key, this.prepare_macro(value, key));
    });

    if (abstract.default_macro) this.macro = this.macro.step(abstract.default_macro);
    this.macro = this.macro.step(this.prepare_macro(abstract.default_strategy));
  }

  prepare_macro(strategy: MonsterStrategy, monster?: Monster): Macro {
    switch (strategy) {
      case MonsterStrategy.RunAway:
        this.can_run_away = true;
        return new Macro().runaway();
      case MonsterStrategy.Kill:
        if (monster && monster.physicalResistance > 10)
          return new Macro().skill($skill`Saucegeyser`);
        else return new Macro().attack().repeat();
      case MonsterStrategy.KillBanish:
        this.equip.push($item`Pantsgiving`);
        return new Macro().skill($skill`Talk About Politics`);
      case MonsterStrategy.Banish:
        for (const banish of banishSources) {
          if (!banish.available()) continue;
          if (this.used_banishes.has(banish.name)) continue;

          this.used_banishes.add(banish.name);
          if (banish.equip) this.equip.push(banish.equip);
          return banish.do;
        }
        throw `Out of banishes; unable to banish ${monster}`;
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
