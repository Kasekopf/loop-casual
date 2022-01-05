import { get, Macro } from "libram";
import { StringProperty } from "libram/dist/propertyTypes";

export type Quest = {
  name: string;
  tasks: Task[];
};

export type Task = {
  name: string;
  after?: string | string[];
  ready?: () => boolean;
  completed?: () => boolean;
  prepare?: () => void;
  do: Location | (() => void);
  choices?: { [id: number]: number };
  combat?: CombatStrategy;
  modifier?: string;
  equip?: Item[];
  familiar?: Familiar;
  cap?: number;
};

export function step(questName: StringProperty): number {
  const stringStep = get(questName);
  if (stringStep === "unstarted") return -1;
  else if (stringStep === "started") return 0;
  else if (stringStep === "finished") return 999;
  else {
    if (stringStep.substring(0, 4) !== "step") {
      throw "Quest state parsing error.";
    }
    return parseInt(stringStep.substring(4), 10);
  }
}

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
