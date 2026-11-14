import { initLevelSelect } from "../common/level-select.js";

initLevelSelect({
  levels: window.DOTS_LEVELS,
  containerId: "levelGrid",
  getUrl: (level) => `game.html?level=${level.id}`,
  getMeta: () => "జతపరచడం (Match)"
});
