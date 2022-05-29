import {
  Familiar,
  getCampground,
  getWorkshed,
  Item,
  mallPrice,
  print,
  printHtml,
  Skill,
  storageAmount,
} from "kolmafia";
import { $familiar, $item, $monster, $skill, CombatLoversLocket, get, have } from "libram";
import { pullStrategy } from "./tasks/pulls";

class Hardcoded {
  have: boolean;
  name: string;

  constructor(have: boolean, name: string) {
    this.have = have;
    this.name = name;
  }
}

type Thing = Item | Familiar | Skill | Hardcoded;
interface Requirement {
  thing: Thing | Thing[];
  why: string;
  optional?: boolean;
}

/**
 * Return: a list of all things required to run the script.
 */
function buildIotmList(): Requirement[] {
  const requirements: Requirement[] = [
    { thing: $familiar`Grey Goose`, why: "Adventures" },
    { thing: $item`Clan VIP Lounge key`, why: "YRs, -combat" },
    { thing: $item`industrial fire extinguisher`, why: "Ultrahydrated" },
    { thing: $familiar`Melodramedary`, why: "Desert progress", optional: true },
    {
      thing: $item`unwrapped knock-off retro superhero cape`,
      why: "Slay the dead in crypt, pygmy killing",
    },
    {
      thing: $familiar`Shorter-Order Cook`,
      why: "Kill the Wall of Skin, initial exp",
    },
    {
      thing: $item`Deck of Every Card`,
      why: "Get a key for the NS tower",
      optional: true,
    },
    {
      thing: new Hardcoded(
        have($item`cold medicine cabinet`) || getWorkshed() === $item`cold medicine cabinet`,
        "Cold medicine cabinet"
      ),
      why: "QoL Equipment",
    },
    {
      thing: $item`fresh coat of paint`,
      why: "Minor boosts in moxie sign",
      optional: true,
    },
    {
      thing: $item`protonic accelerator pack`,
      why: "Wanderers",
      optional: true,
    },
    {
      thing: $item`Cargo Cultist Shorts`,
      why: "War outfit",
      optional: true,
    },
    {
      thing: $item`Powerful Glove`,
      why: "Pixels and lobsterfrogmen",
      optional: true,
    },
    {
      thing: $item`SpinMaster™ lathe`,
      why: "Equipment",
      optional: true,
    },
    {
      thing: $item`cursed magnifying glass`,
      why: "Lobsterfrogmen, delay",
      optional: true,
    },
    {
      thing: $item`backup camera`,
      why: "Lobsterfrogmen, ML, init",
    },
    {
      thing: $item`combat lover's locket`,
      why: "Reminiscing",
    },
    {
      thing: new Hardcoded(
        new Set(CombatLoversLocket.unlockedLocketMonsters()).has($monster`pygmy witch lawyer`),
        "combat lover's locket (Pygmy witch lawyer locketed)"
      ),
      why: "Reminiscing for Infinite Loop",
    },
    {
      thing: new Hardcoded(
        new Set(CombatLoversLocket.unlockedLocketMonsters()).has($monster`mountain man`),
        "combat lover's locket (Mountain man)"
      ),
      why: "Reminiscing for Ore",
    },
    {
      thing: $item`miniature crystal ball`,
      why: "Monster prediction",
      optional: true,
    },
    {
      thing: $item`unbreakable umbrella`,
      why: "-combat modifier, ML",
    },
    {
      thing: new Hardcoded(
        have($item`cosmic bowling ball`) || get("cosmicBowlingBallReturnCombats", -1) >= 0,
        "Cosmic bowling ball"
      ),
      why: "Banishes, Pygmy killing",
      optional: true,
    },
    {
      thing: $familiar`Vampire Vintner`,
      why: "Pygmy killing",
      optional: true,
    },
    {
      thing: $skill`Summon Clip Art`,
      why: "For amulet coin (via familiar jacks)",
      optional: true,
    },
    {
      thing: new Hardcoded("haunted doghouse" in getCampground(), "haunted doghouse"),
      why: "For ghost dog chow",
      optional: true,
    },
  ];

  return requirements;
}

function buildMiscList(): Requirement[] {
  const requirements: Requirement[] = [
    {
      thing: $familiar`Oily Woim`,
      why: "Bonus initiative",
      optional: true,
    },
    {
      thing: $familiar`Hobo Monkey`,
      why: "Meat drops",
      optional: true,
    },
    {
      thing: $familiar`Cornbeefadon`,
      why: "For amulet coin, with clip art",
      optional: true,
    },
  ];
  return requirements;
}

function buildPullList(): Requirement[] {
  const result: Requirement[] = [];
  for (const pull of pullStrategy.pulls) {
    const items = pull.items().filter((item) => item) as Item[];

    // Ignore dynamic item selection for now
    if (items.length === 0) continue;

    // For cheap items, we will just buy it during the run
    if (items.find((item) => mallPrice(item) !== 0 && mallPrice(item) <= 100000)) continue;

    result.push({ thing: items, why: "Pull", optional: pull.optional });
  }
  return result;
}

function checkThing(thing: Thing): [boolean, string] {
  if (thing instanceof Hardcoded) return [thing.have, thing.name];
  if (thing instanceof Familiar) return [have(thing), thing.hatchling.name];
  if (thing instanceof Skill) return [have(thing), thing.name];
  return [have(thing) || storageAmount(thing) > 0, thing.name];
}

function check(req: Requirement): [boolean, string, Requirement] {
  if (Array.isArray(req.thing)) {
    const checks = req.thing.map(checkThing);

    return [
      checks.find((res) => res[0]) !== undefined,
      checks.map((res) => res[1]).join(" OR "),
      req,
    ];
  } else {
    const res = checkThing(req.thing);
    return [res[0], res[1], req];
  }
}

export function checkRequirements(): void {
  let missing_optional = 0;
  let missing = 0;

  const categories: [string, Requirement[]][] = [
    ["IoTMs", buildIotmList().filter((req) => !req.optional)],
    ["Miscellany", buildMiscList().filter((req) => !req.optional)],
    ["Expensive Pulls", buildPullList().filter((req) => !req.optional)],
    ["IoTMs (Optional)", buildIotmList().filter((req) => req.optional)],
    ["Miscellany (Optional)", buildMiscList().filter((req) => req.optional)],
    ["Expensive Pulls (Optional)", buildPullList().filter((req) => req.optional)],
  ];
  printHtml(
    "Checking your character... Legend: <font color='#888888'>✓ Have</font> / <font color='red'>X Missing & Required</font> / <font color='black'>X Missing & Optional"
  );
  for (const [name, requirements] of categories) {
    if (requirements.length === 0) continue;

    const requirements_info: [boolean, string, Requirement][] = requirements.map(check);
    print(name, "blue");
    for (const [have_it, name, req] of requirements_info.sort((a, b) => a[1].localeCompare(b[1]))) {
      const color = have_it ? "#888888" : req.optional ? "black" : "red";
      const symbol = have_it ? "✓" : "X";
      if (!have_it && req.optional) missing_optional++;
      if (!have_it && !req.optional) missing++;
      print(`${symbol} ${name} - ${req.why}`, color);
    }
    print("");
  }

  // Print the count of missing things
  if (missing > 0) {
    print(
      `You are missing ${missing} required things. This script will not yet work for you.`,
      "red"
    );
    if (missing_optional > 0) print(`You are also missing ${missing_optional} optional things.`);
  } else {
    if (missing_optional > 0) {
      print(
        `You are missing ${missing_optional} optional things. This script should work, but it could do better.`
      );
    } else {
      print(`You have everything! You are the shiniest star. This script should work great.`);
    }
  }
}
