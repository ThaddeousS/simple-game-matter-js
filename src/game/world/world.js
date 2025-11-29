import Matter from "matter-js";

export class World {
  constructor(levelData) {
    this.levelData = levelData;
    this.matterWorld = null;
    this.killBoxes = [];
  }

  create() {
    // Create Matter.js engine and world
    const { Engine } = Matter;
    const matterEngine = Engine.create();
    this.matterWorld = matterEngine.world;

    return { matterEngine, matterWorld: this.matterWorld };
  }

  createBoundaries() {
    if (!this.levelData || !this.matterWorld) {
      return [];
    }

    const { Bodies, World: MatterWorld } = Matter;
    const level = this.levelData;
    const bodies = [];
    this.killBoxes = []; // Reset kill boxes

    // Create boundaries if enabled
    if (level.boundaries && level.boundaries.enabled) {
      const worldSize = level.worldSize || 3000;
      const wallThickness = level.wallThickness || 50;

      // Ground (kill box)
      const ground = Bodies.rectangle(
        0,
        worldSize / 2,
        worldSize,
        wallThickness,
        {
          isStatic: true,
          render: { fillStyle: "#34495e" },
          label: "killbox_ground",
        }
      );
      bodies.push(ground);
      this.killBoxes.push(ground);

      // Ceiling (kill box)
      const ceiling = Bodies.rectangle(
        0,
        -worldSize / 2,
        worldSize,
        wallThickness,
        {
          isStatic: true,
          render: { fillStyle: "#34495e" },
          label: "killbox_ceiling",
        }
      );
      bodies.push(ceiling);
      this.killBoxes.push(ceiling);

      // Left wall (kill box)
      const leftWall = Bodies.rectangle(
        -worldSize / 2,
        0,
        wallThickness,
        worldSize,
        {
          isStatic: true,
          render: { fillStyle: "#34495e" },
          label: "killbox_left",
        }
      );
      bodies.push(leftWall);
      this.killBoxes.push(leftWall);

      // Right wall (kill box)
      const rightWall = Bodies.rectangle(
        worldSize / 2,
        0,
        wallThickness,
        worldSize,
        {
          isStatic: true,
          render: { fillStyle: "#34495e" },
          label: "killbox_right",
        }
      );
      bodies.push(rightWall);
      this.killBoxes.push(rightWall);
    }

    // Add all boundary bodies to world
    if (bodies.length > 0) {
      MatterWorld.add(this.matterWorld, bodies);
    }

    return bodies;
  }

  getKillBoxes() {
    return this.killBoxes;
  }

  clear() {
    if (this.matterWorld) {
      const { World: MatterWorld } = Matter;
      MatterWorld.clear(this.matterWorld, false);
    }
    this.killBoxes = [];
  }
}
