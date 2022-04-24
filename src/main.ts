import {
  cliExecute,
  familiarWeight,
  gametimeToInt,
  myAdventures,
  print,
  turnsPlayed,
} from "kolmafia";
import { all_tasks } from "./tasks/all";
import { prioritize } from "./route";
import { Engine } from "./engine";
import { convertMilliseconds, debug } from "./lib";
import { WandererSource, wandererSources } from "./resources";
import { $effect, $familiar, CrystalBall, get, have, PropertiesManager, set } from "libram";
import { step, Task } from "./tasks/structure";
import { Outfit } from "./outfit";
import { absorbtionTargets } from "./tasks/absorb";
import { removeTeleportitis, teleportitisTask } from "./tasks/misc";

const time_property = "_loop_casual_first_start";

export function main(tasks_to_run?: number): void {
  const set_time_now = get(time_property, -1) === -1;
  if (set_time_now) set(time_property, gametimeToInt());

  const tasks = prioritize(all_tasks());
  const engine = new Engine(tasks, absorbtionTargets);
  cliExecute("ccs loopgyou");
  setUniversalProperties(engine.propertyManager);
  tasks_to_run = tasks_to_run ?? 1000;
  absorbtionTargets.updateAbsorbed();
  absorbtionTargets.ignoreUselessAbsorbs();
  if (tasks_to_run < 0) {
    for (const task of tasks) {
      debug(
        `${task.name}: ${
          task.completed() ? "Done" : engine.available(task) ? "Available" : "Not Available"
        }`,
        task.completed() ? "blue" : engine.available(task) ? undefined : "red"
      );
    }
  }

  while (myAdventures() > 0) {
    const next = getNextTask(engine, tasks);
    if (next === undefined) break;
    if (tasks_to_run <= 0) {
      debug(`Next task: ${next[0].name}`);
      return;
    } else {
      tasks_to_run -= 1;
    }

    if (next[1] !== undefined) engine.execute(next[0], next[1]);
    else engine.execute(next[0]);
  }

  const remaining_tasks = tasks.filter((task) => !task.completed());
  if (!runComplete()) {
    debug("Remaining tasks:", "red");
    for (const task of remaining_tasks) {
      if (!task.completed()) debug(`${task.name}`, "red");
    }
    throw `Unable to find available task, but the run is not complete.`;
  }

  print("Grey you complete!", "purple");
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

function getNextTask(engine: Engine, tasks: Task[]): [Task, WandererSource?] | undefined {
  // Teleportitis overrides all
  if (have($effect`Teleportitis`)) {
    const tele = teleportitisTask(engine, tasks);
    if (tele.completed() && removeTeleportitis.ready()) {
      return [removeTeleportitis];
    }
    return [tele];
  }

  // First, check for any prioritized tasks
  const priority = tasks.find(
    (task) => engine.available(task) && task.priority !== undefined && task.priority()
  );
  if (priority !== undefined) {
    return [priority];
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
    return [delay_burning, wanderer];
  }

  const orb_predictions = CrystalBall.currentPredictions(false); // TODO: should this ever be true?
  let todo = undefined;

  // Find the next useful absorb
  if (familiarWeight($familiar`Grey Goose`) >= 6) {
    todo = tasks.find(
      (task) => engine.available(task, orb_predictions) && engine.needsChargedGoose(task)
    );
    if (todo !== undefined) return [todo];
  }

  // Otherwise, advance the next quest while dancing with the crystal ball
  todo = tasks.find((task) => engine.available(task, orb_predictions));
  if (todo !== undefined) return [todo];

  // If there is no way to dodge the crystal ball prediction, ignore it
  todo = tasks.find((task) => engine.available(task));
  if (todo !== undefined) return [todo];

  // No next task
  return undefined;
}

function runComplete(): boolean {
  return step("questL13Final") === 999;
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
    hpAutoRecovery: "0.0",
    hpAutoRecoveryTarget: "0.0",
    mpAutoRecovery: "0.0",
    mpAutoRecoveryTarget: "0.0",
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
