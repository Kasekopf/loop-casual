import { Task } from "./tasks/structure";

export const routing: string[] = [
  // Pickup items
  "Misc/Voting",

  // Start with the basic leveling tasks
  "Toot/Finish",

  // Grind tasks until level 11
  "Absorb/The Haunted Conservatory", // Get +meat early, we'll want a lot
  "Knob/King",
  "Absorb/The Outskirts of Cobb's Knob",
  "Absorb/Cobb's Knob Kitchens",
  "Absorb/Cobb's Knob Barracks",
  "Absorb/Cobb's Knob Harem",
  "Absorb/Cobb's Knob Treasury",
  "Absorb/Cobb's Knob Laboratory",
  "Absorb/The Knob Shaft",
  "Absorb/Cobb's Knob Menagerie, Level 1",
  "Absorb/Cobb's Knob Menagerie, Level 2",
  "Absorb/Cobb's Knob Menagerie, Level 3",

  // Once level 11 is hit, grab -combat
  "Absorb/The Black Forest",

  // Get +item
  "Absorb/Infernal Rackets Backstage",

  // Aim for remaining pygmies
  "Hidden City/Bowling",
  "Absorb/The Hidden Bowling Alley",

  // Absorb the manor
  "Manor/Finish Floor1",
  "Absorb/The Haunted Pantry",
  "Absorb/The Haunted Conservatory",
  "Absorb/The Haunted Kitchen",
  "Absorb/The Haunted Billiards Room",
  "Absorb/The Haunted Library",
  "Manor/Finish Floor2",
  "Absorb/The Haunted Gallery",
  "Absorb/The Haunted Bathroom",
  "Absorb/The Haunted Bedroom",
  "Manor/Boss",
  "Absorb/The Haunted Ballroom",
  "Absorb/The Haunted Wine Cellar",
  "Absorb/The Haunted Laundry Room",
  "Absorb/The Haunted Boiler Room",
  "Absorb/The Haunted Storage Room",
  "Absorb/The Haunted Nursery",
  "Absorb/The Haunted Laboratory",

  // Get +combat
  "Palindome/Copperhead",
  "Palindome/Bat Snake",
  "Palindome/Cold Snake",
  "Giant/Finish",
  "Absorb/Whitey's Grove",

  // Non-delay quests
  "Mosquito/Finish",
  "Tavern/Finish",
  "Bat/Use Sonar",
  "Crypt/Finish",
  "McLargeHuge/Finish",
  "Orc Chasm/Finish",
  "Giant/Finish",
  "War/Boss Hippie",

  // Finish up with last delay
  "Macguffin/Finish",
  "Knob/King",
  "Bat/Finish",

  // Obtain available keys before attempting the daily dungeon
  "Keys/Deck",
  "Keys/Lockpicking",

  "Absorb/All",
  "Tower/Finish",
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
