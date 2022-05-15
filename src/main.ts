import {
  cliExecute,
  gametimeToInt,
  myAdventures,
  myClosetMeat,
  myLevel,
  myMeat,
  print,
  takeCloset,
  turnsPlayed,
  visitUrl,
} from "kolmafia";
import { all_tasks, level_tasks, organ_tasks } from "./tasks/all";
import { prioritize } from "./route";
import { Engine } from "./engine";
import { convertMilliseconds, debug } from "./lib";
import { wandererSources } from "./resources";
import { $skill, get, have, PropertiesManager, set } from "libram";
import { step, Task } from "./tasks/structure";
import { Outfit } from "./outfit";
import * as Args from "./args";

const time_property = "_loop_casual_first_start";

export const args = Args.create("loopcasual", "A script to complete casual runs.", {
  goal: Args.string({
    help: "Which tasks to perform.",
    options: [
      ["all", "Level up, complete all quests, and get your steel organ."],
      ["level", "Level up only."],
      ["quests", "Complete all quests only."],
      ["organ", "Get your steel organ only."],
    ],
    default: "all",
  }),
  stomach: Args.number({
    help: "Amount of stomach to fill.",
    default: 5,
  }),
  liver: Args.number({
    help: "Amount of liver to fill.",
    default: 10,
  }),
  spleen: Args.number({
    help: "Amount of spleen to fill.",
    default: 5,
  }),
});
export function main(command?: string): void {
  Args.fill(args, command);
  if (args.help) {
    Args.showHelp(args);
    return;
  }

  if (runComplete()) {
    print("Casual complete!", "purple");
    return;
  }

  const set_time_now = get(time_property, -1) === -1;
  if (set_time_now) set(time_property, gametimeToInt());

  if (myMeat() > 2000000) {
    print("You have too much meat; closeting some during execution.");
    cliExecute(`closet put ${myMeat() - 2000000} meat`);
  }

  // Select which tasks to perform
  let tasks: Task[] = [];
  switch (args.goal) {
    case "all":
      tasks = prioritize(all_tasks());
      break;
    case "level":
      tasks = prioritize(level_tasks(), true);
      break;
    case "organ":
      tasks = prioritize(organ_tasks(), true);
      break;
  }

  const engine = new Engine(tasks);
  cliExecute("ccs loopcasual");
  setUniversalProperties(engine.propertyManager);

  while (myAdventures() > 0) {
    // First, check for any prioritized tasks
    const priority = tasks.find(
      (task) => engine.available(task) && task.priority !== undefined && task.priority()
    );
    if (priority !== undefined) {
      engine.execute(priority);
      continue;
    }

    // If a wanderer is up try to place it in a useful location
    const wanderer = wandererSources.find((source) => source.available() && source.chance() === 1);
    const delay_burning = tasks.find(
      (task) =>
        engine.hasDelay(task) &&
        engine.available(task) &&
        Outfit.create(task).canEquip(wanderer?.equip)
    );
    if (wanderer !== undefined && delay_burning !== undefined) {
      engine.execute(delay_burning, wanderer);
      continue;
    }

    // Otherwise, just advance the next quest on the route
    const todo = tasks.find((task) => engine.available(task));
    if (todo === undefined) break;
    engine.execute(todo);
  }

  // Can finish the run with 0 adventures, if only the prism is left
  if (step("questL13Final") > 11 && step("questL13Final") !== 999)
    visitUrl("place.php?whichplace=nstower&action=ns_11_prism");

  // Script is done; ensure we have finished
  takeCloset(myClosetMeat());

  const remaining_tasks = tasks.filter((task) => !task.completed());
  if (!runComplete()) {
    debug("Remaining tasks:", "red");
    for (const task of remaining_tasks) {
      if (!task.completed()) debug(`${task.name}`, "red");
    }
    throw `Unable to find available task, but the run is not complete.`;
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

function runComplete(): boolean {
  switch (args.goal) {
    case "all":
      return step("questL13Final") === 999 && have($skill`Liver of Steel`) && myLevel() >= 13;
    case "level":
      return myLevel() >= 13;
    case "quests":
      return step("questL13Final") === 999;
    case "organ":
      return have($skill`Liver of Steel`);
    default:
      throw `Unknown goal ${args.goal}`;
  }
}

function setUniversalProperties(propertyManager: PropertiesManager) {
  // Properties adapted from garbo
  propertyManager.set({
    logPreferenceChange: true,
    logPreferenceChangeFilter: [
      ...new Set([
        ...get("logPreferenceChangeFilter").split(","),
        "libram_savedMacro",
        "maximizerMRUList",
        "testudinalTeachings",
        "_lastCombatStarted",
      ]),
    ]
      .sort()
      .filter((a) => a)
      .join(","),
    battleAction: "custom combat script",
    autoSatisfyWithMall: true,
    autoSatisfyWithNPCs: true,
    autoSatisfyWithCoinmasters: true,
    autoSatisfyWithStash: false,
    dontStopForCounters: true,
    maximizerFoldables: true,
    hpAutoRecovery: 0.0,
    hpAutoRecoveryTarget: 0.0,
    mpAutoRecovery: 0.0,
    mpAutoRecoveryTarget: 0.0,
    afterAdventureScript: "",
    betweenBattleScript: "",
    choiceAdventureScript: "",
    familiarScript: "",
    currentMood: "apathetic",
    autoTuxedo: true,
    autoPinkyRing: true,
    autoGarish: true,
    allowSummonBurning: true,
    libramSkillsSoftcore: "none",
  });
  propertyManager.setChoices({
    1106: 3, // Ghost Dog Chow
    1107: 1, // tennis ball
    1340: 3, // Is There A Doctor In The House?
    1341: 1, // Cure her poison
  });
}
