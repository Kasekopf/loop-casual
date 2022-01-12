import { get } from "libram";
import { StringProperty } from "libram/dist/propertyTypes";
import { CombatStrategy } from "../combat";

export type Quest = {
  name: string;
  tasks: Task[];
};

export class Limit {
  turns_spent: number;
  constructor(turns_spent: number) {
    this.turns_spent = turns_spent;
  }
}

export type Task = {
  name: string;
  after: string[];
  ready?: () => boolean;
  prepare?: () => void;
  completed: () => boolean;
  do: Location | (() => void);
  post?: () => void;
  choices?: { [id: number]: number | (() => number) };
  combat?: CombatStrategy | (() => CombatStrategy);
  modifier?: string;
  effects?: Effect[];
  equip?: Item[];
  acquire?: (Item | [number, Item])[];
  familiar?: Familiar;
  cap?: number | Limit;
  delay?: number | (() => number);
  freeaction?: boolean;
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
