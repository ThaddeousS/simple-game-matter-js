import { Tool } from "./tool.js";
import { Entity } from "../../../game/entity/entity.js";
import { Cloud } from "../../../game/entity/cloud.js";
import { Styles } from "../../../styles/styles.js";

export class EntityTool extends Tool {
  constructor(editor) {
    super(editor, "Add Entity");
    this.pendingPosition = null;
    this.contextMenu = null;
    this.createContextMenu();

    // Define available entity types
    this.entityTypes = [
      { name: "Box (Small)", width: 30, height: 30, color: "#3498db" },
      { name: "Box (Medium)", width: 50, height: 50, color: "#3498db" },
      { name: "Box (Large)", width: 80, height: 80, color: "#3498db" },
      {
        name: "Platform (Short)",
        width: 100,
        height: 20,
        color: "#2ecc71",
        isStatic: true,
      },
      {
        name: "Platform (Medium)",
        width: 200,
        height: 20,
        color: "#2ecc71",
        isStatic: true,
      },
      {
        name: "Platform (Long)",
        width: 300,
        height: 20,
        color: "#2ecc71",
        isStatic: true,
      },
      {
        name: "Cloud (Short)",
        width: 100,
        height: 20,
        color: "#ffffff99",
        isStatic: true,
        entityType: "cloud",
      },
      {
        name: "Cloud (Medium)",
        width: 200,
        height: 20,
        color: "#ffffff99",
        isStatic: true,
        entityType: "cloud",
      },
      {
        name: "Cloud (Long)",
        width: 300,
        height: 20,
        color: "#ffffff99",
        isStatic: true,
        entityType: "cloud",
      },
      { name: "Circle (Small)", shape: "circle", radius: 20, color: "#e74c3c" },
      {
        name: "Circle (Medium)",
        shape: "circle",
        radius: 35,
        color: "#e74c3c",
      },
      { name: "Circle (Large)", shape: "circle", radius: 50, color: "#e74c3c" },
      {
        name: "Triangle (Small)",
        shape: "triangle",
        width: 30,
        height: 30,
        color: "#9b59b6",
      },
      {
        name: "Triangle (Medium)",
        shape: "triangle",
        width: 50,
        height: 50,
        color: "#9b59b6",
      },
      {
        name: "Triangle (Large)",
        shape: "triangle",
        width: 80,
        height: 80,
        color: "#9b59b6",
      },
      {
        name: "Wall (Vertical)",
        width: 20,
        height: 150,
        color: "#95a5a6",
        isStatic: true,
      },
      { name: "Ramp (Left)", width: 100, height: 60, color: "#f39c12" },
      { name: "Ramp (Right)", width: 100, height: 60, color: "#f39c12" },
    ];
  }

  createContextMenu() {
    this.contextMenu = document.createElement("div");
    this.contextMenu.id = "entity-context-menu";
    this.contextMenu.style.cssText = Styles.contextMenuEntity;
    document.body.appendChild(this.contextMenu);

    // Close menu when clicking elsewhere (but not on canvas during entity tool)
    document.addEventListener("mousedown", (e) => {
      const canvas = this.editor.game.render.canvas;
      const clickedCanvas = e.target === canvas;
      const clickedMenu = this.contextMenu.contains(e.target);

      // Only close if not clicking canvas (which will open new menu) and not clicking menu items
      if (
        !clickedCanvas &&
        !clickedMenu &&
        this.contextMenu.style.display === "block"
      ) {
        this.hideContextMenu();
      }
    });
  }

  showContextMenu(x, y, worldPos) {
    this.pendingPosition = worldPos;

    // Clear existing menu items
    this.contextMenu.innerHTML = "";

    // Add header
    const header = document.createElement("div");
    header.style.cssText = Styles.contextMenuHeaderBlue;
    header.textContent = "Select Entity Type";
    this.contextMenu.appendChild(header);

    // Add menu items for each entity type
    this.entityTypes.forEach((type) => {
      const item = document.createElement("div");
      item.style.cssText = Styles.contextMenuItem;

      // Add color indicator
      const colorBox = document.createElement("div");
      colorBox.style.cssText = `${Styles.entityColorBox} background: ${type.color}; border-radius: ${type.shape === "circle" ? "50%" : "2px"};`;

      item.appendChild(colorBox);
      item.appendChild(document.createTextNode(type.name));

      item.addEventListener("mouseenter", () => {
        item.style.background = "#3498db";
      });

      item.addEventListener("mouseleave", () => {
        item.style.background = "transparent";
      });

      item.addEventListener("mousedown", (e) => {
        e.stopPropagation();
        e.preventDefault();
        this.createEntity(type);
        this.hideContextMenu();
      });

      this.contextMenu.appendChild(item);
    });

    // Position the menu at click location
    this.contextMenu.style.left = `${x}px`;
    this.contextMenu.style.top = `${y}px`;
    this.contextMenu.style.display = "block";

    // Adjust if menu goes off-screen
    requestAnimationFrame(() => {
      const rect = this.contextMenu.getBoundingClientRect();
      if (rect.right > window.innerWidth) {
        this.contextMenu.style.left = `${window.innerWidth - rect.width - 10}px`;
      }
      if (rect.bottom > window.innerHeight) {
        this.contextMenu.style.top = `${window.innerHeight - rect.height - 10}px`;
      }
    });
  }

  hideContextMenu() {
    this.contextMenu.style.display = "none";
    this.pendingPosition = null;
  }

  createEntity(type) {
    if (!this.pendingPosition) return;

    const entityConfig = {
      x: this.pendingPosition.x,
      y: this.pendingPosition.y,
      label: `${type.name.toLowerCase().replace(/\s+/g, "_")}_${Date.now()}`,
      color: type.color,
    };

    // Add shape-specific properties
    if (type.shape === "circle") {
      entityConfig.shape = "circle";
      entityConfig.radius = type.radius;
    } else if (type.shape === "triangle") {
      entityConfig.shape = "triangle";
      entityConfig.width = type.width;
      entityConfig.height = type.height;
    } else {
      // Rectangle (default)
      entityConfig.width = type.width;
      entityConfig.height = type.height;
    }

    // Add isStatic if specified in type
    if (type.isStatic !== undefined) {
      entityConfig.isStatic = type.isStatic;
    }

    // Add entityType if specified (e.g., 'cloud')
    if (type.entityType !== undefined) {
      entityConfig.entityType = type.entityType;
    }

    // Create the appropriate entity type
    let newEntity;
    if (entityConfig.entityType === "cloud") {
      newEntity = new Cloud(entityConfig, this.editor.game.world);
      // Add to clouds array if it exists
      if (this.editor.game.gameEngine && this.editor.game.gameEngine.clouds) {
        this.editor.game.gameEngine.clouds.push(newEntity);
      }
    } else {
      newEntity = new Entity(entityConfig, this.editor.game.world);
    }

    this.editor.game.entities.push(newEntity);

    // Update working state to include this new entity
    this.editor.updateWorkingState();
  }

  onActivate() {
    this.editor.game.render.canvas.style.cursor = "crosshair";
  }

  onDeactivate() {
    this.hideContextMenu();
    this.editor.game.render.canvas.style.cursor = "grab";
  }

  onMouseDown(e, worldPos) {
    // If menu is already open, close it and open new one at new position
    if (this.contextMenu.style.display === "block") {
      this.hideContextMenu();
    }

    // Show context menu at click location
    // Store the world position where the click occurred
    this.showContextMenu(e.clientX, e.clientY, worldPos);
  }
}
