import { Entity } from "../entity.js";
import { GameEvents } from "../../../events/game-events.js";

export class SpawnPoint extends Entity {
  constructor(config, world) {
    // SpawnPoint-specific defaults
    const spawnConfig = {
      isStatic: true,
      color: config.color || "#00ff0044", // Semi-transparent green
      label: config.label || "spawn_point",
      entityType: "spawn_point",
      width: config.width || 40,
      height: config.height || 60,
      ...config,
    };

    super(spawnConfig, world);

    // Spawn points are sensors (don't collide physically)
    this.body.isSensor = true;

    // Spawn point properties
    this.spawnType = config.spawnType || "generic"; // Type of entity to spawn
  }

  spawn(EntityClass, config, world) {
    // Create spawn position from this spawn point's position
    const spawnConfig = {
      x: this.body.position.x,
      y: this.body.position.y,
      ...config,
    };

    // Create the entity
    const entity = new EntityClass(spawnConfig, world);

    // Call onSpawned hook
    this.onSpawned(entity);

    return entity;
  }

  onSpawned(entity) {
    // Dispatch ENTITY_SPAWNED event
    window.dispatchEvent(
      new CustomEvent(GameEvents.ENTITY_SPAWNED, {
        detail: { entity: entity, spawnPoint: this },
      })
    );
  }
}
