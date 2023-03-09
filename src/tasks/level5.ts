import { use, visitUrl } from "kolmafia";
import {
  $effect,
  $effects,
  $item,
  $items,
  $location,
  $monster,
  $skill,
  ensureEffect,
  get,
  have,
  Macro,
} from "libram";
import { Quest } from "../engine/task";
import { OutfitSpec, step } from "grimoire-kolmafia";
import { Priorities } from "../engine/priority";
import { CombatStrategy } from "../engine/combat";
import { atLevel } from "../lib";
import { councilSafe } from "./level12";
import { globalStateCache } from "../engine/state";
import { summonStrategy } from "./summons";

export const KnobQuest: Quest = {
  name: "Knob",
  tasks: [
    {
      name: "Start",
      after: [],
      ready: () => atLevel(5),
      completed: () => step("questL05Goblin") >= 0,
      prepare: () => {
        if (have($item`natural magick candle`)) ensureEffect($effect`The Odour of Magick`);
      },
      do: () => visitUrl("council.php"),
      limit: { tries: 1 },
      priority: () => (councilSafe() ? Priorities.Free : Priorities.BadMood),
      freeaction: true,
    },
    {
      name: "Outskirts",
      after: [],
      priority: prioritizeJellyfish,
      completed: () => have($item`Knob Goblin encryption key`) || step("questL05Goblin") > 0,
      do: $location`The Outskirts of Cobb's Knob`,
      choices: { 111: 3, 113: 2, 118: 1 },
      limit: { tries: 12 },
      delay: 10,
    },
    {
      name: "Open Knob",
      after: ["Start", "Outskirts"],
      priority: () => Priorities.Free,
      completed: () => step("questL05Goblin") >= 1,
      do: () => use($item`Cobb's Knob map`),
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Harem",
      after: ["Open Knob"],
      priority: prioritizeJellyfish,
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
            avoid: $items`broken champagne bottle`,
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
          () =>
            new Macro().externalIf(
              !globalStateCache.absorb().isTarget($monster`Knob Goblin Madam`),
              new Macro().trySkill($skill`Fire Extinguisher: Zone Specific`)
            ),
          $monster`Knob Goblin Madam`
        )
        .macro(
          // Don't use the fire extinguisher if we want to absorb the girl
          () =>
            new Macro().externalIf(
              !globalStateCache.absorb().isTarget($monster`Knob Goblin Harem Girl`),
              new Macro().trySkill($skill`Fire Extinguisher: Zone Specific`)
            ),
          $monster`Knob Goblin Harem Girl`
        )
        .banish($monster`Knob Goblin Harem Guard`)
        .killItem(),
      limit: { soft: 20 }, // Allow for Cobb's Knob lab key
    },
    {
      name: "Perfume",
      after: ["Harem"],
      priority: prioritizeJellyfish,
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
        have($effect`Knob Goblin Perfume`) ? Priorities.Effect : prioritizeJellyfish(),
      completed: () => step("questL05Goblin") === 999,
      do: $location`Throne Room`,
      combat: new CombatStrategy().killHard($monster`Knob Goblin King`),
      outfit: {
        equip: $items`Knob Goblin harem veil, Knob Goblin harem pants`,
        modifier: "moxie, -10ML",
      },
      effects: $effects`Knob Goblin Perfume`,
      limit: { tries: 1 },
      boss: true,
    },
    {
      name: "Open Menagerie",
      after: ["King"],
      priority: prioritizeJellyfish,
      completed: () => have($item`Cobb's Knob Menagerie key`),
      ready: () => !have($skill`Phase Shift`),
      do: $location`Cobb's Knob Laboratory`,
      combat: new CombatStrategy().kill($monster`Knob Goblin Very Mad Scientist`),
      limit: { soft: 15 },
    },
  ],
};

export function prioritizeJellyfish() {
  // Get the Spectral Jellyfish manually if we cannot summon it
  if (!summonStrategy.getSourceFor($monster`Spectral Jellyfish`) && !have($skill`Phase Shift`)) {
    return Priorities.SeekJellyfish;
  } else {
    return Priorities.None;
  }
}
