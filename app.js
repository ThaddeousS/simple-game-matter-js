import { Editor } from "./src/editor/editor.js";
import { Game } from "./src/game/game.js";
import { EditorEvents } from "./src/events/editor-events.js";
import { GameEvents } from "./src/events/game-events.js";

class App {
  constructor() {
    this.game = null;
    this.editor = null;
  }

  async init() {
    // Create editor without game - game will be created via dialog
    this.editor = new Editor();
    await this.editor.initialize();

    // Show editor by default
    this.editor.isActive = true;
    this.editor.ui.show();

    // Listen for world creation event from editor
    window.addEventListener(EditorEvents.WORLD_CREATED, async (e) => {
      await this.handleWorldCreated(e);
    });
  }

  async handleWorldCreated(e) {
    const { manualSettings, configPaths } = e.detail || {};

    // Destroy existing game if any
    if (this.game) {
      // TODO: Add proper cleanup method to Game class
    }

    // Create new game
    this.game = new Game();

    // Set config paths (use defaults if not provided)
    this.game.gameConfigInstance.configPath =
      (configPaths && configPaths.gameConfigPath) || "game-config.json";
    this.game.levelConfigInstance.configPath =
      (configPaths && configPaths.levelConfigPath) || "level1.json";

    // Dispatch GAME_CREATED event with game reference
    window.dispatchEvent(
      new CustomEvent(GameEvents.GAME_CREATED, {
        detail: { game: this.game },
      })
    );

    // Initialize the game (this loads the configs)
    await this.game.initialize();

    // Apply manual settings overrides after initialization
    if (
      manualSettings &&
      (manualSettings.worldSize !== null || manualSettings.gravity !== null)
    ) {
      this.applyManualSettings(manualSettings);
    }

    // Dispatch GAME_INITIALIZED event
    window.dispatchEvent(
      new CustomEvent(GameEvents.GAME_INITIALIZED, {
        detail: { game: this.game },
      })
    );
  }

  applyManualSettings(manualSettings) {
    // Override level data with manual settings
    if (manualSettings.worldSize !== null) {
      this.game.levelConfigInstance.levelData.worldSize =
        manualSettings.worldSize;
      // Update world instance if it exists
      if (this.game.worldInstance) {
        this.game.worldInstance.levelData.worldSize = manualSettings.worldSize;
      }
    }

    if (manualSettings.gravity !== null) {
      this.game.engine.gravity.y = manualSettings.gravity;
    }

    if (manualSettings.boundaries !== undefined) {
      if (this.game.levelConfigInstance.levelData.boundaries) {
        this.game.levelConfigInstance.levelData.boundaries.enabled =
          manualSettings.boundaries;
      }
      if (
        this.game.worldInstance &&
        this.game.worldInstance.levelData.boundaries
      ) {
        this.game.worldInstance.levelData.boundaries.enabled =
          manualSettings.boundaries;
      }
    }
  }
}

const app = new App();
app.init();
