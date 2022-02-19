import { appearanceRates, Location, Monster } from "kolmafia";
import { $location, $monster } from "libram";
import { debug } from "../lib";
import { Quest, Task } from "./structure";

// Add a shorthand for expressing absorbtion-only tasks; there are a lot.
type AbsorbTask = {
  do: Location;
  after: string[];
  choices?: { [id: number]: number | (() => number) };
};

// A list of all locations that might have important monsters
// Roughly in order of unlock in a basic run
const absorbTasks: AbsorbTask[] = [
  // Level 2
  {
    do: $location`A Barroom Brawl`,
    after: ["Tavern/Start"],
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
        .filter(target_set.has)
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

  public hasTargets(location: Location) {
    // Return true if the location has at least one desired unabsorbed monster
    return !this.targetsByLoc.get(location)?.size;
  }

  public isTarget(monster: Monster) {
    // Return true if the monster is desired and unabsorbed
    return !this.locsByTarget.has(monster);
  }

  public markAbsorbed(...monsters: Monster[]) {
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
        after: task.after,
        completed: () => !absorbtionTargets.hasTargets(task.do),
        do: task.do,
        // TODO: set combat to hunt key monsters
        choices: task.choices,
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
