import { Task } from "./engine/task";
import { orderByRoute } from "grimoire-kolmafia";

export const routing: string[] = [
  "Diet/Numberology", // Numberology is always ready at the start of the day
  "Diet/Sausage", // Eat magical sausages as soon as they are obtained
  "Diet/Hourglass",

  // Pickup items
  "Misc/Short Cook",
  "Misc/Floundry",
  "Misc/Voting",
  "Misc/Acquire Kgnee",
  "Misc/Acquire FamEquip",

  // Start with the basic leveling tasks
  "Toot/Finish",
  "Leveling/Cloud Talk",
  "Leveling/Daycare",
  "Leveling/Bastille",
  "Leveling/Leaflet",
  "Leveling/Snojo",
  "Leveling/Chateau",

  // Then do the scaling leveling
  "Leveling/LOV Tunnel",
  "Leveling/Witchess",
  "Leveling/God Lobster",
  "Leveling/Machine Elf",
  "Leveling/Neverending Party",
  "Leveling/Sausage Fights",
  "Diet/Consume",
  "Misc/Protonic Ghost", // whenever ghosts are ready

  // Open up MacGuffin zones
  "Macguffin/Diary",
  "Macguffin/Desert", // charge camel, use voters

  // Line up noncombats
  "Manor/Billiards",
  "War/Enrage",
  "War/Flyers End", // Turn in flyers ASAP in-case of tracking issues
  "Giant/Airship",
  "Friar/Finish",
  "Crypt/Cranny",
  "Mosquito/Mosquito",
  "Hidden City/Open Temple",
  "Tavern/Finish",
  "Giant/Basement Finish",

  // Burn delay to unlock remaining noncombats
  "Palindome/Copperhead",
  "Palindome/Bat Snake",
  "Palindome/Cold Snake",
  "Giant/Ground",
  "Palindome/Zepplin",
  "Manor/Bedroom",
  "Manor/Bathroom Delay",
  "Manor/Gallery Delay",

  // Line up more noncombats
  "Manor/Gallery", // Gallery first in-case we banished Out in the Garden
  "Giant/Top Floor",
  "Manor/Bathroom",
  "Manor/Ballroom",

  // Detour to route Steely-Eyed Squint
  "Manor/Wine Cellar",
  "Manor/Laundry Room",

  // Finish noncombats, now with freekills available
  "Palindome/Alarm Gem",

  // Use Hidden City to charge camel
  "Hidden City/Open Bowling",
  "Hidden City/Open Office",
  "Hidden City/Open Hospital",
  "Hidden City/Open Apartment",

  // Nostalgia chaining
  "Orc Chasm/ABoo Start",
  "Crypt/Nook",
  "Orc Chasm/ABoo Peak",

  "Hidden City/Apartment", // Get this out of the way
  "Macguffin/Open Pyramid", // Open more delay for lategame

  // Non-delay quests
  "Mosquito/Finish",
  "Tavern/Finish",
  "Bat/Use Sonar",
  "Crypt/Finish",
  "McLargeHuge/Finish",
  "Orc Chasm/Finish",
  "Giant/Finish",
  "War/Boss Hippie",
  "War/Boss Frat",

  // Finish up with last delay
  "Macguffin/Finish",
  "Knob/King",
  "Bat/Finish",

  // Obtain available keys before attempting the daily dungeon
  "Keys/Deck",
  "Keys/Lockpicking",

  "Tower/Finish",
  "Organ/Finish", // Organ last, just so it doesn't appear in turncount
];

export function prioritize(tasks: Task[], ignore_missing_tasks?: boolean): Task[] {
  return orderByRoute(tasks, routing, ignore_missing_tasks);
}
