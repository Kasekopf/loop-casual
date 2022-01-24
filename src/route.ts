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

  // Do the billards room first, before drinking
  "Macguffin/Diary", // avoid +combat
  "Manor/Billiards",
  "Misc/Consume",

  // Line up noncombats
  "Friar/Finish",
  "Giant/Basement Finish",
  "Organ/Arena",
  "Crypt/Cranny",
  "War/Enrage",
  "Mosquito/Mosquito",
  "Hidden City/Open Temple",
  "Tavern/Finish",

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
  "Palindome/Alarm Gem",

  // Route Steely-Eyed Squint
  "Manor/Wine Cellar",
  "Manor/Laundry Room",

  "Hidden City/Open Bowling", // Open bowling for optional free fights
  "Hidden City/Apartment", // Get this out of the way
  "Crypt/Nook", // As soon as camel is charged
  "Macguffin/Open Pyramid", // Open more delay for lategame
];

export function prioritize(tasks: Task[]): Task[] {
  const priorities = new Map<string, [number, Task]>();
  for (const task of tasks) {
    if (task.delay !== undefined) priorities.set(task.name, [2000, task]); // Finish delay as late as possible
    priorities.set(task.name, [1000, task]);
  }

  // Prioritize the routing list of tasks first
  function set_priority_recursive(task: string, priority: number) {
    const old_priority = priorities.get(task);
    if (old_priority === undefined) throw `Unknown routing task ${task}`;
    if (old_priority[0] <= priority) return;
    priorities.set(task, [priority, old_priority[1]]);

    for (const requirement of old_priority[1].after) {
      set_priority_recursive(requirement, priority - 0.01);
    }
  }
  for (let i = 0; i < routing.length; i++) {
    set_priority_recursive(routing[i], i);
  }

  // Sort all tasks by priority.
  // Since this sort is stable, we default to earlier tasks.
  const result = tasks.slice();
  result.sort(
    (a, b) => (priorities.get(a.name) || [1000])[0] - (priorities.get(b.name) || [1000])[0]
  );
  return result;
}
