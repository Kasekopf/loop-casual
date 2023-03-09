import {
  appearanceRates,
  canadiaAvailable,
  changeMcd,
  currentMcd,
  equip,
  equippedAmount,
  equippedItem,
  familiarWeight,
  gnomadsAvailable,
  itemAmount,
  knollAvailable,
  Location,
  Monster,
  myAscensions,
  myDaycount,
  numericModifier,
  print,
  putCloset,
  runChoice,
  Skill,
  Slot,
  use,
  visitUrl,
} from "kolmafia";
import {
  $effect,
  $effects,
  $familiar,
  $item,
  $items,
  $location,
  $monster,
  $monsters,
  $skill,
  $skills,
  $slot,
  CombatLoversLocket,
  ensureEffect,
  get,
  getBanishedMonsters,
  have,
  Macro,
  set,
} from "libram";
import { CombatStrategy } from "../engine/combat";
import { atLevel } from "../lib";
import { Priorities } from "../engine/priority";
import { globalStateCache } from "../engine/state";
import { towerSkip } from "./level13";
import { Quest, Task } from "../engine/task";
import { Limit, step } from "grimoire-kolmafia";
import { args } from "../args";
import { coldPlanner, stenchPlanner } from "../engine/outfit";
import { prioritizeJellyfish } from "./level5";

// Add a shorthand for expressing absorption-only tasks; there are a lot.
interface AbsorbTask extends Omit<Task, "name" | "limit" | "completed"> {
  do: Location;
  limit?: Limit;
  skill?: Skill; // A skill for which to generate a separate Absorb task, for routing
}

// A list of all locations that might have important monsters
// Roughly in order of unlock in a basic run
const absorbTasks: AbsorbTask[] = [
  // Level 2
  {
    do: $location`The Spooky Forest`,
    after: ["Hidden City/Open Temple"],
    choices: { 502: 2, 505: 2, 334: 1 },
  },
  // Level 3
  {
    do: $location`A Barroom Brawl`,
    after: ["Tavern/Start"],
  },
  // Level 4
  {
    do: $location`The Bat Hole Entrance`,
    after: ["Bat/Start"],
  },
  {
    do: $location`Guano Junction`,
    ready: () => stenchPlanner.maximumPossible(true) >= 1,
    prepare: () => {
      if (numericModifier("stench resistance") < 1) ensureEffect($effect`Red Door Syndrome`);
      if (numericModifier("stench resistance") < 1)
        throw `Unable to ensure stench res for Guano Junction`;
    },
    outfit: () => stenchPlanner.outfitFor(1),
    after: ["Bat/Get Sonar 3"],
    choices: { 1427: 2 },
  },
  {
    do: $location`The Batrat and Ratbat Burrow`,
    after: ["Bat/Use Sonar 1", "Palindome/Bat Snake"],
    skill: $skill`Nanofur`,
  },
  {
    do: $location`The Beanbat Chamber`,
    after: ["Bat/Use Sonar 2", "Giant/Grow Beanstalk"],
  },
  // Level 5
  {
    do: $location`The Outskirts of Cobb's Knob`,
    after: ["Knob/Open Knob"],
    choices: { 111: 3, 113: 2, 118: 1 },
    outfit: { modifier: "+combat", equip: $items`miniature crystal ball` },
  },
  {
    do: $location`Cobb's Knob Kitchens`,
    after: ["Knob/Open Knob"],
  },
  {
    do: $location`Cobb's Knob Barracks`,
    after: ["Knob/Open Knob"],
    choices: { 522: 2 },
  },
  {
    do: $location`Cobb's Knob Harem`,
    after: ["Knob/King"],
  },
  {
    do: $location`Cobb's Knob Treasury`,
    after: ["Knob/Open Knob"],
    outfit: { modifier: "+combat", equip: $items`miniature crystal ball` },
  },
  {
    do: $location`Cobb's Knob Laboratory`,
    after: ["Knob/King"],
  },
  {
    do: $location`The Knob Shaft`,
    after: ["Knob/King"],
    outfit: { modifier: "+combat", equip: $items`miniature crystal ball` },
  },
  {
    do: $location`Cobb's Knob Menagerie, Level 1`,
    after: ["Knob/Open Menagerie"],
  },
  {
    do: $location`Cobb's Knob Menagerie, Level 2`,
    after: ["Knob/Open Menagerie"],
    skill: $skill`Fluid Dynamics Simulation`,
    effects: () => (get("greyYouPoints") < 11 ? $effects`Butt-Rock Hair` : []),
  },
  {
    do: $location`Cobb's Knob Menagerie, Level 3`,
    after: ["Knob/Open Menagerie"],
    priority: prioritizeJellyfish,
    skill: $skill`Phase Shift`,
    effects: () => (get("greyYouPoints") < 11 ? $effects`Butt-Rock Hair` : []),
    outfit: () => {
      if (have($item`designer sweatpants`) && get("greyYouPoints") >= 11)
        return { equip: $items`designer sweatpants` };
      else return { modifier: "moxie, -10ML" };
    },
  },
  // Level 6
  {
    do: $location`The Dark Heart of the Woods`,
    after: ["Friar/Heart"],
    ready: () => step("questL06Friar") < 999,
    outfit: () => {
      if (have($item`latte lovers member's mug`) && !get("latteUnlocks").includes("wing")) {
        return { equip: $items`latte lovers member's mug, miniature crystal ball` };
      }
      return { equip: $items`miniature crystal ball` };
    },
  },
  {
    do: $location`The Dark Neck of the Woods`,
    after: ["Friar/Neck"],
    ready: () => step("questL06Friar") < 999,
  },
  {
    do: $location`The Dark Elbow of the Woods`,
    after: ["Friar/Elbow"],
    ready: () => step("questL06Friar") < 999,
    outfit: () => {
      if (have($item`latte lovers member's mug`) && !get("latteUnlocks").includes("vitamins")) {
        return { equip: $items`latte lovers member's mug, miniature crystal ball` };
      }
      return { equip: $items`miniature crystal ball` };
    },
  },
  {
    do: $location`Pandamonium Slums`,
    prepare: () => {
      if (step("questM10Azazel") === -1) {
        visitUrl("pandamonium.php?action=temp");
        visitUrl("pandamonium.php?action=sven");
      }
    },
    after: ["Friar/Finish"],
  },
  {
    do: $location`The Laugh Floor`,
    prepare: () => {
      if (step("questM10Azazel") === -1) {
        visitUrl("pandamonium.php?action=temp");
        visitUrl("pandamonium.php?action=sven");
      }
    },
    after: ["Friar/Finish"],
  },
  {
    do: $location`Infernal Rackets Backstage`,
    prepare: () => {
      if (step("questM10Azazel") === -1) {
        visitUrl("pandamonium.php?action=temp");
        visitUrl("pandamonium.php?action=sven");
      }
    },
    after: ["Friar/Finish"],
    skill: $skill`Gravitational Compression`,
  },
  // Level 7
  {
    do: $location`The VERY Unquiet Garves`,
    after: ["Crypt/Start", "Crypt/Finish"],
  },
  // Level 8
  {
    do: $location`Itznotyerzitz Mine`,
    after: ["McLargeHuge/Trapper Request"],
    choices: { 18: 3, 19: 3, 20: 3, 556: 2 },
    outfit: { modifier: "+combat", equip: $items`miniature crystal ball` },
  },
  {
    do: $location`The Goatlet`,
    after: ["McLargeHuge/Goatlet"],
  },
  {
    do: $location`Lair of the Ninja Snowmen`,
    after: ["McLargeHuge/Climb", "Palindome/Cold Snake"],
  },
  {
    do: $location`The eXtreme Slope`,
    after: ["McLargeHuge/Climb"],
    choices: { 15: 3, 16: 3, 17: 3, 575: 3 },
    outfit: { modifier: "+combat", equip: $items`miniature crystal ball` },
  },
  {
    do: $location`The Icy Peak`,
    after: ["McLargeHuge/Peak"],
    ready: () => coldPlanner.maximumPossible(true) >= 5,
    prepare: () => {
      if (numericModifier("cold resistance") < 5) ensureEffect($effect`Red Door Syndrome`);
      if (numericModifier("cold resistance") < 5)
        throw `Unable to ensure cold res for The Icy Peak`;
    },
    outfit: () => {
      return coldPlanner.outfitFor(5, {
        modifier: "+combat",
        equip: $items`miniature crystal ball`,
      });
    },
    combat: new CombatStrategy().macro(new Macro().attack().repeat(), $monster`Snow Queen`),
  },
  // Level 9
  {
    do: $location`The Smut Orc Logging Camp`,
    after: ["Orc Chasm/Bridge"],
    choices: { 1345: 1 },
  },
  {
    do: $location`A-Boo Peak`,
    after: ["Orc Chasm/ABoo Clues"],
    combat: new CombatStrategy().macro(new Macro().attack().repeat()),
  },
  {
    do: $location`Twin Peak`,
    after: ["Orc Chasm/Twin Init"],
    skill: $skill`Overclocking`,
  },
  {
    do: $location`Oil Peak`,
    after: ["Orc Chasm/Oil Peak"],
    ready: () => have($item`backup camera`) || have($item`old patched suit-pants`),
    prepare: () => {
      // Unequip the umbrella if it pushes us over the cap
      if (
        equippedAmount($item`unbreakable umbrella`) > 0 &&
        get("umbrellaState") === "broken" &&
        numericModifier("Monster Level") >= 80
      ) {
        equip($slot`off-hand`, $item`none`);
      }

      // Unequip items one-by-one until we are below 100 ML
      // (Always leave the backup camera on)
      for (const slot of Slot.all()) {
        if (numericModifier("Monster Level") < 100) break;

        const item = equippedItem(slot);
        if (item === $item`none`) continue;
        if (numericModifier(item, "Monster Level") === 0 && item !== $item`Jurassic Parka`)
          continue;
        if (item === $item`backup camera`) continue; // Always keep equipped to ensure we can get to 50
        equip(slot, $item`none`);
      }

      if (numericModifier("Monster Level") >= 100 && currentMcd() > 0) changeMcd(0);
      if (numericModifier("Monster Level") < 50 && currentMcd() < 10) changeMcd(10);
      if (numericModifier("Monster Level") < 50 || numericModifier("Monster Level") >= 100)
        throw `Unable to get 50-99 ML for oil barons`;
    },
    post: () => {
      if (currentMcd() > 0) changeMcd(0);
    },
    freecombat: true,
    outfit: { modifier: "ML 50min" },
    limit: { tries: 1 },
  },
  {
    do: $location`The Valley of Rof L'm Fao`,
    after: ["Orc Chasm/Finish"],
    combat: new CombatStrategy().ccs("attack", $monster`rampaging adding machine`),
  },
  // Level 10
  {
    do: $location`The Penultimate Fantasy Airship`,
    after: ["Giant/Airship"],
    outfit: { modifier: "+combat", equip: $items`miniature crystal ball` },
    choices: { 178: 2, 182: 2 },
  },
  {
    do: $location`The Castle in the Clouds in the Sky (Basement)`,
    after: ["Giant/Basement Finish"],
    outfit: { modifier: "+combat", equip: $items`miniature crystal ball` },
    choices: { 670: 3, 669: 1, 671: 3 },
  },
  {
    do: $location`The Castle in the Clouds in the Sky (Ground Floor)`,
    after: ["Giant/Ground"],
    outfit: { modifier: "+combat", equip: $items`miniature crystal ball` },
    choices: { 672: 3, 673: 3, 674: 3, 1026: 3 },
  },
  {
    do: $location`The Castle in the Clouds in the Sky (Top Floor)`,
    after: ["Giant/Top Floor", "Palindome/Hot Snake Postcastle"],
    outfit: { modifier: "+combat", equip: $items`miniature crystal ball` },
    choices: { 675: 4, 676: 4, 677: 2, 678: 3, 679: 1, 1431: 4 },
  },
  {
    do: $location`The Hole in the Sky`,
    after: ["Giant/Unlock HITS", "Keys/Star Key"],
  },
  // Level 11
  {
    do: $location`The Black Forest`,
    after: ["Macguffin/Forest"],
    outfit: { modifier: "+combat", equip: $items`miniature crystal ball` },
    choices: { 923: 1, 924: 1 },
    skill: $skill`Photonic Shroud`,
  },
  // Level 11: Hidden City
  {
    do: $location`The Hidden Temple`,
    after: ["Hidden City/Open City"],
    outfit: { modifier: "+combat", equip: $items`miniature crystal ball` },
    choices: {
      579: () => {
        return get("lastTempleAdventures") === myAscensions() ? 2 : 1;
      },
      580: 3,
      581: 3,
    },
  },
  {
    do: $location`The Hidden Park`,
    after: ["Hidden City/Open City", "Hidden City/Banish Janitors"],
    outfit: { modifier: "+combat", equip: $items`miniature crystal ball` },
    choices: {
      789: () => {
        return get("relocatePygmyJanitor") === myAscensions() ? 2 : 3;
      },
    },
    skill: $skill`System Sweep`,
  },
  {
    do: $location`The Hidden Apartment Building`,
    after: ["Hidden City/Apartment"],
    choices: { 780: 4 },
  },
  {
    do: $location`The Hidden Office Building`,
    after: ["Hidden City/Office Boss"],
    choices: { 786: 4 },
  },
  {
    do: $location`The Hidden Hospital`,
    after: ["Hidden City/Hospital"],
  },
  {
    do: $location`The Hidden Bowling Alley`,
    after: ["Hidden City/Bowling"],
  },
  // Level 11: Manor
  {
    do: $location`The Haunted Pantry`,
    after: [],
    choices: { 114: 2, 115: 1, 116: 4, 117: 1 },
    outfit: { modifier: "+combat", equip: $items`miniature crystal ball` },
  },
  {
    do: $location`The Haunted Conservatory`,
    after: ["Manor/Start"],
    choices: { 899: 2 },
    ready: () =>
      atLevel(12) ||
      !CombatLoversLocket.have() ||
      !CombatLoversLocket.availableLocketMonsters().includes($monster`anglerbush`), // For now, get this manually if we get far without it
    skill: $skill`Ponzi Apparatus`,
    outfit: { equip: $items`miniature crystal ball, combat lover's locket` },
  },
  {
    do: $location`The Haunted Kitchen`,
    after: ["Manor/Kitchen"],
    choices: { 893: 2 },
  },
  {
    do: $location`The Haunted Billiards Room`,
    after: ["Manor/Billiards"],
    outfit: { modifier: "+combat", equip: $items`miniature crystal ball` },
    combat: new CombatStrategy().macro(new Macro().attack().repeat(), $monster`chalkdust wraith`),
    choices: { 900: 2 },
    skill: $skill`Subatomic Hardening`,
  },
  {
    do: $location`The Haunted Library`,
    after: ["Manor/Library"],
    choices: { 163: 4, 888: 4, 889: 5, 894: 1 },
  },
  {
    do: $location`The Haunted Gallery`,
    after: ["Manor/Gallery"],
    outfit: { modifier: "+combat", equip: $items`miniature crystal ball` },
    choices: { 89: 6, 896: 1 },
  },
  {
    do: $location`The Haunted Bathroom`,
    after: ["Manor/Bathroom"],
    outfit: { modifier: "+combat", equip: $items`miniature crystal ball` },
    choices: { 881: 1, 105: 1, 892: 1 },
    skill: $skill`Clammy Microcilia`,
  },
  {
    do: $location`The Haunted Bedroom`,
    after: ["Manor/Bedroom"],
    choices: { 876: 1, 877: 1, 878: 4, 879: 1, 880: 1, 897: 2 },
  },
  {
    do: $location`The Haunted Ballroom`,
    after: ["Manor/Ballroom"],
    outfit: { modifier: "+combat", equip: $items`miniature crystal ball` },
    choices: { 881: 1, 105: 1, 892: 1 },
  },
  {
    do: $location`The Haunted Wine Cellar`,
    after: ["Manor/Wine Cellar"],
    choices: { 901: 2 },
  },
  {
    do: $location`The Haunted Laundry Room`,
    after: ["Manor/Laundry Room"],
    choices: { 891: 2 },
  },
  {
    do: $location`The Haunted Boiler Room`,
    after: ["Manor/Boiler Room"],
    choices: { 902: 2 },
  },
  {
    prepare: () => {
      if (step("questM17Babies") === -1)
        visitUrl("place.php?whichplace=manor3&action=manor3_ladys");
    },
    do: $location`The Haunted Storage Room`,
    after: ["Manor/Finish Floor2"],
    choices: { 886: 6, 890: 1 },
  },
  {
    prepare: () => {
      if (step("questM17Babies") === -1)
        visitUrl("place.php?whichplace=manor3&action=manor3_ladys");
    },
    do: $location`The Haunted Nursery`,
    after: ["Manor/Finish Floor2"],
    choices: { 884: 6, 885: 6, 898: 2 },
  },
  {
    prepare: () => {
      if (step("questM17Babies") === -1)
        visitUrl("place.php?whichplace=manor3&action=manor3_ladys");
    },
    do: $location`The Haunted Laboratory`,
    after: ["Manor/Finish Floor2"],
    choices: { 884: 6, 903: 2 },
  },
  // Level 11: Palindome
  {
    do: $location`The Copperhead Club`,
    after: ["Palindome/Copperhead"],
    choices: { 855: 4 },
  },
  {
    do: $location`A Mob of Zeppelin Protesters`,
    after: ["Palindome/Protesters Finish"],
  },
  {
    do: $location`The Red Zeppelin`,
    after: ["Palindome/Zepplin"],
  },
  {
    do: $location`Inside the Palindome`,
    after: ["Palindome/Palindome Photos"],
    outfit: { modifier: "+combat", equip: $items`Talisman o' Namsilat, miniature crystal ball` },
    choices: { 2: 2, 126: 1, 127: 1, 180: 2 },
  },
  {
    do: $location`Whitey's Grove`,
    after: ["Palindome/Open Alarm"],
    outfit: { modifier: "+combat", equip: $items`miniature crystal ball` },
    choices: { 73: 3, 74: 2, 75: 2 },
  },
  // Level 11: Pyramid
  {
    do: $location`The Arid, Extra-Dry Desert`,
    after: ["Macguffin/Desert"],
  },
  {
    priority: () =>
      have($effect`Ultrahydrated`) && familiarWeight($familiar`Grey Goose`) >= 6
        ? Priorities.Effect
        : Priorities.None,
    do: $location`The Oasis`,
    after: ["Macguffin/Desert"],
  },
  {
    do: $location`The Upper Chamber`,
    after: ["Macguffin/Upper Chamber"],
  },
  {
    do: $location`The Middle Chamber`,
    after: ["Macguffin/Middle Chamber"],
  },
  // Misc areas
  // These are probably only worthwhile with orb
  // {
  //   do: $location`South of the Border`,
  //   ready: () => false,
  //   after: ["Misc/Unlock Beach", "Absorb/Whitey's Grove"],
  //   choices: { 4: 3 },
  //   outfit: { modifier: "+combat", equip: $items`miniature crystal ball` },
  // },
  {
    do: $location`The Unquiet Garves`,
    after: ["Crypt/Start"],
  },
  {
    do: $location`The Old Landfill`,
    after: ["Mosquito/Start"],
    prepare: () => {
      if (step("questM19Hippy") === -1) {
        visitUrl("place.php?whichplace=woods&action=woods_smokesignals");
        visitUrl("choice.php?pwd=&whichchoice=798&option=1");
        visitUrl("choice.php?pwd=&whichchoice=798&option=2");
        visitUrl("woods.php");
      }
      if (have($item`funky junk key`)) {
        putCloset($item`funky junk key`, itemAmount($item`funky junk key`));
      }
    },
    ready: () => atLevel(6),
  },
  {
    do: $location`The Skeleton Store`,
    after: [],
    prepare: () => {
      if (step("questM23Meatsmith") === -1) {
        visitUrl("shop.php?whichshop=meatsmith");
        visitUrl("shop.php?whichshop=meatsmith&action=talk");
        runChoice(1);
      }
    },
    choices: { 1060: 1 },
  },
  {
    do: $location`The Overgrown Lot`,
    after: [],
    prepare: () => {
      if (step("questM24Doc") === -1) {
        visitUrl("shop.php?whichshop=doc");
        visitUrl("shop.php?whichshop=doc&action=talk");
        runChoice(1);
      }
    },
    choices: { 1062: 3 },
  },
  {
    do: $location`Madness Bakery`,
    after: [],
    prepare: () => {
      if (step("questM25Armorer") === -1) {
        visitUrl("shop.php?whichshop=armory");
        visitUrl("shop.php?whichshop=armory&action=talk");
        visitUrl("choice.php?pwd=&whichchoice=1065&option=1");
      }
    },
    choices: { 1061: 5 },
  },
  {
    do: $location`The Dungeons of Doom`,
    skill: $skill`Hivemindedness`,
    after: [],
    prepare: () => {
      if (have($item`plus sign`)) use($item`plus sign`);
    },
    ready: () => get("lastPlusSignUnlock") === myAscensions(),
    choices: { 25: 3 },
    outfit: { modifier: "+combat", equip: $items`miniature crystal ball` },
  },
  // Moon-sign zones
  {
    do: $location`The Bugbear Pen`,
    ready: () => knollAvailable(),
    prepare: () => {
      if (step("questM03Bugbear") === -1) {
        visitUrl("place.php?whichplace=knoll_friendly&action=dk_mayor");
      }
    },
    after: ["Mosquito/Start"],
  },
  {
    do: $location`Outskirts of Camp Logging Camp`,
    ready: () => canadiaAvailable(),
    after: [],
    outfit: { modifier: "+combat", equip: $items`miniature crystal ball` },
  },
  {
    do: $location`Thugnderdome`,
    ready: () => gnomadsAvailable(),
    after: [],
  },
];

// All monsters that give adventures upon absorption
const reprocessTargets = new Map<Monster, number>([
  // 10 adv monsters
  [$monster`1335 HaXx0r`, 10],
  [$monster`Alphabet Giant`, 10],
  [$monster`black magic woman`, 10],
  [$monster`blur`, 10],
  [$monster`Bob Racecar`, 10],
  [$monster`coaltergeist`, 10],
  [$monster`fleet woodsman`, 10],
  [$monster`Iiti Kitty`, 10],
  [$monster`Irritating Series of Random Encounters`, 10],
  [$monster`Little Man in the Canoe`, 10],
  [$monster`mad wino`, 10],
  [$monster`Mob Penguin Capo`, 10],
  [$monster`One-Eyed Willie`, 10],
  [$monster`pygmy blowgunner`, 10],
  [$monster`pygmy headhunter`, 10],
  [$monster`pygmy orderlies`, 10],
  [$monster`pygmy shaman`, 10],
  [$monster`Racecar Bob`, 10],
  [$monster`Raver Giant`, 10],
  [$monster`Renaissance Giant`, 10],
  [$monster`swarm of fire ants`, 10],
  [$monster`tomb asp`, 10],
  // 7 adv monsters
  [$monster`animated rustic nightstand`, 7],
  [$monster`basic lihc`, 7],
  [$monster`Battlie Knight Ghost`, 7],
  [$monster`Bubblemint Twins`, 7],
  [$monster`CH Imp`, 7],
  [$monster`chalkdust wraith`, 7],
  [$monster`cloud of disembodied whiskers`, 7],
  [$monster`eXtreme Orcish snowboarder`, 7],
  [$monster`gluttonous ghuol`, 7],
  [$monster`Grass Elemental`, 7],
  [$monster`grave rober zmobie`, 7],
  [$monster`guy with a pitchfork, and his wife`, 7],
  [$monster`junksprite sharpener`, 7],
  [$monster`Knob Goblin Very Mad Scientist`, 7],
  [$monster`model skeleton`, 7],
  [$monster`Ninja Snowman Janitor`, 7],
  [$monster`oil baron`, 7],
  [$monster`party skelteon`, 7],
  [$monster`possessed silverware drawer`, 7],
  [$monster`possessed toy chest`, 7],
  [$monster`revolving bugbear`, 7],
  [$monster`sabre-toothed goat`, 7],
  [$monster`serialbus`, 7],
  [$monster`sheet ghost`, 7],
  [$monster`skeletal hamster`, 7],
  [$monster`smut orc pipelayer`, 7],
  [$monster`swarm of killer bees`, 7],
  [$monster`tapdancing skeleton`, 7],
  [$monster`toilet papergeist`, 7],
  [$monster`upgraded ram`, 7],
  [$monster`vicious gnauga`, 7],
  [$monster`whitesnake`, 7],
  [$monster`Booze Giant`, 7],
  // 5 adv monsters
  [$monster`dire pigeon`, 5],
  [$monster`gingerbread murderer`, 5],
  [$monster`grave rober`, 5],
  [$monster`irate mariachi`, 5],
  [$monster`plastered frat orc`, 5],
  [$monster`swarm of skulls`, 5],
  [$monster`albino bat`, 5],
  [$monster`batrat`, 5],
  [$monster`G imp`, 5],
  [$monster`Knob Goblin Bean Counter`, 5],
  [$monster`Knob Goblin Madam`, 5],
  [$monster`Knob Goblin Master Chef`, 5],
  [$monster`L imp`, 5],
  [$monster`magical fruit bat`, 5],
  [$monster`P imp`, 5],
  [$monster`swarm of Knob lice`, 5],
  [$monster`W imp`, 5],
  [$monster`warwelf`, 5],
]);

// Other monsters that give skills
const usefulSkills = new Map<Skill, Monster>([
  [$skill`Ponzi Apparatus`, $monster`anglerbush`],
  [$skill`Ominous Substrate`, $monster`animated ornate nightstand`],
  [$skill`Innuendo Circuitry`, $monster`Astronomer`],
  [$skill`Exhaust Tubules`, $monster`beanbat`],
  [$skill`Overclocking`, $monster`Big Wheelin' Twins`],
  [$skill`Photonic Shroud`, $monster`black panther`],
  [$skill`Fluid Dynamics Simulation`, $monster`Carnivorous Moxie Weed`],
  [$skill`Ectogenesis`, $monster`Claybender Sorcerer Ghost`],
  [$skill`Microburner`, $monster`Cobb's Knob oven`],
  [$skill`Telekinetic Murder`, $monster`crêep`],
  [$skill`Localized Vacuum`, $monster`cubist bull`],
  [$skill`Infernal Automata`, $monster`demonic icebox`],
  [$skill`Secondary Fermentation`, $monster`drunk goat`],
  [$skill`Double Nanovision`, $monster`drunk pygmy`],
  [$skill`Microweave`, $monster`eXtreme cross-country hippy`],
  [$skill`AUTOEXEC.BAT`, $monster`Flock of Stab-bats`],
  [$skill`Nanoshock`, $monster`Jacob's adder`],
  [$skill`Propagation Drive`, $monster`junksprite bender`],
  [$skill`Advanced Exo-Alloy`, $monster`Knob Goblin Elite Guard`],
  [$skill`Camp Subroutines`, $monster`Knob Goblin Harem Girl`],
  [$skill`Cryocurrency`, $monster`Knob Goblin MBA`],
  [$skill`Curses Library`, $monster`lihc`],
  [$skill`Clammy Microcilia`, $monster`malevolent hair clog`],
  [$skill`Financial Spreadsheets`, $monster`me4t begZ0r`],
  [$skill`Hivemindedness`, $monster`mind flayer`],
  [$skill`Cooling Tubules`, $monster`Ninja Snowman Weaponmaster`],
  // [$skill`Lubricant Layer`, $monster`oil slick`],
  [$skill`Conifer Polymers`, $monster`pine bat`],
  [$skill`Subatomic Hardening`, $monster`pooltergeist`],
  [$skill`Legacy Code`, $monster`possessed wine rack`],
  [$skill`System Sweep`, $monster`pygmy janitor`],
  [$skill`Infinite Loop`, $monster`pygmy witch lawyer`],
  [$skill`Ire Proof`, $monster`raging bull`],
  [$skill`Nanofur`, $monster`ratbat`],
  [$skill`Hardslab`, $monster`remaindered skeleton`],
  [$skill`Snakesmack`, $monster`sewer snake with a sewer snake in it`],
  [$skill`Procgen Ribaldry`, $monster`smut orc screwer`],
  [$skill`Snow-Cooling System`, $monster`Snow Queen`],
  [$skill`Phase Shift`, $monster`Spectral Jellyfish`],
  [$skill`Audioclasm`, $monster`spooky music box`],
  [$skill`Autovampirism Routines`, $monster`spooky vampire`],
  [$skill`Steam Mycelia`, $monster`steam elemental`],
  [$skill`Nantlers`, $monster`stuffed moose head`],
  [$skill`Gravitational Compression`, $monster`suckubus`],
  [$skill`Grey Noise`, $monster`Boss Bat`],
  [$skill`Anti-Sleaze Recursion`, $monster`werecougar`],
  [$skill`Piezoelectric Honk`, $monster`white lion`],
]);
const usefulMonsters = new Set<Monster>([...reprocessTargets.keys(), ...usefulSkills.values()]);
const skillMonsters = new Set<Monster>(usefulSkills.values());

export function monstersAt(location: Location): Monster[] {
  if (location === $location`The VERY Unquiet Garves`) {
    // Workaround
    return $monsters`basic lihc, party skelteon, corpulent zobmie, grave rober zmobie, senile lihc, slick lihc, gluttonous ghuol, gaunt ghuol`;
  }
  const result = Object.entries(appearanceRates(location))
    .filter((i) => i[1] !== -2) // Avoid impossible monsters
    .map((i) => Monster.get(i[0]));
  return result;
}

export class AbsorbState {
  absorbed = new Set<Monster>();
  reprocessed = new Set<Monster>();
  ignored = new Set<Monster>();
  ignoredSkills = new Set<Skill>();
  advAbsorbed = 0;

  constructor() {
    const charsheet = visitUrl("charsheet.php");
    let match;

    // Mark down all absorbed monsters that didn't give skills
    const monster_regex = new RegExp(/Absorbed [^<]* from ([^<]*)\./g);
    do {
      match = monster_regex.exec(charsheet);
      if (match) {
        const name = match[1]
          .replace(/^a /g, "")
          .replace(/^an /g, "")
          .replace(/^some /g, "")
          .replace(/^the /g, "")
          .replace(/^The /g, "");
        const monster = Monster.get(name);
        this.absorbed.add(monster);
        this.advAbsorbed += reprocessTargets.get(monster) ?? 0;
      }
    } while (match);

    // Mark down all absorbed monsters that gave skills
    const skill_regex = new RegExp(
      /<a onClick='javascript:poop\("[^"]*","skill", \d+, \d+\)'>([^<]*)<\/a>/g
    );
    do {
      match = skill_regex.exec(charsheet);
      if (match) {
        try {
          const monster = usefulSkills.get(Skill.get(match[1]));
          if (monster === undefined) continue;
          this.absorbed.add(monster);
        } catch {
          // The skill is unknown to mafia; ignore
        }
      }
    } while (match);

    // Mark down all monsters that we have reprocessed
    get("gooseReprocessed")
      .split(",")
      .map((id) => parseInt(id))
      .filter((id) => id > 0)
      .map((id) => Monster.get(id))
      .map((monster) => {
        this.reprocessed.add(monster);
        this.advAbsorbed += reprocessTargets.get(monster) ?? 0;
      });
    get("_loopgyou_untracked_gooseReprocessed")
      .split(",")
      .map((id) => parseInt(id))
      .filter((id) => id > 0)
      .map((id) => Monster.get(id))
      .map((monster) => {
        this.reprocessed.add(monster);
        this.advAbsorbed += reprocessTargets.get(monster) ?? 0;
      });

    // Use _greyYouAdventures on later days
    if (myDaycount() === 1) {
      if (this.advAbsorbed !== get("_greyYouAdventures", 0) && args.debug.verbose) {
        print(
          `Verbose: Tracking misalignment on absorb: ${this.advAbsorbed} != ${get(
            "_greyYouAdventures",
            0
          )}.`
        );
      }
    } else {
      this.advAbsorbed = get("_greyYouAdventures", this.advAbsorbed);
    }

    // Ignore unneeded skills for the run
    // Some of them might be re-added by forced_skills
    const ignored_skills = new Set<Skill>([
      $skill`Telekinetic Murder`,
      $skill`Nanoshock`,
      $skill`Advanced Exo-Alloy`,
      $skill`Hardslab`,
      $skill`Snakesmack`,
      $skill`Audioclasm`,
      $skill`Nantlers`,
      $skill`Financial Spreadsheets`,
    ]);

    // Ignore the elemental skills that are not useful for the tower
    const needed_elem_skills: { [elem: string]: Skill[] } = {
      hot: $skills`Microburner, Infernal Automata, Steam Mycelia`,
      cold: $skills`Cryocurrency, Cooling Tubules, Snow-Cooling System`,
      spooky: $skills`Curses Library, Ominous Substrate, Legacy Code`,
      stench: $skills`Exhaust Tubules, Secondary Fermentation, AUTOEXEC.BAT`,
      sleaze: $skills`Camp Subroutines, Procgen Ribaldry, Innuendo Circuitry`,
    };
    for (const elem in needed_elem_skills) {
      if (get("nsChallenge2") !== elem || towerSkip()) {
        for (const unneeded_skill of needed_elem_skills[elem]) {
          ignored_skills.add(unneeded_skill);
        }
      }
    }

    // Ignore the +init skill after the crypt if we are delaying the tower
    // Or if we already found the bubblemint twins and can use Slay the Dead
    if (
      towerSkip() &&
      ((get("cyrptAlcoveEvilness") <= 25 && step("questL07Cyrptic") !== -1) ||
        (have($item`unwrapped knock-off retro superhero cape`) &&
          !this.isTarget($monster`Bubblemint Twins`)))
    ) {
      ignored_skills.add($skill`Overclocking`);
    }

    // No need for resistance skills if we already have enough
    // Get at least 3 cold res for icy peak
    if (coldPlanner.maximumPossible(false) >= 3) ignored_skills.add($skill`Nanofur`);
    // Get at least 4 stench res for twin peaks
    if (stenchPlanner.maximumPossible(false) >= 2) ignored_skills.add($skill`Clammy Microcilia`);

    // Other res skills are only needed for the tower hedge maze
    const res_skills = $skills`Ire Proof, Autovampirism Routines, Conifer Polymers, Anti-Sleaze Recursion, Localized Vacuum, Microweave, Ectogenesis, Lubricant Layer`;
    if (towerSkip()) {
      for (const skill of res_skills) {
        ignored_skills.add(skill);
      }
    }

    // We need a single +cold dmg source for orcs
    if (
      !have($item`frozen jeans`) &&
      !have($item`June cleaver`) &&
      !have($item`industrial fire extinguisher`) &&
      !have($skill`Cryocurrency`) &&
      !have($skill`Cooling Tubules`)
    ) {
      ignored_skills.delete($skill`Snow-Cooling System`);
    }

    // Sweatpants are enough MP regen
    if (have($item`designer sweatpants`)) ignored_skills.add($skill`Hivemindedness`);

    // Do not ignore skills that were given in the args
    const forced_skills = new Set<Skill>();
    for (const skill_name of args.minor.skills.split(",")) {
      if (skill_name.length === 0) continue;
      const skill = Skill.get(skill_name.trim());
      if (!skill || skill === Skill.none || !usefulSkills.has(skill)) {
        throw `Unable to determine how to get skill ${skill_name}`;
      }
      forced_skills.add(skill);
    }

    for (const skill of ignored_skills) {
      if (forced_skills.has(skill)) continue;

      const monster = usefulSkills.get(skill);
      this.ignoredSkills.add(skill);
      if (monster === undefined) continue;
      this.ignored.add(monster);
    }

    // Ignore skills after the NS is defeated
    if (step("questL13Final") > 11) {
      for (const monster of usefulSkills.values()) {
        this.ignored.add(monster);
      }
    }

    // Don't bother to chase the ice house banished monster
    if (!get("_loopgyou_museum", false)) {
      visitUrl("museum.php?action=icehouse");
      set("_loopgyou_museum", true);
    }
    const icehouse = getBanishedMonsters().get($item`ice house`);
    if (icehouse !== undefined) this.ignored.add(icehouse);
  }

  public remainingReprocess(location?: Location): Monster[] {
    // Return all remaining desired and unreprocessed monsters, in this location or everywhere
    if (this.atAbsorbCap()) return [];
    if (!location) {
      return [...reprocessTargets.keys()].filter(
        (monster) => !this.reprocessed.has(monster) && !this.ignored.has(monster)
      );
    }

    return monstersAt(location).filter((monster) => this.isReprocessTarget(monster));
  }

  public remainingAbsorbs(location?: Location): Monster[] {
    // Return all remaining desired and unabsorbed monsters, in this location or everywhere
    if (!location) {
      const targets = this.atAbsorbCap() ? skillMonsters : usefulMonsters;
      return [...targets].filter(
        (monster) => !this.absorbed.has(monster) && !this.ignored.has(monster)
      );
    }

    return monstersAt(location).filter((monster) => this.isTarget(monster));
  }

  public hasTargets(location: Location): boolean {
    // Return true if the location has at least one desired unabsorbed monster
    return this.remainingAbsorbs(location).length > 0;
  }

  public remainingAdventures(location: Location): number {
    return this.remainingAbsorbs(location).reduce((a, b) => a + (reprocessTargets.get(b) ?? 0), 0);
  }

  public hasReprocessTargets(location: Location): boolean {
    // Return true if the location has at least one desired unabsorbed monster we desire to reprocess
    return this.remainingReprocess(location).length > 0;
  }

  public isTarget(monster: Monster): boolean {
    // Return true if the monster is desired and unabsorbed
    const targets = this.atAbsorbCap() ? skillMonsters : usefulMonsters;
    return targets.has(monster) && !this.absorbed.has(monster) && !this.ignored.has(monster);
  }

  public isReprocessTarget(monster: Monster): boolean {
    // Return true if the monster is desired and unreprocessed
    if (this.atAbsorbCap()) return false;
    return (
      reprocessTargets.has(monster) && !this.reprocessed.has(monster) && !this.ignored.has(monster)
    );
  }

  public skillCompleted(skill: Skill) {
    // Return true if the skill is obtained or is safe to ignore
    return have(skill) || this.ignoredSkills.has(skill);
  }

  public atAbsorbCap() {
    return this.advAbsorbed >= 500;
  }
}

export const AbsorbQuest: Quest = {
  name: "Absorb",
  tasks: [
    // Construct a full Task from each minimally-specified AbsorbTask.
    ...absorbTasks
      .filter((task) => task.skill !== undefined)
      .map((task): Task => {
        const result = {
          name: task.skill?.name ?? "",
          completed: () => globalStateCache.absorb().skillCompleted(task.skill ?? $skill`none`),
          ...task,
          combat: (task.combat ?? new CombatStrategy()).ignoreSoftBanish(), // killing targetting monsters is set in the engine
          limit: { soft: 25 },
        };
        if (result.outfit === undefined) result.outfit = { equip: $items`miniature crystal ball` };
        return result;
      }),
    {
      // Add a last task for routing
      name: "All",
      after: absorbTasks
        .filter((task) => task.skill !== undefined)
        .map((task) => task.skill?.name ?? ""),
      ready: () => false,
      completed: () => true,
      do: (): void => {
        throw "Unable to absorb all target monsters";
      },
      limit: { tries: 1 },
      freeaction: true,
    },
  ],
};

// Only used on day 2+
export const ReprocessQuest: Quest = {
  name: "Reprocess",
  tasks: [
    // Construct a full Task from each minimally-specified AbsorbTask.
    ...absorbTasks.map((task): Task => {
      const result = {
        name: task.do.toString(),
        completed: () => !globalStateCache.absorb().hasReprocessTargets(task.do),
        ...task,
        after: [...(task.after ?? []), `AdvAbsorb/${task.do.toString()}`],
        ready: () =>
          (task.ready === undefined || task.ready()) && familiarWeight($familiar`Grey Goose`) >= 6,
        combat: (task.combat ?? new CombatStrategy()).ignoreSoftBanish(), // killing targetting monsters is set in the engine
        limit: { soft: 25 },
      };
      if (result.outfit === undefined) result.outfit = { equip: $items`miniature crystal ball` };
      return result;
    }),
    {
      // Add a last task for routing
      name: "All",
      after: absorbTasks.map((task) => task.do.toString()),
      ready: () => false,
      completed: () => true,
      do: (): void => {
        throw "Unable to reprocess all target monsters";
      },
      limit: { tries: 1 },
      freeaction: true,
    },
  ],
};

// Only used on day 2+
export const AdvAbsorbQuest: Quest = {
  name: "AdvAbsorb",
  tasks: [
    // Construct a full Task from each minimally-specified AbsorbTask.
    ...absorbTasks.map((task): Task => {
      const result = {
        name: task.do.toString(),
        completed: () => globalStateCache.absorb().remainingAdventures(task.do) === 0,
        ...task,
        after: task.skill ? [...(task.after ?? []), `Absorb/${task.skill.name}`] : task.after,
        combat: (task.combat ?? new CombatStrategy()).ignoreSoftBanish(), // killing targetting monsters is set in the engine
        limit: { soft: 25 },
      };
      if (result.outfit === undefined) result.outfit = { equip: $items`miniature crystal ball` };
      return result;
    }),
  ],
};
