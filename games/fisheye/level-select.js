import { initLevelSelect } from "../common/level-select.js";

initLevelSelect({
  levels: window.FISHEYE_LEVELS,
  containerId: "levelGrid",
  getUrl: (level) => `game.html?level=${level.id}`,
  getMeta: () => "మత్స్య యంత్రం (Target)"
});
