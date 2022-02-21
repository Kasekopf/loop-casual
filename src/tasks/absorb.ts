import { appearanceRates, Location, Monster, myAscensions } from "kolmafia";
import { $items, $location, $monster, get } from "libram";
import { debug } from "../lib";
import { Quest, Task } from "./structure";

// Add a shorthand for expressing absorbtion-only tasks; there are a lot.
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
    after: ["Bat/Use Sonar"],
  },
  {
    do: $location`Guano Junction`,
    after: ["Bat/Use Sonar"],
    choices: { 1427: 2 },
  },
  {
    do: $location`The Batrat and Ratbat Burrow`,
    after: ["Bat/Use Sonar", "Palindome/Bat Snake"],
  },
  {
    do: $location`The Beanbat Chamber`,
    after: ["Bat/Use Sonar", "Giant/Grow Beanstalk"],
  },
  // Level 5
  {
    do: $location`The Outskirts of Cobb's Knob`,
    after: ["Knob/Outskirts"],
    choices: { 111: 3, 113: 2, 118: 1 },
    outfit: { modifier: "+combat" },
  },
  {
    do: $location`Cobb's Knob Kitchens`,
    after: ["Knob/Outskirts"],
  },
  {
    do: $location`Cobb's Knob Barracks`,
    after: ["Knob/Outskirts"],
    choices: { 522: 2 },
  },
  {
    do: $location`Cobb's Knob Harem`,
    after: ["Knob/King"],
  },
  {
    do: $location`Cobb's Knob Treasury`,
    after: ["Knob/Outskirts"],
    outfit: { modifier: "+combat" },
  },
  {
    do: $location`Cobb's Knob Laboratory`,
    after: ["Knob/King"],
  },
  {
    do: $location`The Knob Shaft`,
    after: ["Knob/King"],
    outfit: { modifier: "+combat" },
  },
  {
    do: $location`Cobb's Knob Menagerie, Level 1`,
    after: ["Knob/King"], // TODO: Menagerie key
  },
  {
    do: $location`Cobb's Knob Menagerie, Level 2`,
    after: ["Knob/King"], // TODO: Menagerie key
  },
  {
    do: $location`Cobb's Knob Menagerie, Level 3`,
    after: ["Knob/King"], // TODO: Menagerie key
  },
  // Level 6
  {
    do: $location`Pandamonium Slums`,
    after: ["Friar/Finish"],
  },
  {
    do: $location`The Laugh Floor`,
    after: ["Friar/Finish"],
  },
  {
    do: $location`Infernal Rackets Backstage`,
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
    after: ["McLargeHuge/Ores"],
    choices: { 18: 3, 19: 3, 20: 3, 556: 2 },
    outfit: { modifier: "+combat" },
  },
  {
    do: $location`The Goatlet`,
    after: ["McLargeHuge/Ores"],
  },
  {
    do: $location`Lair of the Ninja Snowmen`,
    after: ["McLargeHuge/Climb", "Palindome/Cold Snake"],
  },
  {
    do: $location`The eXtreme Slope`,
    after: ["McLargeHuge/Climb"],
    choices: { 15: 3, 16: 3, 17: 3, 575: 3 },
    outfit: { modifier: "+combat" },
  },
  {
    do: $location`The Icy Peak`,
    after: ["McLargeHuge/Peak"],
    outfit: { modifier: "cold res min 5, +combat" },
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
  },
  {
    do: $location`Twin Peak`,
    after: ["Orc Chasm/Twin Init"],
  },
  {
    do: $location`Oil Peak`,
    after: ["Orc Chasm/Oil Peak"],
  },
  {
    do: $location`The Valley of Rof L'm Fao`,
    after: ["Orc Chasm/Finish"],
  },
  // Level 10
  {
    do: $location`The Penultimate Fantasy Airship`,
    after: ["Giant/Airship"],
    outfit: { modifier: "+combat" },
    choices: { 178: 2, 182: 2 },
  },
  {
    do: $location`The Castle in the Clouds in the Sky (Basement)`,
    after: ["Giant/Basement Finish"],
    outfit: { modifier: "+combat" },
    choices: { 670: 5, 669: 1, 671: 3 },
  },
  {
    do: $location`The Castle in the Clouds in the Sky (Ground Floor)`,
    after: ["Giant/Ground"],
    outfit: { modifier: "+combat" },
    choices: { 672: 3, 673: 3, 674: 3, 1026: 3 },
  },
  {
    do: $location`The Castle in the Clouds in the Sky (Top Floor)`,
    after: ["Giant/Top Floor", "Palindome/Hot Snake Postcastle"],
    outfit: { modifier: "+combat" },
    choices: { 675: 4, 676: 4, 677: 4, 678: 1, 679: 1, 1431: 4 },
  },
  {
    do: $location`The Hole in the Sky`,
    after: ["Giant/Finish"], // TODO: Unlock
  },
  // Level 11
  {
    do: $location`The Black Forest`,
    after: ["Macguffin/Forest"],
    outfit: { modifier: "+combat" },
    choices: { 923: 1, 924: 1 },
  },
  // Level 11: Hidden City
  {
    do: $location`The Hidden Temple`,
    after: ["Hidden City/Open City"],
    outfit: { modifier: "+combat" },
    choices: {
      579: () => {
        return get("lastTempleAdventures") === myAscensions() ? 2 : 1;
      },
      581: 3,
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
    outfit: { modifier: "+combat" },
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
  },
  {
    do: $location`The Haunted Gallery`,
    after: ["Manor/Gallery"],
    outfit: { modifier: "+combat" },
    choices: { 89: 6, 896: 1 },
  },
  {
    do: $location`The Haunted Bathroom`,
    after: ["Manor/Bathroom"],
    outfit: { modifier: "+combat" },
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
    outfit: { modifier: "+combat" },
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
    do: $location`The Haunted Storage Room`,
    after: ["Manor/Finish Floor2"], // TODO: open
    choices: { 886: 4, 890: 1 },
  },
  {
    do: $location`The Haunted Nursery`,
    after: ["Manor/Finish Floor2"], // TODO: open
    choices: { 884: 4, 898: 2 },
  },
  {
    do: $location`The Haunted Laboratory`,
    after: ["Manor/Finish Floor2"], // TODO: open
    choices: { 884: 4, 903: 2 },
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
    outfit: { modifier: "+combat", equip: $items`Talisman o' Namsilat` },
    choices: { 2: 2, 126: 1, 127: 1, 180: 2 },
  },
  {
    do: $location`Whitey's Grove`,
    after: ["Palindome/Open Alarm"],
    outfit: { modifier: "+combat" },
    choices: { 73: 3, 74: 2, 75: 2 },
  },
  // Level 11: Pyramid
  {
    do: $location`The Arid, Extra-Dry Desert`,
    after: ["Macguffin/Desert"],
  },
  {
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
];

// All monsters that give adventures upon absorbtion
const adventureMonsters: Monster[] = [
  $monster`1335 HaXx0r`,
  $monster`albino bat`,
  $monster`Alphabet Giant`,
  $monster`animated rustic nightstand`,
  $monster`banshee librarian`,
  $monster`baseball bat`,
  $monster`BASIC Elemental`,
  $monster`basic lihc`,
  $monster`batrat`,
  $monster`Battlie Knight Ghost`,
  $monster`black magic woman`,
  $monster`blur`,
  $monster`Bob Racecar`,
  $monster`Booze Giant`,
  $monster`Bubblemint Twins`,
  $monster`Bullet Bill`,
  $monster`CH Imp`,
  $monster`chalkdust wraith`,
  $monster`cloud of disembodied whiskers`,
  $monster`coaltergeist`,
  $monster`dire pigeon`,
  $monster`dopey 7-Foot Dwarf`,
  $monster`eXtreme Orcish snowboarder`,
  $monster`fleet woodsman`,
  $monster`G imp`,
  $monster`ghost miner`,
  $monster`gingerbread murderer`,
  $monster`gluttonous ghuol`,
  $monster`Grass Elemental`,
  $monster`grave rober`,
  $monster`grave rober zmobie`,
  $monster`guy with a pitchfork, and his wife`,
  $monster`Iiti Kitty`,
  $monster`irate mariachi`,
  $monster`Irritating Series of Random Encounters`,
  $monster`junksprite sharpener`,
  $monster`Knob Goblin Bean Counter`,
  $monster`Knob Goblin Madam`,
  $monster`Knob Goblin Master Chef`,
  $monster`Knob Goblin Very Mad Scientist`,
  $monster`L imp`,
  $monster`mad wino`,
  $monster`magical fruit bat`,
  $monster`Mob Penguin Capo`,
  $monster`model skeleton`,
  $monster`Ninja Snowman Janitor`,
  $monster`oil baron`,
  $monster`One-Eyed Willie`,
  $monster`P imp`,
  $monster`party skelteon`,
  $monster`plastered frat orc`,
  $monster`possessed silverware drawer`,
  $monster`possessed toy chest`,
  $monster`pygmy blowgunner`,
  $monster`pygmy headhunter`,
  $monster`pygmy orderlies`,
  $monster`pygmy shaman`,
  $monster`Racecar Bob`,
  $monster`Raver Giant`,
  $monster`Renaissance Giant`,
  $monster`revolving bugbear`,
  $monster`rushing bum`,
  $monster`sabre-toothed goat`,
  $monster`serialbus`,
  $monster`sheet ghost`,
  $monster`shifty pirate`,
  $monster`skeletal hamster`,
  $monster`smut orc pipelayer`,
  $monster`Sub-Assistant Knob Mad Scientist`,
  $monster`swarm of fire ants`,
  $monster`swarm of killer bees`,
  $monster`swarm of Knob lice`,
  $monster`swarm of skulls`,
  $monster`tapdancing skeleton`,
  $monster`toilet papergeist`,
  $monster`tomb asp`,
  $monster`undead elbow macaroni`,
  $monster`upgraded ram`,
  $monster`vicious gnauga`,
  $monster`W imp`,
  $monster`warwelf`,
  $monster`whitesnake`,
];

// A many-to-many map to track the remaining monsters at each location
class AbsorbtionTargets {
  private targetsByLoc = new Map<Location, Set<Monster>>();
  private locsByTarget = new Map<Monster, Set<Location>>();

  constructor(targets: Monster[]) {
    const target_set = new Set(targets);
    for (const location of Location.all()) {
      Object.entries(appearanceRates(location))
        .filter((i) => i[1] > 0)
        .map((i) => Monster.get<Monster>(i[0]))
        .filter((m) => target_set.has(m))
        .map((monster) => this.add(monster, location));
    }
  }

  add(monster: Monster, location: Location) {
    if (!this.targetsByLoc.has(location)) this.targetsByLoc.set(location, new Set());
    this.targetsByLoc.get(location)?.add(monster);
    if (!this.locsByTarget.has(monster)) this.locsByTarget.set(monster, new Set());
    this.locsByTarget.get(monster)?.add(location);
  }

  delete(monster: Monster) {
    for (const loc of this.locsByTarget.get(monster) ?? []) {
      this.targetsByLoc.get(loc)?.delete(monster);
    }
    this.locsByTarget.delete(monster);
  }

  public completed(): boolean {
    // Return true if we have absorbed all desired monsters
    return this.locsByTarget.size === 0;
  }

  public remaining(): IterableIterator<Monster> {
    // Return all remaining desired and unabsorbed monsters
    return this.locsByTarget.keys();
  }

  public hasTargets(location: Location): boolean {
    // Return true if the location has at least one desired unabsorbed monster
    return !this.targetsByLoc.get(location)?.size;
  }

  public isTarget(monster: Monster): boolean {
    // Return true if the monster is desired and unabsorbed
    return !this.locsByTarget.has(monster);
  }

  public markAbsorbed(...monsters: Monster[]): void {
    for (const monster of monsters) this.delete(monster);
  }
}
export const absorbtionTargets = new AbsorbtionTargets(adventureMonsters);

export const AbsorbQuest: Quest = {
  name: "Absorb",
  tasks: [
    // Construct a full Task from each minimally-specified AbsorbTask
    ...absorbTasks.map((task): Task => {
      return {
        name: task.do.zone,
        completed: () => !absorbtionTargets.hasTargets(task.do),
        // TODO: set combat to hunt key monsters
        ...task,
        limit: { soft: 20 },
      };
    }),
    {
      // Add a last task that tracks if all monsters have been absorbed
      name: "All",
      after: absorbTasks.map((task) => task.do.zone),
      completed: absorbtionTargets.completed,
      do: (): void => {
        debug("Remaining monsters:", "red");
        for (const monster of absorbtionTargets.remaining()) {
          debug(`${monster.name}`, "red");
        }
        throw "Unable to absorb all target monsters";
      },
      limit: { tries: 1 },
      freeaction: true,
    },
  ],
};
