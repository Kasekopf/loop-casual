import { cliExecute, floor, getMonsters, itemAmount, myLevel, use, visitUrl } from "kolmafia";
import { $effects, $item, $items, $location, $skill, get, have, Macro } from "libram";
import { Quest, step, Task } from "./structure";
import { CombatStrategy } from "../combat";

const ABoo: Task[] = [
  {
    name: "ABoo Start",
    after: ["Start Peaks"],
    completed: () =>
      $location`A-Boo Peak`.noncombatQueue.includes("Faction Traction = Inaction") ||
      get("booPeakProgress") < 50,
    do: $location`A-Boo Peak`,
    cap: 1,
  },
  {
    name: "ABoo Clues",
    after: ["ABoo Start"],
    completed: () => itemAmount($item`A-Boo clue`) * 30 >= get("booPeakProgress"),
    do: $location`A-Boo Peak`,
    modifier: "item 667max",
    equip: $items`Pantsgiving, A Light that Never Goes Out`,
    effects: $effects`Merry Smithsness`,
    combat: (): CombatStrategy => {
      const last_monster = get("lastCopyableMonster");
      const ghosts = getMonsters($location`A-Boo Peak`);
      if (last_monster !== null && ghosts.includes(last_monster)) {
        return new CombatStrategy()
          .macro(
            new Macro()
              .trySkill($skill`Feel Nostalgic`)
              .skill($skill`Saucegeyser`)
              .repeat(),
            ...ghosts.filter((mon) => mon !== last_monster)
          )
          .kill(last_monster);
      } else {
        return new CombatStrategy().macro(
          new Macro()
            .trySkill($skill`Talk About Politics`)
            .skill($skill`Saucegeyser`)
            .repeat()
        );
      }
    },
    choices: { 611: 1, 1430: 1 },
    cap: 2,
  },
  {
    name: "ABoo Horror",
    after: ["ABoo Clues"],
    ready: () => have($item`A-Boo clue`),
    completed: () => get("booPeakProgress") === 0,
    prepare: () => {
      use($item`A-Boo clue`);
    },
    do: $location`A-Boo Peak`,
    modifier: "spooky res, cold res",
    choices: { 611: 1 },
    cap: 4,
  },
  {
    name: "ABoo Peak",
    after: ["ABoo Horror"],
    completed: () => get("booPeakLit"),
    do: $location`A-Boo Peak`,
    cap: 1,
  },
];

const Oil: Task[] = [
  {
    name: "Oil Kill",
    after: ["Start Peaks"],
    completed: () => get("oilPeakProgress") === 0,
    do: $location`Oil Peak`,
    modifier: "ML",
    combat: new CombatStrategy().macro(new Macro().skill($skill`Saucegeyser`).repeat()).killHard(),
    cap: 6,
  },
  {
    name: "Oil Peak",
    after: ["Oil Kill"],
    completed: () => get("oilPeakLit"),
    do: $location`Oil Peak`,
    cap: 1,
  },
];

const Twin: Task[] = [
  {
    name: "Twin Stench",
    after: ["Start Peaks"],
    completed: () => !!(get("twinPeakProgress") & 1),
    do: () => {
      use($item`rusty hedge trimmers`);
    },
    choices: { 606: 1, 607: 1 },
    acquire: $items`rusty hedge trimmers`,
    modifier: "stench res 4min",
    cap: 1,
  },
  {
    name: "Twin Item",
    after: ["Start Peaks"],
    completed: () => !!(get("twinPeakProgress") & 2),
    do: () => {
      use($item`rusty hedge trimmers`);
    },
    choices: { 606: 2, 608: 1 },
    acquire: $items`rusty hedge trimmers`,
    modifier: "item 50min",
    cap: 1,
  },
  {
    name: "Twin Oil",
    after: ["Start Peaks"],
    completed: () => !!(get("twinPeakProgress") & 4),
    do: () => {
      use($item`rusty hedge trimmers`);
    },
    choices: { 606: 3, 609: 1, 616: 1 },
    acquire: $items`rusty hedge trimmers, jar of oil`,
    cap: 1,
  },
  {
    name: "Twin Init",
    after: ["Twin Stench", "Twin Item", "Twin Oil"],
    completed: () => !!(get("twinPeakProgress") & 8),
    do: () => {
      use($item`rusty hedge trimmers`);
    },
    choices: { 606: 4, 610: 1, 1056: 1 },
    acquire: $items`rusty hedge trimmers`,
    cap: 1,
  },
];

export const ChasmQuest: Quest = {
  name: "Orc Chasm",
  tasks: [
    {
      name: "Start",
      after: [],
      ready: () => myLevel() >= 9,
      completed: () => step("questL09Topping") !== -1,
      do: () => visitUrl("council.php"),
      cap: 1,
      freeaction: true,
    },
    {
      name: "Bridge",
      after: ["Start"],
      completed: () => step("questL09Topping") >= 1,
      do: (): void => {
        if (have($item`fish hatchet`)) use($item`fish hatchet`);
        visitUrl(`place.php?whichplace=orc_chasm&action=bridge${get("chasmBridgeProgress")}`); // use existing materials
        const count = floor((34 - get("chasmBridgeProgress")) / 5);
        if (count <= 0) return;
        cliExecute(`acquire ${count} snow boards`);
        visitUrl(`place.php?whichplace=orc_chasm&action=bridge${get("chasmBridgeProgress")}`);
      },
      acquire: [[12, $item`snow berries`]],
      cap: 1,
      freeaction: true,
    },
    {
      name: "Start Peaks",
      after: ["Bridge"],
      completed: () => step("questL09Topping") >= 2,
      do: () => visitUrl("place.php?whichplace=highlands&action=highlands_dude"),
      cap: 1,
      freeaction: true,
    },
    ...ABoo,
    ...Oil,
    ...Twin,
    {
      name: "Finish",
      after: ["ABoo Peak", "Oil Peak", "Twin Init"],
      completed: () => step("questL09Topping") === 999,
      do: () => visitUrl("place.php?whichplace=highlands&action=highlands_dude"),
      cap: 1,
      freeaction: true,
    },
  ],
};
