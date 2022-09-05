import { itemAmount, myDaycount, numericModifier, use, visitUrl } from "kolmafia";
import { $effect, $item, $items, $location, $monster, $monsters, $skill, ensureEffect, get, have, Macro } from "libram";
import { Quest } from "../engine/task";
import { OutfitSpec, step } from "grimoire-kolmafia";
import { OverridePriority } from "../engine/priority";
import { CombatStrategy } from "../engine/combat";
import { atLevel } from "../lib";
import { councilSafe } from "./level12";
import { stenchRes } from "./absorb";

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
      priority: () => (councilSafe() ? OverridePriority.Free : OverridePriority.BadMood),
      freeaction: true,
    },
    {
      name: "Get Sonar 1",
      after: [],
      completed: () => step("questL04Bat") + itemAmount($item`sonar-in-a-biscuit`) >= 1,
      do: $location`Guano Junction`,
      ready: () => stenchRes(true) >= 1,
      priority: () => have($item`industrial fire extinguisher`) || have($skill`Double Nanovision`) ? OverridePriority.None : OverridePriority.BadMood,
      prepare: () => {
        if (numericModifier("stench resistance") < 1) ensureEffect($effect`Red Door Syndrome`);
        if (numericModifier("stench resistance") < 1) throw `Unable to ensure stench res for guano junction`;
      },
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
      after: ["Use Sonar 1"],
      completed: () => step("questL04Bat") + itemAmount($item`sonar-in-a-biscuit`) >= 2,
      priority: () => step("questL11Shen") === 999 ||
        have($item`The Stankara Stone`) ||
        (myDaycount() === 1 && step("questL11Shen") > 1) ? OverridePriority.None : OverridePriority.BadMood,
      prepare: () => {
        if (numericModifier("stench resistance") < 1) ensureEffect($effect`Red Door Syndrome`);
        if (numericModifier("stench resistance") < 1) throw `Unable to ensure stench res for guano junction`;
      },
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
      prepare: () => {
        if (numericModifier("stench resistance") < 1) ensureEffect($effect`Red Door Syndrome`);
        if (numericModifier("stench resistance") < 1) throw `Unable to ensure stench res for guano junction`;
      },
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
      ready: () => get("lastCopyableMonster") === $monster`lobsterfrogman`,
      priority: () =>
        get("lastCopyableMonster") === $monster`lobsterfrogman`
          ? OverridePriority.LastCopyableMonster
          : OverridePriority.None,
      completed: () =>
        step("questL04Bat") >= 4 ||
        itemAmount($item`barrel of gunpowder`) >= 5 ||
        get("sidequestLighthouseCompleted") !== "none" ||
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
      priority: () => (councilSafe() ? OverridePriority.Free : OverridePriority.BadMood),
      completed: () => step("questL04Bat") === 999,
      do: () => visitUrl("council.php"),
      limit: { tries: 1 },
      freeaction: true,
    },
  ],
};
