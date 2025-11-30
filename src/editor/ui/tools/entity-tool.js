import { Tool } from "./tool.js";
import { Entity } from "../../../game/entity/entity.js";
import { Cloud } from "../../../game/entity/cloud.js";
import { Styles } from "../../../styles/styles.js";
import { Liquid } from "../../../game/entity/liquid.js";

export class EntityTool extends Tool {
  constructor(editor) {
    super(editor, "Add Entity");
    this.pendingPosition = null;
    this.contextMenu = null;
    this.submenu = null;
    this.createContextMenu();

    // Define available entity types organized by category
    this.entityCategories = {
      Boxes: [
        { name: "Small", width: 30, height: 30, color: "#3498db" },
        { name: "Medium", width: 50, height: 50, color: "#3498db" },
        { name: "Large", width: 80, height: 80, color: "#3498db" },
      ],
      Platforms: [
        {
          name: "Short",
          width: 100,
          height: 20,
          color: "#2ecc71",
          isStatic: true,
        },
        {
          name: "Medium",
          width: 200,
          height: 20,
          color: "#2ecc71",
          isStatic: true,
        },
        {
          name: "Long",
          width: 300,
          height: 20,
          color: "#2ecc71",
          isStatic: true,
        },
      ],
      Clouds: [
        {
          name: "Short",
          width: 100,
          height: 20,
          color: "#ffffff99",
          isStatic: true,
          entityType: "cloud",
        },
        {
          name: "Medium",
          width: 200,
          height: 20,
          color: "#ffffff99",
          isStatic: true,
          entityType: "cloud",
        },
        {
          name: "Long",
          width: 300,
          height: 20,
          color: "#ffffff99",
          isStatic: true,
          entityType: "cloud",
        },
      ],
      Water: [
        {
          name: "Low",
          width: 200,
          height: 100,
          color: "#3498db66",
          isStatic: true,
          entityType: "liquid",
          viscosity: 0.3,
        },
        {
          name: "Medium",
          width: 200,
          height: 150,
          color: "#3498db66",
          isStatic: true,
          entityType: "liquid",
          viscosity: 0.3,
        },
        {
          name: "Deep",
          width: 200,
          height: 200,
          color: "#3498db66",
          isStatic: true,
          entityType: "liquid",
          viscosity: 0.3,
        },
      ],
      Honey: [
        {
          name: "Low",
          width: 200,
          height: 100,
          color: "#f39c1299",
          isStatic: true,
          entityType: "liquid",
          viscosity: 0.7,
        },
        {
          name: "Medium",
          width: 200,
          height: 150,
          color: "#f39c1299",
          isStatic: true,
          entityType: "liquid",
          viscosity: 0.7,
        },
        {
          name: "Deep",
          width: 200,
          height: 200,
          color: "#f39c1299",
          isStatic: true,
          entityType: "liquid",
          viscosity: 0.7,
        },
      ],
      Tar: [
        {
          name: "Low",
          width: 200,
          height: 100,
          color: "#2c3e5099",
          isStatic: true,
          entityType: "liquid",
          viscosity: 0.95,
        },
        {
          name: "Medium",
          width: 200,
          height: 150,
          color: "#2c3e5099",
          isStatic: true,
          entityType: "liquid",
          viscosity: 0.95,
        },
        {
          name: "Deep",
          width: 200,
          height: 200,
          color: "#2c3e5099",
          isStatic: true,
          entityType: "liquid",
          viscosity: 0.95,
        },
      ],
      Circles: [
        { name: "Small", shape: "circle", radius: 20, color: "#e74c3c" },
        { name: "Medium", shape: "circle", radius: 35, color: "#e74c3c" },
        { name: "Large", shape: "circle", radius: 50, color: "#e74c3c" },
      ],
      Triangles: [
        {
          name: "Small",
          shape: "triangle",
          width: 30,
          height: 30,
          color: "#9b59b6",
        },
        {
          name: "Medium",
          shape: "triangle",
          width: 50,
          height: 50,
          color: "#9b59b6",
        },
        {
          name: "Large",
          shape: "triangle",
          width: 80,
          height: 80,
          color: "#9b59b6",
        },
      ],
      "Walls & Ramps": [
        {
          name: "Wall (Vertical)",
          width: 20,
          height: 150,
          color: "#95a5a6",
          isStatic: true,
        },
        { name: "Ramp (Left)", width: 100, height: 60, color: "#f39c12" },
        { name: "Ramp (Right)", width: 100, height: 60, color: "#f39c12" },
      ],
    };
  }

  createContextMenu() {
    // Create main menu
    this.contextMenu = document.createElement("div");
    this.contextMenu.id = "entity-context-menu";
    this.contextMenu.style.cssText = Styles.contextMenuEntity;
    document.body.appendChild(this.contextMenu);

    // Create submenu
    this.submenu = document.createElement("div");
    this.submenu.id = "entity-submenu";
    this.submenu.style.cssText = Styles.contextMenuEntity + " display: none;";
    document.body.appendChild(this.submenu);

    // Close menu when clicking elsewhere
    document.addEventListener("mousedown", (e) => {
      // Guard: check if game exists
      if (!this.editor.game || !this.editor.game.render) {
        return;
      }

      const canvas = this.editor.game.render.canvas;
      const clickedCanvas = e.target === canvas;
      const clickedMenu = this.contextMenu.contains(e.target);
      const clickedSubmenu = this.submenu.contains(e.target);

      // Close if clicking anywhere except the menu/submenu, OR if left-clicking the canvas
      const shouldClose =
        this.contextMenu.style.display === "block" &&
        !clickedMenu &&
        !clickedSubmenu &&
        ((clickedCanvas && e.button !== 2) || !clickedCanvas);

      if (shouldClose) {
        this.hideContextMenu();
        this.hideSubmenu();
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
    header.textContent = "Select Entity Category";
    this.contextMenu.appendChild(header);

    // Add menu items for each category
    Object.keys(this.entityCategories).forEach((categoryName) => {
      const item = document.createElement("div");
      item.style.cssText = Styles.contextMenuItem + " position: relative;";
      item.textContent = categoryName + " ▶";

      item.addEventListener("mouseenter", () => {
        item.style.background = "#3498db";
        this.showSubmenu(item, categoryName);
      });

      item.addEventListener("mouseleave", (e) => {
        item.style.background = "transparent";
        // Don't hide submenu immediately - let submenu handle it
      });

      this.contextMenu.appendChild(item);
    });

    // Position the menu at click location
    this.contextMenu.style.left = `${x}px`;
    this.contextMenu.style.top = `${y}px`;
    this.contextMenu.style.display = "block";
  }

  showSubmenu(categoryItem, categoryName) {
    const entities = this.entityCategories[categoryName];

    // Clear existing submenu items
    this.submenu.innerHTML = "";

    // Add header
    const header = document.createElement("div");
    header.style.cssText = Styles.contextMenuHeaderBlue;
    header.textContent = categoryName;
    this.submenu.appendChild(header);

    // Add menu items for each entity in this category
    entities.forEach((type) => {
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
        this.hideSubmenu();
      });

      this.submenu.appendChild(item);
    });

    // Position submenu to the right of the main menu
    const menuRect = this.contextMenu.getBoundingClientRect();
    const categoryRect = categoryItem.getBoundingClientRect();

    this.submenu.style.left = `${menuRect.right}px`;
    this.submenu.style.top = `${categoryRect.top}px`;
    this.submenu.style.display = "block";

    // Hide submenu when mouse leaves both menus
    const hideSubmenuOnLeave = (e) => {
      const menuRect = this.contextMenu.getBoundingClientRect();
      const submenuRect = this.submenu.getBoundingClientRect();

      const inMenu =
        e.clientX >= menuRect.left &&
        e.clientX <= menuRect.right &&
        e.clientY >= menuRect.top &&
        e.clientY <= menuRect.bottom;
      const inSubmenu =
        e.clientX >= submenuRect.left &&
        e.clientX <= submenuRect.right &&
        e.clientY >= submenuRect.top &&
        e.clientY <= submenuRect.bottom;

      if (!inMenu && !inSubmenu) {
        this.hideSubmenu();
        document.removeEventListener("mousemove", hideSubmenuOnLeave);
      }
    };

    // Track mouse movement to hide submenu
    document.addEventListener("mousemove", hideSubmenuOnLeave);
  }

  hideSubmenu() {
    if (this.submenu) {
      this.submenu.style.display = "none";
    }
  }

  hideContextMenu() {
    this.contextMenu.style.display = "none";
    this.hideSubmenu();
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

    // Add entityType if specified (e.g., 'cloud', 'liquid', 'cloth')
    if (type.entityType !== undefined) {
      entityConfig.entityType = type.entityType;
    }

    // Add viscosity if specified (for liquids)
    if (type.viscosity !== undefined) {
      entityConfig.viscosity = type.viscosity;
    }

    // Add cloth properties if specified
    if (type.columns !== undefined) entityConfig.columns = type.columns;
    if (type.rows !== undefined) entityConfig.rows = type.rows;
    if (type.particleSize !== undefined)
      entityConfig.particleSize = type.particleSize;
    if (type.particleGap !== undefined)
      entityConfig.particleGap = type.particleGap;
    if (type.stiffness !== undefined) entityConfig.stiffness = type.stiffness;
    if (type.pinTop !== undefined) entityConfig.pinTop = type.pinTop;

    // Create the appropriate entity type
    let newEntity;
    if (entityConfig.entityType === "cloud") {
      newEntity = new Cloud(entityConfig, this.editor.game.world);
      // Add to clouds array if it exists
      if (this.editor.game.gameEngine && this.editor.game.gameEngine.clouds) {
        this.editor.game.gameEngine.clouds.push(newEntity);
      }
    } else if (entityConfig.entityType === "liquid") {
      newEntity = new Liquid(entityConfig, this.editor.game.world);
      // Add to liquids array if it exists
      if (this.editor.game.gameEngine && this.editor.game.gameEngine.liquids) {
        this.editor.game.gameEngine.liquids.push(newEntity);
      }
    } else {
      newEntity = new Entity(entityConfig, this.editor.game.world);
    }

    this.editor.game.entities.push(newEntity);

    // Update working state to include this new entity
    this.editor.updateWorkingState();

    // Switch to select tool and select the newly created entity
    this.editor.selectTool("select");
    this.editor.tools.select.selectedEntity = newEntity;
    this.editor.tools.select.selectedEntities = [newEntity];
    this.editor.tools.select.setTransformMode(
      this.editor.tools.select.transformMode
    );
    this.editor.updatePropertiesPanel();
  }

  onActivate() {
    if (this.editor.game && this.editor.game.render) {
      this.editor.game.render.canvas.style.cursor = "crosshair";
    }
  }

  onDeactivate() {
    this.hideContextMenu();
    if (this.editor.game && this.editor.game.render) {
      this.editor.game.render.canvas.style.cursor = "grab";
    }
  }

  onMouseDown(e, worldPos) {
    // Only show context menu on right click
    if (e.button !== 2) {
      return;
    }

    // Prevent default context menu
    e.preventDefault();

    // If menu is already open, close it and open new one at new position
    if (this.contextMenu.style.display === "block") {
      this.hideContextMenu();
    }

    // Show context menu at click location
    // Store the world position where the click occurred
    this.showContextMenu(e.clientX, e.clientY, worldPos);
  }
}
