import {
  availableAmount,
  buy,
  chew,
  cliExecute,
  drink,
  eat,
  haveEffect,
  Item,
  itemAmount,
  itemType,
  mallPrice,
  myAdventures,
  myDaycount,
  myFullness,
  myInebriety,
  myLevel,
  mySpleenUse,
  print,
  reverseNumberology,
  setProperty,
  turnsPerCast,
  use,
  useSkill,
} from "kolmafia";
import {
  $effect,
  $item,
  $items,
  $skill,
  Diet,
  get,
  getAverageAdventures,
  have,
  MenuItem,
  sumNumbers,
} from "libram";
import { args } from "../main";
import { Quest } from "./structure";

export const DietQuest: Quest = {
  name: "Diet",
  tasks: [
    {
      name: "Consume",
      after: [],
      completed: () =>
        myDaycount() > 1 || (myFullness() >= args.stomach && myInebriety() >= args.liver),
      ready: () => myLevel() >= 13 || myAdventures() <= 1,
      do: (): void => {
        if (have($item`astral six-pack`)) {
          use($item`astral six-pack`);
        }
        const MPA = args.voa;

        // Use the mime shotglass if available
        if (!get("_mimeArmyShotglassUsed") && have($item`mime army shotglass`)) {
          const shotglassDiet = Diet.plan(MPA, shotglassMenu(), { food: 0, booze: 1, spleen: 0 });
          consumeDiet(shotglassDiet, MPA);
        }

        // Compute a diet to bring us up to the desired usage
        const food = Math.max(args.stomach - myFullness(), 0);
        const booze = Math.max(args.liver - myInebriety(), 0);
        const spleen = Math.max(args.spleen - mySpleenUse(), 0);
        const plannedDiet = Diet.plan(MPA, menu(), {
          food: food,
          booze: booze,
          spleen: spleen,
        });

        // Eat the diet
        consumeDiet(plannedDiet, MPA);
      },
      limit: { tries: 1 },
      freeaction: true,
      noadventures: true,
    },
    {
      name: "Numberology",
      after: [],
      completed: () => get("_universeCalculated") >= get("skillLevel144"),
      ready: () => myAdventures() > 0 && Object.keys(reverseNumberology()).includes("69"),
      do: (): void => {
        cliExecute("numberology 69");
      },
      limit: { tries: 4 },
      freeaction: true,
      noadventures: true,
    },
    {
      name: "Sausage",
      after: ["Consume"],
      completed: () => !have($item`Kramco Sausage-o-Matic™`) || get("_sausagesEaten") >= 23, // Cap at 23 sausages to avoid burning through an entire supply
      ready: () => have($item`magical sausage casing`),
      do: (): void => {
        eat(1, $item`magical sausage`);
      },
      limit: { tries: 23 },
      freeaction: true,
      noadventures: true,
    },
    {
      name: "Hourglass",
      after: [],
      completed: () => !have($item`etched hourglass`) || get("_etchedHourglassUsed"),
      do: (): void => {
        use($item`etched hourglass`);
      },
      limit: { tries: 1 },
      freeaction: true,
      noadventures: true,
    },
  ],
};

const spleenCleaners = new Map([
  [$item`extra-greasy slider`, 5],
  [$item`jar of fermented pickle juice`, 5],
  [$item`mojo filter`, 1],
]);

function acquire(qty: number, item: Item, maxPrice?: number, throwOnFail = true): number {
  if (!item.tradeable || (maxPrice !== undefined && maxPrice <= 0)) return 0;
  if (maxPrice === undefined) throw `No price cap for ${item.name}.`;

  print(`Trying to acquire ${qty} ${item.plural}; max price ${maxPrice.toFixed(0)}.`, "green");

  if (qty * mallPrice(item) > 1000000) throw "Aggregate cost too high! Probably a bug.";

  const startAmount = itemAmount(item);

  const remaining = qty - startAmount;
  if (remaining <= 0) return qty;
  if (maxPrice <= 0) throw `buying disabled for ${item.name}.`;

  buy(remaining, item, maxPrice);
  if (itemAmount(item) < qty && throwOnFail) throw `Mall price too high for ${item.name}.`;
  return itemAmount(item) - startAmount;
}

function argmax<T>(values: [T, number][]): T {
  return values.reduce(([minValue, minScore], [value, score]) =>
    score > minScore ? [value, score] : [minValue, minScore]
  )[0];
}

function eatSafe(qty: number, item: Item, mpa: number) {
  if (!get("_milkOfMagnesiumUsed")) {
    acquire(1, $item`milk of magnesium`, 5 * mpa);
    use($item`milk of magnesium`);
  }
  if (!eat(qty, item)) throw "Failed to eat safely";
}

function drinkSafe(qty: number, item: Item) {
  const prevDrunk = myInebriety();
  if (have($skill`The Ode to Booze`)) {
    const odeTurns = qty * item.inebriety;
    const castTurns = odeTurns - haveEffect($effect`Ode to Booze`);
    if (castTurns > 0) {
      useSkill(
        $skill`The Ode to Booze`,
        Math.ceil(castTurns / turnsPerCast($skill`The Ode to Booze`))
      );
    }
  }
  if (!drink(qty, item)) throw "Failed to drink safely";
  if (item.inebriety === 1 && prevDrunk === qty + myInebriety() - 1) {
    // sometimes mafia does not track the mime army shotglass property
    setProperty("_mimeArmyShotglassUsed", "true");
  }
}

function chewSafe(qty: number, item: Item) {
  if (!chew(qty, item)) throw "Failed to chew safely";
}

function consumeSafe(
  qty: number,
  item: Item,
  mpa: number,
  additionalValue?: number,
  skipAcquire?: boolean
) {
  const spleenCleaned = spleenCleaners.get(item);
  if (spleenCleaned && mySpleenUse() < spleenCleaned) {
    throw "No spleen to clear with this.";
  }
  // Treat special seasoning as providing 1 adv for the purpose of a price cap.
  const averageAdventures = item === $item`Special Seasoning` ? 1 : getAverageAdventures(item);
  if (!skipAcquire && (averageAdventures > 0 || additionalValue)) {
    const cap = Math.max(0, averageAdventures * mpa) + (additionalValue ?? 0);
    acquire(qty, item, cap);
  } else if (!skipAcquire) {
    acquire(qty, item);
  }
  if (itemType(item) === "food") eatSafe(qty, item, mpa);
  else if (itemType(item) === "booze") drinkSafe(qty, item);
  else if (itemType(item) === "spleen item") chewSafe(qty, item);
  else use(qty, item);
}

// Item priority - higher means we eat it first.
// Anything that gives a consumption buff should go first (e.g. Refined Palate).
function itemPriority<T>(menuItems: MenuItem<T>[]) {
  // Last menu item is the food itself.
  const menuItem = menuItems[menuItems.length - 1];
  if (menuItem === undefined) {
    throw "Shouldn't have an empty menu item.";
  }
  if (menuItem.item === $item`spaghetti breakfast`) return 200;
  if (
    $items`pocket wish, toasted brie`.includes(menuItem.item) ||
    spleenCleaners.get(menuItem.item)
  ) {
    return 100;
  } else {
    return 0;
  }
}

function menu() {
  const spaghettiBreakfast =
    have($item`spaghetti breakfast`) &&
    myFullness() === 0 &&
    get("_timeSpinnerFoodAvailable") === "" &&
    !get("_spaghettiBreakfastEaten")
      ? 1
      : 0;

  const complexMushroomWines = $items`overpowering mushroom wine, complex mushroom wine, smooth mushroom wine, blood-red mushroom wine, buzzing mushroom wine, swirling mushroom wine`;
  const perfectDrinks = $items`perfect cosmopolitan, perfect negroni, perfect dark and stormy, perfect mimosa, perfect old-fashioned, perfect paloma`;
  const lasagnas = $items`fishy fish lasagna, gnat lasagna, long pork lasagna`;
  const smallEpics = $items`meteoreo, ice rice`.concat([$item`Tea, Earl Grey, Hot`]);

  const mallMin = (items: Item[]) => argmax(items.map((i) => [i, -mallPrice(i)]));

  return [
    // FOOD
    new MenuItem($item`Dreadsylvanian spooky pocket`),
    new MenuItem($item`tin cup of mulligan stew`),
    new MenuItem($item`frozen banquet`),
    new MenuItem($item`deviled egg`),
    new MenuItem($item`spaghetti breakfast`, { maximum: spaghettiBreakfast }),
    new MenuItem($item`extra-greasy slider`),
    new MenuItem(mallMin(lasagnas)),
    new MenuItem(mallMin(smallEpics)),

    // BOOZE
    new MenuItem($item`astral pilsner`, { maximum: availableAmount($item`astral pilsner`) }),
    new MenuItem($item`elemental caipiroska`),
    new MenuItem($item`moreltini`),
    new MenuItem($item`Dreadsylvanian grimlet`),
    new MenuItem($item`Hodgman's blanket`),
    new MenuItem($item`Sacramento wine`),
    new MenuItem($item`iced plum wine`),
    new MenuItem($item`splendid martini`),
    new MenuItem($item`Eye and a Twist`),
    new MenuItem($item`jar of fermented pickle juice`),
    new MenuItem(mallMin(complexMushroomWines)),
    new MenuItem(mallMin(perfectDrinks)),

    // SPLEEN
    new MenuItem($item`octolus oculus`),
    new MenuItem($item`prismatic wad`),
    new MenuItem($item`transdermal smoke patch`),
    new MenuItem($item`antimatter wad`),
    new MenuItem($item`voodoo snuff`),
    new MenuItem($item`blood-drive sticker`),

    // HELPERS
    new MenuItem($item`Special Seasoning`),
    new MenuItem($item`pocket wish`, { maximum: 1, effect: $effect`Refined Palate` }),
    new MenuItem($item`toasted brie`, { maximum: 1 }),
    new MenuItem($item`potion of the field gar`, { maximum: 1 }),
  ];
}

function shotglassMenu() {
  return menu().filter((menuItem) => menuItem.size === 1 && menuItem.organ === "booze");
}

function consumeDiet<T>(diet: Diet<T>, mpa: number) {
  const plannedDietEntries = diet.entries.sort(
    (a, b) => itemPriority(b.menuItems) - itemPriority(a.menuItems)
  );

  for (const dietEntry of plannedDietEntries) {
    print(`${dietEntry.target()} ${dietEntry.helpers().join(",")}`);
  }

  while (sumNumbers(plannedDietEntries.map((e) => e.quantity)) > 0) {
    for (const dietEntry of plannedDietEntries) {
      let quantity = dietEntry.quantity;
      const clean = spleenCleaners.get(dietEntry.target().item);
      if (clean) {
        quantity = Math.floor(mySpleenUse() / clean);
      }
      if (quantity > 0) {
        for (const menuItem of dietEntry.menuItems) {
          if (menuItem.effect === $effect`Refined Palate`) {
            cliExecute(`genie effect ${menuItem.effect}`);
          } else {
            consumeSafe(dietEntry.quantity, menuItem.item, mpa);
          }
        }
        dietEntry.quantity -= quantity;
      }
    }
  }
}
