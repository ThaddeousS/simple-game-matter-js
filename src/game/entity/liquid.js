import Matter from "matter-js";
import { Entity } from "./entity.js";

export class Liquid extends Entity {
  constructor(config, world) {
    // Liquid-specific defaults
    const liquidConfig = {
      isStatic: true, // Liquids don't move
      color: config.color || "#3498db88", // Semi-transparent blue default
      label: config.label || "liquid",
      collisions: "sensor",
      collisionsEnabled: true, // Always enabled for liquids
      viscosity: config.viscosity !== undefined ? config.viscosity : 0.5, // 0 = no resistance, 1 = maximum resistance
      ...config,
    };

    super(liquidConfig, world);

    // Always a sensor - entities pass through
    this.body.isSensor = true;

    // Store entities currently in the liquid
    this.entitiesInLiquid = new Set();

    // Store original air resistance values for entities
    this.originalFrictionAir = new Map();

    // Viscosity (0-1): controls how much the liquid slows movement
    this.viscosity = liquidConfig.viscosity;
  }

  update(entities, player) {
    // Call parent update for texture loading
    if (super.update) {
      super.update();
    }

    // If collisions are disabled, don't apply liquid effects
    if (this.config.collisionsEnabled === false) {
      // Restore any entities still affected
      this.entitiesInLiquid.forEach((bodyId) => {
        const body = this.findBodyById(bodyId, entities, player);
        if (body) {
          this.restoreBody(body);
        }
      });
      this.entitiesInLiquid.clear();
      return;
    }

    const bodiesToCheck = [];

    // Add player if exists
    if (player && player.body) {
      bodiesToCheck.push({ body: player.body, entity: player });
    }

    // Add all entity bodies
    if (entities) {
      entities.forEach((entity) => {
        if (entity.body && entity !== this) {
          bodiesToCheck.push({ body: entity.body, entity: entity });
        }
      });
    }

    // Track which bodies are currently in the liquid
    const currentlyInLiquid = new Set();

    // Check each body for collision with liquid
    bodiesToCheck.forEach(({ body, entity }) => {
      if (this.isBodyInLiquid(body)) {
        currentlyInLiquid.add(body.id);

        // If just entered liquid, store original friction
        if (!this.entitiesInLiquid.has(body.id)) {
          this.originalFrictionAir.set(body.id, body.frictionAir);
        }

        // Apply liquid resistance
        this.applyLiquidEffect(body, entity);
      }
    });

    // Restore bodies that left the liquid
    this.entitiesInLiquid.forEach((bodyId) => {
      if (!currentlyInLiquid.has(bodyId)) {
        const body = this.findBodyById(bodyId, entities, player);
        if (body) {
          this.restoreBody(body);
        }
      }
    });

    // Update tracking
    this.entitiesInLiquid = currentlyInLiquid;
  }

  isBodyInLiquid(body) {
    // Check if body's bounds overlap with liquid's bounds
    const liquidBounds = this.body.bounds;
    const bodyBounds = body.bounds;

    return !(
      bodyBounds.max.x < liquidBounds.min.x ||
      bodyBounds.min.x > liquidBounds.max.x ||
      bodyBounds.max.y < liquidBounds.min.y ||
      bodyBounds.min.y > liquidBounds.max.y
    );
  }

  applyLiquidEffect(body, entity) {
    const { Body } = Matter;

    // Calculate resistance based on viscosity
    // Higher viscosity = more air friction = slower movement
    const baseFriction = this.originalFrictionAir.get(body.id) || 0.01;
    const viscosityFriction = this.viscosity * 0.3; // Scale viscosity to reasonable friction range

    // Set air friction to slow down movement
    body.frictionAir = baseFriction + viscosityFriction;

    // Apply additional damping force based on velocity and viscosity
    // This creates a more liquid-like feel
    const dampingFactor = this.viscosity * 0.95; // 0 to 0.95 damping

    Body.setVelocity(body, {
      x: body.velocity.x * (1 - dampingFactor * 0.05),
      y: body.velocity.y * (1 - dampingFactor * 0.05),
    });

    // Reduce angular velocity (rotation slows in liquid)
    body.angularVelocity *= 1 - dampingFactor * 0.1;
  }

  restoreBody(body) {
    // Restore original air friction
    if (this.originalFrictionAir.has(body.id)) {
      body.frictionAir = this.originalFrictionAir.get(body.id);
      this.originalFrictionAir.delete(body.id);
    }
  }

  findBodyById(bodyId, entities, player) {
    // Find a body by its ID
    if (player && player.body && player.body.id === bodyId) {
      return player.body;
    }

    if (entities) {
      for (let entity of entities) {
        if (entity.body && entity.body.id === bodyId) {
          return entity.body;
        }
      }
    }

    return null;
  }

  getEntityConfig() {
    const baseConfig = super.getEntityConfig();
    // Get the config object and add viscosity to it
    const config = baseConfig.get();
    config.viscosity = this.viscosity;
    return baseConfig;
  }
}
