import { Trigger } from "../entity/trigger";
import { Entity } from "../entity/entity";
import { Cloud } from "../entity/cloud";
import { Player } from "../entity/player/player";
import { InputHandler } from "../../input/input-handler.js";
import { PlayerSpawnPoint } from "../entity/spawn-point/player-spawn-point.js";
import { Liquid } from "../entity/liquid.js";
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
    this.liquids = [];
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

    // Bind input actions - Arrow keys and Space only
    this.input.bindAction("moveLeft", ["ArrowLeft"]);
    this.input.bindAction("moveRight", ["ArrowRight"]);
    this.input.bindAction("jump", [" "]); // Space bar only
  }

  createPlayer() {
    // Prepare player config
    let playerConfig = { ...this.playerConfig };

    // Apply level-specific overrides if they exist
    if (this.levelData.overrides && this.levelData.overrides.player) {
      playerConfig = { ...playerConfig, ...this.levelData.overrides.player };
    }

    // Check if there's a player spawn point in the level
    if (this.levelData.playerSpawn) {
      // Create the player spawn point
      this.playerSpawnPoint = new PlayerSpawnPoint(
        this.levelData.playerSpawn,
        this.matterWorld
      );

      // Add spawn point to entities so it shows in hierarchy
      this.entities.push(this.playerSpawnPoint);

      // Spawn the player from the spawn point with the player config
      this.player = this.playerSpawnPoint.spawnPlayer(
        playerConfig,
        this.matterWorld
      );

      return this.player;
    }

    // Fallback to legacy player creation (no spawn point)
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
    this.liquids = []; // Track liquid entities separately for updates

    // Create entities from the entities array
    if (level.entities) {
      level.entities.forEach((entityConfig) => {
        let entity;

        // Determine which class to instantiate based on entityType
        if (entityConfig.entityType === "cloud") {
          entity = new Cloud(entityConfig, this.matterWorld);
          this.clouds.push(entity);
        } else if (entityConfig.entityType === "liquid") {
          entity = new Liquid(entityConfig, this.matterWorld);
          this.liquids.push(entity);
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

        // Check if player is involved in collision (to reset jump)
        if (this.player && !this.player.isDestroyed) {
          if (bodyA === this.player.body || bodyB === this.player.body) {
            const otherBody = bodyA === this.player.body ? bodyB : bodyA;
            this.player.handleCollisionStart(otherBody);
          }
        }

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
    // Update all entities for texture loading
    this.entities.forEach((entity) => {
      if (entity.update) {
        entity.update();
      }
    });

    // Update triggers (they have their own update logic too)
    this.triggers.forEach((trigger) => {
      if (trigger.update) {
        trigger.update();
      }
    });

    // Update player (for texture loading, health checks, etc.)
    if (this.player) {
      this.player.update();
    }

    // Update player input (only if input is enabled)
    if (this.player && this.input && this.inputEnabled) {
      this.player.updateInput(this.input);
    }

    // Update clouds (one-way platforms need entity position checks)
    if (this.clouds) {
      this.clouds.forEach((cloud) => {
        if (cloud.update) {
          cloud.update(this.entities, this.player);
        }
      });
    }

    // Update liquids (apply viscosity effects)
    if (this.liquids) {
      this.liquids.forEach((liquid) => {
        if (liquid.update) {
          liquid.update(this.entities, this.player);
        }
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
