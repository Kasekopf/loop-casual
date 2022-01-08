import { myAdventures } from "kolmafia";
import { all_tasks } from "./tasks/all";
import { prioritize } from "./route";
import { Engine } from "./engine";

export function main(): void {
  const tasks = prioritize(all_tasks());
  const engine = new Engine(tasks);
  while (myAdventures() > 0) {
    const todo = tasks.find((task) => engine.available(task));
    if (todo === undefined) throw `Unable to find task`;
    engine.execute(todo);
  }
}
