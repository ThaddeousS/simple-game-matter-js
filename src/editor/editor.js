import { SelectTool } from "./ui/tools/select-tool.js";
import { EntityTool } from "./ui/tools/entity-tool.js";
import { DeleteTool } from "./ui/tools/delete-tool.js";
import { Entity } from "../game/entity/entity.js";
import { Player } from "../game/entity/player/player.js";
import { Cloud } from "../game/entity/cloud.js";
import { Trigger } from "../game/entity/trigger.js";
import { EditorUI } from "./ui/editor-ui.js";
import { GameEvents } from "../events/game-events.js";
import { Styles } from "../styles/styles.js";
import { Liquid } from "../game/entity/liquid.js";
import Matter from "matter-js";

export class Editor {
  constructor(game) {
    this.game = game;
    this.isActive = false;
    this.currentTool = "select";

    // Mouse navigation
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.cameraStartX = 0;
    this.cameraStartY = 0;

    // Toolbar widths
    this.leftToolbarDefaultWidth = 180;
    this.rightToolbarDefaultWidth = 220;

    // State management
    this.defaultState = null; // The default state to revert to
    this.workingState = null; // Current working state while editing

    // Track entities that have been manually deleted (to not recreate on reset)
    this.deletedEntityIds = new Set();

    // Initialize tools
    this.tools = {
      select: new SelectTool(this),
      entity: new EntityTool(this),
      delete: new DeleteTool(this),
    };
    this.currentTool = this.tools.select;
    this.currentTool.activate();

    // Create EditorUI
    this.ui = new EditorUI(this);
    this.ui.create();

    this.setupMouseNavigation();
    this.setupGameEventListeners();
  }

  setupGameEventListeners() {
    // Listen for toggle editor event
    window.addEventListener(GameEvents.TOGGLE_EDITOR, () => {
      this.toggle();
    });

    // Listen for reset request
    window.addEventListener(GameEvents.REQUEST_RESET, (e) => {
      if (this.defaultState) {
        // Handle the reset
        this.restoreState(this.defaultState);
        e.detail.handled = true;
      }
    });

    // Listen for render events to draw selection highlight
    window.addEventListener(GameEvents.BEFORE_RENDER, (e) => {
      if (this.isActive && this.currentTool === this.tools.select) {
        this.tools.select.renderHighlight(e.detail.context, e.detail.camera);
      }
    });
  }

  async initialize() {
    // Wait for next frame to ensure game is fully initialized
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        if (this.game.player) {
          this.saveWorkingState();
          resolve();
        } else {
          console.error("Player was not created - cannot save initial state");
          resolve();
        }
      });
    });
  }

  setupMouseNavigation() {
    // Reset button

    // Exit button
    document.getElementById("editor-exit-btn").addEventListener("click", () => {
      this.toggle();
    });

    // Tool buttons
    document.getElementById("tool-select").addEventListener("click", () => {
      this.selectTool("select");
    });
    document.getElementById("tool-entity").addEventListener("click", () => {
      this.selectTool("entity");
    });
    document.getElementById("tool-delete").addEventListener("click", () => {
      this.selectTool("delete");
    });
  }

  setupMouseNavigation() {
    const canvas = this.game.render.canvas;

    canvas.addEventListener("mousedown", (e) => {
      if (!this.isActive) return;

      // Only start camera dragging if Ctrl key is held
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault(); // Prevent default Ctrl+click behavior
        this.isDragging = true;
        this.dragStartX = e.clientX;
        this.dragStartY = e.clientY;
        this.cameraStartX = this.game.camera.x;
        this.cameraStartY = this.game.camera.y;
        canvas.style.cursor = "grabbing";
      }
    });

    canvas.addEventListener("mousemove", (e) => {
      if (!this.isActive) return;

      // Update cursor based on Ctrl key state
      if (!this.isDragging) {
        if (e.ctrlKey || e.metaKey) {
          canvas.style.cursor = "grab";
        } else if (this.currentTool) {
          // Restore tool cursor
          if (this.currentTool === this.tools.select) {
            canvas.style.cursor = "default";
          } else if (this.currentTool === this.tools.entity) {
            canvas.style.cursor = "crosshair";
          } else if (this.currentTool === this.tools.delete) {
            canvas.style.cursor = "not-allowed";
          }
        }
      }

      if (this.isDragging) {
        // Calculate camera movement in world space (accounting for zoom)
        const deltaScreenX = e.clientX - this.dragStartX;
        const deltaScreenY = e.clientY - this.dragStartY;

        // Convert screen space delta to world space delta
        const scale =
          this.game.camera.width /
          (this.game.camera.width / this.game.camera.zoom);
        const deltaWorldX = deltaScreenX / scale;
        const deltaWorldY = deltaScreenY / scale;

        // Update camera position (invert for natural dragging)
        this.game.camera.x = this.cameraStartX - deltaWorldX;
        this.game.camera.y = this.cameraStartY - deltaWorldY;
      }
    });

    canvas.addEventListener("mouseup", () => {
      if (!this.isActive) return;

      if (this.isDragging) {
        this.isDragging = false;
        // Reset cursor based on current tool
        if (this.currentTool) {
          if (this.currentTool === this.tools.select) {
            canvas.style.cursor = "default";
          } else if (this.currentTool === this.tools.entity) {
            canvas.style.cursor = "crosshair";
          } else if (this.currentTool === this.tools.delete) {
            canvas.style.cursor = "not-allowed";
          }
        }
      }
    });

    canvas.addEventListener("mouseleave", () => {
      if (!this.isActive) return;

      this.isDragging = false;
    });
  }

  selectTool(toolName) {
    // Deactivate current tool
    if (this.currentTool) {
      this.currentTool.deactivate();
    }

    // Activate new tool
    if (this.tools[toolName]) {
      this.currentTool = this.tools[toolName];
      this.currentTool.activate();

      // Update button highlighting via UI
      this.ui.updateToolButtonHighlight(toolName);
    }
  }

  updatePropertiesPanel() {
    const propertiesDiv = document.getElementById("editor-properties");
    if (!propertiesDiv) return;

    // Get selected entity from select tool
    const selectedEntity =
      this.currentTool === this.tools.select
        ? this.tools.select.selectedEntity
        : null;

    if (!selectedEntity) {
      propertiesDiv.innerHTML =
        '<p style="color: #aaa; font-size: 13px;">Select an object to edit properties</p>';
      return;
    }

    const entity = selectedEntity;
    const config = entity.config;

    // Build properties form
    let html =
      '<div style="display: flex; flex-direction: column; gap: 12px;">';

    // Label
    html += this.createPropertyInput("Label", "label", config.label, "text");

    // Position
    html += '<div style="border-top: 1px solid #555; padding-top: 8px;">';
    html +=
      '<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px; pointer-events: auto; cursor: pointer;" class="section-header" data-section="position">';
    html +=
      '<span class="collapse-icon" style="font-size: 10px; color: #3498db;">▶</span>';
    html +=
      '<div style="color: #3498db; font-weight: bold; font-size: 12px; pointer-events: none; user-select: none;">Position</div>';
    html += "</div>";
    html += '<div id="position-properties-container" style="display: none;">';
    html += this.createPropertyInput(
      "X",
      "x",
      Math.round(entity.body.position.x),
      "number"
    );
    html += this.createPropertyInput(
      "Y",
      "y",
      Math.round(entity.body.position.y),
      "number"
    );
    html += "</div>";
    html += "</div>";

    // Size/Dimensions
    html += '<div style="border-top: 1px solid #555; padding-top: 8px;">';
    html +=
      '<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px; pointer-events: auto; cursor: pointer;" class="section-header" data-section="size">';
    html +=
      '<span class="collapse-icon" style="font-size: 10px; color: #3498db;">▶</span>';
    html +=
      '<div style="color: #3498db; font-weight: bold; font-size: 12px; pointer-events: none; user-select: none;">Size</div>';
    html += "</div>";
    html += '<div id="size-properties-container" style="display: none;">';
    if (config.shape === "circle") {
      html += this.createPropertyInput(
        "Radius",
        "radius",
        Math.round(config.radius),
        "number"
      );
    } else {
      html += this.createPropertyInput(
        "Width",
        "width",
        Math.round(config.width),
        "number"
      );
      html += this.createPropertyInput(
        "Height",
        "height",
        Math.round(config.height),
        "number"
      );
    }
    html += "</div>";
    html += "</div>";

    // Rotation
    html += '<div style="border-top: 1px solid #555; padding-top: 8px;">';
    html +=
      '<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px; pointer-events: auto; cursor: pointer;" class="section-header" data-section="rotation">';
    html +=
      '<span class="collapse-icon" style="font-size: 10px; color: #3498db;">▶</span>';
    html +=
      '<div style="color: #3498db; font-weight: bold; font-size: 12px; pointer-events: none; user-select: none;">Rotation</div>';
    html += "</div>";
    html += '<div id="rotation-properties-container" style="display: none;">';
    const degrees = Math.round(((entity.body.angle * 180) / Math.PI) % 360);
    html += this.createPropertyInput("Angle (°)", "angle", degrees, "number");
    html += "</div>";
    html += "</div>";

    // Visual
    html += '<div style="border-top: 1px solid #555; padding-top: 8px;">';
    html +=
      '<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px; pointer-events: auto; cursor: pointer;" class="section-header" data-section="visual">';
    html +=
      '<span class="collapse-icon" style="font-size: 10px; color: #3498db;">▶</span>';
    html +=
      '<div style="color: #3498db; font-weight: bold; font-size: 12px; pointer-events: none; user-select: none;">Visual</div>';
    html += "</div>";
    html += '<div id="visual-properties-container" style="display: none;">';
    html += this.createPropertyInput("Color", "color", config.color, "color");
    html += this.createPropertyInput(
      "Shape",
      "shape",
      config.shape || "rectangle",
      "select",
      1,
      null,
      null,
      ["rectangle", "circle", "triangle"]
    );
    html += "</div>";
    html += "</div>";

    // Texture - moved right after Visual
    const textureEnabled = config.textureUrl && config.textureUrl.trim() !== "";
    html += '<div style="border-top: 1px solid #555; padding-top: 8px;">';
    html +=
      '<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px; pointer-events: auto;">';
    html += `<span class="collapse-icon" style="font-size: 10px; color: #3498db; cursor: pointer; user-select: none;" data-section="texture">${textureEnabled ? "▼" : "▶"}</span>`;
    html += `<input type="checkbox" id="texture-enabled-checkbox" style="width: 16px; height: 16px; cursor: pointer;" ${textureEnabled ? "checked" : ""}>`;
    html += `<div id="texture-label" style="color: #3498db; font-weight: bold; font-size: 12px; pointer-events: none; user-select: none;">${textureEnabled ? "Texture (enabled)" : "Texture (disabled)"}</div>`;
    html += "</div>";
    html += `<div id="texture-properties-container" style="display: ${textureEnabled ? "block" : "none"};">`;
    html += this.createPropertyInput(
      "Texture URL",
      "textureUrl",
      config.textureUrl || "",
      "text"
    );
    html += this.createPropertyInput(
      "Scale X",
      "textureScaleX",
      config.textureScaleX !== undefined ? config.textureScaleX : 1,
      "number",
      0.1,
      0.1
    );
    html += this.createPropertyInput(
      "Scale Y",
      "textureScaleY",
      config.textureScaleY !== undefined ? config.textureScaleY : 1,
      "number",
      0.1,
      0.1
    );
    html += "</div>";
    html += "</div>";

    // Physics
    const physicsEnabled = !entity.body.isStatic;
    html += '<div style="border-top: 1px solid #555; padding-top: 8px;">';
    html +=
      '<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px; pointer-events: auto;">';
    html += `<span class="collapse-icon" style="font-size: 10px; color: #3498db; cursor: pointer; user-select: none;" data-section="physics">${physicsEnabled ? "▼" : "▶"}</span>`;
    html += `<input type="checkbox" id="physics-static-checkbox" style="width: 16px; height: 16px; cursor: pointer;" ${physicsEnabled ? "checked" : ""}>`;
    html += `<div id="physics-label" style="color: #3498db; font-weight: bold; font-size: 12px; pointer-events: none; user-select: none;">${physicsEnabled ? "Physics (enabled)" : "Physics (disabled)"}</div>`;
    html += "</div>";
    html += `<div id="physics-properties-container" style="display: ${physicsEnabled ? "block" : "none"};">`;
    html += this.createPropertyInput(
      "Friction",
      "friction",
      config.friction !== undefined ? config.friction : 0.1,
      "number",
      0.01,
      0,
      1
    );
    html += this.createPropertyInput(
      "Restitution",
      "restitution",
      config.restitution !== undefined ? config.restitution : 0,
      "number",
      0.01,
      0,
      1
    );
    html += this.createPropertyInput(
      "Density",
      "density",
      config.density !== undefined ? config.density : 0.001,
      "number",
      0.001,
      0,
      1
    );
    html += "</div>";
    html += "</div>";

    // Entity Type section - only show for non-player entities
    const isPlayer = selectedEntity.config.label === "player";
    if (!isPlayer) {
      html += '<div style="border-top: 1px solid #555; padding-top: 8px;">';
      html +=
        '<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px; pointer-events: auto; cursor: pointer;" class="section-header" data-section="entitytype">';
      html +=
        '<span class="collapse-icon" style="font-size: 10px; color: #3498db;">▶</span>';
      html +=
        '<div style="color: #3498db; font-weight: bold; font-size: 12px; pointer-events: none; user-select: none;">Entity Type</div>';
      html += "</div>";
      html +=
        '<div id="entitytype-properties-container" style="display: none;">';
      const entityTypeOptions = ["entity", "cloud", "liquid", "trigger"];
      const currentEntityType = config.entityType || "entity";
      html += this.createPropertyInput(
        "Type",
        "entityType",
        currentEntityType,
        "select",
        1,
        null,
        null,
        entityTypeOptions
      );

      // Viscosity property - only show for liquid entities
      if (currentEntityType === "liquid") {
        html += this.createPropertyInput(
          "Viscosity",
          "viscosity",
          entity.viscosity !== undefined ? entity.viscosity : 0.5,
          "number",
          0.05,
          0,
          1
        );
        html +=
          '<div style="color: #aaa; font-size: 10px; margin-top: -6px; margin-bottom: 6px;">0 = no resistance, 1 = maximum</div>';
      }

      html += "</div>";
      html += "</div>";
    }

    // Collision
    const collisionEnabled = config.collisionsEnabled !== false;
    html += '<div style="border-top: 1px solid #555; padding-top: 8px;">';
    html +=
      '<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px; pointer-events: auto;">';
    html += `<span class="collapse-icon" style="font-size: 10px; color: #3498db; cursor: pointer; user-select: none;" data-section="collision">${collisionEnabled ? "▼" : "▶"}</span>`;
    html += `<input type="checkbox" id="collision-enabled-checkbox" style="width: 16px; height: 16px; cursor: pointer;" ${config.collisionsEnabled !== false ? "checked" : ""}>`;
    html += `<div id="collision-label" style="color: #3498db; font-weight: bold; font-size: 12px; pointer-events: none; user-select: none;">${config.collisionsEnabled !== false ? "Collision (enabled)" : "Collision (disabled)"}</div>`;
    html += "</div>";
    html += `<div id="collision-properties-container" style="display: ${config.collisionsEnabled !== false ? "block" : "none"};">`;

    // Collision Groups
    html += '<div style="margin-top: 8px;">';
    html +=
      '<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">';
    html +=
      '<label style="color: white; font-size: 12px;">Collision Groups</label>';
    html +=
      '<button id="add-collision-group-btn" style="background: #27ae60; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 11px; display: flex; align-items: center; gap: 4px;">+ Add Group</button>';
    html += "</div>";
    html += '<div id="collision-groups-list" style="margin-top: 4px;"></div>';
    html += "</div>";

    html += "</div>";
    html += "</div>";

    // Health
    const healthEnabled = config.healthEnabled;
    html += '<div style="border-top: 1px solid #555; padding-top: 8px;">';
    html +=
      '<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px; pointer-events: auto;">';
    html += `<span class="collapse-icon" style="font-size: 10px; color: #3498db; cursor: pointer; user-select: none;" data-section="health">${healthEnabled ? "▼" : "▶"}</span>`;
    html += `<input type="checkbox" id="health-enabled-checkbox" style="width: 16px; height: 16px; cursor: pointer;" ${healthEnabled ? "checked" : ""}>`;
    html += `<div id="health-label" style="color: #3498db; font-weight: bold; font-size: 12px; pointer-events: none; user-select: none;">${healthEnabled ? "Health (enabled)" : "Health (disabled)"}</div>`;
    html += "</div>";
    html += `<div id="health-properties-container" style="display: ${config.healthEnabled ? "block" : "none"};">`;
    html += this.createPropertyInput(
      "Health",
      "health",
      config.health !== undefined ? config.health : 100,
      "number"
    );
    html += this.createPropertyInput(
      "Max Health",
      "maxHealth",
      config.maxHealth !== undefined ? config.maxHealth : 100,
      "number"
    );
    html += this.createPropertyInput(
      "Display",
      "healthDisplay",
      config.healthDisplay || "none",
      "select",
      1,
      null,
      null,
      ["none", "bar", "text"]
    );
    html += "</div>";
    html += "</div>";

    html += "</div>";

    propertiesDiv.innerHTML = html;

    // Add event listeners to all inputs
    this.attachPropertyListeners(selectedEntity);

    // Add collapse/expand listeners for all sections
    this.attachSectionCollapseListeners();
  }

  createPropertyInput(
    label,
    property,
    value,
    type,
    step = 1,
    min = null,
    max = null,
    options = []
  ) {
    const inputId = `prop-${property}`;
    let inputHtml = "";

    if (type === "checkbox") {
      inputHtml = `
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                            <label style="color: white; font-size: 12px;">${label}</label>
                            <input type="checkbox" id="${inputId}" ${value ? "checked" : ""} 
                                style="width: 18px; height: 18px; cursor: pointer;">
                        </div>
                    `;
    } else if (type === "color") {
      inputHtml = `
                        <div style="margin-bottom: 6px;">
                            <label style="color: white; font-size: 12px; display: block; margin-bottom: 3px;">${label}</label>
                            <input type="color" id="${inputId}" value="${value}" 
                                style="width: 100%; height: 30px; cursor: pointer; border: 1px solid #555; background: transparent;">
                        </div>
                    `;
    } else if (type === "select") {
      inputHtml = `
                        <div style="margin-bottom: 6px;">
                            <label style="color: white; font-size: 12px; display: block; margin-bottom: 3px;">${label}</label>
                            <select id="${inputId}" 
                                style="width: 100%; padding: 6px; background: #2c3e50; color: white; border: 1px solid #555; border-radius: 3px; font-size: 12px;">
                                ${options.map((opt) => `<option value="${opt}" ${opt === value ? "selected" : ""}>${opt}</option>`).join("")}
                            </select>
                        </div>
                    `;
    } else {
      const minAttr = min !== null ? `min="${min}"` : "";
      const maxAttr = max !== null ? `max="${max}"` : "";
      const stepAttr = `step="${step}"`;
      inputHtml = `
                        <div style="margin-bottom: 6px;">
                            <label style="color: white; font-size: 12px; display: block; margin-bottom: 3px;">${label}</label>
                            <input type="${type}" id="${inputId}" value="${value}" ${minAttr} ${maxAttr} ${stepAttr}
                                style="width: 100%; padding: 6px; background: #2c3e50; color: white; border: 1px solid #555; border-radius: 3px; font-size: 12px;">
                        </div>
                    `;
    }

    return inputHtml;
  }

  attachPropertyListeners(entity) {
    const { Body } = Matter;
    const editor = this; // Capture editor reference for use in listeners

    // Label
    const labelInput = document.getElementById("prop-label");
    if (labelInput) {
      labelInput.addEventListener("input", (e) => {
        entity.updateConfigProperty("label", e.target.value);
      });
    }

    // Position
    const xInput = document.getElementById("prop-x");
    const yInput = document.getElementById("prop-y");
    if (xInput && yInput) {
      xInput.addEventListener("input", (e) => {
        Body.setPosition(entity.body, {
          x: parseFloat(e.target.value),
          y: entity.body.position.y,
        });
      });
      yInput.addEventListener("input", (e) => {
        Body.setPosition(entity.body, {
          x: entity.body.position.x,
          y: parseFloat(e.target.value),
        });
      });
    }

    // Size
    if (entity.config.shape === "circle") {
      const radiusInput = document.getElementById("prop-radius");
      if (radiusInput) {
        radiusInput.addEventListener("input", (e) => {
          const newRadius = parseFloat(e.target.value);
          Body.scale(
            entity.body,
            newRadius / entity.config.radius,
            newRadius / entity.config.radius
          );
          entity.updateConfigProperty("radius", newRadius);
          this.updatePropertiesPanel();
        });
      }
    } else {
      const widthInput = document.getElementById("prop-width");
      const heightInput = document.getElementById("prop-height");
      if (widthInput) {
        widthInput.addEventListener("input", (e) => {
          const newWidth = parseFloat(e.target.value);
          Body.scale(entity.body, newWidth / entity.config.width, 1);
          entity.updateConfigProperty("width", newWidth);
          this.updatePropertiesPanel();
        });
      }
      if (heightInput) {
        heightInput.addEventListener("input", (e) => {
          const newHeight = parseFloat(e.target.value);
          Body.scale(entity.body, 1, newHeight / entity.config.height);
          entity.updateConfigProperty("height", newHeight);
          this.updatePropertiesPanel();
        });
      }
    }

    // Rotation
    const angleInput = document.getElementById("prop-angle");
    if (angleInput) {
      angleInput.addEventListener("input", (e) => {
        const degrees = parseFloat(e.target.value);
        Body.setAngle(entity.body, (degrees * Math.PI) / 180);
        this.updatePropertiesPanel();
      });
    }

    // Color
    const colorInput = document.getElementById("prop-color");
    if (colorInput) {
      colorInput.addEventListener("input", (e) => {
        entity.updateConfigProperty("color", e.target.value);
        entity.body.render.fillStyle = e.target.value;
      });
    }

    // Shape (requires recreation)
    const shapeInput = document.getElementById("prop-shape");
    if (shapeInput) {
      shapeInput.addEventListener("change", (e) => {
        const newShape = e.target.value;
        const { Body } = Matter;

        // Store current entity state
        const oldConfig = { ...entity.config };
        const position = { ...entity.body.position };
        const velocity = { ...entity.body.velocity };
        const angle = entity.body.angle;
        const angularVelocity = entity.body.angularVelocity;

        // Update config with new shape
        oldConfig.shape = newShape;

        // Set default size for new shape
        if (newShape === "circle") {
          // Convert to circle - use average of width/height as radius
          if (!oldConfig.radius) {
            oldConfig.radius = Math.max(
              20,
              (oldConfig.width + oldConfig.height) / 4
            );
          }
        } else if (newShape === "triangle") {
          // Convert to triangle - ensure width and height exist
          if (!oldConfig.width || !oldConfig.height) {
            if (oldConfig.radius) {
              oldConfig.width = oldConfig.radius * 2 || 40;
              oldConfig.height = oldConfig.radius * 2 || 40;
            } else {
              oldConfig.width = 40;
              oldConfig.height = 40;
            }
          }
        } else {
          // Convert to rectangle
          if (!oldConfig.width || !oldConfig.height) {
            if (oldConfig.radius) {
              oldConfig.width = oldConfig.radius * 2 || 40;
              oldConfig.height = oldConfig.radius * 2 || 40;
            } else {
              oldConfig.width = 40;
              oldConfig.height = 40;
            }
          }
        }

        // Check if this is the player
        const isPlayer = entity === editor.game.player;

        if (isPlayer) {
          // Handle player shape change
          entity.destroy();

          // Create new player with updated config
          const newPlayer = new Player(oldConfig, editor.game.world);

          // Restore physics state
          Body.setPosition(newPlayer.body, position);
          Body.setVelocity(newPlayer.body, velocity);
          Body.setAngle(newPlayer.body, angle);
          Body.setAngularVelocity(newPlayer.body, angularVelocity);

          // Replace player reference
          editor.game.player = newPlayer;

          // Update selection and refresh properties panel
          editor.tools.select.selectedEntity = newPlayer;
          editor.updatePropertiesPanel(newPlayer);
        } else {
          // Handle regular entity shape change
          const entityIndex = editor.game.entities.indexOf(entity);
          if (entityIndex === -1) return;

          // Remove old entity
          entity.destroy();
          editor.game.entities.splice(entityIndex, 1);

          // Create new entity with updated config
          const newEntity = new Entity(oldConfig, editor.game.world);

          // Restore physics state
          Body.setPosition(newEntity.body, position);
          Body.setVelocity(newEntity.body, velocity);
          Body.setAngle(newEntity.body, angle);
          Body.setAngularVelocity(newEntity.body, angularVelocity);

          // Add to entities array
          editor.game.entities.splice(entityIndex, 0, newEntity);

          // Update selection and refresh properties panel
          editor.tools.select.selectedEntity = newEntity;
          editor.updatePropertiesPanel(newEntity);
        }
      });
    }

    // Physics static checkbox (controls both isStatic and physics properties visibility)
    const physicsStaticCheckbox = document.getElementById(
      "physics-static-checkbox"
    );
    const physicsPropertiesContainer = document.getElementById(
      "physics-properties-container"
    );
    const physicsLabel = document.getElementById("physics-label");
    if (physicsStaticCheckbox && physicsPropertiesContainer) {
      physicsStaticCheckbox.addEventListener("change", (e) => {
        const physicsEnabled = e.target.checked;
        const isStatic = !physicsEnabled; // Invert: checked = physics enabled = not static
        Body.setStatic(entity.body, isStatic);
        entity.updateConfigProperty("isStatic", isStatic);

        // Update label text based on state
        if (physicsLabel) {
          physicsLabel.textContent = physicsEnabled
            ? "Physics (enabled)"
            : "Physics (disabled)";
        }

        // Update collapse icon
        const collapseIcon = document.querySelector(
          '.collapse-icon[data-section="physics"]'
        );

        // Show physics properties when checked (physics enabled), hide when unchecked
        if (physicsEnabled) {
          physicsPropertiesContainer.style.display = "block";
          if (collapseIcon) collapseIcon.textContent = "▼";
        } else {
          physicsPropertiesContainer.style.display = "none";
          if (collapseIcon) collapseIcon.textContent = "▶";
        }
      });
    }

    const frictionInput = document.getElementById("prop-friction");
    if (frictionInput) {
      frictionInput.addEventListener("input", (e) => {
        const value = parseFloat(e.target.value);
        entity.updateConfigProperty("friction", value);
        entity.body.friction = value;
      });
    }

    const restitutionInput = document.getElementById("prop-restitution");
    if (restitutionInput) {
      restitutionInput.addEventListener("input", (e) => {
        const value = parseFloat(e.target.value);
        entity.updateConfigProperty("restitution", value);
        entity.body.restitution = value;
      });
    }

    const densityInput = document.getElementById("prop-density");
    if (densityInput) {
      densityInput.addEventListener("input", (e) => {
        const value = parseFloat(e.target.value);
        entity.updateConfigProperty("density", value);
        Body.setDensity(entity.body, value);
      });
    }

    // Collision enabled checkbox
    const collisionEnabledCheckbox = document.getElementById(
      "collision-enabled-checkbox"
    );
    const collisionPropertiesContainer = document.getElementById(
      "collision-properties-container"
    );
    const collisionLabel = document.getElementById("collision-label");
    if (collisionEnabledCheckbox && collisionPropertiesContainer) {
      collisionEnabledCheckbox.addEventListener("change", (e) => {
        const enabled = e.target.checked;
        entity.updateConfigProperty("collisionsEnabled", enabled);

        // Update label text based on state
        if (collisionLabel) {
          collisionLabel.textContent = enabled
            ? "Collision (enabled)"
            : "Collision (disabled)";
        }

        // Update collapse icon
        const collapseIcon = document.querySelector(
          '.collapse-icon[data-section="collision"]'
        );

        if (enabled) {
          collisionPropertiesContainer.style.display = "block";
          if (collapseIcon) collapseIcon.textContent = "▼";
          // Reset collision group and filters to default
          entity.body.collisionFilter.group = 0;
          entity.body.collisionFilter.category = 0x0001; // Default category
          entity.body.collisionFilter.mask = 0xffff; // Collide with everything

          // Reapply collision groups if any exist
          if (entity.applyCollisionGroups) {
            entity.applyCollisionGroups();
          }
        } else {
          collisionPropertiesContainer.style.display = "none";
          if (collapseIcon) collapseIcon.textContent = "▶";
          // Set mask to 0 to prevent collision with everything
          entity.body.collisionFilter.mask = 0;
        }

        // Update working state so changes persist
        editor.updateWorkingState();
      });
    }

    // Entity type dropdown ('entity', 'cloud', 'trigger')
    const entityTypeInput = document.getElementById("prop-entityType");
    if (entityTypeInput) {
      entityTypeInput.addEventListener("change", (e) => {
        const newType = e.target.value;
        const oldType = entity.config.entityType || "entity";

        if (newType === oldType) return;

        // Save current state
        const oldConfig = entity.getEntityConfig().get();
        const oldPosition = { ...entity.body.position };
        const oldVelocity = { ...entity.body.velocity };
        const oldAngle = entity.body.angle;
        const oldAngularVelocity = entity.body.angularVelocity;

        // Update entity type in config
        oldConfig.entityType = newType;

        // Destroy old entity
        entity.destroy();

        // Remove from current arrays
        const entityIndex = editor.game.entities.indexOf(entity);
        if (entityIndex > -1) {
          editor.game.entities.splice(entityIndex, 1);
        }

        if (editor.game.gameEngine && editor.game.gameEngine.clouds) {
          const cloudIndex = editor.game.gameEngine.clouds.indexOf(entity);
          if (cloudIndex > -1) {
            editor.game.gameEngine.clouds.splice(cloudIndex, 1);
          }
        }

        if (editor.game.gameEngine && editor.game.gameEngine.liquids) {
          const liquidIndex = editor.game.gameEngine.liquids.indexOf(entity);
          if (liquidIndex > -1) {
            editor.game.gameEngine.liquids.splice(liquidIndex, 1);
          }
        }

        if (editor.game.gameEngine && editor.game.gameEngine.cloths) {
          const clothIndex = editor.game.gameEngine.cloths.indexOf(entity);
          if (clothIndex > -1) {
            editor.game.gameEngine.cloths.splice(clothIndex, 1);
          }
        }

        // Create new entity of the appropriate type
        let newEntity;
        if (newType === "cloud") {
          newEntity = new Cloud(oldConfig, editor.game.world);
          if (editor.game.gameEngine && editor.game.gameEngine.clouds) {
            editor.game.gameEngine.clouds.push(newEntity);
          }
        } else if (newType === "liquid") {
          newEntity = new Liquid(oldConfig, editor.game.world);
          if (editor.game.gameEngine && editor.game.gameEngine.liquids) {
            editor.game.gameEngine.liquids.push(newEntity);
          }
        } else if (newType === "cloth") {
          newEntity = new Cloth(oldConfig, editor.game.world);
          if (editor.game.gameEngine && editor.game.gameEngine.cloths) {
            editor.game.gameEngine.cloths.push(newEntity);
          }
        } else if (newType === "trigger") {
          newEntity = new Trigger(oldConfig, editor.game.world);
          if (editor.game.gameEngine && editor.game.gameEngine.triggers) {
            editor.game.gameEngine.triggers.push(newEntity);
          }
        } else {
          newEntity = new Entity(oldConfig, editor.game.world);
        }

        // Restore physics state (skip for cloth composites)
        const { Body } = Matter;
        if (newType !== "cloth") {
          Body.setPosition(newEntity.body, oldPosition);
          Body.setVelocity(newEntity.body, oldVelocity);
          Body.setAngle(newEntity.body, oldAngle);
          Body.setAngularVelocity(newEntity.body, oldAngularVelocity);
        }

        // Add to entities array
        editor.game.entities.push(newEntity);

        // Update selection to new entity
        if (editor.tools.select) {
          editor.tools.select.selectedEntity = newEntity;
        }

        // Refresh properties panel
        editor.updatePropertiesPanel();
        editor.updateWorkingState();
      });
    }

    // Viscosity (for liquid entities)
    const viscosityInput = document.getElementById("prop-viscosity");
    if (viscosityInput) {
      viscosityInput.addEventListener("input", (e) => {
        const value = parseFloat(e.target.value);
        if (entity.viscosity !== undefined) {
          entity.viscosity = value;
          entity.updateConfigProperty("viscosity", value);
        }
      });
    }

    // Health
    const healthInput = document.getElementById("prop-health");
    if (healthInput) {
      healthInput.addEventListener("input", (e) => {
        const value = parseFloat(e.target.value);
        entity.updateConfigProperty("health", value);
        entity.health = value;
      });
    }

    const maxHealthInput = document.getElementById("prop-maxHealth");
    if (maxHealthInput) {
      maxHealthInput.addEventListener("input", (e) => {
        const value = parseFloat(e.target.value);
        entity.updateConfigProperty("maxHealth", value);
        entity.maxHealth = value;
      });
    }

    const healthDisplayInput = document.getElementById("prop-healthDisplay");
    if (healthDisplayInput) {
      healthDisplayInput.addEventListener("change", (e) => {
        entity.updateConfigProperty("healthDisplay", e.target.value);
        entity.healthDisplay = e.target.value;
      });
    }

    // Health enabled checkbox
    const healthEnabledCheckbox = document.getElementById(
      "health-enabled-checkbox"
    );
    const healthPropertiesContainer = document.getElementById(
      "health-properties-container"
    );
    const healthLabel = document.getElementById("health-label");
    if (healthEnabledCheckbox && healthPropertiesContainer) {
      healthEnabledCheckbox.addEventListener("change", (e) => {
        const enabled = e.target.checked;
        entity.updateConfigProperty("healthEnabled", enabled);

        // Update label text based on state
        if (healthLabel) {
          healthLabel.textContent = enabled
            ? "Health (enabled)"
            : "Health (disabled)";
        }

        // Update collapse icon
        const collapseIcon = document.querySelector(
          '.collapse-icon[data-section="health"]'
        );

        if (enabled) {
          healthPropertiesContainer.style.display = "block";
          if (collapseIcon) collapseIcon.textContent = "▼";
        } else {
          healthPropertiesContainer.style.display = "none";
          if (collapseIcon) collapseIcon.textContent = "▶";
          // Disable health display rendering when health is disabled
          entity.updateConfigProperty("healthDisplay", "none");
          entity.healthDisplay = "none";

          // Reset the dropdown to 'none'
          const healthDisplayDropdown =
            document.getElementById("prop-healthDisplay");
          if (healthDisplayDropdown) {
            healthDisplayDropdown.value = "none";
          }
        }
      });
    }

    // Collision groups
    this.renderCollisionGroups(entity);

    const addGroupBtn = document.getElementById("add-collision-group-btn");
    if (addGroupBtn) {
      addGroupBtn.addEventListener("click", () => {
        const groups = entity.config.collisionGroups || [];
        groups.push(""); // Add empty group name
        entity.updateConfigProperty("collisionGroups", groups);
        this.renderCollisionGroups(entity);
        editor.updateWorkingState();
      });
    }

    // Texture enabled checkbox
    const textureEnabledCheckbox = document.getElementById(
      "texture-enabled-checkbox"
    );
    const texturePropertiesContainer = document.getElementById(
      "texture-properties-container"
    );
    const textureLabel = document.getElementById("texture-label");
    if (textureEnabledCheckbox && texturePropertiesContainer) {
      textureEnabledCheckbox.addEventListener("change", (e) => {
        const enabled = e.target.checked;

        // Update label text based on state
        if (textureLabel) {
          textureLabel.textContent = enabled
            ? "Texture (enabled)"
            : "Texture (disabled)";
        }

        // Update collapse icon
        const collapseIcon = document.querySelector(
          '.collapse-icon[data-section="texture"]'
        );

        if (enabled) {
          texturePropertiesContainer.style.display = "block";
          if (collapseIcon) collapseIcon.textContent = "▼";
          // Set default texture URL if empty
          if (
            !entity.config.textureUrl ||
            entity.config.textureUrl.trim() === ""
          ) {
            entity.updateConfigProperty("textureUrl", "canvas://checkerboard");
            entity.updateConfigProperty("textureScaleX", 1);
            entity.updateConfigProperty("textureScaleY", 1);
            entity.textureLoaded = false; // Force reload
            this.updatePropertiesPanel();
          }
        } else {
          texturePropertiesContainer.style.display = "none";
          if (collapseIcon) collapseIcon.textContent = "▶";
          // Clear texture
          entity.updateConfigProperty("textureUrl", "");
          if (entity.body.render.sprite) {
            entity.body.render.sprite = null;
          }
          entity.body.render.visible = true; // Show solid color again
          entity.textureLoaded = false;
        }
      });
    }

    // Texture URL input
    const textureUrlInput = document.getElementById("prop-textureUrl");
    if (textureUrlInput) {
      textureUrlInput.addEventListener("input", (e) => {
        const url = e.target.value.trim();
        entity.updateConfigProperty("textureUrl", url);

        if (url === "") {
          // Clear texture
          if (entity.body.render.sprite) {
            entity.body.render.sprite = null;
          }
          entity.body.render.visible = true;
          entity.textureLoaded = false;
        } else {
          // Load new texture
          entity.textureLoaded = false; // Force reload on next update
        }
      });
    }

    // Texture Scale X
    const textureScaleXInput = document.getElementById("prop-textureScaleX");
    if (textureScaleXInput) {
      textureScaleXInput.addEventListener("input", (e) => {
        const value = parseFloat(e.target.value);
        entity.updateConfigProperty("textureScaleX", value);
        if (entity.body.render.sprite) {
          entity.body.render.sprite.xScale = value;
        }
      });
    }

    // Texture Scale Y
    const textureScaleYInput = document.getElementById("prop-textureScaleY");
    if (textureScaleYInput) {
      textureScaleYInput.addEventListener("input", (e) => {
        const value = parseFloat(e.target.value);
        entity.updateConfigProperty("textureScaleY", value);
        if (entity.body.render.sprite) {
          entity.body.render.sprite.yScale = value;
        }
      });
    }
  }

  attachSectionCollapseListeners() {
    // Add click handlers for collapsible sections WITHOUT checkboxes
    const sectionHeaders = document.querySelectorAll(".section-header");
    sectionHeaders.forEach((header) => {
      header.addEventListener("click", (e) => {
        const section = header.dataset.section;
        const container = document.getElementById(
          `${section}-properties-container`
        );
        const icon = header.querySelector(".collapse-icon");

        if (container) {
          if (container.style.display === "none") {
            container.style.display = "block";
            if (icon) icon.textContent = "▼";
          } else {
            container.style.display = "none";
            if (icon) icon.textContent = "▶";
          }
        }
      });
    });

    // Add click handlers for collapse icons in sections WITH checkboxes
    const collapseIcons = document.querySelectorAll(
      ".collapse-icon[data-section]"
    );
    collapseIcons.forEach((icon) => {
      icon.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent event bubbling
        const section = icon.dataset.section;
        const container = document.getElementById(
          `${section}-properties-container`
        );

        if (container) {
          // Toggle display and icon
          if (container.style.display === "none") {
            container.style.display = "block";
            icon.textContent = "▼";
          } else {
            container.style.display = "none";
            icon.textContent = "▶";
          }
        }
      });
    });
  }

  renderCollisionGroups(entity) {
    const groupsList = document.getElementById("collision-groups-list");
    if (!groupsList) return;

    const groups = entity.config.collisionGroups || [];
    const editor = this;

    groupsList.innerHTML = "";

    groups.forEach((groupName, index) => {
      const groupItem = document.createElement("div");
      groupItem.style.cssText = Styles.collisionGroupItem;

      const input = document.createElement("input");
      input.type = "text";
      input.value = groupName;
      input.placeholder = "Group name";
      input.style.cssText = Styles.collisionGroupInput;

      input.addEventListener("input", (e) => {
        groups[index] = e.target.value;
        entity.updateConfigProperty("collisionGroups", groups);
        this.applyCollisionGroups(entity);
        editor.updateWorkingState();
      });

      const removeBtn = document.createElement("button");
      removeBtn.textContent = "×";
      removeBtn.style.cssText = Styles.collisionGroupRemoveButton;

      removeBtn.addEventListener("click", () => {
        groups.splice(index, 1);
        entity.updateConfigProperty("collisionGroups", groups);
        this.renderCollisionGroups(entity);
        this.applyCollisionGroups(entity);
        editor.updateWorkingState();
      });

      groupItem.appendChild(input);
      groupItem.appendChild(removeBtn);
      groupsList.appendChild(groupItem);
    });
  }

  applyCollisionGroups(entity) {
    // Delegate to the entity's applyCollisionGroups method
    if (entity && entity.applyCollisionGroups) {
      entity.applyCollisionGroups();
    }
  }

  renderHierarchy() {
    const hierarchyContent = document.getElementById("hierarchy-tab-content");
    if (!hierarchyContent) return;

    // Clear current content
    hierarchyContent.innerHTML = "";

    // Group entities by type
    const groups = {
      player: [],
      entity: [],
      cloud: [],
      trigger: [],
    };

    // Add player
    if (this.game.player) {
      groups.player.push(this.game.player);
    }

    // Add all entities and categorize by type
    this.game.entities.forEach((entity) => {
      const type = entity.config.entityType || "entity";
      if (groups[type]) {
        groups[type].push(entity);
      } else {
        groups.entity.push(entity);
      }
    });

    // Render each group
    Object.entries(groups).forEach(([groupName, entities]) => {
      if (entities.length === 0) return;

      // Create group container
      const groupDiv = document.createElement("div");
      groupDiv.style.cssText = Styles.hierarchyGroup;

      // Create group header
      const groupHeader = document.createElement("div");
      groupHeader.style.cssText = Styles.hierarchyGroupHeader;
      groupHeader.textContent = `▼ ${groupName.charAt(0).toUpperCase() + groupName.slice(1)} (${entities.length})`;

      // Create group content
      const groupContent = document.createElement("div");
      groupContent.style.cssText = Styles.hierarchyGroupContent;

      // Add entity items
      entities.forEach((entity) => {
        const itemDiv = document.createElement("div");
        itemDiv.style.cssText = Styles.hierarchyItem;
        itemDiv.textContent = entity.config.label || "Unnamed";

        // Hover effect
        itemDiv.addEventListener("mouseenter", () => {
          itemDiv.style.cssText = Styles.hierarchyItemHover;
        });
        itemDiv.addEventListener("mouseleave", () => {
          itemDiv.style.cssText = Styles.hierarchyItem;
        });

        // Single click - select and show properties
        itemDiv.addEventListener("click", () => {
          // Switch to select tool
          this.selectTool("select");

          // Select the entity
          if (this.tools.select) {
            this.tools.select.selectedEntity = entity;
            this.updatePropertiesPanel();
          }
        });

        // Double click - center camera and show properties
        let clickCount = 0;
        let clickTimer = null;
        itemDiv.addEventListener("click", () => {
          clickCount++;
          if (clickCount === 1) {
            clickTimer = setTimeout(() => {
              clickCount = 0;
            }, 300);
          } else if (clickCount === 2) {
            clearTimeout(clickTimer);
            clickCount = 0;

            // Switch to select tool
            this.selectTool("select");

            // Center camera on entity
            this.game.camera.x = entity.body.position.x;
            this.game.camera.y = entity.body.position.y;

            // Select and show properties
            if (this.tools.select) {
              this.tools.select.selectedEntity = entity;
              this.tools.select.setTransformMode("move"); // Activate move widget
              this.updatePropertiesPanel();
            }
          }
        });

        groupContent.appendChild(itemDiv);
      });

      // Toggle group expand/collapse
      let expanded = true;
      groupHeader.addEventListener("click", () => {
        expanded = !expanded;
        groupContent.style.display = expanded ? "flex" : "none";
        groupHeader.textContent = `${expanded ? "▼" : "▶"} ${groupName.charAt(0).toUpperCase() + groupName.slice(1)} (${entities.length})`;
      });

      groupDiv.appendChild(groupHeader);
      groupDiv.appendChild(groupContent);
      hierarchyContent.appendChild(groupDiv);
    });
  }

  toggle() {
    // Check current actual display state to handle initial hidden state
    const currentlyHidden =
      this.ui.container.style.display === "none" ||
      !this.ui.container.style.display;

    // Set isActive based on what we want (opposite of current state)
    this.isActive = currentlyHidden;

    if (this.isActive) {
      this.ui.show();
    } else {
      this.ui.hide();
    }

    const canvas = this.game.render.canvas;

    if (this.isActive) {
      // Entering editor mode - save current state as working state
      this.saveWorkingState();
      this.game.pauseSimulation();
      canvas.style.cursor = "grab";

      // Highlight select tool (default)
      this.ui.updateToolButtonHighlight("select");
    } else {
      // Exiting editor mode - apply working state as new default and restart
      this.applyWorkingState();
      this.game.resumeSimulation();
      canvas.style.cursor = "default";
      this.isDragging = false;
    }
  }

  show() {
    this.isActive = true;
    this.ui.show();
    this.game.pauseSimulation();
    this.game.render.canvas.style.cursor = "grab";
  }

  hide() {
    this.isActive = false;
    this.ui.hide();
    this.game.resumeSimulation();
    this.game.render.canvas.style.cursor = "default";
    this.isDragging = false;
  }

  saveInitialState() {
    const { Body } = Matter;

    this.initialGameState = {
      playerPosition: { ...this.game.player.body.position },
      playerVelocity: { ...this.game.player.body.velocity },
      playerAngle: this.game.player.body.angle,
      playerAngularVelocity: this.game.player.body.angularVelocity,
      playerHealth: this.game.player.health,
      cameraPosition: { x: this.game.camera.x, y: this.game.camera.y },
      cameraZoom: this.game.camera.zoom,
      // Store complete entity data including configs for recreation
      entities: this.game.entities.map((entity) => ({
        // Physical state
        position: { ...entity.body.position },
        velocity: { ...entity.body.velocity },
        angle: entity.body.angle,
        angularVelocity: entity.body.angularVelocity,
        health: entity.health,
        isDestroyed: entity.isDestroyed,
        // Complete config for recreation
        config: entity.getEntityConfig().get(),
        // Reference to original entity for matching
        bodyId: entity.body.id,
      })),
      triggers: this.game.triggers.map((trigger) => ({
        entitiesInside: new Set(trigger.entitiesInside),
      })),
    };
  }

  resetToInitialState() {
    // Backward compatibility wrapper - now uses new state system
    this.revertToDefault();
  }

  saveWorkingState() {
    // Save current game state as working state
    const { Body } = Matter;

    // Safety check - ensure player exists
    if (!this.game.player) {
      console.warn("Cannot save working state: player does not exist yet");
      return;
    }

    this.workingState = {
      playerPosition: { ...this.game.player.body.position },
      playerVelocity: { ...this.game.player.body.velocity },
      playerAngle: this.game.player.body.angle,
      playerAngularVelocity: this.game.player.body.angularVelocity,
      playerHealth: this.game.player.health,
      playerConfig: this.game.player.getEntityConfig().get(), // Save player config including dimensions
      cameraPosition: { x: this.game.camera.x, y: this.game.camera.y },
      cameraZoom: this.game.camera.zoom,
      entities: this.game.entities.map((entity) => ({
        position: { ...entity.body.position },
        velocity: { ...entity.body.velocity },
        angle: entity.body.angle,
        angularVelocity: entity.body.angularVelocity,
        health: entity.health,
        isDestroyed: entity.isDestroyed,
        config: entity.getEntityConfig().get(),
        bodyId: entity.body.id,
      })),
      triggers: this.game.triggers.map((trigger) => ({
        entitiesInside: new Set(trigger.entitiesInside),
      })),
    };

    // If no default state exists, save current as default
    if (!this.defaultState) {
      this.defaultState = JSON.parse(JSON.stringify(this.workingState));
    }
  }

  updateWorkingState() {
    // Update the working state with current game state
    this.saveWorkingState();

    // Refresh hierarchy if on hierarchy tab
    if (this.ui.leftToolbar.currentTab === "hierarchy") {
      this.renderHierarchy();
    }
  }

  applyWorkingState() {
    // Save current state as working state, then apply as new default
    this.saveWorkingState();
    if (this.workingState) {
      this.defaultState = JSON.parse(JSON.stringify(this.workingState));
      this.restoreState(this.defaultState);
    } else {
      console.warn(
        "Cannot apply working state: state was not saved (player may not exist)"
      );
    }
  }

  revertToDefault() {
    // Revert to the default state
    if (this.defaultState) {
      this.restoreState(this.defaultState);
      // Update working state to match default
      this.workingState = JSON.parse(JSON.stringify(this.defaultState));
      // Clear deleted entities tracking
      this.deletedEntityIds.clear();
    }
  }

  restoreState(state) {
    // Generic method to restore game state
    const { Body, World } = Matter;

    // Destroy old player and recreate from saved config
    if (this.game.player) {
      this.game.player.destroy();
    }

    // Recreate player with saved config (includes dimensions)
    this.game.player = new Player(state.playerConfig, this.game.world);

    // Restore player physics state
    Body.setPosition(this.game.player.body, state.playerPosition);
    Body.setVelocity(this.game.player.body, state.playerVelocity);
    Body.setAngle(this.game.player.body, state.playerAngle);
    Body.setAngularVelocity(this.game.player.body, state.playerAngularVelocity);
    this.game.player.health = state.playerHealth;

    // Re-target camera to new player
    this.game.camera.setTarget(this.game.player.body);

    // Restore camera
    this.game.camera.x = state.cameraPosition.x;
    this.game.camera.y = state.cameraPosition.y;
    this.game.camera.zoom = state.cameraZoom;

    // Clear current entities
    this.game.entities.forEach((entity) => entity.destroy());
    this.game.entities = [];

    // Clear clouds array
    if (this.game.gameEngine && this.game.gameEngine.clouds) {
      this.game.gameEngine.clouds = [];
    }

    // Clear liquids array
    if (this.game.gameEngine && this.game.gameEngine.liquids) {
      this.game.gameEngine.liquids = [];
    }

    // Clear cloths array
    if (this.game.gameEngine && this.game.gameEngine.cloths) {
      this.game.gameEngine.cloths = [];
    }

    // Recreate entities from state
    state.entities.forEach((savedEntity) => {
      let entity;

      // Create the appropriate entity type based on config
      if (savedEntity.config.entityType === "cloud") {
        entity = new Cloud(savedEntity.config, this.game.world);
        // Add to clouds array
        if (this.game.gameEngine && this.game.gameEngine.clouds) {
          this.game.gameEngine.clouds.push(entity);
        }
      } else if (savedEntity.config.entityType === "liquid") {
        entity = new Liquid(savedEntity.config, this.game.world);
        // Add to liquids array
        if (this.game.gameEngine && this.game.gameEngine.liquids) {
          this.game.gameEngine.liquids.push(entity);
        }
      } else if (savedEntity.config.entityType === "trigger") {
        entity = new Trigger(savedEntity.config, this.game.world);
        // Add to triggers array
        if (this.game.gameEngine && this.game.gameEngine.triggers) {
          this.game.gameEngine.triggers.push(entity);
        }
      } else {
        entity = new Entity(savedEntity.config, this.game.world);
      }

      Body.setPosition(entity.body, savedEntity.position);
      Body.setVelocity(entity.body, savedEntity.velocity);
      Body.setAngle(entity.body, savedEntity.angle);
      Body.setAngularVelocity(entity.body, savedEntity.angularVelocity);
      entity.health = savedEntity.health;
      entity.isDestroyed = savedEntity.isDestroyed;

      // Re-enforce sensor state for liquids and triggers after body manipulation
      if (
        savedEntity.config.entityType === "liquid" ||
        savedEntity.config.entityType === "trigger"
      ) {
        entity.body.isSensor = true;
      }

      this.game.entities.push(entity);
    });

    // Clear selection
    if (this.tools.select) {
      this.tools.select.selectedEntity = null;
      this.tools.select.currentSubTool = null;
    }

    // Reset to select tool
    this.selectTool("select");

    // Update properties panel
    this.updatePropertiesPanel();

    // Force a small delay to ensure everything is refreshed
    setTimeout(() => {
      // Ensure UI is in sync
      if (this.tools.select) {
        this.tools.select.selectedEntity = null;
      }
    }, 10);
  }

  showSaveDialog() {
    // Create a modal dialog for save options
    const dialog = document.createElement("div");
    dialog.style.cssText = Styles.modalDialog;

    dialog.innerHTML = `
                    <h3 style="margin-top: 0; color: #3498db;">Save Level</h3>
                    <p style="color: #aaa; font-size: 14px;">Choose what to save:</p>
                    <div style="display: flex; flex-direction: column; gap: 10px; margin: 20px 0;">
                        <button id="save-level-btn" style="padding: 10px; background: #2ecc71; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
                            Save Level Config
                        </button>
                        <button id="save-game-btn" style="padding: 10px; background: #9b59b6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
                            Save Game Config
                        </button>
                    </div>
                    <button id="cancel-save-btn" style="padding: 8px 16px; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; width: 100%;">
                        Cancel
                    </button>
                `;

    document.body.appendChild(dialog);

    // Event listeners
    document.getElementById("save-level-btn").addEventListener("click", () => {
      document.body.removeChild(dialog);
      this.exportLevelConfig();
    });

    document.getElementById("save-game-btn").addEventListener("click", () => {
      document.body.removeChild(dialog);
      this.exportGameConfig();
    });

    document.getElementById("cancel-save-btn").addEventListener("click", () => {
      document.body.removeChild(dialog);
    });
  }

  showLoadDialog() {
    // Create a modal dialog for load options
    const dialog = document.createElement("div");
    dialog.style.cssText = Styles.modalDialog;

    dialog.innerHTML = `
                    <h3 style="margin-top: 0; color: #3498db;">Load Config</h3>
                    <p style="color: #aaa; font-size: 14px;">Choose what to load:</p>
                    <div style="display: flex; flex-direction: column; gap: 10px; margin: 20px 0;">
                        <button id="load-level-btn" style="padding: 10px; background: #2ecc71; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
                            Load Level Config
                        </button>
                        <button id="load-game-btn" style="padding: 10px; background: #9b59b6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
                            Load Game Config
                        </button>
                    </div>
                    <button id="cancel-load-btn" style="padding: 8px 16px; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; width: 100%;">
                        Cancel
                    </button>
                `;

    document.body.appendChild(dialog);

    // Create hidden file inputs
    const levelFileInput = document.createElement("input");
    levelFileInput.type = "file";
    levelFileInput.accept = ".json";
    levelFileInput.style.display = "none";
    document.body.appendChild(levelFileInput);

    const gameFileInput = document.createElement("input");
    gameFileInput.type = "file";
    gameFileInput.accept = ".json";
    gameFileInput.style.display = "none";
    document.body.appendChild(gameFileInput);

    // Event listeners
    document.getElementById("load-level-btn").addEventListener("click", () => {
      document.body.removeChild(dialog);
      levelFileInput.click();
    });

    document.getElementById("load-game-btn").addEventListener("click", () => {
      document.body.removeChild(dialog);
      gameFileInput.click();
    });

    document.getElementById("cancel-load-btn").addEventListener("click", () => {
      document.body.removeChild(dialog);
      document.body.removeChild(levelFileInput);
      document.body.removeChild(gameFileInput);
    });

    // File input handlers
    levelFileInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (file) {
        await this.loadLevelConfigFromFile(file);
      }
      document.body.removeChild(levelFileInput);
      document.body.removeChild(gameFileInput);
    });

    gameFileInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (file) {
        await this.loadGameConfigFromFile(file);
      }
      document.body.removeChild(levelFileInput);
      document.body.removeChild(gameFileInput);
    });
  }

  async loadLevelConfigFromFile(file) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const levelConfig = JSON.parse(e.target.result);

        // Update the level config instance
        this.game.levelConfigInstance.set(levelConfig);
        this.game.levelData = levelConfig;

        // Validate and update zoom
        const configZoom =
          levelConfig.zoom !== undefined ? levelConfig.zoom : 1;
        const validatedZoom = this.game.validateZoom(configZoom);
        if (validatedZoom !== configZoom) {
          this.game.levelData.zoom = validatedZoom;
        }

        // Reset the world with new level data
        const { World } = Matter;
        World.clear(this.game.world);
        this.game.engine.world = this.game.world;
        this.game.createWorld();
        this.game.createPlayer();
        this.game.camera.setTarget(this.game.player.body);
        this.game.camera.x = 0;
        this.game.camera.y = 0;
        this.game.camera.setZoom(this.game.levelData.zoom);
        this.game.hideGameOver();

        // Clear deletion tracking for new level
        this.deletedEntityIds.clear();

        // Save loaded level as new default and working state
        this.saveWorkingState();
        this.updatePropertiesPanel();

        alert("Level config loaded successfully!");
      } catch (error) {
        console.error("Error loading level config:", error);
        alert("Error loading level config: " + error.message);
      }
    };
    reader.readAsText(file);
  }

  async loadGameConfigFromFile(file) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const gameConfig = JSON.parse(e.target.result);

        // Update the game config
        this.game.gameConfigInstance.set(gameConfig);
        this.game.gameConfig = gameConfig;

        // Apply aspect ratio if changed
        if (gameConfig.aspectRatio) {
          try {
            this.game.aspectRatio = this.game.parseAspectRatio(
              gameConfig.aspectRatio
            );
            const dimensions = this.game.calculateCanvasDimensions();
            this.game.render.canvas.width = dimensions.width;
            this.game.render.canvas.height = dimensions.height;
            this.game.camera.width = dimensions.width;
            this.game.camera.height = dimensions.height;
            this.game.render.options.width = dimensions.width;
            this.game.render.options.height = dimensions.height;
          } catch (error) {
            console.error("Error applying aspect ratio:", error);
          }
        }

        // Apply debug mode
        if (gameConfig.debug !== undefined) {
          this.game.debugLabels = gameConfig.debug;
        }

        alert("Game config loaded successfully!");
      } catch (error) {
        console.error("Error loading game config:", error);
        alert("Error loading game config: " + error.message);
      }
    };
    reader.readAsText(file);
  }

  exportLevelConfig() {
    try {
      // Build level config from current game state
      const levelConfig = {
        worldSize: this.game.levelData.worldSize || 3000,
        wallThickness: this.game.levelData.wallThickness || 50,
        zoom: this.game.camera.zoom,
        boundaries: {
          enabled: this.game.levelData.boundaries?.enabled !== false,
        },
        overrides: {
          player: {
            x: Math.round(this.game.player.body.position.x),
            y: Math.round(this.game.player.body.position.y),
          },
        },
        entities: this.game.entities.map((entity) => {
          const config = entity.getEntityConfig().get();
          return {
            x: Math.round(entity.body.position.x),
            y: Math.round(entity.body.position.y),
            width: config.width,
            height: config.height,
            shape: config.shape,
            radius: config.radius,
            rotation: Math.round(((entity.body.angle * 180) / Math.PI) % 360),
            color: config.color,
            strokeColor: config.strokeColor,
            strokeWidth: config.strokeWidth,
            friction: config.friction,
            frictionAir: config.frictionAir,
            restitution: config.restitution,
            density: config.density,
            isStatic: entity.body.isStatic,
            health: config.health,
            maxHealth: config.maxHealth,
            healthDisplay: config.healthDisplay,
            healthEnabled: config.healthEnabled,
            collisions: config.collisions,
            collisionsEnabled: config.collisionsEnabled,
            label: config.label,
          };
        }),
        triggers: this.game.triggers.map((trigger) => {
          const config = trigger.config;
          return {
            x: Math.round(trigger.body.position.x),
            y: Math.round(trigger.body.position.y),
            width: config.width,
            height: config.height,
            rotation: Math.round(((trigger.body.angle * 180) / Math.PI) % 360),
            label: config.label,
            triggerType: trigger.triggerType,
            color: config.color,
          };
        }),
      };

      this.downloadJSON(levelConfig, "level.json");
    } catch (error) {
      console.error("Error in exportLevelConfig:", error);
      throw error;
    }
  }

  exportGameConfig() {
    try {
      // Get current game config
      const gameConfig = this.game.gameConfig;
      this.downloadJSON(gameConfig, "game-config.json");
    } catch (error) {
      console.error("Error in exportGameConfig:", error);
      throw error;
    }
  }

  downloadJSON(data, filename) {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    // Defer cleanup to ensure download completes
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }
}
