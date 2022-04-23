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

  // Get initial -combat
  "Knob/King",
  "Absorb/Cobb's Knob Menagerie, Level 3",
  "McLargeHuge/Trapper Request", // open for absorbing

  // Get +item
  "Absorb/Infernal Rackets Backstage",

  // Grind tasks until level 11
  "Mosquito/Burn Delay",
  "Hidden City/Open Temple",

  // Once level 11 is hit, grab -combat
  "Absorb/The Black Forest",

  // Aim for remaining pygmies
  "Hidden City/Bowling",
  "Absorb/The Hidden Bowling Alley",

  "War/Flyers Start", // Start the war and get flyers ASAP

  // Prepare for Healer YR
  "Palindome/Copperhead",
  "Palindome/Bat Snake",
  "Palindome/Cold Snake",
  "Giant/Airship YR Healer",

  "Bat/Use Sonar 3", // Prepare for lobsterfrogman backups

  // Line up -combats
  "Manor/Billiards",
  "Manor/Library",
  "Manor/Bedroom",
  "Manor/Bathroom Delay",
  "Manor/Gallery Delay",
  "Macguffin/Desert", // charge camel for protestors
  "Orc Chasm/Oil Peak", // make jar of oil

  // Knock down -combats
  "Wand/Wand",
  "Absorb/The Dungeons of Doom", // For MP regen, ASAP
  "Manor/Finish Floor2",
  "Giant/Unlock HITS",
  "Crypt/Cranny",
  "Manor/Finish Floor2",
  "Orc Chasm/Twin Init",
  "Mosquito/Finish",
  "Palindome/Protesters",

  // Finish remaining quests
  "McLargeHuge/Finish",
  "Manor/Boss",
  "Crypt/Finish",
  "Giant/Finish",
  "Tavern/Finish",
  "Macguffin/Finish",
  "War/Boss Hippie",
  "Orc Chasm/Finish", // save A-Boo for last

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
