import { create, myInebriety, use, visitUrl } from "kolmafia";
import {
  $effect,
  $item,
  $items,
  $location,
  $monster,
  $monsters,
  ensureEffect,
  get,
  have,
} from "libram";
import { Quest, step, Task } from "./structure";
import { CombatStrategy } from "../combat";

const Manor1: Task[] = [
  {
    name: "Kitchen",
    after: ["Start"],
    completed: () => step("questM20Necklace") >= 1,
    do: $location`The Haunted Kitchen`,
    modifier: "stench res, hot res",
    cap: 6,
  },
  {
    name: "Billiards",
    after: ["Kitchen"],
    completed: () => step("questM20Necklace") >= 3,
    ready: () => myInebriety() <= 10,
    prepare: (): void => {
      ensureEffect($effect`Chalky Hand`);
      ensureEffect($effect`Influence of Sphere`);
    },
    do: $location`The Haunted Billiards Room`,
    choices: { 875: 1 },
    modifier: "-combat",
  },
  {
    name: "Library",
    after: ["Billiards"],
    completed: () => step("questM20Necklace") >= 4,
    do: $location`The Haunted Library`,
    combat: new CombatStrategy().banish(...$monsters`banshee librarian, bookbat`).kill(),
    choices: { 163: 4, 888: 4, 889: 4 },
  },
];

const Manor2: Task[] = [
  {
    name: "Start Floor2",
    after: ["Library"],
    completed: () => step("questM21Dance") >= 1,
    do: () => visitUrl("place.php?whichplace=manor2&action=manor2_ladys"),
  },
  {
    name: "Gallery",
    after: ["Start Floor2"],
    completed: () => have($item`Lady Spookyraven's dancing shoes`) || step("questM21Dance") >= 2,
    do: $location`The Haunted Gallery`,
    choices: { 89: 4 }, // TODO: louvre
    modifier: "-combat",
  },
  {
    name: "Bathroom",
    after: ["Start Floor2"],
    completed: () => have($item`Lady Spookyraven's powder puff`) || step("questM21Dance") >= 2,
    do: $location`The Haunted Bathroom`,
    choices: { 881: 1, 105: 1 },
    modifier: "-combat",
    combat: new CombatStrategy().kill($monster`cosmetics wraith`),
  },
  {
    name: "Bedroom",
    after: ["Start Floor2"],
    completed: () => have($item`Lady Spookyraven's finest gown`) || step("questM21Dance") >= 2,
    do: () => $location`The Haunted Bedroom`,
    choices: { 876: 1, 877: 1, 878: 3, 879: 1, 880: 1 },
    combat: new CombatStrategy()
      .kill(...$monsters`tumbleweed, elegant animated nightstand`)
      .killBanish($monster`animated ornate nightstand`)
      .banish(
        ...$monsters`animated mahogany nightstand, animated rustic nightstand, Wardröb nightstand`
      ),
  },
  {
    name: "Open Ballroom",
    after: ["Gallery", "Bathroom", "Bedroom"],
    completed: () => step("questM21Dance") >= 3,
    do: () => visitUrl("place.php?whichplace=manor2&action=manor2_ladys"),
    cap: 1,
  },
  {
    name: "Finsh Floor2",
    after: ["Open Ballroom"],
    completed: () => step("questM21Dance") >= 4,
    do: $location`The Haunted Ballroom`,
    cap: 2, // Lights Out might occur
  },
];

const ManorBasement: Task[] = [
  {
    name: "Ballroom",
    after: ["Macguffin/Diary", "Finish Floor2"],
    completed: () => step("questL11Manor") >= 1,
    do: $location`The Haunted Ballroom`,
    modifier: "-combat",
  },
  {
    name: "Learn Recipe",
    after: ["Ballroom"],
    completed: () => get("spookyravenRecipeUsed") === "with_glasses",
    do: () => use($item`recipe: mortar-dissolving solution`),
    equip: $items`Lord Spookyraven's spectacles`,
  },
  {
    name: "Wine Cellar",
    after: ["Learn Recipe"],
    completed: () =>
      have($item`bottle of Chateau de Vinegar`) ||
      have($item`unstable fulminate`) ||
      have($item`wine bomb`) ||
      step("questL11Manor") >= 3,
    do: $location`The Haunted Wine Cellar`,
    modifier: "items",
    combat: new CombatStrategy()
      .kill($monster`possessed wine rack`)
      .banish(...$monsters`mad wino, skeletal sommelier`),
  },
  {
    name: "Laundry Room",
    after: ["Learn Recipe"],
    completed: () =>
      have($item`blasting soda`) ||
      have($item`unstable fulminate`) ||
      have($item`wine bomb`) ||
      step("questL11Manor") >= 3,
    do: $location`The Haunted Laundry Room`,
    modifier: "items",
    combat: new CombatStrategy()
      .kill($monster`cabinet of Dr. Limpieza`)
      .banish(...$monsters`plaid ghost, possessed laundry press`),
  },
  {
    name: "Fulminate",
    after: ["Wine Cellar", "Laundry Room"],
    completed: () =>
      have($item`unstable fulminate`) || have($item`wine bomb`) || step("questL11Manor") >= 3,
    do: () => create($item`unstable fulminate`),
    cap: 1,
  },
  {
    name: "Boiler Room",
    after: ["Learn Recipe"],
    completed: () => have($item`wine bomb`) || step("questL11Manor") >= 3,
    do: $location`The Haunted Laundry Room`,
    modifier: "ML max 81",
    equip: $items`unstable fulminate`,
    combat: new CombatStrategy().kill($monster`monstrous boiler`).banish($monster`coaltergeist`),
  },
  {
    name: "Blow Wall",
    after: ["Boiler Room"],
    completed: () => step("questL11Manor") >= 3,
    do: () => visitUrl("place.php?whichplace=manor4&action=manor4_chamberwall"),
    cap: 1,
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
      cap: 1,
    },
    ...Manor1,
    ...Manor2,
    ...ManorBasement,
    {
      name: "Boss",
      after: ["Blow Wall"],
      completed: () => step("questL11Manor") >= 999,
      do: () => visitUrl("place.php?whichplace=manor4&action=manor4_chamberboss"),
      combat: new CombatStrategy().kill(),
      cap: 1,
    },
  ],
};
