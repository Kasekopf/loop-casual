import {
  gametimeToInt,
  getRevision,
  inHardcore,
  myAdventures,
  myPath,
  myTurncount,
  print,
  pullsRemaining,
  runChoice,
  svnAtHead,
  svnExists,
  turnsPlayed,
  visitUrl,
} from "kolmafia";
import { all_tasks } from "./tasks/all";
import { prioritize } from "./route";
import { Engine } from "./engine/engine";
import { convertMilliseconds, debug } from "./lib";
import { $path, get, set, sinceKolmafiaRevision } from "libram";
import { Prioritization } from "./engine/priority";
import { Args, step } from "grimoire-kolmafia";
import { checkRequirements } from "./sim";
import { globalStateCache } from "./engine/state";
import { lastCommitHash } from "./_git_commit";

const time_property = "_loop_gyou_first_start";
const svn_name = "Kasekopf-loop-casual-branches-release";

export const args = Args.create(
  "loopgyou",
  'This is a script to complete Grey You Softcore runs. Run "loopgyou sim" without quotes to check if this script will work for you.\n\nYou must ascend manually into a Grey You Softcore run before running the script. The cold medicine cabinet is required in your workshed. Prefer the Vole sign until you have finished most of the path progression. Astral mask or astral belt are both useful, but neither is required. Prefer candles for your eurdora.\n\nThe arguments accepted by the script are listed below. Note that you can combine multiple options; for example "loopgyou pulls=18 tune=blender" will save 2 pulls and switch moon sign to Blender during the run. Most options also have an associated setting to set an option permanently; for example "set loopgyou_pulls=18" will cause the script to always save 2 pulls (unless overriden by using the pulls option at runtime).',
  {
    sim: Args.flag({ help: "Check if you have the requirements to run this script.", setting: "" }),
    version: Args.flag({ help: "Show script version and exit.", setting: "" }),
    class: Args.number({
      help: "If given, break the prism and choose a class. <font color='red'>You will be reduced to 40 adventures with full organs after breaking the prism.</font>",
      options: [
        [1, "Seal Clubber"],
        [2, "Turtle Tamer"],
        [3, "Pastamancer"],
        [4, "Saurceror"],
        [5, "Disco Bandit"],
        [6, "Accordion Thief"],
      ],
      setting: "",
    }),
    major: Args.group("Major Options", {
      pulls: Args.number({
        help: "Number of pulls to use. Lower this if you would like to save some pulls to use for in-ronin farming. (Note that this argument is not needed if you pull all your farming items before running the script).",
        default: 20,
      }),
      tune: Args.string({
        help: "Use your hewn moon-rune spoon to retune to this sign when optimal.",
      }),
      delaytower: Args.flag({
        help: "Delay the NS tower until after ronin ends.",
        default: false,
      }),
      delaywar: Args.flag({
        help: "Delay the war until after ronin ends, then finish with stuffing fluffers.",
        default: false,
      }),
      chargegoose: Args.number({
        help: "If true, use extra familiar turns to charge your Grey Goose to this weight at the end of the run (for aftercore leveling). If you do not have enough extra familiar turns, the goose may be lower level.",
        default: 20,
      }),
    }),
    minor: Args.group("Minor Options", {
      fax: Args.boolean({
        help: "Use a fax to summon a monster. Set to false if the faxbots are offline.",
        default: true,
      }),
      seasoning: Args.boolean({
        help: "If true, get special seasoning from SongBoom boombox after the beginning of the run.",
        default: true,
      }),
      lgr: Args.flag({
        help: "Pull a lucky gold ring. If pulled, it will be equipped during many combats.",
        default: false,
      }),
      asdon: Args.flag({
        help: "Pull an Asdon Martin keyfob. If pulled, it will be used to replace the cold medicine cabinet once all Extrovermectin™ have been obtained.",
        default: false,
      }),
      jellies: Args.flag({
        help: "Use your Space Jellyfish to get stench jellies during the war (this may reduce your goose familiar exp).",
        default: false,
      }),
      pvp: Args.flag({
        help: "Break your hippy stone at the start of the run.",
        default: false,
      }),
      wand: Args.flag({
        help: "Always get the zap wand.",
        default: false,
      }),
      skills: Args.string({
        help: "A comma-separated list of skills to get, in addition to skills that will directly help the run.",
        default: "Financial Spreadsheets",
      }),
      forcelocket: Args.flag({
        help: "Always equip the combat lover's locket, in order to get monsters inside quickly.",
        default: false,
      }),
    }),
    debug: Args.group("Debug Options", {
      actions: Args.number({
        help: "Maximum number of actions to perform, if given. Can be used to execute just a few steps at a time.",
      }),
      verboseequip: Args.flag({
        help: "Print out equipment usage before each task.",
      }),
      ignoretasks: Args.string({
        help: "A comma-separated list of task names that should not be done. Can be used as a workaround for script bugs where a task is crashing.",
        setting: "",
      }),
      completedtasks: Args.string({
        help: "A comma-separated list of task names the should be treated as completed. Can be used as a workaround for script bugs.",
        setting: "",
      }),
      list: Args.flag({
        help: "Show the status of all tasks and exit.",
        setting: "",
      }),
      settings: Args.flag({
        help: "Show the parsed value for all arguments and exit.",
        setting: "",
      }),
      lastasdonbumperturn: Args.number({
        help: "Set the last usage of Asdon Martin: Spring-Loaded Front Bumper, in case of a tracking issue",
        hidden: true,
      }),
      ignorekeys: Args.flag({
        help: "Ignore the check that all keys can be obtained. Typically for hardcore, if you plan to get your own keys",
        default: false,
      }),
    }),
  },
  "Commands"
);
export function main(command?: string): void {
  sinceKolmafiaRevision(26834);

  Args.fill(args, command);
  if (args.debug.settings) {
    debug(JSON.stringify(args));
    return;
  }
  if (args.help) {
    Args.showHelp(args);
    return;
  }
  if (args.sim) {
    checkRequirements();
    return;
  }

  printVersionInfo();
  if (args.version) return;

  // eslint-disable-next-line eqeqeq
  if (myPath() !== $path`Grey You`)
    throw `You are not currently in a Grey You run. Please start one.`;

  // Break the prism and exit if requested
  if (args.class !== undefined) {
    breakPrism(args.class);
    return;
  }

  const set_time_now = get(time_property, -1) === -1;
  if (set_time_now) set(time_property, gametimeToInt());

  // Clear intro adventure
  set("choiceAdventure1464", 1);
  if (visitUrl("main.php").includes("somewhat-human-shaped mass of grey goo nanites"))
    runChoice(-1);

  const tasks = prioritize(all_tasks());
  const engine = new Engine(
    tasks,
    args.debug.ignoretasks?.split(",") ?? [],
    args.debug.completedtasks?.split(",") ?? []
  );
  try {
    if (args.debug.list) {
      listTasks(engine);
      return;
    }

    engine.run(args.debug.actions);

    const remaining_tasks = tasks.filter((task) => !task.completed());
    if (!runComplete()) {
      if (args.debug.actions) {
        const next = engine.getNextTask();
        if (next) {
          debug(`Next task: ${next.name}`);
          return;
        }
      }

      debug("Remaining tasks:", "red");
      for (const task of remaining_tasks) {
        if (!task.completed()) debug(`${task.name}`, "red");
      }
      throw `Unable to find available task, but the run is not complete.`;
    }
  } finally {
    engine.propertyManager.resetAll();
  }

  const absorb_state = globalStateCache.absorb();
  if (step("questL13Final") > 11) {
    print("Grey you complete!", "purple");
  } else {
    print("Grey you partially complete! Rerun after ronin ends.", "purple");
  }
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
  if (inHardcore()) {
    print(`   Pulls used: 0 (Hardcore)`);
  } else {
    print(
      `   Pulls used: ${get("_loopgyou_pulls_used")} (${pullsRemaining()} remaining)`,
      "purple"
    );
  }
  print(
    `   Monsters remaining: ${Array.from(absorb_state.remainingAbsorbs()).join(", ")}`,
    "purple"
  );
  print(
    `   Reprocess remaining: ${Array.from(absorb_state.remainingReprocess()).join(", ")}`,
    "purple"
  );
}

function runComplete(): boolean {
  return (
    step("questL13Final") > 11 ||
    // eslint-disable-next-line eqeqeq
    myPath() !== $path`Grey You` ||
    (args.major.delaytower && myTurncount() < 1000 && step("questL13Final") !== -1) ||
    (args.major.delaywar &&
      myTurncount() < 1000 &&
      step("questL02Larva") === 999 &&
      step("questL03Rat") === 999 &&
      step("questL04Bat") === 999 &&
      step("questL05Goblin") === 999 &&
      step("questL06Friar") === 999 &&
      step("questL07Cyrptic") === 999 &&
      step("questL08Trapper") === 999 &&
      step("questL09Topping") === 999 &&
      step("questL10Garbage") === 999 &&
      step("questL11MacGuffin") === 999)
  );
}

function printVersionInfo(): void {
  debug(
    `Running loopgyou version [${lastCommitHash ?? "custom-built"}] in KoLmafia r${getRevision()}`
  );
  if (lastCommitHash !== undefined) {
    if (svnExists(svn_name) && !svnAtHead(svn_name))
      debug(
        'A newer version of this script is available and can be obtained with "svn update".',
        "red"
      );
    else if (args.version) {
      debug("This script is up to date.", "red");
    }
  }
}

function breakPrism(into_class: number): void {
  if (step("questL13Final") <= 11)
    throw `You have not finished your Grey You run. Do not set this argument yet.`;
  const absorb_state = globalStateCache.absorb();
  print(
    `   Monsters remaining: ${Array.from(absorb_state.remainingAbsorbs()).join(", ")}`,
    "purple"
  );
  print(
    `   Reprocess remaining: ${Array.from(absorb_state.remainingReprocess()).join(", ")}`,
    "purple"
  );
  if (step("questL13Final") === 999) return;
  visitUrl("place.php?whichplace=nstower&action=ns_11_prism");
  visitUrl("main.php");
  runChoice(into_class);
  runChoice(into_class);
}

function listTasks(engine: Engine): void {
  engine.updatePlan();
  for (const task of engine.tasks) {
    if (task.completed()) {
      debug(`${task.name}: Done`, "blue");
    } else {
      if (engine.available(task)) {
        const priority = Prioritization.from(task);
        const reason = priority.explain();
        const why = reason === "" ? "Route" : reason;
        debug(`${task.name}: Available [${priority.score()}: ${why}]`);
      } else {
        debug(`${task.name}: Not Available`, "red");
      }
    }
  }
}
