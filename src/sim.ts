import {
  Familiar,
  getCampground,
  getWorkshed,
  Item,
  mallPrice,
  Monster,
  print,
  printHtml,
  Skill,
  storageAmount,
} from "kolmafia";
import { $familiar, $item, $items, $monster, $skill, CombatLoversLocket, get, have } from "libram";
import { pullStrategy } from "./tasks/pulls";

class Hardcoded {
  have: boolean;
  name: string;

  constructor(have: boolean, name: string) {
    this.have = have;
    this.name = name;
  }
}

type Thing = Item | Familiar | Skill | Monster | Hardcoded;
interface Requirement {
  thing: Thing | Thing[];
  why: string;
  optional?: boolean;
}

/**
 * Return: a list of all things required to run the script.
 */
function buildIotmList(): Requirement[] {
  return [
    { thing: $familiar`Grey Goose`, why: "Adventures" },
    { thing: $item`Clan VIP Lounge key`, why: "YRs, +combat" },
    {
      thing: $item`industrial fire extinguisher`,
      why: "Harem outfit, Bat hole, stone wool, Crypt, Ultrahydrated",
      optional: true,
    },
    { thing: $familiar`Melodramedary`, why: "Desert progress", optional: true },
    {
      thing: $item`unwrapped knock-off retro superhero cape`,
      why: "Slay the dead in crypt, pygmy killing",
      optional: true,
    },
    {
      thing: $familiar`Shorter-Order Cook`,
      why: "Kill the Wall of Skin, initial exp",
      optional: true,
    },
    {
      thing: $item`Deck of Every Card`,
      why: "A key for the NS tower, stone wool, ore",
      optional: true,
    },
    {
      thing: new Hardcoded(
        have($item`cold medicine cabinet`) || getWorkshed() === $item`cold medicine cabinet`,
        "Cold medicine cabinet"
      ),
      why: "Get Extrovermectin for profit",
      optional: true,
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
      why: "Mountain man",
      optional: true,
    },
    {
      thing: $item`Powerful Glove`,
      why: "Pixels",
      optional: true,
    },
    {
      thing: $item`SpinMaster™ lathe`,
      why: "QoL equipment",
      optional: true,
    },
    {
      thing: $item`cursed magnifying glass`,
      why: "Delay",
      optional: true,
    },
    {
      thing: $item`backup camera`,
      why: "Lobsterfrogmen, ML, init",
      optional: true,
    },
    {
      thing: $item`combat lover's locket`,
      why: "Reminiscing",
      optional: true,
    },
    {
      thing: $item`miniature crystal ball`,
      why: "Monster prediction",
      optional: true,
    },
    {
      thing: $item`unbreakable umbrella`,
      why: "-combat modifier, ML",
      optional: true,
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
      why: "Amulet coin",
      optional: true,
    },
    {
      thing: new Hardcoded("haunted doghouse" in getCampground(), "haunted doghouse"),
      why: "Ghost dog chow",
      optional: true,
    },
    {
      thing: $item`SongBoom™ BoomBox`,
      why: "Meat and special seasonings",
      optional: true,
    },
    {
      thing: $item`hewn moon-rune spoon`,
      why: "Access to an extra monster absorb (see tune arg)",
      optional: true,
    },
    {
      thing: new Hardcoded(get("hasMaydayContract"), "MayDay™ contract"),
      why: "+combat, early meat",
      optional: true,
    },
    {
      thing: $item`June cleaver`,
      why: "Cold damage, QoL, sometimes +famexp and +adv",
      optional: true,
    },
    {
      thing: $item`designer sweatpants`,
      why: "Sleaze damage",
      optional: true,
    },
    {
      thing: $item`Jurassic Parka`,
      why: "Meat, ML, QoL (in moxie sign)",
      optional: true,
    },
    {
      thing: $item`Fourth of May Cosplay Saber`,
      why: "Lobsterfrogmen, res",
      optional: true,
    },
    {
      thing: $familiar`Space Jellyfish`,
      why: 'Stench jellies for profit; see the argument "jellies"',
      optional: true,
    },
    {
      thing: new Hardcoded(
        have($item`model train set`) || getWorkshed() === $item`model train set`,
        "Cold medicine cabinet"
      ),
      why: "Meat, MP, Ore, Orc bridge parts, and res",
      optional: true,
    },
  ];
}

function buildLocketList(): Requirement[] {
  return [
    {
      thing: $monster`pygmy witch lawyer`,
      why: "Infinite Loop",
      optional: true,
    },
    {
      thing: $monster`mountain man`,
      why: "Ore",
      optional: true,
    },
    {
      thing: $monster`Spectral Jellyfish`,
      why: "-Combat skill",
      optional: true,
    },
    {
      thing: $monster`anglerbush`,
      why: "Meat skill",
      optional: true,
    },
    {
      thing: $monster`Big Wheelin' Twins`,
      why: "Init skill",
      optional: true,
    },
  ];
}

function buildMiscList(): Requirement[] {
  return [
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
      why: "Amulet coin, with clip art",
      optional: true,
    },
    {
      thing: $items`Great Wolf's rocket launcher, Drunkula's bell`,
      why: "Kill the wall of bones (with delaytower)",
      optional: true,
    },
    {
      thing: new Hardcoded(get("poolSharkCount") >= 25, "Permanent pool skill from A Shark's Chum"),
      why: "Haunted billiards room",
      optional: true,
    },
  ];
}

function buildPullList(): Requirement[] {
  const result: Requirement[] = [];
  for (const pull of pullStrategy.pulls) {
    const items = pull.items().filter((item) => item) as Item[];

    // Ignore dynamic item selection for now
    if (items.length === 0) continue;

    // For cheap items, we will just buy it during the run
    const big_items = items.filter((item) => mallPrice(item) === 0 || mallPrice(item) > 100000);
    if (big_items.length < items.length) continue;

    result.push({ thing: big_items, why: pull.description ?? "Pull", optional: pull.optional });
  }
  return result;
}

function checkThing(thing: Thing): [boolean, string] {
  if (thing instanceof Hardcoded) return [thing.have, thing.name];
  if (thing instanceof Familiar) return [have(thing), thing.hatchling.name];
  if (thing instanceof Skill) return [have(thing), thing.name];
  if (thing instanceof Monster)
    return [new Set(CombatLoversLocket.unlockedLocketMonsters()).has(thing), thing.name];
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
    ["Combat Lover's Locket Monsters (Optional)", buildLocketList()],
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
