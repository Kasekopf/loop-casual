import {
  autosell,
  autosellPrice,
  drink,
  eat,
  equippedItem,
  getInventory,
  Item,
  Location,
  myBasestat,
  myBuffedstat,
  myHp,
  myMaxhp,
  myMaxmp,
  myMeat,
  myMp,
  myPath,
  myTurncount,
  print,
  restoreHp,
  restoreMp,
  Slot,
  toInt,
  use,
} from "kolmafia";
import { Task } from "./tasks/structure";
import {
  $effect,
  $effects,
  $familiar,
  $item,
  $items,
  $locations,
  $skill,
  $stat,
  get,
  have,
  Macro,
  PropertiesManager,
  set,
  uneffect,
} from "libram";
import {
  BuiltCombatStrategy,
  CombatResourceAllocation,
  CombatStrategy,
  MonsterStrategy,
} from "./combat";
import { Outfit } from "./outfit";
import { applyEffects } from "./moods";
import {
  adv1,
  buy,
  choiceFollowsFight,
  cliExecute,
  equippedAmount,
  inMultiFight,
  itemAmount,
  retrieveItem,
  runChoice,
  runCombat,
  setAutoAttack,
} from "kolmafia";
import { debug } from "./lib";
import {
  BanishState,
  canChargeVoid,
  freekillSources,
  runawaySources,
  WandererSource,
  wandererSources,
} from "./resources";
import { AbsorptionTargets } from "./tasks/absorb";
import { OverridePriority, Prioritization } from "./priority";
import { args } from "./main";
import { ponderPrediction } from "./lib";
import { flyersDone } from "./tasks/level12";

export class Engine {
  attempts: { [task_name: string]: number } = {};
  propertyManager = new PropertiesManager();
  tasks: Task[];
  tasks_by_name = new Map<string, Task>();
  absorptionTargets: AbsorptionTargets;

  constructor(tasks: Task[], absorptionTargets: AbsorptionTargets) {
    this.tasks = tasks;
    this.absorptionTargets = absorptionTargets;
    for (const task of tasks) {
      this.tasks_by_name.set(task.name, task);
    }
  }

  public available(task: Task): boolean {
    for (const after of task.after) {
      const after_task = this.tasks_by_name.get(after);
      if (after_task === undefined) throw `Unknown task dependency ${after} on ${task.name}`;
      if (!after_task.completed()) return false;
    }
    if (task.ready && !task.ready()) return false;
    if (task.completed()) return false;

    // Wait until we get Infinite Loop before doing most things
    if (task.do instanceof Location && !have($skill`Infinite Loop`)) return false;

    return true;
  }

  public hasDelay(task: Task): boolean {
    if (!task.delay) return false;
    if (!(task.do instanceof Location)) return false;
    return task.do.turnsSpent < task.delay;
  }

  public execute(
    task: Task,
    priority: Prioritization,
    banishes: BanishState,
    ...wanderers: WandererSource[]
  ): void {
    debug(``);
    const reason = priority.explain();
    const why = reason === "" ? "Route" : reason;
    debug(`Executing ${task.name} [${why}]`, "blue");
    this.check_limits(task);

    // Get needed items
    for (const to_get of task.acquire || []) {
      const num_needed = to_get.num ?? 1;
      const num_have = itemAmount(to_get.item) + equippedAmount(to_get.item);
      if (num_needed <= num_have) continue;
      if (to_get.useful !== undefined && !to_get.useful()) continue;
      if (to_get.item === $item`makeshift garbage shirt`) {
        // Hardcode to avoid mafia weirdness
        cliExecute("fold makeshift garbage shirt");
      } else if (to_get.price !== undefined) {
        debug(`Purchasing ${num_needed - num_have} ${to_get.item} below ${to_get.price}`);
        buy(to_get.item, num_needed - num_have, to_get.price);
      } else {
        debug(`Acquiring ${num_needed} ${to_get.item}`);
        retrieveItem(to_get.item, num_needed);
      }
      if (itemAmount(to_get.item) + equippedAmount(to_get.item) < num_needed && !to_get.optional) {
        throw `Task ${task.name} was unable to acquire ${num_needed} ${to_get.item}`;
      }
    }

    // Prepare choice selections
    const choices: { [choice: number]: number } = {};
    for (const choice_id_str in task.choices) {
      const choice_id = parseInt(choice_id_str);
      const choice = task.choices[choice_id];
      if (typeof choice === "number") choices[choice_id] = choice;
      else choices[choice_id] = choice();
    }
    this.propertyManager.setChoices(choices);
    const ignored_noncombats = [
      "Wooof! Wooooooof!",
      "Seeing-Eyes Dog",
      "Playing Fetch",
      "Lights Out in the",
    ];
    const ignored_noncombats_seen = ignored_noncombats.filter(
      (name) => task.do instanceof Location && task.do.noncombatQueue.includes(name)
    );

    // Prepare basic equipment
    const outfit = Outfit.create(task);
    for (const wanderer of wanderers) {
      if (!outfit.equip(wanderer?.equip))
        throw `Wanderer equipment ${wanderer.equip} conflicts with ${task.name}`;
    }

    const freeaction = typeof task.freeaction === "function" ? task.freeaction() : task.freeaction;
    if (!freeaction) {
      // Prepare combat macro
      const task_combat = task.combat?.clone() ?? new CombatStrategy();

      // Absorb targeted monsters
      // (if we have teleportitis, everything is a possible target)
      const absorb_targets =
        task.do instanceof Location
          ? this.absorptionTargets.remainingReprocess(
              have($effect`Teleportitis`) ? undefined : task.do
            )
          : [];
      for (const monster of absorb_targets) {
        if (this.absorptionTargets.isReprocessTarget(monster)) {
          outfit.equip($familiar`Grey Goose`);
          task_combat.prependMacro(new Macro().trySkill($skill`Re-Process Matter`), monster);
          debug(`Target x2: ${monster.name}`, "purple");
        } else {
          debug(`Target: ${monster.name}`, "purple");
        }
        const strategy = task_combat.currentStrategy(monster);
        if (
          strategy === MonsterStrategy.Ignore ||
          strategy === MonsterStrategy.Banish ||
          strategy === MonsterStrategy.IgnoreNoBanish
        ) {
          task_combat.kill(monster); // TODO: KillBanish for Banish, KillNoBanish for IgnoreNoBanish
        }
      }

      // Use rock-band flyers if needed (300 extra as a buffer for mafia tracking)
      const blacklist = new Set<Location>($locations`The Copperhead Club, The Black Forest`);
      if (
        myBasestat($stat`Moxie`) >= 200 &&
        myBuffedstat($stat`Moxie`) >= 200 &&
        have($item`rock band flyers`) &&
        !flyersDone() &&
        (!(task.do instanceof Location) || !blacklist.has(task.do))
      ) {
        task_combat.prependMacro(
          new Macro().if_("!hpbelow 50", new Macro().tryItem($item`rock band flyers`))
        );
      }

      // Apply resources
      const combat_resources = new CombatResourceAllocation();
      if (wanderers.length === 0) {
        // Set up a banish if needed
        const banishSources = banishes.unusedBanishes();
        combat_resources.banishWith(outfit.equipFirst(banishSources));
        if (task_combat.can(MonsterStrategy.Banish)) {
          debug(
            `Banish targets: ${task_combat
              .where(MonsterStrategy.Banish)
              .filter((monster) => !banishes.already_banished.has(monster))
              .join(", ")}`
          );
          debug(`Banishes used: ${Array.from(banishes.used_banishes).join(", ")}`);
        }

        // Equip an orb if we have a good target.
        // (If we have banished all the bad targets, there is no need to force an orb)
        if (
          priority.has(OverridePriority.GoodOrb) &&
          (!task_combat.can(MonsterStrategy.Banish) || !banishes.isFullyBanished(task))
        ) {
          outfit.equip($item`miniature crystal ball`);
        }

        // Set up a runaway if there are combats we do not care about
        let runaway = undefined;
        if (task_combat.can(MonsterStrategy.Ignore)) {
          runaway = outfit.equipFirst(runawaySources);
          combat_resources.runawayWith(runaway);
        }
        if (task_combat.can(MonsterStrategy.IgnoreNoBanish)) {
          if (runaway !== undefined && !runaway.banishes)
            combat_resources.runawayNoBanishWith(runaway);
          else
            combat_resources.runawayNoBanishWith(
              outfit.equipFirst(runawaySources.filter((source) => !source.banishes))
            );
        }

        // Set up a free kill if needed, or if no free kills will ever be needed again
        if (
          task_combat.can(MonsterStrategy.KillFree) ||
          (task_combat.can(MonsterStrategy.Kill) &&
            !task_combat.boss &&
            this.tasks.every((t) => t.completed() || !t.combat?.can(MonsterStrategy.KillFree)))
        ) {
          combat_resources.freekillWith(outfit.equipFirst(freekillSources));
        }
      }

      // Charge familiars if needed
      outfit.equipCharging();

      // Set up more wanderers if delay is needed
      if (wanderers.length === 0 && this.hasDelay(task))
        wanderers = outfit.equipUntilCapped(wandererSources);

      // Prepare mood
      applyEffects(outfit.modifier ?? "", task.effects || []);

      // Prepare full outfit
      if (task_combat.boss) outfit.equip($familiar`Machine Elf`);
      const freecombat = task.freecombat || wanderers.find((wanderer) => wanderer.chance() === 1);
      // if (!task_combat.boss && !freecombat) outfit.equip($item`carnivorous potted plant`);
      if (
        canChargeVoid() &&
        (!outfit.modifier || !outfit.modifier.includes("-combat")) &&
        !freecombat &&
        ((task_combat.can(MonsterStrategy.Kill) &&
          !combat_resources.has(MonsterStrategy.KillFree)) ||
          task_combat.can(MonsterStrategy.KillHard) ||
          task_combat.boss)
      )
        outfit.equip($item`cursed magnifying glass`);
      outfit.equipDefaults();
      outfit.dress();

      // Prepare resources if needed
      wanderers.map((source) => source.prepare && source.prepare());
      combat_resources.all().map((source) => source.prepare && source.prepare());

      // HP/MP upkeep
      if (myHp() < 50 && myHp() < myMaxhp()) restoreHp(myMaxhp() < 50 ? myMaxhp() : 50);
      if (myMp() < 40 && myMaxmp() >= 40) restoreMp(40);
      else if (myMp() < 20) restoreMp(20);

      // Prepare combat macro (after effects and outfit)
      const combat = new BuiltCombatStrategy(
        task_combat,
        combat_resources,
        wanderers,
        task.do instanceof Location ? task.do : undefined
      );

      const auto_str = combat.autoattack.toString();
      if (auto_str.length > 0) {
        debug(`Auto: ${auto_str}`, "purple");
        combat.autoattack.setAutoAttack();
      } else {
        setAutoAttack(0);
      }
      debug(combat.macro.toString(), "blue");
      combat.macro.save();
    } else {
      // Prepare only as requested by the task
      applyEffects(outfit.modifier ?? "", task.effects || []);
      outfit.dress();
    }

    // Do any task-specific preparation
    if (task.prepare) task.prepare();

    if (args.verboseequip) {
      const equipped = [...new Set(Slot.all().map((slot) => equippedItem(slot)))];
      print(`Equipped: ${equipped.join(", ")}`);
    }

    // Do the task
    if (typeof task.do === "function") {
      task.do();
    } else {
      adv1(task.do, 0, "");
    }
    runCombat();
    while (inMultiFight()) runCombat();
    if (choiceFollowsFight()) runChoice(-1);
    if (task.post) task.post();

    this.absorptionTargets.updateAbsorbed();
    absorbConsumables();
    autosellJunk();
    if (have($effect`Beaten Up`)) throw "Fight was lost; stop.";
    for (const poisoned of $effects`Hardly Poisoned at All, A Little Bit Poisoned, Somewhat Poisoned, Really Quite Poisoned, Majorly Poisoned, Toad In The Hole`) {
      if (have(poisoned)) uneffect(poisoned);
    }

    // Mark the number of attempts (unless an ignored noncombat occured)
    if (!(task.name in this.attempts)) this.attempts[task.name] = 0;
    if (
      ignored_noncombats.filter(
        (name) => task.do instanceof Location && task.do.noncombatQueue.includes(name)
      ).length === ignored_noncombats_seen.length
    ) {
      this.attempts[task.name]++;
    }

    if (task.completed()) {
      debug(`${task.name} completed!`, "blue");
    } else if (!(task.ready?.() ?? true)) {
      debug(`${task.name} not completed! [Again? Not ready]`, "blue");
    } else {
      const priority_explain = Prioritization.from(
        task,
        ponderPrediction(),
        this.absorptionTargets,
        new BanishState(this.tasks.filter((task) => this.available(task)))
      ).explain();
      if (priority_explain !== "") {
        debug(`${task.name} not completed! [Again? ${priority_explain}]`, "blue");
      } else {
        debug(`${task.name} not completed!`, "blue");
      }
      this.check_limits(task); // Error if too many tries occur
    }
  }

  public check_limits(task: Task): void {
    const failureMessage = task.limit.message ? ` ${task.limit.message}` : "";
    if (task.limit.tries && this.attempts[task.name] >= task.limit.tries)
      throw `Task ${task.name} did not complete within ${task.limit.tries} attempts. Please check what went wrong.${failureMessage}`;
    if (task.limit.soft && this.attempts[task.name] >= task.limit.soft)
      throw `Task ${task.name} did not complete within ${task.limit.soft} attempts. Please check what went wrong (you may just be unlucky).${failureMessage}`;
    if (task.limit.turns && task.do instanceof Location && task.do.turnsSpent >= task.limit.turns)
      throw `Task ${task.name} did not complete within ${task.limit.turns} turns. Please check what went wrong.${failureMessage}`;
  }
}

const consumables_blacklist = new Set<Item>(
  $items`wet stew, wet stunt nut stew, stunt nuts, astral pilsner, astral hot dog dinner, giant marshmallow, booze-soaked cherry, sponge cake, gin-soaked blotter paper, steel margarita, bottle of Chateau de Vinegar, Bowl of Scorpions, unnamed cocktail, Flamin' Whatshisname, goat cheese, Extrovermectin™`
);
function autosellJunk(): void {
  if (myPath() !== "Grey You") return; // final safety
  if (myMeat() >= 10000) return;
  if (myTurncount() >= 1000) return; // stop after breaking ronin
  if (have($item`pork elf goodies sack`)) use($item`pork elf goodies sack`);

  // Sell junk items
  const junk = $items`hamethyst, baconstone, meat stack, dense meat stack, facsimile dictionary, space blanket, black snake skin, demon skin, hellion cube, adder bladder, weremoose spit, Knob Goblin firecracker, wussiness potion, diamond-studded cane, Knob Goblin tongs, Knob Goblin scimitar, eggbeater, red-hot sausage fork, Knob Goblin pants, awful poetry journal`;
  for (const item of junk) {
    if (have(item)) autosell(item, itemAmount(item));
  }

  // Sell all but one of a few items
  const partial_junk = $items`porquoise, ruby W, metallic A, lowercase N, heavy D`;
  for (const item of partial_junk) {
    if (itemAmount(item) > 1) autosell(item, itemAmount(item) - 1);
  }

  // Use wallets
  const wallets = $items`ancient vinyl coin purse, black pension check, old leather wallet, Gathered Meat-Clip, old coin purse`;
  for (const item of wallets) {
    if (have(item)) use(item, itemAmount(item));
  }

  // Sell extra consumables (after 1 has been absorbed)
  for (const item_name in getInventory()) {
    const item = Item.get(item_name);
    if (consumables_blacklist.has(item)) continue;
    if (autosellPrice(item) === 0) continue;
    if (item.inebriety > 0 || item.fullness > 0 || item.spleen > 0) {
      autosell(item, itemAmount(item));
    }
  }
}

function absorbConsumables(): void {
  if (myPath() !== "Grey You") return; // final safety
  if (myTurncount() >= 1000) return; // stop after breaking ronin

  let absorbed_list = get("_loop_gyou_absorbed_consumables", "");
  const absorbed = new Set<string>(absorbed_list.split(","));

  for (const item_name in getInventory()) {
    const item = Item.get(item_name);
    const item_id = `${toInt(item)}`;
    if (consumables_blacklist.has(item)) continue;
    if (item.inebriety > 0 && !absorbed.has(item_id)) {
      drink(item);
      absorbed_list += absorbed_list.length > 0 ? `,${item_id}` : item_id;
    }
    if (item.fullness > 0 && !absorbed.has(item_id)) {
      eat(item);
      absorbed_list += absorbed_list.length > 0 ? `,${item_id}` : item_id;
    }
  }
  set("_loop_gyou_absorbed_consumables", absorbed_list);
}
