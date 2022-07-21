import {
  abort,
  canadiaAvailable,
  canFaxbot,
  chatPrivate,
  cliExecute,
  equippedAmount,
  familiarWeight,
  gnomadsAvailable,
  initiativeModifier,
  itemAmount,
  knollAvailable,
  Monster, myAscensions, myFamiliar, myMeat, runCombat, use, userConfirm, visitUrl, wait
} from "kolmafia";
import {
  $effect,
  $familiar,
  $item,
  $items,
  $monster,
  $skill,
  CombatLoversLocket,
  get,
  have,
  Macro,
  set,
} from "libram";
import { CombatStrategy } from "../combat";
import { debug } from "../lib";
import { args } from "../main";
import { OverridePriority } from "../priority";
import { GameState } from "../state";
import { Quest, step, Task } from "./structure";

type ExtraReprocessTarget = {
  after: string[];
  target: Monster;
  needed: () => boolean;
};
const extraReprocessTargets: ExtraReprocessTarget[] = [
  {
    after: ["Absorb/The Hole in the Sky"],
    target: $monster`One-Eyed Willie`,
    needed: () => myAscensions() % 2 === 1,
  },
  {
    after: ["Absorb/The Hole in the Sky"],
    target: $monster`Little Man in the Canoe`,
    needed: () => myAscensions() % 2 === 0,
  },
  {
    after: ["Misc/Retune Moon"],
    target: $monster`revolving bugbear`,
    needed: () => !knollAvailable(),
  },
  {
    after: ["Misc/Retune Moon"],
    target: $monster`cloud of disembodied whiskers`,
    needed: () => !canadiaAvailable(),
  },
  {
    after: ["Misc/Retune Moon"],
    target: $monster`vicious gnauga`,
    needed: () => !gnomadsAvailable(),
  },
];

type SummonTarget = Omit<Task, "do" | "name" | "limit"> & {
  target: Monster;
}
const summonTargets: SummonTarget[] = [
  {
    target: $monster`pygmy witch lawyer`,
    priority: () => OverridePriority.Start,
    after: [],
    completed: () => have($skill`Infinite Loop`),
    acquire: [
      {
        item: $item`Arr, M80`,
        num: 2,
        useful: () =>
          have($familiar`Vampire Vintner`) &&
          have($item`cosmic bowling ball`) &&
          have($item`unwrapped knock-off retro superhero cape`),
      },
      {
        // Backup plan if missing Vintner/bowling ball
        item: $item`yellow rocket`,
        num: 1,
        useful: () =>
          !have($familiar`Vampire Vintner`) ||
          !have($item`cosmic bowling ball`) ||
          !have($item`unwrapped knock-off retro superhero cape`),
      },
    ],
    prepare: () => {
      if (
        (equippedAmount($item`unwrapped knock-off retro superhero cape`) === 0 ||
          myFamiliar() !== $familiar`Vampire Vintner`) &&
        !have($item`yellow rocket`)
      )
        abort("Not ready for pygmy locket");
      if (equippedAmount($item`unwrapped knock-off retro superhero cape`) > 0)
        cliExecute("retrocape heck hold");

      if (initiativeModifier() < 50) cliExecute("pool stylish");
      if (initiativeModifier() < 50) abort("Not ready for pygmy locket");
    },
    combat: new CombatStrategy().macro(
      new Macro()
        .tryItem($item`yellow rocket`)
        .tryItem($item`cosmic bowling ball`)
        .step("if hascombatitem 10769;use Arr;endif;") // Arr, M80; "use Arr, M80" trys and fails to funksling
        .step("if hascombatitem 10769;use Arr;endif;")
        .skill($skill`Pseudopod Slap`)
        .repeat()
    ),
    outfit: () => {
      if (
        have($familiar`Vampire Vintner`) &&
        have($item`cosmic bowling ball`) &&
        have($item`unwrapped knock-off retro superhero cape`)
      )
        return {
          modifier: "init",
          equip: $items`unwrapped knock-off retro superhero cape`,
          familiar: $familiar`Vampire Vintner`,
        };
      else return { modifier: "init, -1ML" }; // Just use yellow rocket
    },
  },
  {
    target: $monster`mountain man`,
    after: [],
    completed: () =>
      itemAmount($item`asbestos ore`) >= 3 ||
      itemAmount($item`chrome ore`) >= 3 ||
      itemAmount($item`linoleum ore`) >= 3 ||
      step("questL08Trapper") >= 2,
    ready: () =>
      !have($effect`Everything Looks Yellow`) && (myMeat() >= 250 || have($item`yellow rocket`)),
    priority: () =>
      have($effect`Everything Looks Yellow`) ? OverridePriority.None : OverridePriority.YR,
    acquire: [{ item: $item`yellow rocket` }],
    prepare: () => {
      if (have($item`unwrapped knock-off retro superhero cape`)) cliExecute("retrocape heck hold");
    },
    outfit: { equip: $items`unwrapped knock-off retro superhero cape` },
    combat: new CombatStrategy().macro(new Macro().item($item`yellow rocket`)),
  },
  ...extraReprocessTargets.map((target: ExtraReprocessTarget): SummonTarget => {
    return {
      target: target.target,
      after: target.after,
      completed: (state: GameState) => !state.absorb.isReprocessTarget(target.target) || !target.needed(),
      priority: () => OverridePriority.GoodGoose,
      ready: () => familiarWeight($familiar`Grey Goose`) >= 6,
      outfit: () => {
        if (CombatLoversLocket.have() && !CombatLoversLocket.unlockedLocketMonsters().includes(target.target)) {
          // Store this monster in the locket for the next run
          return { familiar: $familiar`Grey Goose`, equip: $items`combat lover's locket` };
        } else {
          return { familiar: $familiar`Grey Goose` };
        }
      },
      combat: new CombatStrategy()
        .autoattack(new Macro().trySkill($skill`Re-Process Matter`))
        .macro(new Macro().trySkill($skill`Re-Process Matter`))
        .kill(),
    };
  }),
  {
    target: $monster`white lion`,
    after: ["Hidden City/Bowling Skills"],
    ready: () => have($item`white page`),
    completed: () => have($skill`Piezoelectric Honk`),
    choices: { 940: 2 },
    outfit: { modifier: "item" },
    combat: new CombatStrategy().killItem(),
  }
];


type SummonSource = {
  name: string;
  available: () => number;
  canFight: (mon: Monster) => boolean;
  summon: (mon: Monster) => void;
};
const summonSources: SummonSource[] = [
  {
    name: "Cargo Shorts",
    available: () => have($item`Cargo Cultist Shorts`) && !get("_cargoPocketEmptied") ? 1 : 0,
    canFight: (mon: Monster) => mon === $monster`mountain man`,  // Only use for mountain man
    summon: () => cliExecute('cargo 565'),
  },
  {
    name: "White Page",
    available: () => have($item`white page`) ? 1 : 0,
    canFight: (mon: Monster) => mon === $monster`white lion`,  // Only use for mountain man
    summon: () => use($item`white page`),
  },
  {
    name: "Fax",
    available: () => args.fax && !get("_photocopyUsed") ? 1 : 0,
    canFight: (mon: Monster) => canFaxbot(mon),
    summon: (mon: Monster) => {
      chatPrivate("cheesefax", mon.name);
      for (let i = 0; i < 3; i++) {
        wait(10);
        if (checkFax(mon)) break;
        if (i === 2) throw `Failed to acquire photocopied ${mon.name}.`;
      }
      use($item`photocopied monster`);
    },
  },
  {
    name: "Combat Locket",
    available: () => CombatLoversLocket.have() ? CombatLoversLocket.reminiscesLeft() : 0,
    canFight: (mon: Monster) => CombatLoversLocket.unlockedLocketMonsters().includes(mon),
    summon: (mon: Monster) => CombatLoversLocket.reminisce(mon),
  },
  {
    name: "Wish",
    available: () => have($item`genie bottle`) ? 3 - get("_genieWishesUsed") : 0,
    canFight: () => true,
    summon: (mon: Monster) => {
      cliExecute(`genie monster ${mon.name}`);
      visitUrl("main.php");
    },
  }
];

// From garbo
function checkFax(mon: Monster): boolean {
  if (!have($item`photocopied monster`)) cliExecute("fax receive");
  if (get("photocopyMonster") === mon) return true;
  cliExecute("fax send");
  return false;
}

class SummonStrategy {
  targets: SummonTarget[];
  sources: SummonSource[];
  plan = new Map<Monster, SummonSource>();

  constructor(
    targets: SummonTarget[],
    sources: SummonSource[]
  ) {
    this.targets = targets;
    this.sources = sources;
  }

  public update(state: GameState): void {
    this.plan.clear();
    const targets = this.targets.filter((t) => !t.completed(state)).map((t) => t.target);
    for (const source of this.sources) {
      let available = source.available();
      for (const target of targets) {
        if (available > 0 && !this.plan.has(target) && source.canFight(target)) {
          this.plan.set(target, source);
          available -= 1;
        }
      }
    }

    if (!have($skill`Infinite Loop`) && !this.plan.has($monster`pygmy witch lawyer`))
      throw `Unable to summon pygmy witch lawyer`;
  }

  public getSourceFor(monster: Monster): SummonSource | undefined {
    return this.plan.get(monster);
  }
}
export const summonStrategy = new SummonStrategy(summonTargets, summonSources);

export const SummonQuest: Quest = {
  name: "Summon",
  tasks: summonTargets.map((task): Task => {
    return {
      ...task,
      name: task.target.name.replace(/(^\w|\s\w)/g, m => m.toUpperCase()), // capitalize first letter of each word
      ready: (state: GameState) => (task.ready?.(state) ?? true) && (summonStrategy.getSourceFor(task.target) !== undefined),
      do: () => {
        // Some extra safety around the Pygmy Witch Lawyer summon
        if (task.target === $monster`pygmy witch lawyer`) {
          if (get("_loopgyou_fought_pygmy", false)) {
            if (!userConfirm("We already tried to fight a pygmy witch lawyer today and lost (or failed to start the fight). Are you sure we can win this time? Consider fighting a pygymy witch lawyer yourself (buy yellow rocket; ensure you have no ML running and +50 combat initative). Press yes to let the script try the fight again, or no to abort.")) {
              throw `Abort requested`;
            }
          }
          set("_loopgyou_fought_pygmy", true);
        }

        // Perform the actual summon
        const source = summonStrategy.getSourceFor(task.target);
        if (source) {
          debug(`Summon source: ${source.name}`);
          source.summon(task.target);
        }
        else throw `Unable to find summon source for ${task.target.name}`;
        runCombat();
      },
      limit: { tries: 1 },
    };
  })
}
