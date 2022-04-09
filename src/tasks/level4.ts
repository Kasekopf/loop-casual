import { itemAmount, use, visitUrl } from "kolmafia";
import { $item, $items, $location, $monster, $skill, get, have, Macro } from "libram";
import { OutfitSpec, Quest, step } from "./structure";
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
          };
        else
          return {
            modifier: "item",
          };
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
      after: ["Use Sonar 1"],
      completed: () => step("questL04Bat") + itemAmount($item`sonar-in-a-biscuit`) >= 2,
      do: $location`Guano Junction`,
      post: () => {
        if (have($item`sonar-in-a-biscuit`)) use($item`sonar-in-a-biscuit`);
      },
      outfit: { modifier: "item" },
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
      outfit: { modifier: "item" },
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
      name: "Boss Bat",
      after: ["Use Sonar 3"],
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
