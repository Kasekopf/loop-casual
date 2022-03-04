import {
  adv1,
  cliExecute,
  initiativeModifier,
  Item,
  myLevel,
  runChoice,
  toUrl,
  useSkill,
  visitUrl,
} from "kolmafia";
import {
  $effect,
  $familiar,
  $item,
  $items,
  $location,
  $monster,
  $monsters,
  $skill,
  ensureEffect,
  get,
  have,
  Macro,
} from "libram";
import { OutfitSpec, Quest, step, Task } from "./structure";
import { CombatStrategy } from "../combat";

function tuneCape(): void {
  if (
    have($item`unwrapped knock-off retro superhero cape`) &&
    (get("retroCapeSuperhero") !== "vampire" || get("retroCapeWashingInstructions") !== "kill")
  ) {
    cliExecute("retrocape vampire kill");
  }
}

function tryCape(sword: Item, ...rest: Item[]) {
  if (have($item`unwrapped knock-off retro superhero cape`)) {
    rest.unshift($item`unwrapped knock-off retro superhero cape`);
    rest.unshift(sword);
  }
  return rest;
}

const slay_macro = new Macro()
  .trySkill($skill`Slay the Dead`)
  .attack()
  .repeat();

const Alcove: Task[] = [
  {
    name: "Alcove",
    after: ["Start"],
    prepare: (): void => {
      tuneCape();
      // Potions to be used if cheap
      if (have($item`ear candle`) && initiativeModifier() < 850)
        ensureEffect($effect`Clear Ears, Can't Lose`);
      if (have($item`panty raider camouflage`) && initiativeModifier() < 850)
        ensureEffect($effect`Hiding in Plain Sight`);
      if (have($item`Freddie's blessing of Mercury`) && initiativeModifier() < 850)
        ensureEffect($effect`You're High as a Crow, Marty`);
    },
    acquire: [
      { item: $item`gravy boat` },
      // Init boosters
      { item: $item`ear candle`, price: 2000, optional: true },
      { item: $item`panty raider camouflage`, price: 2000, optional: true },
      { item: $item`Freddie's blessing of Mercury`, price: 2000, optional: true },
    ],
    completed: () => get("cyrptAlcoveEvilness") <= 25,
    do: $location`The Defiled Alcove`,
    outfit: (): OutfitSpec => {
      return {
        equip: tryCape($item`costume sword`, $item`gravy boat`),
        modifier: "init 850max, sword",
      };
    },
    choices: { 153: 4 },
    combat: new CombatStrategy().macro(slay_macro, ...$monsters`modern zmobie, conjoined zmombie`),
    limit: { turns: 25 },
  },
  {
    name: "Alcove Boss",
    after: ["Alcove"],
    completed: () => get("cyrptAlcoveEvilness") === 0,
    do: $location`The Defiled Alcove`,
    combat: new CombatStrategy(true).kill(),
    limit: { tries: 1 },
  },
];

const Cranny: Task[] = [
  {
    name: "Cranny",
    after: ["Start"],
    prepare: tuneCape,
    acquire: [{ item: $item`gravy boat` }],
    completed: () => get("cyrptCrannyEvilness") <= 25,
    do: $location`The Defiled Cranny`,
    outfit: (): OutfitSpec => {
      return {
        equip: tryCape($item`serpentine sword`, $item`gravy boat`),
        modifier: "-combat, ML, sword",
      };
    },
    choices: { 523: 4 },
    combat: new CombatStrategy()
      .macro(
        new Macro()
          .trySkill($skill`Slay the Dead`)
          .skill($skill`Saucegeyser`)
          .repeat(),
        ...$monsters`swarm of ghuol whelps, big swarm of ghuol whelps, giant swarm of ghuol whelps, huge ghuol`
      )
      .macro(slay_macro),
    limit: { turns: 25 },
  },
  {
    name: "Cranny Boss",
    after: ["Cranny"],
    completed: () => get("cyrptCrannyEvilness") === 0,
    do: $location`The Defiled Cranny`,
    combat: new CombatStrategy(true).killHard(),
    limit: { tries: 1 },
  },
];

const Niche: Task[] = [
  {
    name: "Niche",
    after: ["Start"],
    prepare: tuneCape,
    acquire: [{ item: $item`gravy boat` }],
    completed: () => get("cyrptNicheEvilness") <= 25,
    do: $location`The Defiled Niche`,
    choices: { 157: 4 },
    outfit: (): OutfitSpec => {
      if (
        have($item`industrial fire extinguisher`) &&
        get("_fireExtinguisherCharge") >= 20 &&
        !get("fireExtinguisherCyrptUsed")
      )
        return { equip: $items`industrial fire extinguisher, gravy boat` };
      else
        return {
          equip: tryCape($item`serpentine sword`, $item`gravy boat`),
        };
    },
    combat: new CombatStrategy()
      .macro(new Macro().trySkill($skill`Fire Extinguisher: Zone Specific`).step(slay_macro))
      .banish(...$monsters`basic lihc, senile lihc, slick lihc`),
    limit: { turns: 25 },
  },
  {
    name: "Niche Boss",
    after: ["Niche"],
    completed: () => get("cyrptNicheEvilness") === 0,
    do: $location`The Defiled Niche`,
    combat: new CombatStrategy(true).kill(),
    limit: { tries: 1 },
  },
];

const Nook: Task[] = [
  {
    name: "Nook",
    after: ["Start"],
    priority: () => get("lastCopyableMonster") === $monster`spiny skelelton`,
    prepare: tuneCape,
    acquire: [{ item: $item`gravy boat` }],
    ready: () => get("camelSpit") >= 100,
    completed: () => get("cyrptNookEvilness") <= 25,
    do: (): void => {
      useSkill($skill`Map the Monsters`);
      if (get("mappingMonsters")) {
        visitUrl(toUrl($location`The Defiled Nook`));
        if (get("lastCopyableMonster") === $monster`spiny skelelton`) {
          runChoice(1, "heyscriptswhatsupwinkwink=186"); // toothy skeleton
        } else {
          runChoice(1, "heyscriptswhatsupwinkwink=185"); // spiny skelelton
        }
      } else {
        adv1($location`The Defiled Nook`, 0, "");
      }
    },
    post: (): void => {
      while (have($item`evil eye`) && get("cyrptNookEvilness") > 25) cliExecute("use * evil eye");
    },
    outfit: (): OutfitSpec => {
      return {
        equip: tryCape($item`costume sword`, $item`gravy boat`),
        modifier: "item 500max",
        familiar: $familiar`Melodramedary`,
        skipDefaults: true,
      };
    },
    choices: { 155: 5, 1429: 1 },
    combat: new CombatStrategy()
      .macro((): Macro => {
        if (get("lastCopyableMonster") === $monster`party skelteon`)
          return new Macro()
            .trySkill($skill`Feel Nostalgic`)
            .trySkill($skill`%fn, spit on them!`)
            .trySkill($skill`Feel Envy`)
            .step(slay_macro);
        else return new Macro().trySkill($skill`Feel Envy`).step(slay_macro);
      }, $monster`spiny skelelton`)
      .macro((): Macro => {
        if (get("lastCopyableMonster") === $monster`spiny skelelton`)
          return new Macro()
            .trySkill($skill`Feel Nostalgic`)
            .trySkill($skill`%fn, spit on them!`)
            .trySkill($skill`Feel Envy`)
            .step(slay_macro);
        else return new Macro().trySkill($skill`Feel Envy`).step(slay_macro);
      }, $monster`toothy sklelton`)
      .banish($monster`party skelteon`),
    limit: { tries: 3 },
  },
  {
    name: "Nook Eye", // In case we get eyes from outside sources (Nostalgia)
    after: ["Start"],
    ready: () => have($item`evil eye`),
    completed: () => get("cyrptNookEvilness") <= 25,
    do: (): void => {
      cliExecute("use * evil eye");
    },
    freeaction: true,
    limit: { tries: 9 },
  },
  {
    name: "Nook Simple",
    after: ["Start"],
    prepare: tuneCape,
    acquire: [{ item: $item`gravy boat` }],
    ready: () => get("cyrptNookEvilness") < 30 && !have($item`evil eye`),
    completed: () => get("cyrptNookEvilness") <= 25,
    do: $location`The Defiled Nook`,
    post: (): void => {
      while (have($item`evil eye`) && get("cyrptNookEvilness") > 25) cliExecute("use * evil eye");
    },
    outfit: (): OutfitSpec => {
      return {
        equip: tryCape($item`costume sword`, $item`gravy boat`),
        modifier: "item 500max",
      };
    },
    choices: { 155: 5, 1429: 1 },
    combat: new CombatStrategy()
      .macro(slay_macro, ...$monsters`spiny skelelton, toothy sklelton`)
      .banish($monster`party skelteon`),
    limit: { tries: 9 },
  },
  {
    name: "Nook Boss",
    after: ["Nook", "Nook Eye", "Nook Simple"],
    completed: () => get("cyrptNookEvilness") === 0,
    do: $location`The Defiled Nook`,
    combat: new CombatStrategy(true).kill(),
    limit: { tries: 1 },
  },
];

export const CryptQuest: Quest = {
  name: "Crypt",
  tasks: [
    {
      name: "Start",
      after: [],
      ready: () => myLevel() >= 7,
      completed: () => step("questL07Cyrptic") !== -1,
      do: () => visitUrl("council.php"),
      limit: { tries: 1 },
      freeaction: true,
    },
    ...Alcove,
    ...Cranny,
    ...Niche,
    ...Nook,
    {
      name: "Bonerdagon",
      after: ["Alcove Boss", "Cranny Boss", "Niche Boss", "Nook Boss"],
      completed: () => step("questL07Cyrptic") >= 1,
      do: $location`Haert of the Cyrpt`,
      choices: { 527: 1 },
      combat: new CombatStrategy(true).kill(),
      limit: { tries: 1 },
    },
    {
      name: "Finish",
      after: ["Bonerdagon"],
      completed: () => step("questL07Cyrptic") === 999,
      do: () => visitUrl("council.php"),
      limit: { tries: 1 },
      freeaction: true,
    },
  ],
};
