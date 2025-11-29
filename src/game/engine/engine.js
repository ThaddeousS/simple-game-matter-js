import { Trigger } from "../entity/trigger";
import { Entity } from "../entity/entity";
import { Cloud } from "../entity/cloud";
import Matter from "matter-js";

export class Engine {
  constructor(matterEngine, matterWorld, levelData, worldInstance) {
    this.matterEngine = matterEngine; // Matter.js engine
    this.matterWorld = matterWorld; // Matter.js world
    this.levelData = levelData;
    this.worldInstance = worldInstance; // Our World class instance
    this.entities = [];
    this.triggers = [];
    this.clouds = [];
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

  setupCollisionDetection(player, onPlayerKilled) {
    const { Events } = Matter;
    const killBoxes = this.worldInstance.getKillBoxes();

    Events.on(this.matterEngine, "collisionStart", (event) => {
      event.pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;

        // Check for kill box collisions
        if (killBoxes.some((kb) => kb === bodyA || kb === bodyB)) {
          const otherBody = killBoxes.includes(bodyA) ? bodyB : bodyA;

          // Check if it's the player
          if (otherBody === player.body && !player.isDestroyed) {
            // Don't destroy player here - let the callback handle it
            if (onPlayerKilled) {
              onPlayerKilled();
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

  findEntityByBody(body, player) {
    if (player && body === player.body) {
      return player;
    }
    return this.entities.find((e) => e.body === body);
  }

  update(player) {
    // Update triggers
    this.triggers.forEach((trigger) => {
      trigger.update(this.entities, player);
    });

    // Update clouds (one-way platforms need to check entity positions)
    if (this.clouds) {
      this.clouds.forEach((cloud) => {
        cloud.update(this.entities, player);
      });
    }
  }

  clearEntities() {
    // Destroy all entities
    this.entities.forEach((entity) => entity.destroy());
    this.entities = [];

    // Clear triggers (they are also entities, so they're already destroyed)
    this.triggers = [];

    // Clear clouds
    this.clouds = [];
  }
}
