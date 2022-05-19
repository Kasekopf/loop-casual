import { Familiar, getWorkshed, Item, mallPrice, print, printHtml, visitUrl } from "kolmafia";
import { $familiar, $item, $monster, CombatLoversLocket, get, have } from "libram";
import { pulls } from "./tasks/misc";

type Thing = Item | Familiar | [boolean, string];
interface Requirement {
  thing: Thing;
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
    { thing: $familiar`Melodramedary`, why: "Desert progress" },
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
      thing: [
        have($item`cold medicine cabinet`) || getWorkshed() === $item`cold medicine cabinet`,
        "Cold medicine cabinet",
      ],
      why: "QoL Equipment",
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
      why: "War outfit",
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
      thing: [
        new Set(CombatLoversLocket.unlockedLocketMonsters()).has($monster`pygmy witch lawyer`),
        "combat lover's locket (Pygmy witch lawyer locketed)",
      ],
      why: "Reminiscing for Infinite Loop",
    },
    {
      thing: [
        new Set(CombatLoversLocket.unlockedLocketMonsters()).has($monster`mountain man`),
        "combat lover's locket (Mountain man)",
      ],
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
      thing: [
        have($item`cosmic bowling ball`) || get("cosmicBowlingBallReturnCombats", -1) >= 0,
        "Cosmic bowling ball",
      ],
      why: "Banishes, Pygmy killing",
    },
    {
      thing: [visitUrl("questlog.php?which=1").includes("questlog.php?which=6"), "Monster Manuel"],
      why: "Checking for monster HP in combat macro",
    },
    {
      thing: $familiar`Vampire Vintner`,
      why: "Pygmy killing",
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
  ];
  return requirements;
}

function buildPullList(): Requirement[] {
  return pulls
    .filter((item) => mallPrice(item) >= 50000 || mallPrice(item) === 0)
    .map((item) => ({ thing: item, why: "Pull" }));
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
    "Checking your character... Legend: <font color='#888888'>Have</font> / <font color='red'>Missing & Required</font> / <font color='black'>Missing & Optional"
  );
  for (const [name, requirements] of categories) {
    if (requirements.length === 0) continue;

    const requirements_info: [boolean, string, Requirement][] = requirements.map((req) => {
      return Array.isArray(req.thing)
        ? [req.thing[0], req.thing[1], req]
        : [
            have(req.thing),
            req.thing instanceof Familiar ? req.thing.hatchling.name : req.thing.name,
            req,
          ];
    });
    print(name, "blue");
    for (const [have_it, name, req] of requirements_info.sort((a, b) => a[1].localeCompare(b[1]))) {
      const color = have_it ? "#888888" : req.optional ? "black" : "red";
      if (!have_it && req.optional) missing_optional++;
      if (!have_it && !req.optional) missing++;
      print(`${name} - ${req.why}`, color);
    }
    print("");
  }

  // Print the count of missing things
  if (missing > 0) {
    print(
      `You are missing ${missing} required things. This script will not yet work for you.`,
      "red"
    );
    if (missing_optional > 0) print(`You are also missing ${missing} optional things.`);
  } else {
    if (missing_optional > 0) {
      print(
        `You are missing ${missing} optional things. This script should work, but it could do better.`
      );
    } else {
      print(`You have everything! You are the shiniest star. This script should work great.`);
    }
  }
}
