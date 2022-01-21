import {
  cliExecute,
  gametimeToInt,
  myAdventures,
  myClosetMeat,
  myMeat,
  print,
  takeCloset,
  turnsPlayed,
  visitUrl,
} from "kolmafia";
import { all_tasks } from "./tasks/all";
import { prioritize } from "./route";
import { Engine } from "./engine";
import { convertMilliseconds, debug } from "./lib";
import { wandererSources } from "./resources";
import { get, set } from "libram";
import { step } from "./tasks/structure";

const time_property = "_loop_casual_first_start";

export function main(): void {
  const set_time_now = get(time_property, -1) === -1;
  if (set_time_now) set(time_property, gametimeToInt());

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

  // Can finish the run with 0 adventures, if only the prism is left
  if (step("questL13Final") > 11 && step("questL13Final") !== 999)
    visitUrl("place.php?whichplace=nstower&action=ns_11_prism");

  // Script is done; ensure we have finished
  takeCloset(myClosetMeat());

  const remaining_tasks = tasks.filter((task) => !task.completed());
  if (remaining_tasks.length > 0) {
    for (const task of remaining_tasks) {
      if (!task.completed()) debug(`${task.name}`, "red");
    }
    throw `Unable to find available task, but not all tasks are completed.`;
  }

  print("Casual complete!", "purple");
  print(`   Adventures used: ${turnsPlayed()}`, "purple");
  print(`   Adventures remaining: ${myAdventures()}`, "purple");
  if (set_time_now)
    print(
      `   Time: ${convertMilliseconds(gametimeToInt() - get(time_property, gametimeToInt()))}`,
      "purple"
    );
  else
    print(
      `   Time: ${convertMilliseconds(
        gametimeToInt() - get(time_property, gametimeToInt())
      )} since first run today started`,
      "purple"
    );
}
