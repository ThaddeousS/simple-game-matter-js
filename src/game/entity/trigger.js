import { Entity } from "./entity.js";

export class Trigger extends Entity {
  constructor(config, world) {
    // Force sensor to be on for triggers
    const triggerConfig = {
      isStatic: true, // Triggers don't move
      label: config.label || "trigger",
      color: config.color || "#00ffff33", // Semi-transparent cyan default
      healthDisplay: "none", // Triggers don't show health
      entityType: "trigger", // Ensure entity type is set
      ...config,
    };

    super(triggerConfig, world);

    // Hide trigger rendering by default (will be shown when debug panel is open)
    this.body.render.visible = false;

    // Trigger-specific properties
    this.triggerType = config.triggerType || "generic"; // e.g., 'checkpoint', 'zone', 'damage'
    this.onEnter = config.onEnter || null; // Callback function when entity enters
    this.onExit = config.onExit || null; // Callback function when entity exits
    this.onStay = config.onStay || null; // Callback function while entity is inside
    this.triggerData = config.triggerData || {}; // Additional data for the trigger

    // Track entities currently inside the trigger
    this.entitiesInside = new Set();
  }

  handleCollisionStart(otherBody) {
    // Add to set of entities inside
    this.entitiesInside.add(otherBody);

    // Call onEnter callback if defined
    if (this.onEnter && typeof this.onEnter === "function") {
      this.onEnter(otherBody, this);
    }
  }

  handleCollisionEnd(otherBody) {
    // Remove from set of entities inside
    this.entitiesInside.delete(otherBody);

    // Call onExit callback if defined
    if (this.onExit && typeof this.onExit === "function") {
      this.onExit(otherBody, this);
    }
  }

  update() {
    // Update visibility based on debug panel state
    const infoPanel = document.getElementById("info");
    const isPanelVisible = infoPanel && infoPanel.style.display !== "none";
    this.body.render.visible = isPanelVisible;

    // Call onStay for all entities currently inside
    if (this.onStay && typeof this.onStay === "function") {
      this.entitiesInside.forEach((body) => {
        this.onStay(body, this);
      });
    }
  }

  isEntityInside(body) {
    return this.entitiesInside.has(body);
  }

  clearEntities() {
    this.entitiesInside.clear();
  }
}
