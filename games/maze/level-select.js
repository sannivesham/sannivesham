import { initLevelSelect } from "../common/level-select.js";

initLevelSelect({
  levels: window.MAZE_LEVELS,
  containerId: "levelGrid",
  getUrl: (level) => `game.html?level=${level.id}`,
  getMeta: () => "చిక్కుముడి (Labyrinth)"
});
