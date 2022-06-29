import { drink, Item, itemAmount, myLevel, toInt, visitUrl } from "kolmafia";
import { $item, $items, $location, $monsters, $skill, have } from "libram";
import { CombatStrategy } from "../combat";
import { Quest, step } from "./structure";

export const FriarQuest: Quest = {
  name: "Friar",
  tasks: [
    {
      name: "Start",
      after: [],
      ready: () => myLevel() >= 6,
      completed: () => step("questL06Friar") !== -1,
      do: () => visitUrl("council.php"),
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Heart",
      after: ["Start"],
      completed: () => have($item`box of birthday candles`) || step("questL06Friar") === 999,
      do: $location`The Dark Heart of the Woods`,
      outfit: { modifier: "-combat" },
      limit: { soft: 20 },
    },
    {
      name: "Neck",
      after: ["Start"],
      completed: () => have($item`dodecagram`) || step("questL06Friar") === 999,
      do: $location`The Dark Neck of the Woods`,
      outfit: { modifier: "-combat" },
      choices: { 1428: 2 },
      limit: { soft: 20 },
    },
    {
      name: "Elbow",
      after: ["Start"],
      completed: () => have($item`eldritch butterknife`) || step("questL06Friar") === 999,
      do: $location`The Dark Elbow of the Woods`,
      outfit: { modifier: "-combat" },
      limit: { soft: 20 },
    },
    {
      name: "Finish",
      after: ["Heart", "Neck", "Elbow"],
      completed: () => step("questL06Friar") === 999,
      do: () => visitUrl("friars.php?action=ritual&pwd"),
      limit: { tries: 1 },
      freeaction: true,
    },
  ],
};

export const OrganQuest: Quest = {
  name: "Organ",
  tasks: [
    {
      name: "Start",
      after: ["Friar/Finish"],
      completed: () => step("questM10Azazel") >= 0,
      do: (): void => {
        visitUrl("pandamonium.php?action=temp");
        visitUrl("pandamonium.php?action=sven");
      },
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Tutu",
      after: ["Start"],
      completed: () => have($item`Azazel's tutu`) || step("questM10Azazel") === 999,
      acquire: [
        { item: $item`imp air`, num: 5 },
        { item: $item`bus pass`, num: 5 },
      ],
      do: () => visitUrl("pandamonium.php?action=moan"),
      limit: { tries: 2 },
      freeaction: true,
    },
    {
      name: "Arena",
      after: ["Start"],
      completed: (): boolean => {
        if (step("questM10Azazel") === 999) return true;
        if (have($item`Azazel's unicorn`)) return true;

        const count = (items: Item[]) => items.reduce((sum, item) => sum + itemAmount(item), 0);
        if (count($items`giant marshmallow, beer-scented teddy bear, gin-soaked blotter paper`) < 2)
          return false;
        if (count($items`booze-soaked cherry, comfy pillow, sponge cake`) < 2) return false;
        return true;
      },
      do: $location`Infernal Rackets Backstage`,
      limit: { soft: 30 },
      outfit: { modifier: "-combat" },
    },
    {
      name: "Unicorn",
      after: ["Arena"],
      completed: () => have($item`Azazel's unicorn`) || step("questM10Azazel") === 999,
      do: (): void => {
        const goals: { [name: string]: Item[] } = {
          Bognort: $items`giant marshmallow, gin-soaked blotter paper`,
          Stinkface: $items`beer-scented teddy bear, gin-soaked blotter paper`,
          Flargwurm: $items`booze-soaked cherry, sponge cake`,
          Jim: $items`comfy pillow, sponge cake`,
        };
        visitUrl("pandamonium.php?action=sven");
        for (const member of Object.keys(goals)) {
          if (goals[member].length === 0) throw `Unable to solve Azazel's arena quest`;
          const item = have(goals[member][0]) ? toInt(goals[member][0]) : toInt(goals[member][1]);
          visitUrl(`pandamonium.php?action=sven&bandmember=${member}&togive=${item}&preaction=try`);
        }
      },
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Comedy Club",
      after: ["Start"],
      completed: () => have($item`observational glasses`),
      do: $location`The Laugh Floor`,
      outfit: { modifier: "+combat" },
      combat: new CombatStrategy().kill(
        ...$monsters`Carbuncle Top, Larry of the Field of Signs, Victor the Insult Comic Hellhound`
      ),
      limit: { soft: 30 },
    },
    {
      name: "Lollipop",
      after: ["Comedy Club"],
      completed: () => have($item`Azazel's lollipop`) || step("questM10Azazel") === 999,
      do: () => visitUrl("pandamonium.php?action=mourn&preaction=observe"),
      outfit: { equip: $items`observational glasses` },
      limit: { tries: 1 },
      freeaction: true,
      noadventures: true,
    },
    {
      name: "Azazel",
      after: ["Tutu", "Unicorn", "Lollipop"],
      completed: () => step("questM10Azazel") === 999,
      do: () => visitUrl("pandamonium.php?action=temp"),
      limit: { tries: 1 },
      freeaction: true,
      noadventures: true,
    },
    {
      name: "Finish",
      after: ["Azazel"],
      completed: () => have($skill`Liver of Steel`),
      do: () => drink($item`steel margarita`),
      limit: { tries: 1 },
      freeaction: true,
      noadventures: true,
    },
  ],
};
