import { Task } from "./tasks/structure";

export const routing: string[] = [
  // Start with the basic leveling tasks
  "Toot/Finish",
  // Get basic gear
  "Misc/Goose Exp",
  "Misc/Acquire Cold Medicine Gear",
  "Misc/Acquire Firework Hat",
  "Misc/Acquire Birch Battery",
  "Keys/Deck",
  "Pull/All",
  "Misc/Dog Chow", // Eat if there are no other options
  "Misc/Cake-Shaped Arena", // Arena if there are no charged options

  // Get infinite loop
  "McLargeHuge/Ore Mountain",
  "Misc/Locket Pygmy",

  "Absorb/The Haunted Conservatory", // Get +meat early, we'll want a lot

  // Get initial -combat
  "Knob/King",
  "Absorb/Cobb's Knob Menagerie, Level 3",
  "McLargeHuge/Trapper Request", // open for absorbing
  "Absorb/Cobb's Knob Menagerie, Level 2",

  // Get +item
  "Absorb/Infernal Rackets Backstage",

  // Grind tasks until level 11
  "Mosquito/Burn Delay",

  // Once level 11 is hit, grab -combat
  "Absorb/The Black Forest",
  "Hidden City/Open Temple",
  "Misc/Fortune",

  // Aim for remaining pygmies
  "Hidden City/Bowling Skills",
  "Giant/Airship YR Healer",
  "War/Flyers Start", // Start the war and get flyers

  // For MP regen, ASAP
  "Wand/Wand",
  "Misc/Hermit Clover",
  "Absorb/The Dungeons of Doom",

  // Line up -combats
  "Manor/Start Floor2",
  "Manor/Bedroom",
  "Manor/Bathroom Delay",
  "Manor/Gallery Delay",
  "Palindome/Copperhead",
  "Palindome/Bat Snake",
  "Bat/Use Sonar 3", // Prepare for lobsterfrogman backups
  "Palindome/Cold Snake",

  // Open Hidden City with Sue buff
  "Hidden City/Open Office",
  "Hidden City/Open Hospital",
  "Hidden City/Open Apartment",

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

  "Palindome/Protesters",

  // Finish remaining quests
  "McLargeHuge/Finish",
  "Manor/Boss",
  "Crypt/Finish",
  "Giant/Finish",
  "Tavern/Finish",
  "Macguffin/Finish",

  "Orc Chasm/Start Peaks",
  "War/Boss Hippie",
  "Orc Chasm/Finish", // save A-Boo for last

  // Finish up with last delay
  "Bat/Finish",
  "Tower/Naughty Sorceress",
  "Absorb/All",
  "Reprocess/All", // Return to locations if reprocessing was missed
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
