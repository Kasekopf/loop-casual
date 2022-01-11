import { cliExecute, myAdventures } from "kolmafia";
import { all_tasks } from "./tasks/all";
import { prioritize } from "./route";
import { Engine } from "./engine";
import { debug } from "./lib";
import { wandererSources } from "./resources";

export function main(): void {
  cliExecute("ccs garbo");
  const tasks = prioritize(all_tasks());
  const engine = new Engine(tasks);
  while (myAdventures() > 0) {
    const wanderer = wandererSources.find((source) => source.available());
    const delay_burning = tasks.find((task) => engine.available_delay(task));
    if (wanderer !== undefined && delay_burning !== undefined) {
      engine.execute(delay_burning, wanderer);
    } else {
      const todo = tasks.find((task) => engine.available(task));
      if (todo === undefined) break;
      engine.execute(todo);
    }
  }

  // Script is done; ensure we have finished
  const remaining_tasks = tasks.filter((task) => !task.completed());
  if (remaining_tasks.length === 0) return;

  for (const task of remaining_tasks) {
    if (!task.completed()) debug(`${task.name}`, "red");
  }
  throw `Unable to find available task, but not all tasks are completed.`;
}
