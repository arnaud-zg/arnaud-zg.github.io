// What a site needs to set the mission up: the words to replace, the shape of its data, and how
// a career becomes the crates' loadout. The game itself loads from ./trigger, once the code is in.
export { missionLabels, type MissionLabels } from "./arcade/domain/labels.ts";
export type { MissionData } from "./arcade/domain/mission.ts";
export { pickupsOf, type Chapter, type Pickup, type Station } from "./campaign/domain/loadout.ts";
