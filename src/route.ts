import { Task } from "./tasks/structure";

export const routing: string[] = [
  // Start with the basic leveling tasks
  "Toot/Finish",
  // Get basic gear
  "Misc/Acquire Cold Medicine Gear",
  "Misc/Acquire Firework Hat",
  "Misc/Acquire Birch Battery",
  "Pull/Basic",

  "Absorb/The Haunted Conservatory", // Get +meat early, we'll want a lot
  "Absorb/The Haunted Kitchen",

  // Get initial -combat
  "Absorb/Cobb's Knob Laboratory",
  "Absorb/Cobb's Knob Menagerie, Level 3",

  // Get +item
  "Absorb/Infernal Rackets Backstage",

  // Grind tasks until level 11
  "Mosquito/Burn Delay",
  "Manor/Finish Floor1",

  // Once level 11 is hit, grab -combat
  "Absorb/The Black Forest",

  // Start the war ASAP
  "War/Flyers Start",

  // Aim for remaining pygmies
  // "Hidden City/Bowling",
  // "Absorb/The Hidden Bowling Alley",

  // Open the manor for absorbing
  "Manor/Boss",

  "Palindome/Copperhead",
  "Palindome/Bat Snake",
  "Giant/Grow Beanstalk",
  "McLargeHuge/Finish",

  // Non-delay quests
  "Mosquito/Finish",
  "Bat/Use Sonar 3",
  "Crypt/Finish",
  "Orc Chasm/Finish",
  "Giant/Finish",
  "Tavern/Finish",
  "Macguffin/Desert",
  "Macguffin/Finish",
  "War/Boss Hippie",

  // Finish up with last delay
  "Bat/Finish",

  "Tower/Naughty Sorceress",
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
