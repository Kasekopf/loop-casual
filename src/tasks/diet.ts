import {
  availableAmount,
  buy,
  chew,
  cliExecute,
  drink,
  eat,
  equip,
  familiarEquippedEquipment,
  getIngredients,
  haveEffect,
  Item,
  itemAmount,
  itemType,
  mallPrice,
  myAdventures,
  myBasestat,
  myDaycount,
  myFullness,
  myInebriety,
  myPrimestat,
  mySpleenUse,
  print,
  restoreMp,
  retrieveItem,
  reverseNumberology,
  setProperty,
  toInt,
  turnsPerCast,
  use,
  useFamiliar,
  useSkill,
} from "kolmafia";
import {
  $effect,
  $familiar,
  $item,
  $items,
  $skill,
  $slot,
  clamp,
  Diet,
  get,
  getAverageAdventures,
  getRemainingLiver,
  getRemainingSpleen,
  getRemainingStomach,
  have,
  MenuItem,
  sumNumbers,
} from "libram";
import { args } from "../main";
import { Quest } from "../engine/task";

export const DietQuest: Quest = {
  name: "Diet",
  tasks: [
    {
      name: "Consume",
      after: [],
      completed: () =>
        myDaycount() > 1 || (myFullness() >= args.stomach && myInebriety() >= args.liver),
      ready: () => myBasestat(myPrimestat()) >= 149 || myAdventures() <= 1,
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
        restoreMp(1);
        cliExecute("numberology 69");
      },
      limit: { tries: 5 },
      freeaction: true,
      noadventures: true,
    },
    {
      name: "Sausage",
      after: ["Consume"],
      completed: () => !have($item`Kramco Sausage-o-Matic™`) || get("_sausagesEaten") >= 23, // Cap at 23 sausages to avoid burning through an entire supply
      ready: () => have($item`magical sausage casing`),
      do: (): void => {
        // Pump-and-grind cannot be used from Left-Hand Man
        if (
          have($familiar`Left-Hand Man`) &&
          familiarEquippedEquipment($familiar`Left-Hand Man`) === $item`Kramco Sausage-o-Matic™`
        ) {
          useFamiliar($familiar`Left-Hand Man`);
          equip($slot`familiar`, $item`none`);
        }
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

function priceToCraft(item: Item) {
  if (item.tradeable) {
    return mallPrice(item);
  }
  let total = 0;
  const ingredients = getIngredients(item);
  for (const i in ingredients) {
    total += priceToCraft($item`${i}`) * ingredients[i];
  }
  return total;
}

function acquire(qty: number, item: Item, maxPrice?: number, throwOnFail = true): number {
  const startAmount = itemAmount(item);
  const remaining = qty - startAmount;
  if (maxPrice === undefined) throw `No price cap for ${item.name}.`;
  if (
    $items`Boris's bread, roasted vegetable of Jarlsberg, Pete's rich ricotta, roasted vegetable focaccia, baked veggie ricotta casserole, plain calzone, Deep Dish of Legend, Calzone of Legend, Pizza of Legend`.includes(
      item
    )
  ) {
    print(`Trying to acquire ${qty} ${item.plural}; max price ${maxPrice.toFixed(0)}.`, "green");
    if (priceToCraft(item) <= maxPrice) {
      retrieveItem(remaining, item);
    }
    return itemAmount(item) - startAmount;
  }
  if (!item.tradeable || (maxPrice !== undefined && maxPrice <= 0)) return 0;

  print(`Trying to acquire ${qty} ${item.plural}; max price ${maxPrice.toFixed(0)}.`, "green");

  if (qty * mallPrice(item) > 1000000) throw "Aggregate cost too high! Probably a bug.";

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

type MenuData = {
  turns: number; // Est. number of turns provided by an item; used for the price cap
};
function consumeSafe(
  qty: number,
  item: Item,
  mpa: number,
  data?: MenuData,
  additionalValue?: number,
  skipAcquire?: boolean
) {
  const spleenCleaned = spleenCleaners.get(item);
  if (spleenCleaned && mySpleenUse() < spleenCleaned) {
    throw "No spleen to clear with this.";
  }
  const averageAdventures = data?.turns ?? getAverageAdventures(item);
  if (!skipAcquire && (averageAdventures > 0 || additionalValue)) {
    const cap = Math.max(0, averageAdventures * mpa) + (additionalValue ?? 0);
    acquire(qty, item, cap);
  } else if (!skipAcquire) {
    acquire(qty, item);
  }
  if (itemType(item) === "food") eatSafe(qty, item, mpa);
  else if (itemType(item) === "booze") drinkSafe(qty, item);
  else if (itemType(item) === "spleen item") chewSafe(qty, item);
  else if (item !== $item`Special Seasoning`) use(qty, item);
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

function recipeKnown(item: Item) {
  if ($items`Boris's bread, roasted vegetable of Jarlsberg, Pete's rich ricotta`.includes(item)) {
    return !get(`unknownRecipe${toInt(item)}`);
  }
  let allComponentsKnown = !get(`unknownRecipe${toInt(item)}`);
  const ingredients = getIngredients(item);
  for (const i in ingredients) {
    allComponentsKnown = allComponentsKnown && recipeKnown($item`${i}`);
  }
  return allComponentsKnown;
}

function cookBookBatMenu(): MenuItem<MenuData>[] {
  /* Excluding
      - plain calzone, because the +ML buff may not be desirable
      - Deep Dish of Legend, because the +familiar weight buff is best saved for garbo
  */
  const cookBookBatFoods = $items`Boris's bread, roasted vegetable of Jarlsberg, Pete's rich ricotta, roasted vegetable focaccia, baked veggie ricotta casserole, Calzone of Legend, Pizza of Legend`;

  const legendaryPizzasEaten: Item[] = [];
  if (get("calzoneOfLegendEaten")) legendaryPizzasEaten.push($item`Calzone of Legend`);
  if (get("pizzaOfLegendEaten")) legendaryPizzasEaten.push($item`Pizza of Legend`);
  if (get("deepDishOfLegendEaten")) legendaryPizzasEaten.push($item`Deep Dish of Legend`);

  const cookBookBatFoodAvailable = cookBookBatFoods.filter(
    (food) => recipeKnown(food) && !legendaryPizzasEaten.includes(food)
  );
  return cookBookBatFoodAvailable.map(
    (food) =>
      new MenuItem(food, {
        priceOverride: priceToCraft(food),
        maximum: $items`Calzone of Legend, Pizza of Legend, Deep Dish of Legend`.includes(food)
          ? 1
          : 99,
      })
  );
}

function menu(): MenuItem<MenuData>[] {
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

  const menu: MenuItem<MenuData>[] = [
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
    new MenuItem($item`Special Seasoning`, { data: { turns: 1 } }),
    new MenuItem($item`pocket wish`, {
      maximum: 1,
      effect: $effect`Refined Palate`,
      data: { turns: 10 },
    }),
    new MenuItem($item`toasted brie`, { maximum: 1, data: { turns: 10 } }),
    new MenuItem($item`potion of the field gar`, { maximum: 1, data: { turns: 5 } }),
  ];
  return menu.concat(cookBookBatMenu());
}

function shotglassMenu() {
  return menu().filter((menuItem) => menuItem.size === 1 && menuItem.organ === "booze");
}

function consumeDiet(diet: Diet<MenuData>, mpa: number) {
  const plannedDietEntries = diet.entries.sort(
    (a, b) => itemPriority(b.menuItems) - itemPriority(a.menuItems)
  );

  print(`Diet Plan:`);
  for (const dietEntry of plannedDietEntries) {
    print(`${dietEntry.target()} ${dietEntry.helpers().join(",")}`);
  }

  while (sumNumbers(plannedDietEntries.map((e) => e.quantity)) > 0) {
    let progressed = false;
    for (const dietEntry of plannedDietEntries) {
      let quantity = dietEntry.quantity;

      // Compute the usable quantity of the diet entry
      const organ = dietEntry.target().organ ?? itemType(dietEntry.target().item);
      if (organ === "food") {
        quantity = clamp(Math.floor(getRemainingStomach() / dietEntry.target().size), 0, quantity);
      } else if (organ === "booze") {
        quantity = clamp(Math.floor(getRemainingLiver() / dietEntry.target().size), 0, quantity);
        if (
          dietEntry.target().size === 1 &&
          !get("_mimeArmyShotglassUsed") &&
          have($item`mime army shotglass`) &&
          quantity === 0
        ) {
          quantity = 1;
        }
      } else if (organ === "spleen item") {
        quantity = clamp(Math.floor(getRemainingSpleen() / dietEntry.target().size), 0, quantity);
      }
      const clean = spleenCleaners.get(dietEntry.target().item);
      if (clean) {
        quantity = clamp(Math.floor(mySpleenUse() / clean), 0, quantity);
      }

      if (quantity > 0) {
        progressed = true;
        for (const menuItem of dietEntry.menuItems) {
          if (menuItem.effect === $effect`Refined Palate`) {
            cliExecute(`genie effect ${menuItem.effect}`);
          } else {
            consumeSafe(dietEntry.quantity, menuItem.item, mpa, menuItem.data);
          }
        }
        dietEntry.quantity -= quantity;
      }
    }

    if (!progressed) throw `Unable to determine what to consume next`;
  }
}
