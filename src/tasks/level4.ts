import { itemAmount, use, visitUrl } from "kolmafia";
import { $item, $items, $location, $monster, $monsters, $skill, get, have, Macro } from "libram";
import { OutfitSpec, Quest, step } from "./structure";
import { OverridePriority } from "../priority";
import { CombatStrategy } from "../combat";
import { atLevel } from "../lib";

export const BatQuest: Quest = {
  name: "Bat",
  tasks: [
    {
      name: "Start",
      after: [],
      ready: () => atLevel(4),
      completed: () => step("questL04Bat") !== -1,
      do: () => visitUrl("council.php"),
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Get Sonar 1",
      after: [],
      completed: () => step("questL04Bat") + itemAmount($item`sonar-in-a-biscuit`) >= 1,
      do: $location`Guano Junction`,
      post: () => {
        if (have($item`sonar-in-a-biscuit`)) use($item`sonar-in-a-biscuit`);
      },
      outfit: (): OutfitSpec => {
        if (
          have($item`industrial fire extinguisher`) &&
          get("_fireExtinguisherCharge") >= 20 &&
          !get("fireExtinguisherBatHoleUsed")
        )
          return {
            equip: $items`industrial fire extinguisher`,
            modifier: "stench res",
          };
        else return { modifier: "item, 10 stench res" };
      },
      combat: new CombatStrategy()
        .macro(new Macro().trySkill($skill`Fire Extinguisher: Zone Specific`))
        .kill($monster`screambat`)
        .killItem(),
      limit: { tries: 10 },
    },
    {
      name: "Use Sonar 1",
      after: ["Get Sonar 1"],
      completed: () => step("questL04Bat") >= 1,
      do: () => use($item`sonar-in-a-biscuit`),
      limit: { tries: 3 },
      freeaction: true,
    },
    {
      name: "Get Sonar 2",
      after: ["Use Sonar 1", "Palindome/Bat Snake"],
      completed: () => step("questL04Bat") + itemAmount($item`sonar-in-a-biscuit`) >= 2,
      do: $location`Guano Junction`,
      post: () => {
        if (have($item`sonar-in-a-biscuit`)) use($item`sonar-in-a-biscuit`);
      },
      outfit: { modifier: "item, 10 stench res" },
      combat: new CombatStrategy().kill($monster`screambat`).killItem(),
      limit: { tries: 10 },
    },
    {
      name: "Use Sonar 2",
      after: ["Get Sonar 2"],
      completed: () => step("questL04Bat") >= 2,
      do: () => use($item`sonar-in-a-biscuit`),
      limit: { tries: 3 },
      freeaction: true,
    },
    {
      name: "Get Sonar 3",
      after: ["Use Sonar 2"],
      completed: () => step("questL04Bat") + itemAmount($item`sonar-in-a-biscuit`) >= 3,
      do: $location`Guano Junction`,
      post: () => {
        if (have($item`sonar-in-a-biscuit`)) use($item`sonar-in-a-biscuit`);
      },
      outfit: { modifier: "item, 10 stench res" },
      combat: new CombatStrategy().kill($monster`screambat`).killItem(),
      limit: { tries: 10 },
    },
    {
      name: "Use Sonar 3",
      after: ["Get Sonar 3"],
      completed: () => step("questL04Bat") >= 3,
      do: () => use($item`sonar-in-a-biscuit`),
      limit: { tries: 3 },
      freeaction: true,
    },
    {
      name: "Lobsterfrogman Drop",
      after: ["Use Sonar 3"],
      priority: () =>
        get("lastCopyableMonster") === $monster`lobsterfrogman`
          ? OverridePriority.LastCopyableMonster
          : OverridePriority.None,
      completed: () =>
        step("questL04Bat") >= 4 ||
        itemAmount($item`barrel of gunpowder`) >= 5 ||
        get("sidequestLighthouseCompleted") !== "none" ||
        !have($item`cursed magnifying glass`) ||
        !have($item`Powerful Glove`) ||
        !have($item`backup camera`),
      do: $location`The Boss Bat's Lair`,
      combat: new CombatStrategy()
        .macro(new Macro().trySkill($skill`Back-Up to your Last Enemy`))
        .kill(...$monsters`Boss Bat, lobsterfrogman`),
      outfit: { equip: $items`backup camera` },
      limit: { tries: 4 },
    },
    {
      name: "Boss Bat",
      after: ["Bat/Use Sonar 3", "Lobsterfrogman Drop"],
      completed: () => step("questL04Bat") >= 4,
      do: $location`The Boss Bat's Lair`,
      combat: new CombatStrategy().kill($monster`Boss Bat`).ignoreNoBanish(),
      limit: { soft: 10 },
      delay: 6,
    },
    {
      name: "Finish",
      after: ["Boss Bat"],
      completed: () => step("questL04Bat") === 999,
      do: () => visitUrl("council.php"),
      limit: { tries: 1 },
      freeaction: true,
    },
  ],
};
