import { $skill, Macro } from "libram";
import { BanishSource, RunawaySource, WandererSource } from "./resources";

export enum MonsterStrategy {
  RunAway,
  Kill,
  KillHard,
  Banish,
  Abort,
}

export class BuiltCombatStrategy {
  macro: Macro = new Macro();

  use_banish?: Macro;
  use_runaway?: Macro;

  constructor(
    abstract: CombatStrategy,
    banish?: BanishSource,
    runaway?: RunawaySource,
    wanderer?: WandererSource
  ) {
    if (banish?.do instanceof Item) this.use_banish = new Macro().item(banish.do);
    if (banish?.do instanceof Skill) this.use_banish = new Macro().skill(banish.do);
    this.use_runaway = runaway?.do;

    // Setup the macros
    abstract.macros.forEach((value, key) => {
      this.macro = this.macro.if_(key, value);
    });
    abstract.strategy.forEach((strat, monster) => {
      this.macro = this.macro.if_(monster, this.prepare_macro(strat, monster));
    });

    if (wanderer !== undefined)
      this.macro = this.macro.if_(wanderer.monster, this.prepare_macro(MonsterStrategy.KillHard));
    if (abstract.default_macro) this.macro = this.macro.step(abstract.default_macro);
    this.macro = this.macro.step(this.prepare_macro(abstract.default_strategy));
  }

  public handle_monster(monster: Monster, strategy: MonsterStrategy | Macro): void {
    this.macro = new Macro().if_(monster, this.prepare_macro(strategy, monster)).step(this.macro);
  }

  prepare_macro(strategy: MonsterStrategy | Macro, monster?: Monster): Macro {
    if (strategy instanceof Macro) return strategy;

    switch (strategy) {
      case MonsterStrategy.RunAway:
        if (this.use_runaway === undefined)
          return new Macro()
            .runaway()
            .skill($skill`Saucestorm`)
            .attack()
            .repeat();
        else return this.use_runaway;
      case MonsterStrategy.Kill:
        if (monster && monster.physicalResistance > 50)
          return new Macro().skill($skill`Saucegeyser`).repeat();
        else return new Macro().attack().repeat();
      case MonsterStrategy.KillHard:
        return new Macro().skill($skill`Saucegeyser`).repeat();
      case MonsterStrategy.Banish:
        if (this.use_banish === undefined) return new Macro().abort(); // should already be banished
        return this.use_banish;
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
  boss: boolean;

  constructor(boss?: boolean) {
    this.boss = boss ?? false;
  }
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

  public can(do_this: MonsterStrategy): boolean {
    if (do_this === this.default_strategy) return true;
    return Array.from(this.strategy.values()).includes(do_this);
  }

  public where(do_this: MonsterStrategy): Monster[] {
    return Array.from(this.strategy.keys()).filter((key) => this.strategy.get(key) === do_this);
  }
}
