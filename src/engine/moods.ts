import {
  cliExecute,
  Effect,
  getWorkshed,
  myClass,
  myEffects,
  myMaxmp,
  myPrimestat,
  toSkill,
} from "kolmafia";
import {
  $class,
  $effect,
  $effects,
  $item,
  $skill,
  $stat,
  AsdonMartin,
  ensureEffect,
  get,
  have,
  uneffect,
} from "libram";

function getRelevantEffects(): { [modifier: string]: Effect[] } {
  const result = {
    "-combat": $effects`Smooth Movements, The Sonata of Sneakiness`,
    "+combat": $effects`Carlweather's Cantata of Confrontation, Musk of the Moose`,
    "": $effects`Empathy, Leash of Linguini, Astral Shell, Elemental Saucesphere`,
    "fam weight": $effects`Chorale of Companionship`,
    init: $effects`Walberg's Dim Bulb, Springy Fusilli`,
    ML: $effects`Ur-Kel's Aria of Annoyance, Pride of the Puffin, Drescher's Annoying Noise`,
    item: $effects`Fat Leon's Phat Loot Lyric, Singer's Faithful Ocelot`,
    meat: $effects`Polka of Plenty`,
    mainstat: $effects`Big, Tomato Power, Trivia Master, Gr8ness, Carol of the Hells, Carol of the Thrills`,
    muscle: $effects`Go Get 'Em\, Tiger!, Phorcefullness, Incredibly Hulking`,
    mysticality: $effects`Glittering Eyelashes, Mystically Oiled, On the Shoulders of Giants`,
    moxie: $effects`Butt-Rock Hair, Superhuman Sarcasm, Cock of the Walk`,
  };

  // Glitches if given above
  result["mainstat"].push($effect`That's Just Cloud-Talk, Man`);

  // Class-specific
  if (myClass() === $class`Seal Clubber`) result["init"].push($effect`Silent Hunting`);
  else result["init"].push($effect`Nearly Silent Hunting`);

  // One-per-day
  if (!get("_ballpit")) result["mainstat"].push($effect`Having a Ball!`);
  if (!get("_lyleFavored")) result["mainstat"].push($effect`Favored by Lyle`);
  if (!get("telescopeLookedHigh")) result["mainstat"].push($effect`Starry-Eyed`);
  if (get("spacegateAlways") && get("spacegateVaccine2") && !get("_spacegateVaccine"))
    result["mainstat"].push($effect`Broad-Spectrum Vaccine`);
  if (have($skill`Emotionally Chipped`) && get("_feelExcitementUsed") < 3)
    result["mainstat"].push($effect`Feeling Excited`);
  if (have($item`protonic accelerator pack`) && !get("_streamsCrossed"))
    result["mainstat"].push($effect`Total Protonic Reversal`);

  // Noncombat buffs
  if (get("_feelLonelyUsed") < 3 || have($effect`Feeling Lonely`))
    result["-combat"].push($effect`Feeling Lonely`);
  if (!get("_olympicSwimmingPool") || have($effect`Silent Running`))
    result["-combat"].push($effect`Silent Running`);
  // TODO: Silence of the God Lobster?
  // TODO: Snow cleats?

  return result;
}

function isSong(effect: Effect) {
  return toSkill(effect).class === $class`Accordion Thief` && toSkill(effect).buff;
}

function maxSongs(): number {
  return have($skill`Mariachi Memory`) ? 4 : 3;
}

function shrug(effects: Effect[]) {
  for (const effect of effects) {
    if (have(effect)) uneffect(effect);
  }
}

export function applyEffects(modifier: string): void {
  const relevantEffects = getRelevantEffects();

  const useful_effects = [];
  for (const key in relevantEffects) {
    if (modifier.includes(key)) {
      useful_effects.push(...relevantEffects[key]);
    }
  }

  if (modifier.includes("MP")) {
    useful_effects.push(...relevantEffects["mysticality"]);
  }

  // Handle mainstat buffing and equalizing
  switch (myPrimestat()) {
    case $stat`Muscle`:
      if (modifier.includes("mainstat")) useful_effects.push(...relevantEffects["muscle"]);
      if (modifier.includes("moxie") || modifier.includes("myst"))
        useful_effects.push($effect`Stabilizing Oiliness`);
      break;
    case $stat`Mysticality`:
      if (modifier.includes("mainstat")) useful_effects.push(...relevantEffects["mysticality"]);
      if (modifier.includes("moxie") || modifier.includes("muscle"))
        useful_effects.push($effect`Expert Oiliness`);
      break;
    case $stat`Moxie`:
      if (modifier.includes("mainstat")) useful_effects.push(...relevantEffects["moxie"]);
      if (modifier.includes("muscle") || modifier.includes("myst"))
        useful_effects.push($effect`Slippery Oiliness`);
      break;
  }

  // Remove wrong combat effects
  if (modifier.includes("+combat")) shrug(relevantEffects["-combat"]);
  if (modifier.includes("-combat")) shrug(relevantEffects["+combat"]);

  if (myMaxmp() < 27 && have($skill`The Magical Mojomuscular Melody`)) {
    useful_effects.unshift($effect`The Magical Mojomuscular Melody`);
  }

  // Make room for songs
  const songs = [];
  for (const effect of useful_effects) {
    if (isSong(effect)) songs.push(effect);
  }
  if (songs.length > maxSongs()) throw "Too many AT songs.";
  if (songs.length > 0) {
    const extra_songs = [];
    for (const effect_name of Object.keys(myEffects())) {
      const effect = Effect.get(effect_name);
      if (isSong(effect) && !songs.includes(effect)) {
        extra_songs.push(effect);
      }
    }
    while (songs.length + extra_songs.length > maxSongs()) {
      const to_remove = extra_songs.pop();
      if (to_remove === undefined) break;
      else uneffect(to_remove);
    }
  }

  // Use horsery
  if (get("horseryAvailable")) {
    if (modifier.includes("-combat") && get("_horsery") !== "dark horse") {
      cliExecute("horsery dark");
    }
    // TODO: +combat?
  }

  // Use asdon martin
  if (getWorkshed() === $item`Asdon Martin keyfob`) {
    if (modifier.includes("-combat")) AsdonMartin.drive(AsdonMartin.Driving.Stealthily);
    else if (modifier.includes("+combat")) AsdonMartin.drive(AsdonMartin.Driving.Obnoxiously);
    else if (modifier.includes("init")) AsdonMartin.drive(AsdonMartin.Driving.Quickly);
    else if (modifier.includes("item")) AsdonMartin.drive(AsdonMartin.Driving.Observantly);
  }

  // Apply all relevant effects
  for (const effect of useful_effects) {
    ensureEffect(effect);
  }
}
