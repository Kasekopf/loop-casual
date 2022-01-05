import { Macro } from "libram";

enum MonsterStrategy {
  RunAway,
  Kill,
  Banish,
  Abort,
}

function to_macro(strategy: MonsterStrategy): Macro {
  switch (strategy) {
    case MonsterStrategy.RunAway:
      return new Macro().runaway();
    case MonsterStrategy.Kill:
      return new Macro().attack().repeat();
    case MonsterStrategy.Banish:
      return new Macro().attack().repeat();
    case MonsterStrategy.Abort:
      return new Macro().abort();
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
    return this.apply(MonsterStrategy.Banish, ...monsters);
  }
  public flee(...monsters: Monster[]): CombatStrategy {
    return this.apply(MonsterStrategy.RunAway, ...monsters);
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

  public can_run_away(): boolean {
    return (
      this.default_strategy === MonsterStrategy.RunAway ||
      MonsterStrategy.RunAway in this.strategy.values()
    );
  }

  public build(): Macro {
    let macro = new Macro();
    macro = Object.entries(this.macros).reduce((prev, [key, value]) => prev.if_(key, value), macro);
    macro = Object.entries(this.strategy).reduce(
      (prev, [key, value]) => prev.if_(key, to_macro(value)),
      macro
    );
    if (this.default_macro) macro.step(this.default_macro);
    macro.step(to_macro(this.default_strategy));
    return macro;
  }
}
