import { cliExecute, myAdventures, myClosetMeat, myMeat, print, takeCloset } from "kolmafia";
import { all_tasks } from "./tasks/all";
import { prioritize } from "./route";
import { Engine } from "./engine";
import { debug } from "./lib";
import { wandererSources } from "./resources";

export function main(): void {
  if (myMeat() > 2000000) {
    print("You have too much meat; closeting some during execution.");
    cliExecute(`closet put ${myMeat() - 2000000} meat`);
  }

  cliExecute("ccs garbo");
  const tasks = prioritize(all_tasks());
  const engine = new Engine(tasks);
  while (myAdventures() > 0) {
    const wanderer = wandererSources.find((source) => source.available() && source.chance() === 1);
    const delay_burning = tasks.find((task) => engine.available(task) && engine.has_delay(task));
    if (wanderer !== undefined && delay_burning !== undefined) {
      engine.execute(delay_burning, wanderer);
    } else {
      const todo = tasks.find((task) => engine.available(task));
      if (todo === undefined) break;
      engine.execute(todo);
    }
  }

  // Script is done; ensure we have finished
  takeCloset(myClosetMeat());

  const remaining_tasks = tasks.filter((task) => !task.completed());
  if (remaining_tasks.length === 0) return;

  for (const task of remaining_tasks) {
    if (!task.completed()) debug(`${task.name}`, "red");
  }
  throw `Unable to find available task, but not all tasks are completed.`;
}
