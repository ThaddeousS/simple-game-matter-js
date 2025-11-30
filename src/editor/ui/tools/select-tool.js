import { Tool } from "./tool.js";
import Matter from "matter-js";
import { MoveTool } from "./move-tool.js";
import { RotateTool } from "./rotate-tool.js";
import { ScaleTool } from "./scale-tool.js";
import { Styles } from "../../../styles/styles.js";

export class SelectTool extends Tool {
  constructor(editor) {
    super(editor, "Select");
    this.selectedEntity = null;
    this.selectedEntities = []; // Array for multi-select
    this.highlightColor = "#ffff00";
    this.highlightWidth = 3;
    this.transformMode = "move";
    this.contextMenu = null;
    this.currentSubTool = null;

    // Selection box properties
    this.isSelecting = false;
    this.selectionStart = null;
    this.selectionEnd = null;

    this.createContextMenu();
  }

  createContextMenu() {
    this.contextMenu = document.createElement("div");
    this.contextMenu.id = "select-context-menu";
    this.contextMenu.style.cssText = Styles.contextMenu;
    document.body.appendChild(this.contextMenu);

    document.addEventListener("mousedown", (e) => {
      const canvas = this.editor.game.render.canvas;
      const clickedCanvas = e.target === canvas;
      const clickedMenu = this.contextMenu.contains(e.target);

      if (
        !clickedCanvas &&
        !clickedMenu &&
        this.contextMenu.style.display === "block"
      ) {
        this.hideContextMenu();
      }
    });
  }

  showContextMenu(x, y) {
    this.contextMenu.innerHTML = "";

    const header = document.createElement("div");
    header.style.cssText = Styles.contextMenuHeader;
    header.textContent = "Transform Mode";
    this.contextMenu.appendChild(header);

    const modes = [
      { name: "Move", mode: "move", icon: "↔" },
      { name: "Rotate", mode: "rotate", icon: "↻" },
      { name: "Scale", mode: "scale", icon: "⇔" },
    ];

    modes.forEach((modeData) => {
      const item = document.createElement("div");
      item.style.cssText = `${Styles.contextMenuItem} background: ${this.transformMode === modeData.mode ? "#ffff0033" : "transparent"};`;

      const icon = document.createElement("span");
      icon.style.cssText = Styles.contextMenuIcon;
      icon.textContent = modeData.icon;

      item.appendChild(icon);
      item.appendChild(document.createTextNode(modeData.name));

      item.addEventListener("mouseenter", () => {
        if (this.transformMode !== modeData.mode) {
          item.style.background = "#ffff0022";
        }
      });

      item.addEventListener("mouseleave", () => {
        if (this.transformMode !== modeData.mode) {
          item.style.background = "transparent";
        }
      });

      item.addEventListener("mousedown", (e) => {
        e.stopPropagation();
        e.preventDefault();
        this.setTransformMode(modeData.mode);
        this.hideContextMenu();
      });

      this.contextMenu.appendChild(item);
    });

    this.contextMenu.style.left = `${x}px`;
    this.contextMenu.style.top = `${y}px`;
    this.contextMenu.style.display = "block";

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
  }

  setTransformMode(mode) {
    this.transformMode = mode;

    // Create appropriate sub-tool
    if (this.selectedEntities.length > 0) {
      switch (mode) {
        case "move":
          this.currentSubTool = new MoveTool(
            this.editor,
            this.selectedEntities
          );
          break;
        case "rotate":
          this.currentSubTool = new RotateTool(
            this.editor,
            this.selectedEntities
          );
          break;
        case "scale":
          this.currentSubTool = new ScaleTool(
            this.editor,
            this.selectedEntities
          );
          break;
      }
    }
  }

  onActivate() {
    this.editor.game.render.canvas.style.cursor = "default";
    this.transformMode = "move";
  }

  onDeactivate() {
    this.selectedEntity = null;
    this.currentSubTool = null;
    this.hideContextMenu();
  }

  onMouseDown(e, worldPos) {
    // Right-click on selected entity shows context menu
    if (e.button === 2 && this.selectedEntities.length > 0) {
      // Check if right-clicking on any selected entity
      for (let entity of this.selectedEntities) {
        if (this.isPointInEntity(worldPos, entity)) {
          e.preventDefault();
          this.showContextMenu(e.clientX, e.clientY);
          return;
        }
      }
    }

    // Left-click
    if (e.button !== 0) return;

    // Check if clicking on sub-tool widget
    let clickedWidget = false;
    if (this.currentSubTool && this.selectedEntities.length > 0) {
      // Try to interact with the widget
      if (this.currentSubTool.getWidgetInteraction) {
        const interaction = this.currentSubTool.getWidgetInteraction(worldPos);
        if (interaction) {
          clickedWidget = true;
          this.currentSubTool.onMouseDown(e, worldPos);
          return;
        }
      } else if (this.currentSubTool.getScaleHandle) {
        const handle = this.currentSubTool.getScaleHandle(worldPos);
        if (handle) {
          clickedWidget = true;
          this.currentSubTool.onMouseDown(e, worldPos);
          return;
        }
      } else {
        // For rotate tool, check if clicking near the circle
        const center = this.getMultiSelectCenter();
        const dx = worldPos.x - center.x;
        const dy = worldPos.y - center.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 50 && dist < 90) {
          clickedWidget = true;
          this.currentSubTool.onMouseDown(e, worldPos);
          return;
        }
      }
    }

    // Check for entity selection
    const entities = [...this.editor.game.entities];
    if (this.editor.game.player) {
      entities.push(this.editor.game.player);
    }

    let foundEntity = false;
    for (let entity of entities) {
      if (entity && this.isPointInEntity(worldPos, entity)) {
        // Select entity
        this.selectedEntity = entity;
        this.selectedEntities = [entity];
        this.setTransformMode(this.transformMode);
        foundEntity = true;

        // Update properties panel
        this.editor.updatePropertiesPanel();

        // Let sub-tool handle the initial click
        if (this.currentSubTool) {
          this.currentSubTool.onMouseDown(e, worldPos);
        }
        return;
      }
    }

    // If no entity or widget was clicked, start selection box
    if (!foundEntity && !clickedWidget) {
      this.isSelecting = true;
      this.selectionStart = { ...worldPos };
      this.selectionEnd = { ...worldPos };
      this.selectedEntity = null;
      this.selectedEntities = [];
      this.currentSubTool = null;
      this.editor.updatePropertiesPanel();
    }
  }

  onMouseMove(e, worldPos) {
    // Update selection box
    if (this.isSelecting) {
      this.selectionEnd = { ...worldPos };
      return;
    }

    if (this.currentSubTool) {
      this.currentSubTool.onMouseMove(e, worldPos);
    }
  }

  onMouseUp(e, worldPos) {
    // Finalize selection box
    if (this.isSelecting) {
      this.isSelecting = false;
      this.finalizeSelection();
      return;
    }

    if (this.currentSubTool) {
      this.currentSubTool.onMouseUp(e, worldPos);
    }
  }

  finalizeSelection() {
    if (!this.selectionStart || !this.selectionEnd) {
      this.isSelecting = false;
      this.selectionStart = null;
      this.selectionEnd = null;
      return;
    }

    const minX = Math.min(this.selectionStart.x, this.selectionEnd.x);
    const maxX = Math.max(this.selectionStart.x, this.selectionEnd.x);
    const minY = Math.min(this.selectionStart.y, this.selectionEnd.y);
    const maxY = Math.max(this.selectionStart.y, this.selectionEnd.y);

    // Find all entities within selection box
    const entities = [...this.editor.game.entities];
    if (this.editor.game.player) {
      entities.push(this.editor.game.player);
    }

    this.selectedEntities = entities.filter((entity) => {
      if (!entity || !entity.body) return false;
      const pos = entity.body.position;
      return pos.x >= minX && pos.x <= maxX && pos.y >= minY && pos.y <= maxY;
    });

    // Update selected entity for compatibility
    this.selectedEntity =
      this.selectedEntities.length === 1 ? this.selectedEntities[0] : null;

    // Set transform mode if entities selected
    if (this.selectedEntities.length > 0) {
      this.setTransformMode(this.transformMode);
    }

    // Clear selection box
    this.selectionStart = null;
    this.selectionEnd = null;

    // Update properties panel
    this.editor.updatePropertiesPanel();
  }

  getMultiSelectCenter() {
    if (this.selectedEntities.length === 0) return { x: 0, y: 0 };

    let sumX = 0,
      sumY = 0;
    for (let entity of this.selectedEntities) {
      sumX += entity.body.position.x;
      sumY += entity.body.position.y;
    }

    return {
      x: sumX / this.selectedEntities.length,
      y: sumY / this.selectedEntities.length,
    };
  }

  renderHighlight(ctx, camera) {
    // Draw selection box if selecting
    if (this.isSelecting && this.selectionStart && this.selectionEnd) {
      const viewWidth = camera.width / camera.zoom;
      const scale = camera.width / viewWidth;

      const startScreenX =
        (this.selectionStart.x - camera.x) * scale + camera.width / 2;
      const startScreenY =
        (this.selectionStart.y - camera.y) * scale + camera.height / 2;
      const endScreenX =
        (this.selectionEnd.x - camera.x) * scale + camera.width / 2;
      const endScreenY =
        (this.selectionEnd.y - camera.y) * scale + camera.height / 2;

      ctx.strokeStyle = "#00ffff";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(
        startScreenX,
        startScreenY,
        endScreenX - startScreenX,
        endScreenY - startScreenY
      );
      ctx.setLineDash([]);

      ctx.fillStyle = "rgba(0, 255, 255, 0.1)";
      ctx.fillRect(
        startScreenX,
        startScreenY,
        endScreenX - startScreenX,
        endScreenY - startScreenY
      );
      return;
    }

    // Draw highlights for all selected entities
    if (this.selectedEntities.length === 0) return;

    const viewWidth = camera.width / camera.zoom;
    const scale = camera.width / viewWidth;

    for (let entity of this.selectedEntities) {
      const pos = entity.body.position;
      const screenX = (pos.x - camera.x) * scale + camera.width / 2;
      const screenY = (pos.y - camera.y) * scale + camera.height / 2;

      ctx.strokeStyle = this.highlightColor;
      ctx.lineWidth = this.highlightWidth;

      if (entity.config.shape === "circle") {
        const radius = entity.config.radius * scale;
        ctx.beginPath();
        ctx.arc(screenX, screenY, radius + 5 * scale, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        const width = entity.config.width * scale;
        const height = entity.config.height * scale;
        const offset = 5 * scale;

        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(entity.body.angle);
        ctx.strokeRect(
          -width / 2 - offset,
          -height / 2 - offset,
          width + offset * 2,
          height + offset * 2
        );
        ctx.restore();
      }
    }

    // Render sub-tool widget at center of multi-selection
    if (this.currentSubTool && this.currentSubTool.renderWidget) {
      this.currentSubTool.renderWidget(ctx, camera);
    }

    // Mode indicator removed - no longer drawing label above entity
  }

  isPointInEntity(point, entity) {
    const body = entity.body;
    const dx = point.x - body.position.x;
    const dy = point.y - body.position.y;

    if (entity.config.shape === "circle") {
      const distSq = dx * dx + dy * dy;
      return distSq <= entity.config.radius * entity.config.radius;
    } else {
      const cos = Math.cos(-body.angle);
      const sin = Math.sin(-body.angle);
      const rotatedX = dx * cos - dy * sin;
      const rotatedY = dx * sin + dy * cos;

      const halfWidth = entity.config.width / 2;
      const halfHeight = entity.config.height / 2;
      return (
        Math.abs(rotatedX) <= halfWidth && Math.abs(rotatedY) <= halfHeight
      );
    }
  }

  onKeyDown(e) {
    // Only handle keyboard shortcuts when entities are selected
    if (this.selectedEntities.length === 0) {
      return;
    }

    const { Body } = Matter;
    const moveAmount = 5;

    // Handle arrow key nudging for all selected entities
    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault();
        for (let entity of this.selectedEntities) {
          const currentPos = entity.body.position;
          Body.setPosition(entity.body, {
            x: currentPos.x - moveAmount,
            y: currentPos.y,
          });
        }
        return;
      case "ArrowRight":
        e.preventDefault();
        for (let entity of this.selectedEntities) {
          const currentPos = entity.body.position;
          Body.setPosition(entity.body, {
            x: currentPos.x + moveAmount,
            y: currentPos.y,
          });
        }
        return;
      case "ArrowUp":
        e.preventDefault();
        for (let entity of this.selectedEntities) {
          const currentPos = entity.body.position;
          Body.setPosition(entity.body, {
            x: currentPos.x,
            y: currentPos.y - moveAmount,
          });
        }
        return;
      case "ArrowDown":
        e.preventDefault();
        for (let entity of this.selectedEntities) {
          const currentPos = entity.body.position;
          Body.setPosition(entity.body, {
            x: currentPos.x,
            y: currentPos.y + moveAmount,
          });
        }
        return;
    }

    // Handle transform mode shortcuts
    if (e.key === "r" || e.key === "R") {
      e.preventDefault();
      e.stopPropagation();
      this.setTransformMode("rotate");
    } else if (e.key === "s" || e.key === "S") {
      e.preventDefault();
      e.stopPropagation();
      this.setTransformMode("scale");
    } else if (e.key === "m" || e.key === "M") {
      e.preventDefault();
      e.stopPropagation();
      this.setTransformMode("move");
    }
  }
}
