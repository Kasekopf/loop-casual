import { myAdventures } from "kolmafia";
import { all_tasks } from "./tasks/all";
import { prioritize } from "./route";
import { Engine } from "./engine";
import { debug } from "./lib";

export function main(): void {
  const tasks = prioritize(all_tasks());
  const engine = new Engine(tasks);
  while (myAdventures() > 0) {
    const todo = tasks.find((task) => engine.available(task));
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
