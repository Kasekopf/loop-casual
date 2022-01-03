import { get } from "libram";
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
