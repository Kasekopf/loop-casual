import { Task } from "./tasks/structure";

export const routing: string[] = [
  // Pickup items
  "Misc/Short Cook",
  "Misc/Floundry",
  "Misc/Voting",

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
  "Misc/Consume",
  "Misc/Protonic Ghost", // whenever ghosts are ready

  // Do the billards room first, before drinking
  "Macguffin/Diary", // avoid +combat
  "Macguffin/Desert", // charge camel, use voters
  "Manor/Billiards",

  // Line up noncombats
  "Giant/Airship",
  "Friar/Finish",
  "Crypt/Cranny",
  "War/Enrage",
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
  "Hidden City/Open Bowling", // Open bowling for optional free fights
  "Hidden City/Open Office", // Charge camel
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

  "Tower/Finish",
  "Organ/Finish", // Organ last, just so it doesn't appear in turncount
];

export function prioritize(tasks: Task[]): Task[] {
  const priorities = new Map<string, [number, Task]>();
  for (const task of tasks) {
    if (task.delay !== undefined) priorities.set(task.name, [2000, task]); // Finish delay as late as possible
    priorities.set(task.name, [1000, task]);
  }

  // Prioritize the routing list of tasks first
  function setPriorityRecursive(task: string, priority: number) {
    const old_priority = priorities.get(task);
    if (old_priority === undefined) throw `Unknown routing task ${task}`;
    if (old_priority[0] <= priority) return;
    priorities.set(task, [priority, old_priority[1]]);

    for (const requirement of old_priority[1].after) {
      setPriorityRecursive(requirement, priority - 0.01);
    }
  }
  for (let i = 0; i < routing.length; i++) {
    setPriorityRecursive(routing[i], i);
  }

  // Sort all tasks by priority.
  // Since this sort is stable, we default to earlier tasks.
  const result = tasks.slice();
  result.sort(
    (a, b) => (priorities.get(a.name) || [1000])[0] - (priorities.get(b.name) || [1000])[0]
  );
  return result;
}
