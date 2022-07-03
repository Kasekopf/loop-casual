import {
  autosell,
  autosellPrice,
  descToItem,
  eat,
  equippedItem,
  familiarWeight,
  getInventory,
  getWorkshed,
  haveEffect,
  Item,
  Location,
  Monster,
  myAdventures,
  myBasestat,
  myBuffedstat,
  myHp,
  myLevel,
  myMaxhp,
  myMaxmp,
  myMeat,
  myMp,
  myPath,
  myTurncount,
  overdrink,
  print,
  restoreHp,
  restoreMp,
  Slot,
  toInt,
  totalTurnsPlayed,
  use,
  visitUrl,
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
  canChargeVoid,
  freekillSources,
  runawaySources,
  WandererSource,
  wandererSources,
} from "./resources";
import { OverridePriority, Prioritization } from "./priority";
import { args } from "./main";
import { flyersDone } from "./tasks/level12";
import { GameState } from "./state";

export const wanderingNCs = new Set<string>([
  "Wooof! Wooooooof!",
  "Playing Fetch*",
  "A Pound of Cure",
  "Aunts not Ants",
  "Bath Time",
  "Beware of Aligator",
  "Delicious Sprouts",
  "Hypnotic Master",
  "Lost and Found",
  "Poetic Justice",
  "Summer Days",
  "Teacher's Pet",
]);

export class Engine {
  attempts: { [task_name: string]: number } = {};
  propertyManager = new PropertiesManager();
  tasks: Task[];
  tasks_by_name = new Map<string, Task>();

  constructor(tasks: Task[]) {
    this.tasks = tasks;
    for (const task of tasks) {
      this.tasks_by_name.set(task.name, task);
    }
  }

  public available(task: Task, state: GameState): boolean {
    for (const after of task.after) {
      const after_task = this.tasks_by_name.get(after);
      if (after_task === undefined) throw `Unknown task dependency ${after} on ${task.name}`;
      if (!after_task.completed(state)) return false;
    }
    if (task.ready && !task.ready(state)) return false;
    if (task.completed(state)) return false;

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
    state: GameState,
    ...wanderers: WandererSource[]
  ): GameState {
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

    // Prepare basic equipment
    const outfit = Outfit.create(task, state);
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
          ? new Set<Monster>([
            ...state.absorb.remainingAbsorbs(have($effect`Teleportitis`) ? undefined : task.do),
            ...state.absorb.remainingReprocess(have($effect`Teleportitis`) ? undefined : task.do),
          ])
          : [];
      for (const monster of absorb_targets) {
        if (state.absorb.isReprocessTarget(monster)) {
          outfit.equip($familiar`Grey Goose`);
          task_combat.autoattack(new Macro().trySkill($skill`Re-Process Matter`), monster);
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
          new Macro().if_(
            // Avoid sausage goblin (2104), ninja snowman assassin (1185), protagonist (160), quantum mechanic (223)
            "!hpbelow 50 && !monsterid 2104 && !monsterid 1185 &&!monsterid 160 && !monsterid 223",
            new Macro().tryItem($item`rock band flyers`)
          )
        );
      }

      // Apply resources
      const combat_resources = new CombatResourceAllocation();
      if (wanderers.length === 0) {
        // Set up a banish if needed

        if (task_combat.can(MonsterStrategy.Banish) && !state.banishes.isFullyBanished(task)) {
          const available_tasks = this.tasks.filter((task) => this.available(task, state));
          const banishSources = state.banishes.unusedBanishes(available_tasks);
          combat_resources.banishWith(outfit.equipFirst(banishSources));
          debug(
            `Banish targets: ${task_combat
              .where(MonsterStrategy.Banish)
              .filter((monster) => !state.banishes.already_banished.has(monster))
              .join(", ")}`
          );
          debug(
            `Banishes available: ${Array.from(banishSources)
              .map((b) => b.do)
              .join(", ")}`
          );
        }

        // Equip an orb if we have a good target.
        // (If we have banished all the bad targets, there is no need to force an orb)
        if (
          priority.has(OverridePriority.GoodOrb) &&
          (!task_combat.can(MonsterStrategy.Banish) || !state.banishes.isFullyBanished(task))
        ) {
          outfit.equip($item`miniature crystal ball`);
        }

        // Set up a runaway if there are combats we do not care about
        let runaway = undefined;
        if (
          task_combat.can(MonsterStrategy.Ignore) &&
          familiarWeight($familiar`Grey Goose`) >= 6 &&
          myLevel() >= 11
        ) {
          runaway = outfit.equipFirst(runawaySources);
          combat_resources.runawayWith(runaway);
        }
        if (
          task_combat.can(MonsterStrategy.IgnoreNoBanish) &&
          familiarWeight($familiar`Grey Goose`) >= 6 &&
          myLevel() >= 11
        ) {
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
            this.tasks.every((t) => t.completed(state) || !t.combat?.can(MonsterStrategy.KillFree)))
        ) {
          combat_resources.freekillWith(outfit.equipFirst(freekillSources));
        }
      }

      // Charge familiars if needed
      if (!outfit.skipDefaults) {
        outfit.equipCharging();
      }

      if (wanderers.length === 0) {
        // Set up more wanderers if delay is needed
        if (this.hasDelay(task)) wanderers = outfit.equipUntilCapped(wandererSources);

        // Prepare mood (no need if there is a forced wanderer)
        applyEffects(outfit.modifier ?? "", task.effects || []);
      }

      // Prepare full outfit
      if (!outfit.skipDefaults) {
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
      }
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
        state,
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

    // Prepare choice selections
    const choices: { [choice: number]: number } = {};
    for (const choice_id_str in task.choices) {
      const choice_id = parseInt(choice_id_str);
      const choice = task.choices[choice_id];
      if (typeof choice === "number") choices[choice_id] = choice;
      else choices[choice_id] = choice();
    }
    this.propertyManager.setChoices(choices);
    if (equippedAmount($item`June cleaver`) > 0) {
      this.propertyManager.setChoices({
        // June cleaver noncombats
        1467: 3, // +adv
        1468: get("_juneCleaverSkips", 0) < 5 ? 4 : 1,
        1469: get("_juneCleaverSkips", 0) < 5 ? 4 : 3,
        1470: 2, // teacher's pen
        1471: get("_juneCleaverSkips", 0) < 5 ? 4 : 1,
        1472: get("_juneCleaverSkips", 0) < 5 ? 4 : 2,
        1473: get("_juneCleaverSkips", 0) < 5 ? 4 : 2,
        1474: get("_juneCleaverSkips", 0) < 5 ? 4 : 2,
        1475: get("_juneCleaverSkips", 0) < 5 ? 4 : 1,
      })
    }
    const ignored_noncombats = [
      "Wooof! Wooooooof!",
      "Seeing-Eyes Dog",
      "Playing Fetch",
      "Lights Out in the",
    ];
    const ignored_noncombats_seen = ignored_noncombats.filter(
      (name) => task.do instanceof Location && task.do.noncombatQueue.includes(name)
    );

    // Do any task-specific preparation
    if (task.prepare) task.prepare(state);

    if (args.verboseequip) {
      const equipped = [...new Set(Slot.all().map((slot) => equippedItem(slot)))];
      print(`Equipped: ${equipped.join(", ")}`);
    }

    // Do the task
    let beaten_turns = haveEffect($effect`Beaten Up`);
    const start_advs = myAdventures();
    const goose_weight = familiarWeight($familiar`Grey Goose`);
    if (typeof task.do === "function") {
      task.do();
    } else {
      adv1(task.do, 0, "");
      // If we encounter a free wandering noncombat, just retry
      if (wanderingNCs.has(get("lastEncounter"))) {
        if (get("lastEncounter") === "Poetic Justice") {
          // Our choice for this one leads to 5 turns of Beaten Up
          beaten_turns = haveEffect($effect`Beaten Up`);
        }
        adv1(task.do, 0, "");
      }
    }
    runCombat();
    while (inMultiFight()) runCombat();
    if (choiceFollowsFight()) runChoice(-1);
    if (task.post) task.post();

    absorbConsumables();
    autosellJunk();
    if (myAdventures() !== start_advs) getExtros();
    // Crash if we unexpectedly lost the fight
    if (!task.expectbeatenup && have($effect`Beaten Up`)) {
      if (
        haveEffect($effect`Beaten Up`) > beaten_turns || // Turns of beaten-up increased, so we lost
        (haveEffect($effect`Beaten Up`) === beaten_turns &&
          // Turns of beaten-up was constant but adventures went down, so we lost fight while already beaten up
          (myAdventures() < start_advs ||
            // Check if adventures went down but also we reprocessed a monster
            (familiarWeight($familiar`Grey Goose`) < goose_weight &&
              (myAdventures() === start_advs + 4 ||
                myAdventures() === start_advs + 6 ||
                myAdventures() === start_advs + 9))))
      )
        throw "Fight was lost; stop.";
    }
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

    const new_state = new GameState();
    if (task.completed(new_state)) {
      debug(`${task.name} completed!`, "blue");
    } else if (!(task.ready?.(state) ?? true)) {
      debug(`${task.name} not completed! [Again? Not ready]`, "blue");
    } else {
      const priority_explain = Prioritization.from(task, new_state).explain();
      if (priority_explain !== "") {
        debug(`${task.name} not completed! [Again? ${priority_explain}]`, "blue");
      } else {
        debug(`${task.name} not completed!`, "blue");
      }
      this.check_limits(task); // Error if too many tries occur
    }
    return new_state;
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
  $items`wet stew, wet stunt nut stew, stunt nuts, astral pilsner, astral hot dog dinner, giant marshmallow, booze-soaked cherry, sponge cake, gin-soaked blotter paper, steel margarita, bottle of Chateau de Vinegar, Bowl of Scorpions, unnamed cocktail, Flamin' Whatshisname, goat cheese, Extrovermectin™, blueberry muffin, bran muffin, chocolate chip muffin`
);
function autosellJunk(): void {
  if (myPath() !== "Grey You") return; // final safety
  if (myMeat() >= 10000) return;
  if (myTurncount() >= 1000) return; // stop after breaking ronin
  if (have($item`pork elf goodies sack`)) use($item`pork elf goodies sack`);

  // Sell junk items
  const junk = $items`hamethyst, baconstone, meat stack, dense meat stack, facsimile dictionary, space blanket, 1\,970 carat gold, black snake skin, demon skin, hellion cube, adder bladder, weremoose spit, Knob Goblin firecracker, wussiness potion, diamond-studded cane, Knob Goblin tongs, Knob Goblin scimitar, eggbeater, red-hot sausage fork, Knob Goblin pants, awful poetry journal, black pixel, pile of dusty animal bones`;
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
      overdrink(item);
      absorbed_list += absorbed_list.length > 0 ? `,${item_id}` : item_id;
    }
    if (item.fullness > 0 && !absorbed.has(item_id)) {
      eat(item);
      absorbed_list += absorbed_list.length > 0 ? `,${item_id}` : item_id;
    }
  }
  set("_loop_gyou_absorbed_consumables", absorbed_list);
}


function getExtros(): void {
  if (getWorkshed() !== $item`cold medicine cabinet`) return;
  if (!have($item`ice crown`)) return;
  if (!have($item`frozen jeans`)) return;
  if (
    get("_coldMedicineConsults") >= 5 ||
    get("_nextColdMedicineConsult") > totalTurnsPlayed()
  ) {
    return;
  }
  const options = visitUrl("campground.php?action=workshed");
  let match;
  const regexp = /descitem\((\d+)\)/g;
  while ((match = regexp.exec(options)) !== null) {
    const item = descToItem(match[1]);
    if (item === $item`Extrovermectin™`) {
      visitUrl("campground.php?action=workshed");
      runChoice(5);
      return;
    }
  }
}
