import { orderByRoute } from "grimoire-kolmafia";
import { Task } from "./engine/task";

export const routing: string[] = [
  // Start with the basic leveling tasks
  "Toot/Finish",
  // Get basic gear
  "Misc/Goose Exp",
  "Misc/Acquire Firework Hat",
  "Misc/Acquire Birch Battery",
  "Keys/Deck",
  "Pull/All",

  // Get infinite loop
  "Summon/Pygmy Witch Lawyer",
  "Summon/Mountain Man",

  "Absorb/Ponzi Apparatus", // Get +meat early, we'll want a lot

  // Get initial -combat
  "Knob/King",
  "Absorb/Phase Shift",
  "McLargeHuge/Trapper Request", // open for absorbing
  "Absorb/Fluid Dynamics Simulation",

  // ASAP once level 11 is hit, grab -combat
  "Absorb/Photonic Shroud",

  // Grind tasks until level 11
  "Mosquito/Burn Delay",
  "Hidden City/Open Temple",

  // Get +item
  "Absorb/Gravitational Compression",
  "Misc/Fortune",

  // Aim for remaining pygmies
  "Hidden City/Bowling Skills",
  "Absorb/System Sweep",  // Get from hidden park in hardcore
  "Giant/Airship YR Healer",
  "Misc/Retune Moon",
  "War/Flyers Start", // Start the war and get flyers
  "War/Flyers End", // End the flyers quest ASAP in case of tracking errors

  // For MP regen, ASAP
  "Wand/Wand",
  "Misc/Hermit Clover",
  "Absorb/Hivemindedness",

  // Open Hidden City with Sue buff
  "Hidden City/Open Office",
  "Hidden City/Open Hospital",
  "Hidden City/Open Apartment",

  // Line up -combats
  "Manor/Start Floor2",
  "Absorb/Subatomic Hardening", // Get soon after the Billiards room
  "Manor/Bedroom",
  "Manor/Bathroom Delay",
  "Manor/Gallery Delay",
  "Palindome/Copperhead",
  "Palindome/Bat Snake",
  "Bat/Use Sonar 3", // Prepare for lobsterfrogman backups
  "Palindome/Cold Snake",

  // Knock down -combats
  "Manor/Finish Floor2",
  "Giant/Unlock HITS",
  "Crypt/Cranny",
  "Manor/Finish Floor2",
  "Mosquito/Finish",

  // The following 3 tasks should always stay in this order
  "Macguffin/Oasis", // Get ultrahydrated as soon as needed
  "Macguffin/Oasis Drum", // Get drum as soon as pages are gathered
  "Macguffin/Desert", // charge camel for protestors

  "McLargeHuge/Trapper Return", // ensure we don't need clovers for ore
  "Palindome/Protesters",

  // Finish remaining quests
  "McLargeHuge/Finish",
  "Manor/Boss",
  "Crypt/Finish",
  "Giant/Finish",
  "Tavern/Finish",
  "Macguffin/Finish",

  "Orc Chasm/Start Peaks",
  "Orc Chasm/Finish",
  "Reprocess/Twin Peak", // Work on absorbing Twin Peak during war
  "War/Boss Hippie",

  // Finish up with last delay
  "Bat/Finish",
  "Tower/Naughty Sorceress",
  "Absorb/South of the Border", // If we are doing this, do it early to give room for orb
  "Absorb/All",
  "Reprocess/All", // Return to locations if reprocessing was missed

  "Misc/Dog Chow", // Eat if there are no other options
  "Misc/Cake-Shaped Arena", // Arena if there are no charged options
];

export function prioritize(tasks: Task[]): Task[] {
  return orderByRoute(tasks, routing, false);
}
