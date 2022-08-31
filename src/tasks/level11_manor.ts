import { create, myClass, myFury, myInebriety, use, useSkill, visitUrl } from "kolmafia";
import {
  $class,
  $effect,
  $effects,
  $item,
  $items,
  $location,
  $monster,
  $monsters,
  $skill,
  ensureEffect,
  get,
  have,
  Macro,
} from "libram";
import { Quest, Task } from "../engine/task";
import { CombatStrategy } from "../engine/combat";
import { step } from "grimoire-kolmafia";

const Manor1: Task[] = [
  {
    name: "Kitchen",
    after: ["Start"],
    completed: () => step("questM20Necklace") >= 1,
    do: $location`The Haunted Kitchen`,
    outfit: { modifier: "stench res, hot res" },
    choices: { 893: 2 },
    combat: new CombatStrategy().kill(),
    limit: { turns: 7 },
  },
  {
    name: "Billiards",
    after: ["Kitchen"],
    completed: () => step("questM20Necklace") >= 3,
    prepare: () => {
      if (!have($item`government-issued eyeshade`)) ensureEffect($effect`Influence of Sphere`);
    },
    acquire: [{ item: $item`T.U.R.D.S. Key`, num: 1, price: 4000, optional: true }],
    ready: () => myInebriety() <= 15, // Nonnegative contribution
    do: $location`The Haunted Billiards Room`,
    choices: { 875: 1, 900: 2, 1436: 2 },
    outfit: () => {
      return {
        equip: have($item`government-issued eyeshade`) ? $items`government-issued eyeshade` : [],
        modifier: "-combat",
      };
    },
    combat: new CombatStrategy()
      .ignore()
      .banish($monster`pooltergeist`)
      .macro(new Macro().tryItem($item`T.U.R.D.S. Key`), $monster`chalkdust wraith`)
      .kill($monster`pooltergeist (ultra-rare)`),
    effects: $effects`Chalky Hand`,
    limit: { soft: 10 },
  },
  {
    name: "Library",
    after: ["Billiards"],
    completed: () => step("questM20Necklace") >= 4,
    do: $location`The Haunted Library`,
    combat: new CombatStrategy()
      .banish(...$monsters`banshee librarian, bookbat`)
      .kill($monster`writing desk`),
    choices: { 163: 4, 888: 4, 889: 5, 894: 1 },
    limit: { soft: 10 },
  },
  {
    name: "Finish Floor1",
    after: ["Library"],
    completed: () => step("questM20Necklace") === 999,
    do: () => visitUrl("place.php?whichplace=manor1&action=manor1_ladys"),
    limit: { tries: 1 },
    freeaction: true,
  },
];

const Manor2: Task[] = [
  {
    name: "Start Floor2",
    after: ["Finish Floor1"],
    completed: () => step("questM21Dance") >= 1,
    do: () => visitUrl("place.php?whichplace=manor2&action=manor2_ladys"),
    limit: { tries: 1 },
    freeaction: true,
  },
  {
    name: "Gallery Delay",
    after: ["Start Floor2"],
    completed: () => $location`The Haunted Gallery`.turnsSpent >= 5 || step("questM21Dance") >= 2,
    do: $location`The Haunted Gallery`,
    choices: { 89: 6, 896: 1 }, // TODO: louvre
    limit: { turns: 5 },
    delay: 5,
  },
  {
    name: "Gallery",
    after: ["Gallery Delay"],
    completed: () => have($item`Lady Spookyraven's dancing shoes`) || step("questM21Dance") >= 2,
    do: $location`The Haunted Gallery`,
    choices: { 89: 6, 896: 1 }, // TODO: louvre
    outfit: { modifier: "-combat" },
    limit: { soft: 10 },
  },
  {
    name: "Bathroom Delay",
    after: ["Start Floor2"],
    completed: () => $location`The Haunted Bathroom`.turnsSpent >= 5 || step("questM21Dance") >= 2,
    do: $location`The Haunted Bathroom`,
    choices: { 881: 1, 105: 1, 892: 1 },
    combat: new CombatStrategy().kill($monster`cosmetics wraith`),
    limit: { turns: 5 },
    delay: 5,
  },
  {
    name: "Bathroom",
    after: ["Bathroom Delay"],
    completed: () => have($item`Lady Spookyraven's powder puff`) || step("questM21Dance") >= 2,
    do: $location`The Haunted Bathroom`,
    choices: { 881: 1, 105: 1, 892: 1 },
    outfit: { modifier: "-combat" },
    combat: new CombatStrategy().kill($monster`cosmetics wraith`),
    limit: { soft: 10 },
  },
  {
    name: "Bedroom",
    after: ["Start Floor2"],
    completed: () => have($item`Lady Spookyraven's finest gown`) || step("questM21Dance") >= 2,
    do: $location`The Haunted Bedroom`,
    choices: { 876: 1, 877: 1, 878: 3, 879: 1, 880: 1, 897: 2 },
    combat: new CombatStrategy()
      .kill($monsters`elegant animated nightstand, animated ornate nightstand`) // kill ornate nightstand if banish fails
      .macro(
        new Macro().trySkill($skill`Batter Up!`).trySkill($skill`Talk About Politics`),
        $monster`animated ornate nightstand`
      )
      .banish(
        $monsters`animated mahogany nightstand, animated rustic nightstand, Wardröb nightstand`
      )
      .ignore($monster`tumbleweed`),
    outfit: () => {
      if (myClass() === $class`Seal Clubber` && have($skill`Batter Up!`) && myFury() >= 5)
        return { equip: $items`Meat Tenderizer is Murder` };
      else return { equip: $items`Pantsgiving` };
    },
    delay: () => (have($item`Lord Spookyraven's spectacles`) ? 5 : 0),
    limit: { soft: 10 },
  },
  {
    name: "Open Ballroom",
    after: ["Gallery", "Bathroom", "Bedroom"],
    completed: () => step("questM21Dance") >= 3,
    do: () => visitUrl("place.php?whichplace=manor2&action=manor2_ladys"),
    limit: { tries: 1 },
  },
  {
    name: "Finish Floor2",
    after: ["Open Ballroom"],
    completed: () => step("questM21Dance") >= 4,
    do: $location`The Haunted Ballroom`,
    limit: { turns: 1 },
  },
];

const ManorBasement: Task[] = [
  {
    name: "Ballroom Delay",
    after: ["Macguffin/Diary", "Finish Floor2"],
    completed: () => $location`The Haunted Ballroom`.turnsSpent >= 5 || step("questL11Manor") >= 1,
    do: $location`The Haunted Ballroom`,
    choices: { 90: 3, 106: 4, 921: 1 },
    limit: { turns: 5 },
    delay: 5,
  },
  {
    name: "Ballroom",
    after: ["Ballroom Delay"],
    completed: () => step("questL11Manor") >= 1,
    do: $location`The Haunted Ballroom`,
    outfit: { modifier: "-combat" },
    choices: { 90: 3, 106: 4, 921: 1 },
    limit: { soft: 10 },
  },
  {
    name: "Learn Recipe",
    after: ["Ballroom"],
    completed: () => get("spookyravenRecipeUsed") === "with_glasses",
    do: () => {
      visitUrl("place.php?whichplace=manor4&action=manor4_chamberwall");
      use($item`recipe: mortar-dissolving solution`);
    },
    outfit: { equip: $items`Lord Spookyraven's spectacles` },
    limit: { tries: 1 },
  },
  {
    name: "Wine Cellar",
    after: ["Learn Recipe"],
    completed: () =>
      have($item`bottle of Chateau de Vinegar`) ||
      have($item`unstable fulminate`) ||
      have($item`wine bomb`) ||
      step("questL11Manor") >= 3,
    priority: () => have($effect`Steely-Eyed Squint`),
    prepare: (): void => {
      if (!get("_steelyEyedSquintUsed")) useSkill($skill`Steely-Eyed Squint`);
    },
    do: $location`The Haunted Wine Cellar`,
    outfit: {
      equip: $items`A Light that Never Goes Out, Lil' Doctor™ bag`,
      modifier: "item, booze drop",
      skipDefaults: true,
    },
    effects: $effects`Merry Smithsness`,
    choices: { 901: 2 },
    combat: new CombatStrategy()
      .macro(new Macro().trySkill($skill`Otoscope`), $monster`possessed wine rack`)
      .banish($monsters`mad wino, skeletal sommelier`)
      .killFree(),
    limit: { soft: 10 },
  },
  {
    name: "Laundry Room",
    after: ["Learn Recipe"],
    priority: () => have($effect`Steely-Eyed Squint`),
    completed: () =>
      have($item`blasting soda`) ||
      have($item`unstable fulminate`) ||
      have($item`wine bomb`) ||
      step("questL11Manor") >= 3,
    prepare: (): void => {
      if (!get("_steelyEyedSquintUsed")) useSkill($skill`Steely-Eyed Squint`);
    },
    do: $location`The Haunted Laundry Room`,
    outfit: {
      equip: $items`A Light that Never Goes Out, Lil' Doctor™ bag`,
      modifier: "item, food drop",
      skipDefaults: true,
    },
    effects: $effects`Merry Smithsness`,
    choices: { 891: 2 },
    combat: new CombatStrategy()
      .macro(
        new Macro().trySkill($skill`Otoscope`).trySkill($skill`Chest X-Ray`),
        $monster`cabinet of Dr. Limpieza`
      )
      .banish($monsters`plaid ghost, possessed laundry press`)
      .killFree(),
    limit: { soft: 10 },
  },
  {
    name: "Fulminate",
    after: ["Wine Cellar", "Laundry Room"],
    completed: () =>
      have($item`unstable fulminate`) || have($item`wine bomb`) || step("questL11Manor") >= 3,
    do: () => create($item`unstable fulminate`),
    limit: { tries: 1 },
    freeaction: true,
  },
  {
    name: "Boiler Room",
    after: ["Fulminate"],
    completed: () => have($item`wine bomb`) || step("questL11Manor") >= 3,
    do: $location`The Haunted Boiler Room`,
    outfit: { modifier: "ML", equip: $items`unstable fulminate` },
    choices: { 902: 2 },
    combat: new CombatStrategy()
      .kill($monster`monstrous boiler`)
      .banish($monsters`coaltergeist, steam elemental`),
    limit: { soft: 10 },
  },
  {
    name: "Blow Wall",
    after: ["Boiler Room"],
    completed: () => step("questL11Manor") >= 3,
    do: () => visitUrl("place.php?whichplace=manor4&action=manor4_chamberwall"),
    limit: { tries: 1 },
    freeaction: true,
  },
];

export const ManorQuest: Quest = {
  name: "Manor",
  tasks: [
    {
      name: "Start",
      after: [],
      completed: () => step("questM20Necklace") >= 0,
      do: () => use($item`telegram from Lady Spookyraven`),
      limit: { tries: 1 },
      freeaction: true,
    },
    ...Manor1,
    ...Manor2,
    ...ManorBasement,
    {
      name: "Boss",
      after: ["Blow Wall"],
      completed: () => step("questL11Manor") >= 999,
      do: () => visitUrl("place.php?whichplace=manor4&action=manor4_chamberboss"),
      boss: true,
      combat: new CombatStrategy().kill(),
      limit: { tries: 1 },
    },
  ],
};
