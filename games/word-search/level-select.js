import { initLevelSelect } from "../common/level-select.js";

initLevelSelect({
  levels: window.WORD_SEARCH_LEVELS || window.LEVELS,
  containerId: "levelGrid",
  getUrl: (level) => `game.html?level=${level.id}`,
  getMeta: (level) => level.size ? `గడులు: ${level.size}×${level.size}` : "పద శోధన"
});
