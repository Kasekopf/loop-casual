import { Task } from "./tasks/structure";

export const routing: string[] = [
  // Start with the basic leveling tasks
  "Toot/Finish",

  // Grind tasks until level 11
  "Knob/Outskirts",
  "Absorb/The Haunted Conservatory", // Get +meat early, we'll want a lot
  "Absorb/The Haunted Kitchen",
  "Mosquito/Burn Delay",
  "Knob/King",
  "Absorb/The Outskirts of Cobb's Knob",
  "Absorb/Cobb's Knob Kitchens",
  "Absorb/Cobb's Knob Barracks",
  "Absorb/Cobb's Knob Harem",
  "Absorb/Cobb's Knob Laboratory",
  "Absorb/Cobb's Knob Menagerie, Level 1",
  "Absorb/Cobb's Knob Menagerie, Level 2",
  "Absorb/Cobb's Knob Menagerie, Level 3",

  "Manor/Finish Floor1",
  "Manor/Gallery Delay",
  "Manor/Bathroom Delay",
  "Manor/Bedroom",
  "Absorb/The Haunted Billiards Room",
  "Absorb/The Haunted Library",
  "Absorb/The Haunted Bedroom",

  // Once level 11 is hit, grab -combat
  "Absorb/The Black Forest",

  // Get +item
  "Absorb/Infernal Rackets Backstage",

  // Aim for remaining pygmies
  "Hidden City/Bowling",
  "Absorb/The Hidden Bowling Alley",

  // Get +combat
  "Palindome/Copperhead",
  "Palindome/Bat Snake",
  "Palindome/Cold Snake",
  "Giant/Finish",
  "Absorb/Whitey's Grove",

  // Absorb things that required +combat
  "Absorb/Cobb's Knob Treasury",
  "Absorb/The Knob Shaft",

  // Absorb the manor
  "Absorb/The Haunted Pantry",
  "Absorb/The Haunted Conservatory",
  "Absorb/The Haunted Kitchen",
  "Manor/Finish Floor2",
  "Absorb/The Haunted Gallery",
  "Absorb/The Haunted Bathroom",
  "Manor/Boss",
  "Absorb/The Haunted Ballroom",
  "Absorb/The Haunted Wine Cellar",
  "Absorb/The Haunted Laundry Room",
  "Absorb/The Haunted Boiler Room",
  "Absorb/The Haunted Storage Room",
  "Absorb/The Haunted Nursery",
  "Absorb/The Haunted Laboratory",

  // Non-delay quests
  "Mosquito/Finish",
  "Tavern/Finish",
  "Bat/Use Sonar",
  "Crypt/Finish",
  "McLargeHuge/Finish",
  "Orc Chasm/Finish",
  "Giant/Finish",
  "Macguffin/Finish",
  "War/Boss Hippie",

  // Finish up with last delay
  "Knob/King",
  "Bat/Finish",

  "Tower/Finish",
  "Absorb/All",
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
