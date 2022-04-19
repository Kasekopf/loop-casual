import {
  myFullness,
  Item,
  mallPrice,
  use,
  myInebriety,
  mySpleenUse,
  itemType,
  eat,
  useSkill,
  turnsPerCast,
  drink,
  setProperty,
  chew,
  haveEffect,
  print,
  itemAmount,
  buy,
  cliExecute,
  availableAmount,
} from "kolmafia";
import {
  $effect,
  $item,
  $items,
  get,
  have,
  MenuItem,
  Diet,
  getAverageAdventures,
  $skill,
  sumNumbers,
} from "libram";

const MPA = get("valueOfAdventure");
const spleenCleaners = new Map([
  [$item`extra-greasy slider`, 5],
  [$item`jar of fermented pickle juice`, 5],
  [$item`mojo filter`, 1],
]);
const maxPrices = new Map([[$item`special seasoning`, MPA]]);

function acquire(qty: number, item: Item, maxPrice?: number, throwOnFail = true): number {
  maxPrice = maxPrice ?? maxPrices.get(item);
  if (!item.tradeable || (maxPrice !== undefined && maxPrice <= 0)) return 0;
  if (maxPrice === undefined) throw `No price cap for ${item.name}.`;

  print(`Trying to acquire ${qty} ${item.plural}; max price ${maxPrice.toFixed(0)}.`, "green");

  if (qty * mallPrice(item) > 1000000) throw "Aggregate cost too high! Probably a bug.";

  const startAmount = itemAmount(item);

  let remaining = qty - startAmount;
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

function eatSafe(qty: number, item: Item) {
  if (!get("_milkOfMagnesiumUsed")) {
    acquire(1, $item`milk of magnesium`, 5 * MPA);
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

function consumeSafe(qty: number, item: Item, additionalValue?: number, skipAcquire?: boolean) {
  const spleenCleaned = spleenCleaners.get(item);
  if (spleenCleaned && mySpleenUse() < spleenCleaned) {
    throw "No spleen to clear with this.";
  }
  const averageAdventures = getAverageAdventures(item);
  if (!skipAcquire && (averageAdventures > 0 || additionalValue)) {
    const cap = Math.max(0, averageAdventures * MPA) + (additionalValue ?? 0);
    acquire(qty, item, cap);
  } else if (!skipAcquire) {
    acquire(qty, item);
  }
  if (itemType(item) === "food") eatSafe(qty, item);
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
  return menu().filter((menuItem) => menuItem.size === 1 && menuItem.organ == "booze");
}

function consumeDiet<T>(diet: Diet<T>) {
  const plannedDietEntries = diet.entries.sort(
    (a, b) => itemPriority(b.menuItems) - itemPriority(a.menuItems)
  );

  for (const dietEntry of plannedDietEntries) {
    print(`${dietEntry.target()} ${dietEntry.helpers().join(",")}`);
  }

  while (sumNumbers(plannedDietEntries.map((e) => e.quantity)) > 0) {
    for (const dietEntry of plannedDietEntries) {
      let quantity = dietEntry.quantity;
      let clean = spleenCleaners.get(dietEntry.target().item);
      if (clean) {
        quantity = Math.floor(mySpleenUse() / clean);
      }
      if (quantity > 0) {
        for (const menuItem of dietEntry.menuItems) {
          if (menuItem.effect === $effect`Refined Palate`) {
            cliExecute(`genie effect ${menuItem.effect}`);
          } else {
            consumeSafe(dietEntry.quantity, menuItem.item);
          }
        }
        dietEntry.quantity -= quantity;
      }
    }
  }
}

export function diet(options: { food?: number; booze?: number; spleen?: number }) {
  if (!get("_mimeArmyShotglassUsed")) {
    const shotglassDiet = Diet.plan(MPA, shotglassMenu(), { food: 0, booze: 1, spleen: 0 });
    consumeDiet(shotglassDiet);
  }

  const plannedDiet = Diet.plan(MPA, menu(), {
    food: options.food ?? 5,
    booze: options.booze ?? 15,
    spleen: options.spleen ?? 5,
  });

  consumeDiet(plannedDiet);
}
