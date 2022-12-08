import {
  adv1,
  buy,
  cliExecute,
  create,
  eat,
  effectModifier,
  familiarWeight,
  mallPrice,
  myClass,
  myFullness, fullnessLimit,
  myHp,
  myLevel,
  myMaxhp,
  myPrimestat,
  runChoice,
  runCombat,
  totalFreeRests,
  use,
  useSkill,
  visitUrl,
} from "kolmafia";
import {
  $class,
  $effect,
  $effects,
  $familiar,
  $item,
  $items,
  $location,
  $monster,
  $skill,
  $stat,
  ChateauMantegna,
  ensureEffect,
  get,
  getKramcoWandererChance,
  have,
  Macro,
  set,
  Witchess,
} from "libram";
import { Quest } from "../engine/task";
import { CombatStrategy } from "../engine/combat";
import { args } from "../main";
import { acquire, eatSafe } from "./diet";

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
      name: "Buffs",
      after: [],
      ready: () => get("getawayCampsiteUnlocked"),
      completed: () =>
        have($effect`That's Just Cloud-Talk, Man`) ||
        get("_campAwayCloudBuffs", 0) > 0 ||
        myLevel() >= args.levelto,
      do: () => {
        visitUrl("place.php?whichplace=campaway&action=campaway_sky");
        if (mallPrice($item`honey stick`) <= 5000){
          ensureEffect($effect`Stuck That Way`);
        }
        if (!get("_aprilShower")) {
          cliExecute("shower warm");
        }
        if (myFullness() + 2 <= args.stomach && !have($effect`Feeling Fancy`)){
          acquire(1, $item`roasted vegetable focaccia`, 20000)
          eatSafe(1, $item`roasted vegetable focaccia`, args.voa);
        }
        /*if (mallPrice($item`pulled blue taffy`) <= 5000){
          buy($item`pulled blue taffy`, 5)
          use($item`pulled blue taffy`, 5);
        }*/
      },
      freeaction: true,
      limit: { tries: 1 },
    },
    /*{
      name: "Daycare",
      after: [],
      ready: () => get("daycareOpen"),
      completed: () => get("_daycareGymScavenges") !== 0 || myLevel() >= args.levelto,
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
      limit: { tries: 1 },
      freeaction: true,
    },*/
    {
      name: "Bastille",
      after: [],
      ready: () => have($item`Bastille Battalion control rig`),
      completed: () => get("_bastilleGames") !== 0 || myLevel() >= args.levelto,
      do: () =>
        cliExecute(`bastille ${myPrimestat() === $stat`Mysticality` ? "myst" : myPrimestat()}`),
      limit: { tries: 1 },
      freeaction: true,
      outfit: {
        modifier: "exp",
      },
    },
    /*{
      name: "Chateau",
      after: [],
      ready: () => ChateauMantegna.have(),
      completed: () => get("timesRested") >= totalFreeRests() || myLevel() >= args.levelto,
      prepare: (): void => {
        // Set the chateau to give the proper stats
        if (myPrimestat() === $stat`Muscle`) {
          ChateauMantegna.changeNightstand("electric muscle stimulator");
        } else if (myPrimestat() === $stat`Mysticality`) {
          ChateauMantegna.changeNightstand("foreign language tapes");
        } else if (myPrimestat() === $stat`Moxie`) {
          ChateauMantegna.changeNightstand("bowl of potpourri");
        }

        // Set extra free rests
        if (ChateauMantegna.getCeiling() !== "ceiling fan") {
          ChateauMantegna.changeCeiling("ceiling fan");
        }
      },
      do: () => visitUrl("place.php?whichplace=chateau&action=chateau_restbox"),
      freeaction: true,
      outfit: {
        modifier: "exp",
      },
      limit: { soft: 40 },
    },*/
    /*{
      name: "LOV Tunnel",
      after: [],
      ready: () => get("loveTunnelAvailable"),
      completed: () => get("_loveTunnelUsed") || myLevel() >= args.levelto,
      do: $location`The Tunnel of L.O.V.E.`,
      choices: { 1222: 1, 1223: 1, 1224: primestatId(), 1225: 1, 1226: 2, 1227: 1, 1228: 3 },
      combat: new CombatStrategy()
        .macro(() =>
          new Macro().externalIf(
            myPrimestat() === $stat`mysticality`,
            new Macro().skill($skill`Saucestorm`).repeat()
          )
        )
        .killHard(),
      outfit: {
        modifier: "mainstat, 4exp",
        equip: $items`makeshift garbage shirt`,
        familiar: $familiar`Galloping Grill`,
      },
      limit: { tries: 1 },
      freecombat: true,
    },*/
    /*{
      name: "Snojo",
      after: [],
      ready: () => get("snojoAvailable"),
      prepare: (): void => {
        if (get("snojoSetting") === null) {
          visitUrl("place.php?whichplace=snojo&action=snojo_controller");
          runChoice(primestatId());
        }
        if (have($item`Greatest American Pants`)) {
          ensureEffect($effect`Super Skill`); // after GAP are equipped
        }
        cliExecute("uneffect ode to booze");
        if (myHp() < myMaxhp()) useSkill($skill`Cannelloni Cocoon`);
      },
      completed: () => get("_snojoFreeFights") >= 10 || myLevel() >= 13,
      do: $location`The X-32-F Combat Training Snowman`,
      post: (): void => {
        if (get("_snojoFreeFights") === 10) cliExecute("hottub"); // Clean -stat effects
      },
      combat: new CombatStrategy()
        .macro((): Macro => {
          if (have($familiar`Frumious Bandersnatch`) && have($item`Greatest American Pants`)) {
            // Grind exp for Bandersnatch
            return new Macro()
              .skill($skill`Curse of Weaksauce`)
              .skill($skill`Stuffed Mortar Shell`)
              .while_("!pastround 27 && !hpbelow 100", new Macro().skill($skill`Cannelloni Cannon`))
              .trySkill($skill`Saucegeyser`)
              .attack()
              .repeat();
          } else {
            // no need to grind exp
            return new Macro().skill($skill`Saucegeyser`).repeat();
          }
        })
        .killHard(),
      outfit: {
        familiar: $familiar`Frumious Bandersnatch`,
        equip: $items`Greatest American Pants, familiar scrapbook`,
        modifier: "mainstat, 4exp, HP",
      },
      effects: $effects`Spirit of Peppermint`,
      limit: { tries: 10 },
      freecombat: true,
    },*/
    /*{
      name: "God Lobster",
      after: [],
      acquire: [
        {
          item: $item`makeshift garbage shirt`,
          get: () => cliExecute("fold makeshift garbage shirt"),
        },
      ],
      ready: () => have($familiar`God Lobster`),
      completed: () => get("_godLobsterFights") >= 3 || myLevel() >= args.levelto,
      do: (): void => {
        visitUrl("main.php?fightgodlobster=1");
        runCombat();
        runChoice(3);
      },
      combat: new CombatStrategy().killHard(),
      outfit: {
        modifier: "mainstat, 4exp, monster level percent",
        equip: $items`makeshift garbage shirt, unbreakable umbrella`,
        familiar: $familiar`God Lobster`,
      },
      limit: { tries: 3 },
      freecombat: true,
    },*/
    /*{
      name: "Witchess",
      after: [],
      ready: () => Witchess.have(),
      completed: () => Witchess.fightsDone() >= 5 || myLevel() >= args.levelto,
      do: () => Witchess.fightPiece($monster`Witchess Knight`),
      combat: new CombatStrategy().killHard(),
      outfit: {
        modifier: "mainstat, 4exp, monster level percent",
        equip: $items`makeshift garbage shirt, unbreakable umbrella`,
        familiar: $familiar`Left-Hand Man`,
      },
      limit: { tries: 5 },
      freecombat: true,
    },*/
    {
      name: "Sausage Fights",
      after: ["Pop Gooso"],
      acquire: [
        {
          item: $item`makeshift garbage shirt`,
          get: () => cliExecute("fold makeshift garbage shirt"),
        },
        {
          item: $item`Unwrapped knock-off retro superhero cape`,
          get: () => cliExecute("retrocape heck kill"),
        },
      ],
      ready: () =>
        have($familiar`Pocket Professor`) &&
        have($item`Kramco Sausage-o-Matic™`) &&
        getKramcoWandererChance() === 1,
      completed: () => get("_sausageFights") > 0 || myLevel() >= args.levelto || !args.professor,
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
      outfit: {
        modifier: "mainstat, 4exp",
        equip: $items`Kramco Sausage-o-Matic™, makeshift garbage shirt, Unwrapped knock-off retro superhero cape, Pocket Professor memory chip`,
        familiar: $familiar`Pocket Professor`,
      },
      limit: { tries: 1 },
      freecombat: true,
    },
    {
      name: "Oliver's Fights",
      after: [],
      acquire: [],
      completed: () => get("_speakeasyFreeFights") >= 3 || myLevel() >= args.levelto,
      do: $location`An Unusually Quiet Barroom Brawl`,
      combat: new CombatStrategy().killHard(),
      outfit: {
        modifier: "mainstat, 4exp, monster level percent",
        equip: $items`teacher's pen, teacher's pen`,
        familiar: $familiar`Grey Goose`,
      },
      limit: { tries: 3 },
      freecombat: true,
    },
    {
      name: "Seals",
      after: [],
      acquire: [],
      ready: () => myClass() === $class`Seal Clubber`,
      completed: () => get("_sealsSummoned") >= 10 || myLevel() >= args.levelto,
      do: () => {
        use($item`figurine of a wretched-looking seal`);
        runChoice(1);
      },
      combat: new CombatStrategy().macro(new Macro().attack().repeat()),
      outfit: {
        modifier: "mainstat, 4exp, monster level percent, club",
        equip: $items`teacher's pen, teacher's pen`,
        familiar: $familiar`Grey Goose`,
      },
      limit: { tries: 10 },
      freecombat: true,
    },
    {
      name: "Neverending Party",
      after: [],
      acquire: [
        {
          item: $item`makeshift garbage shirt`,
          get: () => cliExecute("fold makeshift garbage shirt"),
        },
      ],
      completed: () => get("_neverendingPartyFreeTurns") >= 10 || myLevel() >= args.levelto,
      do: $location`The Neverending Party`,
      choices: { 1322: 2, 1324: 5 },
      combat: new CombatStrategy()
        .macro((): Macro => {
          if (
            get("_neverendingPartyFreeTurns") >= 7 &&
            get("_feelPrideUsed") < 3 &&
            have($skill`Feel Pride`)
          ) {
            return new Macro().skill($skill`Feel Pride`);
          } else if (get("_neverendingPartyFreeTurns") >= 6 && have($item`cosmic bowling ball`)) {
            return new Macro().skill($skill`Bowl Sideways`);
          } else {
            return new Macro();
          }
        })
        .killHard(),
      outfit: {
        modifier: "mainstat, 4exp, monster level percent, familiar experience ",
        equip: $items`makeshift garbage shirt, unbreakable umbrella, teacher's pen, teacher's pen`,
        familiar: $familiar`Grey Goose`,
      },
      limit: { tries: 11 },
      freecombat: true,
    },
    {
      name: "Pop Gooso",
      combat: new CombatStrategy().macro(() =>
              Macro.trySkill($skill`Convert Matter to Protein`)
          ).killHard(),
      after: [],
      acquire: [
        {
          item: $item`makeshift garbage shirt`,
          get: () => cliExecute("fold makeshift garbage shirt"),
        },
      ],
      ready: () => have($familiar`Grey Goose`) && familiarWeight($familiar`Grey Goose`) === 20 ,
      priority: () => true,
      completed: () => get("_eldritchTentacleFought") || myLevel() >= args.levelto,
      do: () => {
        visitUrl("place.php?whichplace=forestvillage&action=fv_scientist");
        runChoice(1);
      },
      outfit: {
        modifier: "exp percent",
        equip: $items`makeshift garbage shirt`,
        familiar: $familiar`Grey Goose`,
      },
      limit: { tries: 1 },
      freecombat: true,
    },
    /*{
      name: "Machine Elf",
      after: [],
      acquire: [
        {
          item: $item`makeshift garbage shirt`,
          get: () => cliExecute("fold makeshift garbage shirt"),
        },
      ],
      ready: () => have($familiar`Machine Elf`),
      completed: () => get("_machineTunnelsAdv") >= 5 || myLevel() >= args.levelto,
      do: $location`The Deep Machine Tunnels`,
      combat: new CombatStrategy().killHard(),
      outfit: {
        modifier: "mainstat, 4exp, monster level percent",
        equip: $items`makeshift garbage shirt, unbreakable umbrella`,
        familiar: $familiar`Machine Elf`,
      },
      limit: { tries: 5 },
      freecombat: true,
    },*/
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
      limit: { tries: 1 },
      outfit: {
        modifier: "exp",
      },
    },
  ],
};
