import { Entity } from "./entity";

export class Cloud extends Entity {
  constructor(config, world) {
    // Cloud-specific defaults
    const cloudConfig = {
      isStatic: true, // Clouds don't move
      color: config.color || "#ffffff99", // Semi-transparent white default
      label: config.label || "cloud",
      collisions: "solid",
      ...config,
    };

    super(cloudConfig, world);

    // Store original sensor state and collision checking
    this.allowPassThrough = true;

    // Make initially a sensor so things can pass through
    this.body.isSensor = true;

    // Store entities that are on top of the cloud
    this.entitiesOnTop = new Set();
  }

  // Check if an entity should be allowed to stand on this cloud
  shouldCollideWith(otherBody) {
    // Get the cloud's top surface position
    const cloudTop = this.body.bounds.min.y;

    // Get the other body's bottom position
    const otherBottom = otherBody.bounds.max.y;

    // Allow collision only if the other body is coming from above
    // and its bottom is at or above the cloud's top surface
    const isComingFromAbove =
      otherBody.velocity.y >= 0 && otherBottom <= cloudTop + 5;

    return isComingFromAbove;
  }

  update(entities, player) {
    // Call parent update for texture loading
    if (super.update) {
      super.update();
    }

    // This method will be called by the game engine to update collision state

    // If collisions are disabled, don't update sensor state
    if (this.config.collisionsEnabled === false) {
      return;
    }

    const bodiesToCheck = [];

    // Add player if exists
    if (player && player.body) {
      bodiesToCheck.push(player.body);
    }

    // Add all entity bodies
    if (entities) {
      entities.forEach((entity) => {
        if (entity.body && entity !== this) {
          bodiesToCheck.push(entity.body);
        }
      });
    }

    // Check each body and determine if cloud should be solid for it
    bodiesToCheck.forEach((body) => {
      if (this.shouldCollideWith(body)) {
        // Body is on top - make cloud solid for this body
        this.entitiesOnTop.add(body.id);
      } else {
        // Body is below or falling - remove from on-top tracking
        this.entitiesOnTop.delete(body.id);
      }
    });

    // If any entities are on top, make solid; otherwise sensor
    this.body.isSensor = this.entitiesOnTop.size === 0;
  }
}
