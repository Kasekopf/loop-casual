import { containsText, myLevel, use, visitUrl } from "kolmafia";
import { $item, $items, $location, have } from "libram";
import { Quest, step } from "./structure";

export const GiantQuest: Quest = {
  name: "Giant Quest",
  tasks: [
    {
      name: "Start",
      ready: () => myLevel() >= 10,
      completed: () => step("questL10Garbage") !== -1,
      do: () => visitUrl("council.php"),
    },
    {
      name: "Grow Beanstalk",
      after: "Start",
      ready: () => have($item`enchanted bean`),
      completed: () => step("questL10Garbage") === 1,
      do: () => use($item`enchanted bean`),
    },
    {
      name: "Airship",
      after: "Grow Beanstalk",
      completed: () => step("questL10Garbage") >= 7,
      do: $location`The Penultimate Fantasy Airship`,
      modifier: "-combat",
    },
    {
      name: "Basement Search",
      after: "Airship",
      completed: () =>
        containsText(
          $location`The Castle in the Clouds in the Sky (Basement)`.noncombatQueue,
          "Mess Around with Gym"
        ),
      do: $location`The Castle in the Clouds in the Sky (Basement)`,
      modifier: "-combat",
      choices: { 670: 4, 669: 1, 671: 4 },
    },
    {
      name: "Basement Finish",
      after: "Basement Search",
      completed: () => step("questL10Garbage") >= 8,
      do: $location`The Castle in the Clouds in the Sky (Basement)`,
      equip: $items`amulet of extreme plot significance`,
      choices: { 670: 1 },
    },
    {
      name: "Ground",
      after: "Basement Finish",
      completed: () => step("questL10Garbage") >= 9,
      do: $location`The Castle in the Clouds in the Sky (Ground Floor)`,
      choices: { 672: 3, 673: 3, 674: 3, 1026: 3 },
    },
    {
      name: "Top Floor",
      after: "Ground",
      completed: () => step("questL10Garbage") >= 10,
      do: $location`The Castle in the Clouds in the Sky (Top Floor)`,
      equip: $items`Mohawk wig`,
      choices: { 675: 4, 676: 4, 677: 4, 678: 1, 679: 1 },
    },
    {
      name: "Finish",
      after: "Top Floor",
      completed: () => step("questL10Garbage") === 999,
      do: () => visitUrl("council.php"),
    },
  ],
};
