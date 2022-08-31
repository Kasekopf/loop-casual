import { cliExecute, containsText, myLevel, use, visitUrl } from "kolmafia";
import { $effect, $item, $items, $location, $monster, have } from "libram";
import { CombatStrategy } from "../engine/combat";
import { Quest } from "../engine/task";
import { step } from "grimoire-kolmafia";

export const GiantQuest: Quest = {
  name: "Giant",
  tasks: [
    {
      name: "Start",
      after: [],
      ready: () => myLevel() >= 10,
      completed: () => step("questL10Garbage") !== -1,
      do: () => visitUrl("council.php"),
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Grow Beanstalk",
      after: ["Start"],
      acquire: [{ item: $item`enchanted bean` }],
      completed: () => step("questL10Garbage") >= 1,
      do: () => use($item`enchanted bean`),
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Airship",
      after: ["Grow Beanstalk"],
      completed: () => have($item`S.O.C.K.`),
      do: $location`The Penultimate Fantasy Airship`,
      choices: { 178: 2, 182: 1 },
      post: () => {
        if (have($effect`Temporary Amnesia`)) cliExecute("uneffect Temporary Amnesia");
      },
      outfit: { modifier: "-combat" },
      limit: { soft: 50 },
      delay: () =>
        have($item`Plastic Wrap Immateria`) ? 25 : have($item`Gauze Immateria`) ? 20 : 15, // After that, just look for noncombats
    },
    {
      name: "Basement Search",
      after: ["Airship"],
      completed: () =>
        containsText(
          $location`The Castle in the Clouds in the Sky (Basement)`.noncombatQueue,
          "Mess Around with Gym"
        ) || step("questL10Garbage") >= 8,
      do: $location`The Castle in the Clouds in the Sky (Basement)`,
      outfit: { modifier: "-combat" },
      limit: { soft: 20 },
      choices: { 670: 5, 669: 1, 671: 4 },
    },
    {
      name: "Basement Finish",
      after: ["Basement Search"],
      acquire: [{ item: $item`amulet of extreme plot significance` }],
      completed: () => step("questL10Garbage") >= 8,
      do: $location`The Castle in the Clouds in the Sky (Basement)`,
      outfit: { equip: $items`amulet of extreme plot significance` },
      choices: { 670: 4 },
      limit: { tries: 1 },
    },
    {
      name: "Ground",
      after: ["Basement Finish"],
      completed: () => step("questL10Garbage") >= 9,
      do: $location`The Castle in the Clouds in the Sky (Ground Floor)`,
      choices: { 672: 3, 673: 3, 674: 3, 1026: 3 },
      limit: { turns: 11 },
      delay: 10,
    },
    {
      name: "Top Floor",
      after: ["Ground"],
      acquire: [{ item: $item`Mohawk wig` }],
      completed: () => step("questL10Garbage") >= 10,
      do: $location`The Castle in the Clouds in the Sky (Top Floor)`,
      outfit: { equip: $items`Mohawk wig`, modifier: "-combat" },
      combat: new CombatStrategy().kill($monster`Burning Snake of Fire`),
      choices: { 675: 4, 676: 4, 677: 4, 678: 1, 679: 1, 1431: 4 },
      limit: { soft: 20 },
    },
    {
      name: "Finish",
      after: ["Top Floor"],
      completed: () => step("questL10Garbage") === 999,
      do: () => visitUrl("council.php"),
      limit: { soft: 10 },
      freeaction: true,
    },
  ],
};
