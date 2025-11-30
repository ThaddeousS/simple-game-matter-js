import { Trigger } from "../entity/trigger";
import { Entity } from "../entity/entity";
import { Cloud } from "../entity/cloud";
import { Player } from "../entity/player/player";
import { InputHandler } from "../../input/input-handler.js";
import Matter from "matter-js";

export class Engine {
  constructor(
    matterEngine,
    matterWorld,
    levelData,
    worldInstance,
    playerConfig
  ) {
    this.matterEngine = matterEngine; // Matter.js engine
    this.matterWorld = matterWorld; // Matter.js world
    this.levelData = levelData;
    this.worldInstance = worldInstance; // Our World class instance
    this.playerConfig = playerConfig;
    this.entities = [];
    this.triggers = [];
    this.clouds = [];
    this.player = null;
    this.input = null;
    this.inputEnabled = true; // Control whether input affects player
    this.onPlayerKilled = null; // Callback for when player dies

    // Initialize input handler
    this.createInput();
  }

  createInput() {
    // Initialize input handler
    this.input = new InputHandler();

    // Bind input actions
    this.input.bindAction("moveLeft", ["ArrowLeft", "a", "A"]);
    this.input.bindAction("moveRight", ["ArrowRight", "d", "D"]);
    this.input.bindAction("jump", ["ArrowUp", "w", "W", " "]);
  }

  createPlayer() {
    // Create player with config
    let playerConfig = { ...this.playerConfig };

    // Apply level-specific overrides if they exist
    if (this.levelData.overrides && this.levelData.overrides.player) {
      playerConfig = { ...playerConfig, ...this.levelData.overrides.player };
    }

    this.player = new Player(playerConfig, this.matterWorld);
    return this.player;
  }

  createEntities() {
    if (!this.levelData) {
      return;
    }

    const level = this.levelData;

    this.entities = []; // Reset entity instances
    this.triggers = []; // Reset trigger instances
    this.clouds = []; // Track cloud entities separately for updates

    // Create entities from the entities array
    if (level.entities) {
      level.entities.forEach((entityConfig) => {
        let entity;

        // Determine which class to instantiate based on entityType
        if (entityConfig.entityType === "cloud") {
          entity = new Cloud(entityConfig, this.matterWorld);
          this.clouds.push(entity);
        } else {
          entity = new Entity(entityConfig, this.matterWorld);
        }

        this.entities.push(entity);
      });
    }

    // Create triggers from the triggers array
    if (level.triggers) {
      level.triggers.forEach((triggerConfig) => {
        const trigger = new Trigger(triggerConfig, this.matterWorld);
        this.triggers.push(trigger);
      });
    }
  }

  setupCollisionDetection(onPlayerKilled) {
    this.onPlayerKilled = onPlayerKilled; // Store callback
    const { Events } = Matter;
    const killBoxes = this.worldInstance.getKillBoxes();

    Events.on(this.matterEngine, "collisionStart", (event) => {
      event.pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;

        // Check for kill box collisions
        if (killBoxes.some((kb) => kb === bodyA || kb === bodyB)) {
          const otherBody = killBoxes.includes(bodyA) ? bodyB : bodyA;

          // Check if it's the player
          if (
            this.player &&
            otherBody === this.player.body &&
            !this.player.isDestroyed
          ) {
            // Don't destroy player here - let the callback handle it
            if (this.onPlayerKilled) {
              this.onPlayerKilled();
            }
          } else {
            // Check if it's an entity
            const entity = this.entities.find((e) => e.body === otherBody);
            if (entity && !entity.isDestroyed) {
              entity.destroy();
              // Remove from entities array
              const index = this.entities.indexOf(entity);
              if (index > -1) {
                this.entities.splice(index, 1);
              }
            }
          }
        }

        // Check for trigger entry
        this.triggers.forEach((trigger) => {
          if (bodyA === trigger.body || bodyB === trigger.body) {
            const otherBody = bodyA === trigger.body ? bodyB : bodyA;
            trigger.handleCollisionStart(otherBody);
          }
        });
      });
    });

    Events.on(this.matterEngine, "collisionEnd", (event) => {
      event.pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;

        // Check for trigger exit
        this.triggers.forEach((trigger) => {
          if (bodyA === trigger.body || bodyB === trigger.body) {
            const otherBody = bodyA === trigger.body ? bodyB : bodyA;
            trigger.handleCollisionEnd(otherBody);
          }
        });
      });
    });
  }

  findEntityByBody(body) {
    if (this.player && body === this.player.body) {
      return this.player;
    }
    return this.entities.find((e) => e.body === body);
  }

  update() {
    // Update player with input (only if input is enabled)
    if (this.player && this.input && this.inputEnabled) {
      this.player.update(this.input);
    }

    // Update triggers
    this.triggers.forEach((trigger) => {
      trigger.update(this.entities, this.player);
    });

    // Update clouds (one-way platforms need to check entity positions)
    if (this.clouds) {
      this.clouds.forEach((cloud) => {
        cloud.update(this.entities, this.player);
      });
    }
  }

  clearEntities() {
    // Destroy player
    if (this.player) {
      this.player.destroy();
      this.player = null;
    }

    // Destroy all entities
    this.entities.forEach((entity) => entity.destroy());
    this.entities = [];

    // Clear triggers (they are also entities, so they're already destroyed)
    this.triggers = [];

    // Clear clouds
    this.clouds = [];
  }
}
