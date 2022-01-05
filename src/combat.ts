import { Macro } from "libram";

enum MonsterStrategy {
  Kill,
  Banish,
  Abort,
}

export class CombatStrategy {
  strategy: { [id: number]: MonsterStrategy | Macro } = {};
  apply(strategy: MonsterStrategy | Macro, ...monsters: Monster[]): CombatStrategy {
    if (monsters.length === 0) {
      this.strategy[-1] = strategy;
    }
    for (const monster of monsters) {
      this.strategy[monster.id] = strategy;
    }
    return this;
  }
  public kill(...monsters: Monster[]): CombatStrategy {
    return this.apply(MonsterStrategy.Kill, ...monsters);
  }
  public banish(...monsters: Monster[]): CombatStrategy {
    return this.apply(MonsterStrategy.Banish, ...monsters);
  }
  public abort(...monsters: Monster[]): CombatStrategy {
    return this.apply(MonsterStrategy.Abort, ...monsters);
  }
  public macro(strategy: Macro, ...monsters: Monster[]): CombatStrategy {
    return this.apply(strategy, ...monsters);
  }
}
