import Matter from "matter-js";
import { Camera } from "../camera/camera.js";
import { InputHandler } from "../input/input-handler.js";
import { Player } from "./entity/player/player.js";
import { Editor } from "../editor/editor.js";
import { GameConfig } from "../config/game-config.js";
import { LevelConfig } from "../config/level-config.js";
import { Engine } from "./engine/engine.js";
import { World } from "./world/world.js";

export class Game {
  constructor() {
    // Module aliases
    const { Engine, Render, World, Bodies, Runner, Events } = Matter;

    // Initialize config instances
    this.gameConfigInstance = new GameConfig("game-config.json");
    this.levelConfigInstance = new LevelConfig("level1.json");

    // These will be populated after async load
    this.gameConfig = null;
    this.playerConfig = null;
    this.levelData = null;

    // Initialize debug states separately
    this.debugLabels = false;
    this.wireframes = false;
    this.inputDisabled = false;

    // Store Matter.js references
    this.Engine = Engine;
    this.Render = Render;
    this.World = World;
    this.Bodies = Bodies;
    this.Runner = Runner;
    this.Events = Events;

    // Engine, render, camera will be initialized after config loads
    this.engine = null;
    this.world = null;
    this.render = null;
    this.camera = null;
    this.input = null;
    this.player = null;
    this.worldInstance = null; // Our custom World class instance
    this.gameEngine = null; // Our custom Engine class instance
    this.runner = null;
    this.editor = null;
  }

  // Accessor properties to delegate to engine
  get entities() {
    return this.gameEngine ? this.gameEngine.entities : [];
  }

  set entities(value) {
    if (this.gameEngine) {
      this.gameEngine.entities = value;
    }
  }

  get triggers() {
    return this.gameEngine ? this.gameEngine.triggers : [];
  }

  set triggers(value) {
    if (this.gameEngine) {
      this.gameEngine.triggers = value;
    }
  }

  async initialize() {
    // Load configurations
    await this.loadConfigurations();

    // Initialize debug state from config
    this.debugLabels = this.gameConfig.debug || false;

    // Validate and set initial zoom from level config
    const configZoom =
      this.levelData.zoom !== undefined ? this.levelData.zoom : 1;
    const validatedZoom = this.validateZoom(configZoom);
    if (validatedZoom !== configZoom) {
      this.levelData.zoom = validatedZoom;
    }

    // Set aspect ratio from game config (default to 16:9 if not specified)
    try {
      this.aspectRatio = this.gameConfig.aspectRatio
        ? this.parseAspectRatio(this.gameConfig.aspectRatio)
        : 16 / 9;
    } catch (error) {
      alert(
        "Invalid aspect ratio in game config.\n" +
          error.message +
          "\n\nReverting to default 16:9"
      );
      this.gameConfig.aspectRatio = "16:9";
      this.aspectRatio = 16 / 9;
    }

    // Calculate initial dimensions maintaining aspect ratio
    const dimensions = this.calculateCanvasDimensions();

    // Create world instance
    this.worldInstance = new World(this.levelData);
    const { matterEngine, matterWorld } = this.worldInstance.create();
    this.engine = matterEngine;
    this.world = matterWorld;

    // Create renderer
    this.render = this.Render.create({
      element: document.body,
      engine: this.engine,
      options: {
        width: dimensions.width,
        height: dimensions.height,
        wireframes: this.wireframes,
        background: "#2c3e50",
      },
    });

    // Initialize camera
    this.camera = new Camera(0, 0, dimensions.width, dimensions.height);

    // Set initial zoom from level config
    this.camera.setZoom(this.levelData.zoom);

    // Initialize input
    this.input = new InputHandler();

    // Bind input actions
    this.input.bindAction("moveLeft", ["ArrowLeft", "a", "A"]);
    this.input.bindAction("moveRight", ["ArrowRight", "d", "D"]);
    this.input.bindAction("jump", ["ArrowUp", "w", "W", " "]);

    // Create game engine instance
    this.gameEngine = new Engine(
      this.engine,
      this.world,
      this.levelData,
      this.worldInstance
    );

    // Create world with loaded level data (this also finds the player)
    this.createWorld();

    // Set camera to follow player
    if (this.player) {
      this.camera.setTarget(this.player.body);
    }

    // Setup event listeners
    this.setupEvents();

    // Create and start the runner
    this.runner = this.Runner.create();
    this.Runner.run(this.runner, this.engine);
    this.Render.run(this.render);

    // Set up custom rendering for health displays
    this.setupCustomRendering();

    // Set up collision detection
    this.setupCollisionDetection();

    // Initialize editor
    this.editor = new Editor(this);

    // Game loop
    this.gameLoop();

    // Save initial state as default after everything is loaded
    requestAnimationFrame(() => {
      if (this.player) {
        this.editor.saveWorkingState();
      } else {
        console.error("Player was not created - cannot save initial state");
      }
    });
  }

  setupCollisionDetection() {
    // Delegate collision detection to engine
    this.gameEngine.setupCollisionDetection(this.player, () =>
      this.handlePlayerDeath()
    );
  }

  handlePlayerDeath() {
    if (this.player && !this.player.isDestroyed) {
      this.player.destroy();
      this.showGameOver();
    }
  }

  showGameOver() {
    const dialog = document.getElementById("game-over-dialog");
    dialog.style.display = "block";
  }

  hideGameOver() {
    const dialog = document.getElementById("game-over-dialog");
    dialog.style.display = "none";
  }

  pauseSimulation() {
    // Pause the physics engine
    const { Runner } = Matter;
    Runner.stop(this.runner);

    // Disable input
    this.inputDisabled = true;

    // Disable camera following
    this.camera.followEnabled = false;
  }

  resumeSimulation() {
    // Resume the physics engine
    const { Runner } = Matter;
    Runner.run(this.runner, this.engine);

    // Enable input
    this.inputDisabled = false;

    // Enable camera following
    this.camera.followEnabled = true;
  }

  setupCustomRendering() {
    const canvas = this.render.canvas;
    const context = this.render.context;

    // Hook into Matter.js render events to draw health displays and debug labels
    const { Events } = Matter;
    Events.on(this.render, "afterRender", () => {
      // Check if info panel is visible
      const infoPanel = document.getElementById("info");
      const isPanelVisible = infoPanel && infoPanel.style.display !== "none";

      // Render health for all entities
      if (this.entities) {
        this.entities.forEach((entity) => {
          entity.renderHealth(context, this.camera);

          // Render debug labels only if debug labels mode is on AND panel is visible
          if (this.debugLabels && isPanelVisible) {
            entity.renderDebugLabel(context, this.camera);
          }
        });
      }

      // Render health and debug for player
      if (this.player) {
        this.player.renderHealth(context, this.camera);

        if (this.debugLabels && isPanelVisible) {
          this.player.renderDebugLabel(context, this.camera);
        }
      }

      // Render selection highlight if in editor mode with SelectTool
      if (
        this.editor &&
        this.editor.isActive &&
        this.editor.currentTool === this.editor.tools.select
      ) {
        this.editor.tools.select.renderHighlight(context, this.camera);
      }
    });
  }

  calculateCanvasDimensions() {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const windowAspectRatio = windowWidth / windowHeight;

    let width, height;

    if (windowAspectRatio > this.aspectRatio) {
      // Window is wider than target aspect ratio
      // Fit to height
      height = windowHeight;
      width = height * this.aspectRatio;
    } else {
      // Window is taller than target aspect ratio
      // Fit to width
      width = windowWidth;
      height = width / this.aspectRatio;
    }

    return { width, height };
  }

  parseAspectRatio(aspectRatioString) {
    // Valid aspect ratios
    const validRatios = {
      "16:9": 16 / 9,
      "4:3": 4 / 3,
      "21:9": 21 / 9,
    };

    if (typeof aspectRatioString === "number") {
      // If it's already a number, validate it matches one of our allowed ratios
      const matchingRatio = Object.entries(validRatios).find(
        ([key, value]) => Math.abs(value - aspectRatioString) < 0.0001
      );

      if (!matchingRatio) {
        throw new Error(
          `Invalid aspect ratio: ${aspectRatioString}. ` +
            `Only the following aspect ratios are supported: "16:9", "4:3", "21:9"`
        );
      }
      return aspectRatioString;
    }

    if (typeof aspectRatioString === "string") {
      if (!validRatios.hasOwnProperty(aspectRatioString)) {
        throw new Error(
          `Invalid aspect ratio: "${aspectRatioString}". ` +
            `Only the following aspect ratios are supported: "16:9", "4:3", "21:9"`
        );
      }
      return validRatios[aspectRatioString];
    }

    throw new Error(
      `Invalid aspect ratio format. ` +
        `Only the following aspect ratios are supported: "16:9", "4:3", "21:9"`
    );
  }

  validateZoom(zoom) {
    // Check if zoom is 0 or less
    if (zoom <= 0) {
      alert(
        `Invalid zoom level: ${zoom}\nZoom must be greater than 0.\n\nResetting to default zoom: 1`
      );
      return 1;
    }

    // Check if zoom is greater than 100
    if (zoom > 100) {
      alert(
        `Invalid zoom level: ${zoom}\nZoom is too large (maximum: 100).\n\nResetting to default zoom: 1`
      );
      return 1;
    }

    return zoom;
  }

  async loadConfigurations() {
    // Load game config
    this.gameConfig = await this.gameConfigInstance.load();

    // Load level config
    this.levelData = await this.levelConfigInstance.load();

    // Load player config (still uses old method for now)
    this.playerConfig = this.getDefaultPlayerConfig();
  }

  getDefaultGameConfig() {
    return {
      aspectRatio: "16:9",
      debug: false,
    };
  }

  getDefaultPlayerConfig() {
    return {
      x: 0,
      y: -400,
      width: 40,
      height: 60,
      color: "#ffcc00",
      strokeColor: "#ff9900",
      strokeWidth: 3,
      moveForce: 0.001,
      jumpForce: 0.015,
      maxSpeed: 8,
      friction: 0.3,
      frictionAir: 0.01,
      density: 0.002,
      health: 100,
      maxHealth: 100,
      healthDisplay: "bar",
      healthEnabled: true,
    };
  }

  getDefaultLevel() {
    return {
      worldSize: 3000,
      wallThickness: 50,
      zoom: 1,
      boundaries: {
        enabled: true,
      },
      overrides: {
        player: {
          x: 0,
          y: -400,
        },
      },
      entities: [
        {
          x: -400,
          y: 100,
          width: 300,
          height: 20,
          color: "#e74c3c",
          isStatic: true,
          label: "platform_1",
        },
        {
          x: 400,
          y: -100,
          width: 300,
          height: 20,
          color: "#3498db",
          isStatic: true,
          label: "platform_2",
        },
        {
          x: 0,
          y: 300,
          width: 400,
          height: 20,
          color: "#2ecc71",
          isStatic: true,
          label: "platform_3",
        },
        {
          x: -600,
          y: -200,
          width: 200,
          height: 20,
          color: "#f39c12",
          isStatic: true,
          label: "platform_4",
        },
        {
          x: 600,
          y: 200,
          width: 200,
          height: 20,
          color: "#9b59b6",
          isStatic: true,
          label: "platform_5",
        },
        {
          x: -200,
          y: -300,
          width: 50,
          height: 50,
          color: "#e74c3c",
          label: "box_1",
        },
        {
          x: 300,
          y: -200,
          width: 40,
          height: 40,
          color: "#3498db",
          label: "box_2",
        },
        {
          x: -500,
          y: 50,
          width: 60,
          height: 60,
          color: "#2ecc71",
          label: "box_3",
        },
        {
          x: 100,
          y: 150,
          width: 45,
          height: 45,
          color: "#f39c12",
          label: "box_4",
        },
        {
          x: 450,
          y: -50,
          width: 55,
          height: 55,
          color: "#9b59b6",
          label: "box_5",
        },
        {
          x: -100,
          y: -200,
          shape: "circle",
          radius: 30,
          color: "#e74c3c",
          label: "circle_1",
        },
        {
          x: 250,
          y: -100,
          shape: "circle",
          radius: 25,
          color: "#3498db",
          label: "circle_2",
        },
        {
          x: -400,
          y: 100,
          shape: "circle",
          radius: 35,
          color: "#2ecc71",
          label: "circle_3",
        },
        {
          x: 150,
          y: 200,
          shape: "circle",
          radius: 28,
          color: "#f39c12",
          label: "circle_4",
        },
        {
          x: 500,
          y: -50,
          shape: "circle",
          radius: 40,
          color: "#9b59b6",
          label: "circle_5",
        },
      ],
      triggers: [
        {
          x: -100,
          y: -400,
          width: 100,
          height: 100,
          label: "test_trigger",
          triggerType: "test",
          color: "#00ffff33",
        },
      ],
    };
  }

  loadLevelFromFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const levelData = JSON.parse(e.target.result);

        // Validate zoom if specified
        if (levelData.zoom !== undefined) {
          const validatedZoom = this.validateZoom(levelData.zoom);
          levelData.zoom = validatedZoom;
        }

        this.levelData = levelData;

        // Apply zoom from level config
        this.camera.setZoom(this.levelData.zoom || 1);
        this.updateZoom();

        this.resetWorld();
      } catch (error) {
        alert("Invalid level file format. Please check the JSON structure.");
      }
    };
    reader.readAsText(file);
  }

  loadGameConfigFromFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const gameConfig = JSON.parse(e.target.result);
        this.gameConfig = gameConfig;

        // Update aspect ratio if specified in the config
        if (gameConfig.aspectRatio) {
          try {
            this.aspectRatio = this.parseAspectRatio(gameConfig.aspectRatio);

            // Recalculate and update canvas dimensions
            const dimensions = this.calculateCanvasDimensions();
            this.render.canvas.width = dimensions.width;
            this.render.canvas.height = dimensions.height;
            this.camera.width = dimensions.width;
            this.camera.height = dimensions.height;
            this.render.options.width = dimensions.width;
            this.render.options.height = dimensions.height;
          } catch (aspectError) {
            alert(
              "Invalid aspect ratio in game config.\n" +
                aspectError.message +
                "\n\nReverting to current aspect ratio."
            );
          }
        }

        // Update debug labels if specified
        if (gameConfig.debug !== undefined) {
          this.debugLabels = gameConfig.debug;
          this.updateDebugStatus();
        }
      } catch (error) {
        alert(
          "Invalid game config file format. Please check the JSON structure."
        );
      }
    };
    reader.readAsText(file);
  }

  loadPlayerConfigFromFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const playerConfig = JSON.parse(e.target.result);
        this.playerConfig = playerConfig;
        this.resetWorld();
      } catch (error) {
        alert(
          "Invalid player config file format. Please check the JSON structure."
        );
      }
    };
    reader.readAsText(file);
  }

  createWorld() {
    if (!this.levelData) {
      return;
    }

    // Create world boundaries
    this.worldInstance.createBoundaries();

    // Create entities via engine
    this.gameEngine.createEntities();

    // Create the player
    this.createPlayer();
  }

  createPlayer() {
    // Create player with config
    let playerConfig = { ...this.playerConfig };

    // Apply level-specific overrides if they exist
    if (this.levelData.overrides && this.levelData.overrides.player) {
      playerConfig = { ...playerConfig, ...this.levelData.overrides.player };
    }

    this.player = new Player(playerConfig, this.world);
  }

  setupEvents() {
    // Handle window resize
    window.addEventListener("resize", () => {
      const dimensions = this.calculateCanvasDimensions();
      this.render.canvas.width = dimensions.width;
      this.render.canvas.height = dimensions.height;
      this.camera.width = dimensions.width;
      this.camera.height = dimensions.height;

      // Update render options
      this.render.options.width = dimensions.width;
      this.render.options.height = dimensions.height;
    });

    // Handle mouse wheel zoom (only when debug panel is open)
    window.addEventListener(
      "wheel",
      (e) => {
        const infoPanel = document.getElementById("info");
        const isPanelVisible = infoPanel && infoPanel.style.display !== "none";

        if (isPanelVisible) {
          e.preventDefault();

          // Adjust zoom based on wheel delta
          const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1;
          this.camera.setZoom(this.camera.zoom * zoomDelta);

          this.updateZoom();
        }
      },
      { passive: false }
    );

    // Handle keyboard shortcuts
    window.addEventListener("keydown", (e) => {
      // Ctrl+D can always be used to toggle the panel
      if ((e.key === "d" || e.key === "D") && e.ctrlKey) {
        e.preventDefault(); // Prevent browser bookmark dialog
        const infoPanel = document.getElementById("info");
        const isHidden =
          infoPanel.style.display === "none" || !infoPanel.style.display;

        if (isHidden) {
          // Showing panel - restore debug settings
          infoPanel.style.display = "block";
          this.render.options.wireframes = this.wireframes;
        } else {
          // Hiding panel - disable visual debug features but preserve settings
          infoPanel.style.display = "none";
          this.render.options.wireframes = false;
          // Reset zoom to level config default
          this.camera.setZoom(this.levelData.zoom || 1);
          this.updateZoom();
        }
        return;
      }

      // Ctrl+I can always be used to toggle editor mode
      if ((e.key === "i" || e.key === "I") && e.ctrlKey) {
        e.preventDefault();
        if (this.editor) {
          this.editor.toggle();
        }
        return;
      }

      // Check if info panel is visible for all other shortcuts
      const infoPanel = document.getElementById("info");
      const isPanelVisible = infoPanel.style.display !== "none";

      if (!isPanelVisible) {
        // If panel is hidden, ignore all other shortcuts
        return;
      }

      // All other shortcuts only work when panel is visible
      if (e.key === "r" || e.key === "R") {
        this.resetWorld();
      } else if ((e.key === "l" || e.key === "L") && !e.ctrlKey) {
        document.getElementById("levelFileInput").click();
      } else if ((e.key === "g" || e.key === "G") && !e.ctrlKey) {
        document.getElementById("gameConfigFileInput").click();
      } else if ((e.key === "p" || e.key === "P") && !e.ctrlKey) {
        document.getElementById("playerConfigFileInput").click();
      } else if ((e.key === "l" || e.key === "L") && e.ctrlKey) {
        // Toggle debug labels with Ctrl+L
        e.preventDefault();
        this.debugLabels = !this.debugLabels;
        this.updateDebugStatus();
      } else if ((e.key === "y" || e.key === "Y") && e.ctrlKey) {
        // Toggle wireframes with Ctrl+Y
        e.preventDefault();
        this.wireframes = !this.wireframes;
        this.render.options.wireframes = this.wireframes;
        this.updateDebugStatus();
      } else if (e.key === "1") {
        // Test: Damage player
        if (this.player && !this.player.isDestroyed) {
          this.player.takeDamage(10);
        }
      } else if (e.key === "2") {
        // Test: Heal player
        if (this.player && !this.player.isDestroyed) {
          this.player.heal(10);
        }
      }
    });

    // Handle file input for loading custom levels
    const levelFileInput = document.getElementById("levelFileInput");
    levelFileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        this.loadLevelFromFile(file);
      }
      // Reset the input so the same file can be loaded again
      e.target.value = "";
    });

    // Handle file input for loading game config
    const gameConfigFileInput = document.getElementById("gameConfigFileInput");
    gameConfigFileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        this.loadGameConfigFromFile(file);
      }
      // Reset the input so the same file can be loaded again
      e.target.value = "";
    });

    // Handle file input for loading player config
    const playerConfigFileInput = document.getElementById(
      "playerConfigFileInput"
    );
    playerConfigFileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        this.loadPlayerConfigFromFile(file);
      }
      // Reset the input so the same file can be loaded again
      e.target.value = "";
    });
  }

  toggleInfoPanel() {
    const infoContent = document.getElementById("info-content");
    const infoHeader = document.getElementById("info-header");
    const isCollapsed = infoContent.style.display === "none";

    infoContent.style.display = isCollapsed ? "block" : "none";
    infoHeader.innerHTML = isCollapsed
      ? "<strong>▼ Controls & Info</strong>"
      : "<strong>▶ Controls & Info</strong>";
  }

  updateDebugStatus() {
    document.getElementById("debug-status").textContent =
      `Debug Labels: ${this.debugLabels ? "ON" : "OFF"} | Wireframes: ${this.wireframes ? "ON" : "OFF"} | Zoom: ${this.camera.zoom.toFixed(2)}x`;
  }

  updateZoom() {
    // Update the render bounds based on zoom level
    const { Render } = Matter;

    // Calculate bounds based on zoom
    const viewWidth = this.camera.width / this.camera.zoom;
    const viewHeight = this.camera.height / this.camera.zoom;

    Render.lookAt(this.render, {
      min: {
        x: this.camera.x - viewWidth / 2,
        y: this.camera.y - viewHeight / 2,
      },
      max: {
        x: this.camera.x + viewWidth / 2,
        y: this.camera.y + viewHeight / 2,
      },
    });

    this.updateDebugStatus();
  }

  resetWorld() {
    // Hide game over dialog first
    this.hideGameOver();

    // If editor exists and has default state, restore it
    if (this.editor && this.editor.defaultState) {
      this.editor.restoreState(this.editor.defaultState);
      return;
    }

    // Otherwise do standard reset
    const { World } = Matter;
    World.clear(this.world);
    this.engine.world = this.world;
    this.createWorld();
    this.createPlayer();
    this.camera.setTarget(this.player.body);
    this.camera.x = 0;
    this.camera.y = 0;
  }

  async switchLevel(levelUrl = null) {
    // Load new level configuration
    this.levelData = await this.levelConfigInstance.switchLevel(levelUrl);

    // Validate and update zoom
    const configZoom =
      this.levelData.zoom !== undefined ? this.levelData.zoom : 1;
    const validatedZoom = this.validateZoom(configZoom);
    if (validatedZoom !== configZoom) {
      this.levelData.zoom = validatedZoom;
    }

    // Reset the world with new level data
    const { World } = Matter;
    World.clear(this.world);
    this.engine.world = this.world;
    this.createWorld();
    this.createPlayer();
    this.camera.setTarget(this.player.body);
    this.camera.x = 0;
    this.camera.y = 0;
    this.camera.setZoom(this.levelData.zoom);
    this.hideGameOver();
  }

  updateCamera() {
    // Update player based on input (only if input is not disabled)
    if (this.player && !this.inputDisabled) {
      this.player.update(this.input);
    }

    // Update camera to follow player
    this.camera.update();

    // Update the render bounds with zoom applied
    this.updateZoom();

    // Update UI
    if (this.player && !this.player.isDestroyed) {
      const playerPos = this.player.getPosition();
      document.getElementById("camera-pos").textContent =
        `Camera: (${Math.round(this.camera.x)}, ${Math.round(this.camera.y)}) | Player: (${Math.round(playerPos.x)}, ${Math.round(playerPos.y)}) | Health: ${this.player.health}/${this.player.maxHealth}`;
    } else if (this.player && this.player.isDestroyed) {
      document.getElementById("camera-pos").textContent =
        `Player Destroyed! Press R to reset.`;
    }
  }

  gameLoop() {
    this.updateCamera();

    // Check if debug panel is visible
    const infoPanel = document.getElementById("info");
    const isPanelVisible = infoPanel && infoPanel.style.display !== "none";

    // Update trigger visibility and state via engine
    if (this.gameEngine) {
      this.gameEngine.triggers.forEach((trigger) => {
        trigger.body.render.visible = isPanelVisible;
      });
      this.gameEngine.update(this.player);
    }

    requestAnimationFrame(() => this.gameLoop());
  }
}
