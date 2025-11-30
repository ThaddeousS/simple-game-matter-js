import { Editor } from "./src/editor/editor.js";
import { Game } from "./src/game/game.js";

const init = () => {
  let game = undefined;
  let editor = undefined;

  window.addEventListener("load", async () => {
    console.log("Initializing game...");
    game = new Game();
    await game.initialize();

    console.log("Initializing editor...");
    editor = new Editor(game);
    await editor.initialize();

    // Setup debug panel header click functionality
    game.debug.setupHeaderClickListener(() => {
      game.toggleInfoPanel();
    });
  });
};

init();
