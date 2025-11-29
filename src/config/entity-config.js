import { Config } from "./config.js";

export class EntityConfig extends Config {
  constructor(config = {}) {
    // EntityConfig doesn't use URL loading, just direct config
    super(null);
    // Merge provided config with defaults
    this.config = { ...this.getDefaultConfig(), ...config };
  }

  getDefaultConfig() {
    return {
      // Position
      x: 0,
      y: 0,

      // Size (for rectangles)
      width: 40,
      height: 40,

      // Size (for circles)
      shape: "rectangle", // 'rectangle' or 'circle'
      radius: 20,

      // Transform
      rotation: 0,

      // Visual
      color: "#ffffff",
      strokeColor: null,
      strokeWidth: 0,

      // Physics
      friction: 0.3,
      frictionAir: 0.01,
      restitution: 0,
      density: 0.001,
      isStatic: false,

      // Health
      health: 100,
      maxHealth: 100,
      healthDisplay: "none", // 'none', 'bar', 'text'
      healthEnabled: false, // Whether health system is enabled for this entity

      // Collision
      collisionsEnabled: true, // Whether collision system is enabled
      collisionGroups: [], // Array of collision group names

      // Type
      entityType: "entity", // 'entity', 'cloud', 'trigger'

      // Identity
      label: "entity",
    };
  }

  // Update a specific property
  updateProperty(key, value) {
    if (this.config.hasOwnProperty(key)) {
      this.config[key] = value;
    }
  }

  // Get a specific property
  getProperty(key) {
    return this.config[key];
  }
}
