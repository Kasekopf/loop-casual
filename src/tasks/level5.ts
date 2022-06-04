import { use, visitUrl } from "kolmafia";
import {
  $effect,
  $effects,
  $item,
  $items,
  $location,
  $monster,
  $skill,
  get,
  have,
  Macro,
} from "libram";
import { OutfitSpec, Quest, step } from "./structure";
import { OverridePriority } from "../priority";
import { CombatStrategy } from "../combat";
import { atLevel } from "../lib";
import { councilSafe } from "./level12";
import { GameState } from "../state";

export const KnobQuest: Quest = {
  name: "Knob",
  tasks: [
    {
      name: "Start",
      after: [],
      ready: () => atLevel(5),
      completed: () => step("questL05Goblin") >= 0,
      do: () => visitUrl("council.php"),
      limit: { tries: 1 },
      priority: () => (councilSafe() ? OverridePriority.Free : OverridePriority.BadMood),
      freeaction: true,
    },
    {
      name: "Outskirts",
      after: [],
      completed: () => have($item`Knob Goblin encryption key`) || step("questL05Goblin") > 0,
      do: $location`The Outskirts of Cobb's Knob`,
      choices: { 111: 3, 113: 2, 118: 1 },
      limit: { tries: 12 },
      delay: 10,
    },
    {
      name: "Open Knob",
      after: ["Start", "Outskirts"],
      completed: () => step("questL05Goblin") >= 1,
      do: () => use($item`Cobb's Knob map`),
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Harem",
      after: ["Open Knob"],
      completed: () => have($item`Knob Goblin harem veil`) && have($item`Knob Goblin harem pants`),
      do: $location`Cobb's Knob Harem`,
      outfit: (): OutfitSpec => {
        if (
          have($item`industrial fire extinguisher`) &&
          get("_fireExtinguisherCharge") >= 20 &&
          !get("fireExtinguisherHaremUsed")
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
        .macro(
          // Always use the fire extinguisher on the guard
          new Macro().trySkill($skill`Fire Extinguisher: Zone Specific`),
          $monster`Knob Goblin Harem Guard`
        )
        .macro(
          // Don't use the fire extinguisher if we want to absorb the madam
          (state: GameState) =>
            new Macro().externalIf(
              !state.absorb.isTarget($monster`Knob Goblin Madam`),
              new Macro().trySkill($skill`Fire Extinguisher: Zone Specific`)
            ),
          $monster`Knob Goblin Madam`
        )
        .macro(
          // Don't use the fire extinguisher if we want to absorb the girl
          (state: GameState) =>
            new Macro().externalIf(
              !state.absorb.isTarget($monster`Knob Goblin Harem Girl`),
              new Macro().trySkill($skill`Fire Extinguisher: Zone Specific`)
            ),
          $monster`Knob Goblin Harem Girl`
        )
        .banish($monster`Knob Goblin Harem Guard`)
        .killItem(),
      limit: { soft: 10 }, // Allow for Cobb's Knob lab key
    },
    {
      name: "Perfume",
      after: ["Harem"],
      completed: () =>
        have($effect`Knob Goblin Perfume`) ||
        have($item`Knob Goblin perfume`) ||
        step("questL05Goblin") === 999,
      do: $location`Cobb's Knob Harem`,
      outfit: { equip: $items`Knob Goblin harem veil, Knob Goblin harem pants` },
      limit: { tries: 2 }, // Allow for Cobb's Knob lab key
    },
    {
      name: "King",
      after: ["Harem", "Perfume"],
      priority: () =>
        have($effect`Knob Goblin Perfume`) ? OverridePriority.Effect : OverridePriority.None,
      completed: () => step("questL05Goblin") === 999,
      do: $location`Throne Room`,
      combat: new CombatStrategy(true).kill($monster`Knob Goblin King`),
      outfit: { equip: $items`Knob Goblin harem veil, Knob Goblin harem pants` },
      effects: $effects`Knob Goblin Perfume`,
      limit: { tries: 1 },
    },
    {
      name: "Open Menagerie",
      after: ["King"],
      completed: () => have($item`Cobb's Knob Menagerie key`),
      do: $location`Cobb's Knob Laboratory`,
      combat: new CombatStrategy().kill($monster`Knob Goblin Very Mad Scientist`),
      limit: { soft: 15 },
    },
  ],
};
