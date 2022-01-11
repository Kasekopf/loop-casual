import { cliExecute, myAdventures } from "kolmafia";
import { all_tasks } from "./tasks/all";
import { prioritize } from "./route";
import { Engine } from "./engine";
import { debug } from "./lib";
import { getKramcoWandererChance } from "libram";

export function main(): void {
  cliExecute("ccs garbo");
  const tasks = prioritize(all_tasks());
  const engine = new Engine(tasks);
  while (myAdventures() > 0) {
    let todo = tasks.find((task) => engine.available(task));
    if (getKramcoWandererChance() === 1) {
      const delay_burning = tasks.find((task) => engine.available_delay(task));
      if (delay_burning !== undefined) {
        todo = delay_burning;
      }
    }

    if (todo === undefined) {
      const remaining_tasks = tasks.filter((task) => !task.completed());
      if (remaining_tasks.length === 0) break;

      for (const task of remaining_tasks) {
        if (!task.completed()) debug(`${task.name}`, "red");
      }
      throw `Unable to find available task, but not all tasks are completed.`;
    }

    debug("");
    debug(`Executing ${todo.name}`, "blue");
    engine.execute(todo);
    if (todo.completed()) debug(`${todo.name} completed!`, "blue");
    else debug(`${todo.name} not completed!`, "blue");
  }
}
