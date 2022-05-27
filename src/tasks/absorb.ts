import {
  appearanceRates,
  canadiaAvailable,
  familiarWeight,
  gnomadsAvailable,
  itemAmount,
  knollAvailable,
  Location,
  Monster,
  myAscensions,
  putCloset,
  runChoice,
  Skill,
  use,
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
  $skills,
  get,
  have,
  Macro,
} from "libram";
import { CombatStrategy } from "../combat";
import { atLevel } from "../lib";
import { OverridePriority } from "../priority";
import { Quest, step, Task } from "./structure";

// Add a shorthand for expressing absorption-only tasks; there are a lot.
interface AbsorbTask extends Omit<Task, "name" | "limit" | "completed"> {
  do: Location;
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
    after: ["Bat/Get Sonar 3"],
    choices: { 1427: 2 },
  },
  {
    do: $location`The Batrat and Ratbat Burrow`,
    after: ["Bat/Use Sonar 1", "Palindome/Bat Snake"],
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
  },
  {
    do: $location`Cobb's Knob Menagerie, Level 3`,
    after: ["Knob/Open Menagerie"],
  },
  // Level 6
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
  },
  // Level 7
  {
    do: $location`The VERY Unquiet Garves`,
    after: ["Crypt/Finish"],
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
    outfit: { modifier: "cold res 5min, +combat", equip: $items`miniature crystal ball` },
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
    after: ["Orc Chasm/ABoo Peak"],
    combat: new CombatStrategy().macro(new Macro().attack().repeat()),
  },
  {
    do: $location`Twin Peak`,
    after: ["Orc Chasm/Twin Init"],
  },
  // {
  //   do: $location`Oil Peak`,
  //   after: ["Orc Chasm/Oil Peak"],
  //   prepare: () => {
  //     if (numericModifier("ML") >= 100) throw `ML is too high to encounter oil cartels`;
  //   },
  //   outfit: { modifier: "moxie, ML 50min 50max" },
  // },
  {
    do: $location`The Valley of Rof L'm Fao`,
    after: ["Orc Chasm/Finish"],
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
    choices: { 670: 5, 669: 1, 671: 3 },
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
    choices: { 675: 4, 676: 4, 677: 4, 678: 1, 679: 1, 1431: 4 },
  },
  {
    do: $location`The Hole in the Sky`,
    after: ["Keys/Star Key"],
  },
  // Level 11
  {
    do: $location`The Black Forest`,
    after: ["Macguffin/Forest"],
    outfit: { modifier: "+combat", equip: $items`miniature crystal ball` },
    choices: { 923: 1, 924: 1 },
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
      581: 3,
    },
  },
  {
    do: $location`The Hidden Park`,
    after: ["Hidden City/Open City", "Hidden City/Banish Janitors"],
    choices: {
      789: () => {
        return get("relocatePygmyJanitor") === myAscensions() ? 2 : 3;
      },
    },
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
  },
  {
    do: $location`The Haunted Kitchen`,
    after: ["Manor/Kitchen"],
    choices: { 893: 2 },
  },
  {
    do: $location`The Haunted Billiards Room`,
    after: ["Manor/Billiards"],
    choices: { 900: 2 },
  },
  {
    do: $location`The Haunted Library`,
    after: ["Manor/Library"],
    choices: { 163: 4, 888: 4, 889: 5, 894: 1 },
    combat: new CombatStrategy().macro(new Macro().attack().repeat(), $monster`chalkdust wraith`),
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
    choices: { 884: 6, 898: 2 },
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
        ? OverridePriority.Effect
        : OverridePriority.None,
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
  {
    do: $location`South of the Border`,
    after: ["Misc/Unlock Beach"],
    choices: { 4: 3 },
    outfit: { modifier: "+combat", equip: $items`miniature crystal ball` },
  },
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
  },
  {
    do: $location`The Dungeons of Doom`,
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
const reprocessTargets: Monster[] = [
  // 10 adv monsters
  $monster`1335 HaXx0r`,
  $monster`Alphabet Giant`,
  $monster`black magic woman`,
  $monster`blur`,
  $monster`Bob Racecar`,
  $monster`coaltergeist`,
  $monster`fleet woodsman`,
  $monster`Iiti Kitty`,
  $monster`Irritating Series of Random Encounters`,
  $monster`Little Man in the Canoe`,
  $monster`mad wino`,
  $monster`Mob Penguin Capo`,
  $monster`One-Eyed Willie`,
  $monster`pygmy blowgunner`,
  $monster`pygmy headhunter`,
  $monster`pygmy orderlies`,
  $monster`pygmy shaman`,
  $monster`Racecar Bob`,
  $monster`Raver Giant`,
  $monster`Renaissance Giant`,
  $monster`swarm of fire ants`,
  $monster`tomb asp`,
  // 7 adv monsters
  $monster`animated rustic nightstand`,
  $monster`basic lihc`,
  $monster`Battlie Knight Ghost`,
  $monster`Bubblemint Twins`,
  $monster`CH Imp`,
  $monster`chalkdust wraith`,
  $monster`cloud of disembodied whiskers`,
  $monster`eXtreme Orcish snowboarder`,
  $monster`gluttonous ghuol`,
  $monster`Grass Elemental`,
  $monster`grave rober zmobie`,
  $monster`guy with a pitchfork, and his wife`,
  $monster`junksprite sharpener`,
  $monster`Knob Goblin Very Mad Scientist`,
  $monster`model skeleton`,
  $monster`Ninja Snowman Janitor`,
  $monster`oil baron`,
  $monster`party skelteon`,
  $monster`possessed silverware drawer`,
  $monster`possessed toy chest`,
  $monster`revolving bugbear`,
  $monster`sabre-toothed goat`,
  $monster`serialbus`,
  $monster`sheet ghost`,
  $monster`skeletal hamster`,
  $monster`smut orc pipelayer`,
  $monster`swarm of killer bees`,
  $monster`tapdancing skeleton`,
  $monster`toilet papergeist`,
  $monster`upgraded ram`,
  $monster`vicious gnauga`,
  $monster`whitesnake`,
  $monster`Booze Giant`,
  // 5 adv monsters
  $monster`dire pigeon`,
  $monster`gingerbread murderer`,
  $monster`grave rober`,
  $monster`irate mariachi`,
  $monster`plastered frat orc`,
  $monster`swarm of skulls`,
  $monster`albino bat`,
  $monster`batrat`,
  $monster`G imp`,
  $monster`Knob Goblin Bean Counter`,
  $monster`Knob Goblin Madam`,
  $monster`Knob Goblin Master Chef`,
  $monster`L imp`,
  $monster`magical fruit bat`,
  $monster`P imp`,
  $monster`swarm of Knob lice`,
  $monster`W imp`,
  $monster`warwelf`,
];

// Other monsters that give skills
const usefulMonsters: [Monster, Skill][] = [
  [$monster`anglerbush`, $skill`Ponzi Apparatus`],
  [$monster`animated ornate nightstand`, $skill`Ominous Substrate`],
  [$monster`Astronomer`, $skill`Innuendo Circuitry`],
  [$monster`beanbat`, $skill`Exhaust Tubules`],
  [$monster`Big Wheelin' Twins`, $skill`Overclocking`],
  [$monster`black panther`, $skill`Photonic Shroud`],
  [$monster`Carnivorous Moxie Weed`, $skill`Fluid Dynamics Simulation`],
  [$monster`Claybender Sorcerer Ghost`, $skill`Ectogenesis`],
  [$monster`Cobb's Knob oven`, $skill`Microburner`],
  [$monster`cubist bull`, $skill`Localized Vacuum`],
  [$monster`demonic icebox`, $skill`Infernal Automata`],
  [$monster`drunk goat`, $skill`Secondary Fermentation`],
  [$monster`drunk pygmy`, $skill`Double Nanovision`],
  [$monster`eXtreme cross-country hippy`, $skill`Microweave`],
  [$monster`Flock of Stab-bats`, $skill`AUTOEXEC.BAT`],
  [$monster`junksprite bender`, $skill`Propagation Drive`],
  [$monster`Knob Goblin Harem Girl`, $skill`Camp Subroutines`],
  [$monster`Knob Goblin MBA`, $skill`Cryocurrency`],
  [$monster`lihc`, $skill`Curses Library`],
  [$monster`malevolent hair clog`, $skill`Clammy Microcilia`],
  [$monster`me4t begZ0r`, $skill`Financial Spreadsheets`],
  [$monster`mind flayer`, $skill`Hivemindedness`],
  [$monster`Ninja Snowman Weaponmaster`, $skill`Cooling Tubules`],
  // [$monster`oil slick`, $skill`Lubricant Layer`],
  [$monster`pine bat`, $skill`Conifer Polymers`],
  [$monster`possessed wine rack`, $skill`Legacy Code`],
  [$monster`pygmy janitor`, $skill`System Sweep`],
  [$monster`pygmy witch lawyer`, $skill`Infinite Loop`],
  [$monster`raging bull`, $skill`Ire Proof`],
  [$monster`ratbat`, $skill`Nanofur`],
  [$monster`smut orc screwer`, $skill`Procgen Ribaldry`],
  [$monster`Snow Queen`, $skill`Snow-Cooling System`],
  [$monster`Spectral Jellyfish`, $skill`Phase Shift`],
  [$monster`spooky vampire`, $skill`Autovampirism Routines`],
  [$monster`steam elemental`, $skill`Steam Mycelia`],
  [$monster`suckubus`, $skill`Gravitational Compression`],
  [$monster`Boss Bat`, $skill`Grey Noise`],
  [$monster`werecougar`, $skill`Anti-Sleaze Recursion`],
  [$monster`white lion`, $skill`Piezoelectric Honk`],
];

// A many-to-many map used to track the remaining monsters at each location
class ManyToMany<A, B> {
  private aByB = new Map<B, Set<A>>();
  private bByA = new Map<A, Set<B>>();

  public add(a: A, b: B): void {
    if (!this.aByB.has(b)) this.aByB.set(b, new Set());
    this.aByB.get(b)?.add(a);
    if (!this.bByA.has(a)) this.bByA.set(a, new Set());
    this.bByA.get(a)?.add(b);
  }

  public delete(a: A): void {
    for (const b of this.bByA.get(a) ?? []) {
      this.aByB.get(b)?.delete(a);
    }
    this.bByA.delete(a);
  }

  public hasB(b: B): boolean {
    return (this.aByB.get(b)?.size ?? 0) > 0;
  }

  public remaining(b?: B): IterableIterator<A> | Set<A> | A[] {
    // Return all remaining A in the many-to-many map
    if (b === undefined) {
      return this.bByA.keys();
    } else {
      return this.aByB.get(b) ?? [];
    }
  }

  public hasA(a: A): boolean {
    return this.bByA.has(a);
  }

  public empty(): boolean {
    return this.bByA.size === 0;
  }
}

export class AbsorptionTargets {
  private absorb = new ManyToMany<Monster, Location>();
  private reprocess = new ManyToMany<Monster, Location>();
  private targetsBySkill = new Map<Skill, Monster>();

  constructor(reprocess: Monster[], absorb: [Monster, Skill][]) {
    const reprocess_set = new Set(reprocess);
    const absorb_set = new Set<Monster>();
    for (const target of absorb) {
      absorb_set.add(target[0]);
      this.targetsBySkill.set(target[1], target[0]);
    }

    for (const location of Location.all()) {
      Object.entries(appearanceRates(location))
        .filter((i) => i[1] > 0)
        .map((i) => Monster.get<Monster>(i[0]))
        .map((monster) => {
          if (reprocess_set.has(monster)) {
            this.absorb.add(monster, location);
            this.reprocess.add(monster, location);
          } else if (absorb_set.has(monster)) {
            this.absorb.add(monster, location);
          }
        });
    }

    // Include janitor at all possible locations
    this.absorb.add($monster`pygmy janitor`, $location`The Hidden Apartment Building`);
    this.absorb.add($monster`pygmy janitor`, $location`The Hidden Bowling Alley`);
    this.absorb.add($monster`pygmy janitor`, $location`The Hidden Hospital`);
    this.absorb.add($monster`pygmy janitor`, $location`The Hidden Office Building`);
    this.absorb.add($monster`pygmy janitor`, $location`The Hidden Park`);
  }

  public completed(): boolean {
    // Return true if we have absorbed all desired monsters
    return this.absorb.empty();
  }

  public remainingReprocess(
    location?: Location
  ): IterableIterator<Monster> | Set<Monster> | Monster[] {
    // Return all remaining desired and unabsorbed monsters, in this location or everywhere
    return this.reprocess.remaining(location);
  }

  public remainingAbsorbs(
    location?: Location
  ): IterableIterator<Monster> | Set<Monster> | Monster[] {
    // Return all remaining desired and unabsorbed monsters, in this location or everywhere
    return this.absorb.remaining(location);
  }

  public hasTargets(location: Location): boolean {
    // Return true if the location has at least one desired unabsorbed monster
    return this.absorb.hasB(location);
  }

  public hasReprocessTargets(location: Location): boolean {
    // Return true if the location has at least one desired unabsorbed monster we desire to reprocess
    return this.reprocess.hasB(location);
  }

  public isTarget(monster: Monster): boolean {
    // Return true if the monster is desired and unabsorbed
    return this.absorb.hasA(monster);
  }

  public isReprocessTarget(monster: Monster): boolean {
    // Return true if the monster is desired and unreprocessed
    return this.reprocess.hasA(monster);
  }

  markAbsorbed(monster: Monster | undefined): void {
    if (monster !== undefined) this.absorb.delete(monster);
  }

  markObtained(skill: Skill): void {
    this.markAbsorbed(this.targetsBySkill.get(skill));
  }

  markReprocessed(monster: Monster) {
    this.reprocess.delete(monster);
  }

  public updateAbsorbed(): void {
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
        this.markAbsorbed(Monster.get(name));
      }
    } while (match);

    // Mark down all absorbed monsters that gave skills
    const skill_regex = new RegExp(
      /<a onClick='javascript:poop\("[^"]*","skill", \d+, \d+\)'>([^<]*)<\/a>/g
    );
    do {
      match = skill_regex.exec(charsheet);
      if (match) {
        this.markObtained(Skill.get(match[1]));
      }
    } while (match);

    get("gooseReprocessed")
      .split(",")
      .map((id) => parseInt(id))
      .filter((id) => id > 0)
      .map((id) => Monster.get(id))
      .map((monster) => this.markReprocessed(monster));
  }

  public ignoreUselessAbsorbs(): void {
    // Ignore the elemental skills that are not useful for the tower
    const needed_elem_skills: { [elem: string]: Skill[] } = {
      hot: $skills`Microburner, Infernal Automata, Steam Mycelia`,
      cold: $skills`Cryocurrency, Cooling Tubules, Snow-Cooling System`,
      spooky: $skills`Curses Library, Ominous Substrate, Legacy Code`,
      stench: $skills`Exhaust Tubules, Secondary Fermentation, AUTOEXEC.BAT`,
      sleaze: $skills`Camp Subroutines, Procgen Ribaldry, Innuendo Circuitry`,
    };
    for (const elem in needed_elem_skills) {
      if (get("nsChallenge2") !== elem) {
        for (const unneeded_skill of needed_elem_skills[elem]) {
          this.markObtained(unneeded_skill);
        }
      }
    }

    // Ignore skills after the NS is defeated
    if (step("questL13Final") > 11) {
      for (const skill of this.targetsBySkill.keys()) {
        this.markObtained(skill);
      }
    }
  }
}

export const absorptionTargets = new AbsorptionTargets(reprocessTargets, usefulMonsters);

export const AbsorbQuest: Quest = {
  name: "Absorb",
  tasks: [
    // Construct a full Task from each minimally-specified AbsorbTask.
    ...absorbTasks.map((task): Task => {
      const result = {
        name: task.do.toString(),
        completed: () => !absorptionTargets.hasTargets(task.do),
        ...task,
        combat: (task.combat ?? new CombatStrategy()).ignore(), // killing targetting monsters is set in the engine
        limit: { soft: 20 },
      };
      if (result.outfit === undefined) result.outfit = { equip: $items`miniature crystal ball` };
      return result;
    }),
    {
      // Add a last task that tracks if all monsters have been absorbed
      name: "All",
      after: absorbTasks.map((task) => task.do.toString()),
      ready: () => false,
      completed: () => absorptionTargets.completed(),
      do: (): void => {
        throw "Unable to absorb all target monsters";
      },
      limit: { tries: 1 },
      freeaction: true,
    },
  ],
};

export const ReprocessQuest: Quest = {
  name: "Reprocess",
  tasks: [
    // Construct a full Task from each minimally-specified AbsorbTask.
    ...absorbTasks.map((task): Task => {
      const result = {
        name: task.do.toString(),
        completed: () => !absorptionTargets.hasReprocessTargets(task.do),
        ...task,
        after: [...task.after, `Absorb/${task.do.toString()}`],
        ready: () =>
          (task.ready === undefined || task.ready()) && familiarWeight($familiar`Grey Goose`) >= 6,
        combat: (task.combat ?? new CombatStrategy()).ignore(), // killing targetting monsters is set in the engine
        limit: { soft: 20 },
      };
      if (result.outfit === undefined) result.outfit = { equip: $items`miniature crystal ball` };
      return result;
    }),
    {
      // Add a last task that tracks if all monsters have been absorbed
      name: "All",
      after: absorbTasks.map((task) => task.do.toString()),
      ready: () => false,
      completed: () => absorptionTargets.completed(),
      do: (): void => {
        throw "Unable to reprocess all target monsters";
      },
      limit: { tries: 1 },
      freeaction: true,
    },
  ],
};
