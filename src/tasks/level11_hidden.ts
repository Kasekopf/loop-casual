import { cliExecute, myHash, use, visitUrl } from "kolmafia";
import { $effects, $item, $items, $location, $monster, $monsters, get, have } from "libram";
import { Quest, step, Task } from "./structure";
import { CombatStrategy } from "../combat";

function manualChoice(whichchoice: number, option: number) {
  return visitUrl(`choice.php?whichchoice=${whichchoice}&pwd=${myHash()}&option=${option}`);
}

const Temple: Task[] = [
  {
    name: "Forest Coin",
    after: ["Mosquito/Burn Delay"],
    completed: () =>
      have($item`tree-holed coin`) ||
      have($item`Spooky Temple map`) ||
      step("questM16Temple") === 999,
    do: $location`The Spooky Forest`,
    choices: { 502: 2, 505: 2, 334: 1 },
    modifier: "-combat",
  },
  {
    name: "Forest Map",
    after: ["Forest Coin"],
    completed: () => have($item`Spooky Temple map`) || step("questM16Temple") === 999,
    do: $location`The Spooky Forest`,
    choices: { 502: 3, 506: 3, 507: 1, 334: 1 },
    modifier: "-combat",
  },
  {
    name: "Forest Sapling",
    after: ["Mosquito/Burn Delay"],
    completed: () => have($item`spooky sapling`) || step("questM16Temple") === 999,
    do: $location`The Spooky Forest`,
    choices: { 502: 1, 503: 3, 504: 3, 334: 1 },
    modifier: "-combat",
  },
  {
    name: "Open Temple",
    after: ["Forest Coin", "Forest Map", "Forest Sapling"],
    acquire: $items`Spooky-Gro fertilizer`,
    completed: () => step("questM16Temple") === 999,
    do: () => use($item`Spooky Temple map`),
    cap: 1,
    freeaction: true,
  },
  {
    name: "Temple Nostril",
    after: ["Open Temple", "Macguffin/Diary"],
    acquire: $items`stone wool`,
    completed: () => have($item`the Nostril of the Serpent`) || step("questL11Worship") >= 3,
    do: $location`The Hidden Temple`,
    choices: { 579: 2, 582: 1 },
    effects: $effects`Stone-Faced`,
    cap: 1,
  },
  {
    name: "Open City",
    after: ["Temple Nostril"],
    acquire: $items`stone wool`,
    completed: () => step("questL11Worship") >= 3,
    do: () => {
      visitUrl("adventure.php?snarfblat=280");
      manualChoice(582, 2);
      manualChoice(580, 2);
      manualChoice(584, 4);
      manualChoice(580, 1);
      manualChoice(123, 2);
      visitUrl("choice.php");
      cliExecute("dvorak");
      manualChoice(125, 3);
    },
    effects: $effects`Stone-Faced`,
    cap: 1,
  },
];

const Apartment: Task[] = [
  {
    name: "Open Apartment",
    after: ["Open City"],
    completed: () => get("hiddenApartmentProgress") >= 1,
    do: $location`An Overgrown Shrine (Northwest)`,
    equip: $items`antique machete`,
    choices: { 781: 1 },
    cap: 4,
  },
  {
    name: "Apartment",
    after: ["Open Apartment", "Office Files"], // Wait until after all needed pygmy witch lawyers are done
    completed: () => get("hiddenApartmentProgress") >= 7,
    do: $location`The Hidden Apartment Building`,
    combat: new CombatStrategy()
      .kill($monster`ancient protector spirit (The Hidden Apartment Building)`)
      .banish(...$monsters`pygmy janitor, pygmy witch lawyer, pygmy witch accountant`)
      .flee($monster`pygmy shaman`),
    choices: { 780: 1 },
  },
  {
    name: "Finish Apartment",
    after: ["Apartment"],
    completed: () => get("hiddenApartmentProgress") >= 8,
    do: $location`An Overgrown Shrine (Northwest)`,
    choices: { 781: 2 },
    cap: 1,
    freeaction: true,
  },
];

const Office: Task[] = [
  {
    name: "Open Office",
    after: ["Open City"],
    completed: () => get("hiddenOfficeProgress") >= 1,
    do: $location`An Overgrown Shrine (Northeast)`,
    equip: $items`antique machete`,
    choices: { 785: 1 },
    cap: 4,
  },
  {
    name: "Office Files",
    after: ["Open Office"],
    completed: () =>
      (have($item`McClusky file (page 1)`) &&
        have($item`McClusky file (page 2)`) &&
        have($item`McClusky file (page 3)`) &&
        have($item`McClusky file (page 4)`) &&
        have($item`McClusky file (page 5)`)) ||
      have($item`McClusky file (complete)`) ||
      get("hiddenOfficeProgress") >= 7,
    do: $location`The Hidden Office Building`,
    combat: new CombatStrategy()
      .kill($monster`pygmy witch accountant`)
      .banish(...$monsters`pygmy janitor, pygmy headhunter, pygmy witch lawyer`),
    choices: { 786: 2 },
    cap: 9,
  },
  {
    name: "Office Clip",
    after: ["Office Files"],
    completed: () =>
      have($item`boring binder clip`) ||
      have($item`McClusky file (complete)`) ||
      get("hiddenOfficeProgress") >= 7,
    do: $location`The Hidden Office Building`,
    choices: { 786: 2 },
    cap: 9,
  },
  {
    name: "Office Boss",
    after: ["Office Clip"],
    completed: () => get("hiddenOfficeProgress") >= 7,
    do: $location`The Hidden Office Building`,
    choices: { 786: 1 },
    combat: new CombatStrategy().kill(
      $monster`ancient protector spirit (The Hidden Office Building)`
    ),
    cap: 6,
  },
  {
    name: "Finish Office",
    after: ["Office Boss"],
    completed: () => get("hiddenOfficeProgress") >= 8,
    do: $location`An Overgrown Shrine (Northeast)`,
    choices: { 785: 2 },
    cap: 1,
    freeaction: true,
  },
];

const Hospital: Task[] = [
  {
    name: "Open Hospital",
    after: ["Open City"],
    completed: () => get("hiddenHospitalProgress") >= 1,
    do: $location`An Overgrown Shrine (Southwest)`,
    equip: $items`antique machete`,
    choices: { 783: 1 },
    cap: 4,
  },
  {
    name: "Hospital",
    after: ["Open Hospital"],
    acquire: $items`half-size scalpel, head mirror, surgical mask, surgical apron, bloodied surgical dungarees`,
    completed: () => get("hiddenHospitalProgress") >= 7,
    do: $location`The Hidden Hospital`,
    combat: new CombatStrategy().kill($monster`ancient protector spirit (The Hidden Hospital)`),
    equip: $items`half-size scalpel, head mirror, surgical mask, surgical apron, bloodied surgical dungarees`,
    choices: { 784: 1 },
  },
  {
    name: "Finish Hospital",
    after: ["Hospital"],
    completed: () => get("hiddenHospitalProgress") >= 8,
    do: $location`An Overgrown Shrine (Southwest)`,
    choices: { 783: 2 },
    cap: 1,
    freeaction: true,
  },
];

const Bowling: Task[] = [
  {
    name: "Open Bowling",
    after: ["Open City"],
    completed: () => get("hiddenBowlingAlleyProgress") >= 1,
    do: $location`An Overgrown Shrine (Southeast)`,
    equip: $items`antique machete`,
    choices: { 787: 1 },
    cap: 4,
  },
  {
    name: "Bowling",
    after: ["Open Bowling"],
    acquire: $items`bowling ball`,
    completed: () => get("hiddenBowlingAlleyProgress") >= 7,
    do: $location`The Hidden Bowling Alley`,
    combat: new CombatStrategy().kill(
      $monster`ancient protector spirit (The Hidden Bowling Alley)`
    ),
    choices: { 788: 1 },
  },
  {
    name: "Finish Bowling",
    after: ["Bowling"],
    completed: () => get("hiddenBowlingAlleyProgress") >= 8,
    do: $location`An Overgrown Shrine (Southeast)`,
    choices: { 787: 2 },
    cap: 1,
    freeaction: true,
  },
];

export const HiddenQuest: Quest = {
  name: "Hidden City",
  tasks: [
    ...Temple,
    ...Office,
    ...Apartment,
    ...Hospital,
    ...Bowling,
    {
      name: "Boss",
      after: ["Finish Office", "Finish Apartment", "Finish Hospital", "Finish Bowling"],
      completed: () => step("questL11Worship") === 999,
      do: $location`A Massive Ziggurat`,
      equip: $items`antique machete`,
      choices: { 791: 1 },
      combat: new CombatStrategy(true).kill(...$monsters`dense liana, Protector Spectre`),
      cap: 4,
    },
  ],
};
