import { Config } from "./config.js";

export class LevelConfig extends Config {
  constructor(url = null) {
    super(url);
    this.currentLevelUrl = url;
  }

  getDefaultConfig() {
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
        // Main ground platform
        {
          x: 0,
          y: 300,
          width: 600,
          height: 20,
          rotation: 0,
          color: "#2ecc71",
          strokeColor: null,
          strokeWidth: 0,
          friction: 0.3,
          frictionAir: 0.01,
          restitution: 0,
          density: 0.001,
          isStatic: true,
          health: 100,
          maxHealth: 100,
          healthDisplay: "none",
          label: "ground",
        },

        // Left platform
        {
          x: -400,
          y: 100,
          width: 200,
          height: 20,
          rotation: 0,
          color: "#3498db",
          strokeColor: null,
          strokeWidth: 0,
          friction: 0.3,
          frictionAir: 0.01,
          restitution: 0,
          density: 0.001,
          isStatic: true,
          health: 100,
          maxHealth: 100,
          healthDisplay: "none",
          label: "platform_left",
        },

        // Right platform
        {
          x: 400,
          y: -100,
          width: 200,
          height: 20,
          rotation: 0,
          color: "#9b59b6",
          strokeColor: null,
          strokeWidth: 0,
          friction: 0.3,
          frictionAir: 0.01,
          restitution: 0,
          density: 0.001,
          isStatic: true,
          health: 100,
          maxHealth: 100,
          healthDisplay: "none",
          label: "platform_right",
        },

        // Upper platform
        {
          x: 0,
          y: -250,
          width: 150,
          height: 20,
          rotation: 0,
          color: "#e74c3c",
          strokeColor: null,
          strokeWidth: 0,
          friction: 0.3,
          frictionAir: 0.01,
          restitution: 0,
          density: 0.001,
          isStatic: true,
          health: 100,
          maxHealth: 100,
          healthDisplay: "none",
          label: "platform_upper",
        },

        // Left wall
        {
          x: -600,
          y: 0,
          width: 20,
          height: 400,
          rotation: 0,
          color: "#95a5a6",
          strokeColor: null,
          strokeWidth: 0,
          friction: 0.3,
          frictionAir: 0.01,
          restitution: 0,
          density: 0.001,
          isStatic: true,
          health: 100,
          maxHealth: 100,
          healthDisplay: "none",
          label: "wall_left",
        },

        // Right wall
        {
          x: 600,
          y: 0,
          width: 20,
          height: 400,
          rotation: 0,
          color: "#95a5a6",
          strokeColor: null,
          strokeWidth: 0,
          friction: 0.3,
          frictionAir: 0.01,
          restitution: 0,
          density: 0.001,
          isStatic: true,
          health: 100,
          maxHealth: 100,
          healthDisplay: "none",
          label: "wall_right",
        },

        // Movable boxes
        {
          x: -200,
          y: -50,
          width: 40,
          height: 40,
          rotation: 0,
          color: "#f39c12",
          strokeColor: null,
          strokeWidth: 0,
          friction: 0.3,
          frictionAir: 0.01,
          restitution: 0,
          density: 0.001,
          isStatic: false,
          health: 100,
          maxHealth: 100,
          healthDisplay: "none",
          label: "box_1",
        },
        {
          x: 200,
          y: -50,
          width: 40,
          height: 40,
          rotation: 0,
          color: "#f39c12",
          strokeColor: null,
          strokeWidth: 0,
          friction: 0.3,
          frictionAir: 0.01,
          restitution: 0,
          density: 0.001,
          isStatic: false,
          health: 100,
          maxHealth: 100,
          healthDisplay: "none",
          label: "box_2",
        },
        {
          x: 0,
          y: 200,
          width: 50,
          height: 50,
          rotation: 0,
          color: "#e67e22",
          strokeColor: null,
          strokeWidth: 0,
          friction: 0.3,
          frictionAir: 0.01,
          restitution: 0,
          density: 0.001,
          isStatic: false,
          health: 100,
          maxHealth: 100,
          healthDisplay: "none",
          label: "box_3",
        },

        // Circles
        {
          x: -300,
          y: 0,
          shape: "circle",
          radius: 30,
          rotation: 0,
          color: "#1abc9c",
          strokeColor: null,
          strokeWidth: 0,
          friction: 0.3,
          frictionAir: 0.01,
          restitution: 0,
          density: 0.001,
          isStatic: false,
          health: 100,
          maxHealth: 100,
          healthDisplay: "none",
          label: "circle_1",
        },
        {
          x: 300,
          y: -200,
          shape: "circle",
          radius: 25,
          rotation: 0,
          color: "#16a085",
          strokeColor: null,
          strokeWidth: 0,
          friction: 0.3,
          frictionAir: 0.01,
          restitution: 0,
          density: 0.001,
          isStatic: false,
          health: 100,
          maxHealth: 100,
          healthDisplay: "none",
          label: "circle_2",
        },
      ],
      triggers: [
        {
          x: 0,
          y: -100,
          width: 100,
          height: 100,
          rotation: 0,
          label: "spawn_trigger",
          triggerType: "spawn",
          color: "#00ffff33",
        },
      ],
    };
  }

  async switchLevel(url) {
    if (!url) {
      // Load default level
      this.currentLevelUrl = null;
      this.url = null;
      this.config = this.getDefaultConfig();
      return this.config;
    } else {
      // Load new level
      this.currentLevelUrl = url;
      this.url = url;
      return await this.load();
    }
  }

  getCurrentLevelUrl() {
    return this.currentLevelUrl;
  }

  async reloadCurrentLevel() {
    return await this.switchLevel(this.currentLevelUrl);
  }
}
