import {
  cliExecute,
  myLevel,
  myPrimestat,
  runChoice,
  runCombat,
  totalFreeRests,
  visitUrl,
} from "kolmafia";
import {
  $effect,
  $familiar,
  $item,
  $items,
  $location,
  $monster,
  $skill,
  $stat,
  ChateauMantegna,
  get,
  getKramcoWandererChance,
  have,
  Macro,
  set,
  Witchess,
} from "libram";
import { Quest } from "./structure";
import { CombatStrategy } from "../combat";

function primestatId(): number {
  switch (myPrimestat()) {
    case $stat`Muscle`:
      return 1;
    case $stat`Mysticality`:
      return 2;
    case $stat`Moxie`:
      return 3;
  }
  return 1;
}

export const LevelingQuest: Quest = {
  name: "Leveling",
  tasks: [
    {
      name: "Cloud Talk",
      after: [],
      completed: () => have($effect`That's Just Cloud-Talk, Man`) || myLevel() >= 10,
      do: () => visitUrl("place.php?whichplace=campaway&action=campaway_sky"),
    },
    {
      name: "Daycare",
      after: [],
      ready: () => get("daycareOpen"),
      completed: () => get("_daycareGymScavenges") !== 0 || myLevel() >= 13,
      do: (): void => {
        if ((get("daycareOpen") || get("_daycareToday")) && !get("_daycareSpa")) {
          switch (myPrimestat()) {
            case $stat`Muscle`:
              cliExecute("daycare muscle");
              break;
            case $stat`Mysticality`:
              cliExecute("daycare myst");
              break;
            case $stat`Moxie`:
              cliExecute("daycare moxie");
              break;
          }
        }
        visitUrl("place.php?whichplace=town_wrong&action=townwrong_boxingdaycare");
        runChoice(3);
        runChoice(2);
      },
      cap: 1,
    },
    {
      name: "Bastille",
      after: [],
      ready: () => have($item`Bastille Battalion control rig`),
      completed: () => get("_bastilleGames") !== 0 || myLevel() >= 13,
      do: () =>
        cliExecute(`bastille ${myPrimestat() === $stat`Mysticality` ? "myst" : myPrimestat()}`),
      cap: 1,
    },
    {
      name: "Chateau",
      after: [],
      ready: () => ChateauMantegna.have(),
      completed: () => get("timesRested") >= totalFreeRests() || myLevel() >= 13,
      prepare: (): void => {
        let nightstand = null;
        if (myPrimestat() === $stat`Muscle`) {
          nightstand = $item`electric muscle stimulator`;
        } else if (myPrimestat() === $stat`Mysticality`) {
          nightstand = $item`foreign language tapes`;
        } else if (myPrimestat() === $stat`Moxie`) {
          nightstand = $item`bowl of potpourri`;
        }
        if (nightstand !== null && nightstand !== ChateauMantegna.getNightstand()) {
          ChateauMantegna.changeNightstand(nightstand);
        }
      },
      do: () => visitUrl("place.php?whichplace=chateau&action=chateau_restbox"),
    },
    {
      name: "LOV Tunnel",
      after: ["Tote"],
      ready: () => get("loveTunnelAvailable"),
      completed: () => get("_loveTunnelUsed") || myLevel() >= 13,
      do: $location`The Tunnel of L.O.V.E.`,
      choices: { 1222: 1, 1223: 1, 1224: primestatId(), 1225: 1, 1226: 2, 1227: 1, 1228: 3 },
      combat: new CombatStrategy().killHard(),
      modifier: "mainstat, 4exp",
      equip: $items`makeshift garbage shirt`,
      cap: 1,
    },
    {
      name: "Snojo",
      after: [],
      ready: () => get("snojoAvailable"),
      prepare: (): void => {
        if (get("snojoSetting") === "NONE") {
          visitUrl("place.php?whichplace=snojo&action=snojo_controller");
          runChoice(primestatId());
        }
      },
      completed: () => get("_snojoFreeFights") >= 10,
      do: $location`The X-32-F Combat Training Snowman`,
      post: (): void => {
        if (get("_snojoFreeFights") === 10) cliExecute("hottub"); // Clean -stat effects
      },
      combat: new CombatStrategy().killHard(),
      modifier: "mainstat, 4exp",
      cap: 10,
    },
    {
      name: "Tote",
      after: [],
      completed: () => get("_garbageItemChanged"),
      do: () => cliExecute("fold makeshift garbage shirt"),
      cap: 1,
      freeaction: true,
    },
    {
      name: "God Lobster",
      after: ["Tote"],
      acquire: $items`makeshift garbage shirt`,
      ready: () => have($familiar`God Lobster`),
      completed: () => get("_godLobsterFights") >= 3 || myLevel() >= 13,
      do: (): void => {
        visitUrl("main.php?fightgodlobster=1");
        runCombat();
        runChoice(3);
      },
      combat: new CombatStrategy().killHard(),
      modifier: "mainstat, 4exp",
      equip: $items`makeshift garbage shirt`,
      familiar: $familiar`God Lobster`,
      cap: 3,
    },
    {
      name: "Witchess",
      after: ["Tote"],
      ready: () => Witchess.have(),
      completed: () => Witchess.fightsDone() >= 5,
      do: () => Witchess.fightPiece($monster`Witchess Knight`),
      combat: new CombatStrategy().killHard(),
      modifier: "mainstat, 4exp",
      equip: $items`makeshift garbage shirt`,
      cap: 5,
    },
    {
      name: "Sausage Fights",
      after: ["Tote"],
      acquire: $items`makeshift garbage shirt`,
      ready: () =>
        have($familiar`Pocket Professor`) &&
        have($item`Kramco Sausage-o-Matic™`) &&
        getKramcoWandererChance() === 1,
      completed: () => get("_sausageFights") > 0 || myLevel() >= 13,
      do: $location`The Outskirts of Cobb's Knob`,
      combat: new CombatStrategy()
        .macro(
          new Macro()
            .trySkill($skill`lecture on relativity`)
            .trySkill($skill`Saucegeyser`)
            .repeat(),
          $monster`sausage goblin`
        )
        .abort(), // error on everything except sausage goblin
      modifier: "mainstat, 4exp",
      equip: $items`Kramco Sausage-o-Matic™, makeshift garbage shirt, Pocket Professor memory chip`,
      familiar: $familiar`Pocket Professor`,
      cap: 1,
    },
    {
      name: "Neverending Party",
      after: ["Tote"],
      acquire: $items`makeshift garbage shirt`,
      completed: () => get("_neverendingPartyFreeTurns") >= 10 || myLevel() >= 13,
      do: $location`The Neverending Party`,
      choices: { 1322: 2, 1324: 5 },
      combat: (): CombatStrategy => {
        if (
          get("_neverendingPartyFreeTurns") >= 7 &&
          get("_feelPrideUsed") < 3 &&
          have($skill`Feel Pride`)
        )
          return new CombatStrategy().macro(new Macro().skill($skill`Feel Pride`)).killHard();
        return new CombatStrategy().killHard();
      },
      modifier: "mainstat, 4exp",
      equip: $items`makeshift garbage shirt`,
      familiar: $familiar`Galloping Grill`,
      cap: 11,
    },
    {
      name: "Machine Elf",
      after: ["Tote"],
      acquire: $items`makeshift garbage shirt`,
      ready: () => have($familiar`Machine Elf`),
      completed: () => get("_machineTunnelsAdv") >= 5 || myLevel() >= 13,
      do: $location`The Deep Machine Tunnels`,
      combat: new CombatStrategy().killHard(),
      modifier: "mainstat, 4exp",
      equip: $items`makeshift garbage shirt`,
      familiar: $familiar`Machine Elf`,
      cap: 5,
    },
    {
      name: "Leaflet",
      after: [],
      ready: () => myLevel() >= 9,
      completed: () => get("leafletCompleted"),
      do: (): void => {
        visitUrl("council.php");
        cliExecute("leaflet");
        set("leafletCompleted", true);
      },
      freeaction: true,
      cap: 1,
    },
  ],
};
