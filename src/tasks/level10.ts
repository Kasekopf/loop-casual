import { cliExecute, containsText, myMeat, use, visitUrl } from "kolmafia";
import { $effect, $item, $items, $location, $monster, have, Macro } from "libram";
import { CombatStrategy } from "../combat";
import { atLevel } from "../lib";
import { Quest, step } from "./structure";
import { OverridePriority } from "../priority";

export const GiantQuest: Quest = {
  name: "Giant",
  tasks: [
    {
      name: "Start",
      after: [],
      ready: () => atLevel(10),
      completed: () => step("questL10Garbage") !== -1,
      do: () => visitUrl("council.php"),
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Get Bean",
      after: ["Bat/Use Sonar 2"],
      completed: () => have($item`enchanted bean`) || step("questL10Garbage") >= 1,
      do: $location`The Beanbat Chamber`,
      outfit: { modifier: "item" },
      combat: new CombatStrategy().killItem($monster`beanbat`),
      limit: { soft: 5 },
    },
    {
      name: "Grow Beanstalk",
      after: ["Start", "Get Bean"],
      completed: () => step("questL10Garbage") >= 1,
      do: () => use($item`enchanted bean`),
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Airship YR Healer",
      after: ["Grow Beanstalk"],
      completed: () => have($item`amulet of extreme plot significance`),
      ready: () =>
        !have($effect`Everything Looks Yellow`) && (myMeat() >= 250 || have($item`yellow rocket`)),
      priority: () =>
        have($effect`Everything Looks Yellow`) ? OverridePriority.None : OverridePriority.YR,
      acquire: [{ item: $item`yellow rocket` }],
      do: $location`The Penultimate Fantasy Airship`,
      choices: { 178: 2, 182: () => (have($item`model airship`) ? 1 : 4) },
      post: () => {
        if (have($effect`Temporary Amnesia`)) cliExecute("uneffect Temporary Amnesia");
      },
      outfit: { modifier: "-combat" },
      limit: { soft: 50 },
      delay: () =>
        have($item`Plastic Wrap Immateria`) ? 25 : have($item`Gauze Immateria`) ? 20 : 15, // After that, just look for noncombats
      combat: new CombatStrategy().macro(
        new Macro().item($item`yellow rocket`),
        $monster`Quiet Healer`
      ),
    },
    {
      name: "Airship",
      after: ["Airship YR Healer"],
      completed: () => have($item`S.O.C.K.`),
      do: $location`The Penultimate Fantasy Airship`,
      choices: { 178: 2, 182: () => (have($item`model airship`) ? 1 : 4) },
      post: () => {
        if (have($effect`Temporary Amnesia`)) cliExecute("uneffect Temporary Amnesia");
      },
      outfit: { modifier: "-combat" },
      limit: { soft: 50 },
      delay: () =>
        have($item`Plastic Wrap Immateria`) ? 25 : have($item`Gauze Immateria`) ? 20 : 15, // After that, just look for noncombats
      combat: new CombatStrategy().killItem($monster`Quiet Healer`, $monster`Burly Sidekick`),
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
      choices: { 672: 3, 673: 3, 674: 3, 1026: 2 },
      outfit: () => {
        if (have($item`electric boning knife`)) return {};
        else return { modifier: "-combat" };
      },
      limit: { turns: 12 },
      delay: 10,
    },
    {
      name: "Ground Knife",
      after: ["Ground", "Tower/Wall of Meat"],
      completed: () => have($item`electric boning knife`) || step("questL13Final") > 8,
      do: $location`The Castle in the Clouds in the Sky (Ground Floor)`,
      choices: { 672: 3, 673: 3, 674: 3, 1026: 2 },
      outfit: { modifier: "-combat" },
      limit: { soft: 20 },
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
      choices: { 675: 4, 676: 4, 677: 1, 678: 1, 679: 1, 1431: 4 },
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
    {
      name: "Unlock HITS",
      after: ["Top Floor"],
      completed: () => have($item`steam-powered model rocketship`),
      do: $location`The Castle in the Clouds in the Sky (Top Floor)`,
      outfit: { modifier: "-combat" },
      combat: new CombatStrategy().kill($monster`Burning Snake of Fire`),
      choices: { 675: 4, 676: 4, 677: 2, 678: 3, 679: 1, 1431: 4 },
      limit: { soft: 20 },
    },
  ],
};
