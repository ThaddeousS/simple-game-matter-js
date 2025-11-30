import { TransformTool } from "./transform-tool.js";
import Matter from "matter-js";

export class MoveTool extends TransformTool {
  constructor(editor, entity) {
    super(editor, entity, "Move");
    this.dragMode = "free"; // 'free', 'x', 'y'
    this.dragOffset = { x: 0, y: 0 };
    this.widgetSize = 60;
    this.arrowSize = 15;
  }

  onMouseDown(e, worldPos) {
    if (this.entities.length === 0) return;

    const widgetInteraction = this.getWidgetInteraction(worldPos);

    if (widgetInteraction) {
      this.dragMode = widgetInteraction;
      this.isDragging = true;
      const center = this.getCenter();
      this.dragOffset.x = center.x - worldPos.x;
      this.dragOffset.y = center.y - worldPos.y;

      // Store initial positions for all entities
      this.initialPositions = this.entities.map((entity) => ({
        entity: entity,
        x: entity.body.position.x,
        y: entity.body.position.y,
      }));
    }
  }

  onMouseMove(e, worldPos) {
    if (
      !this.isDragging ||
      this.entities.length === 0 ||
      !this.initialPositions
    )
      return;

    const { Body } = Matter;
    const center = this.getCenter();
    const targetX = worldPos.x + this.dragOffset.x;
    const targetY = worldPos.y + this.dragOffset.y;

    // Calculate delta from initial center
    const deltaX = targetX - center.x;
    const deltaY = targetY - center.y;

    // Apply delta to all entities
    for (let i = 0; i < this.entities.length; i++) {
      const entity = this.entities[i];
      const initial = this.initialPositions[i];

      switch (this.dragMode) {
        case "free":
          Body.setPosition(entity.body, {
            x: initial.x + deltaX,
            y: initial.y + deltaY,
          });
          break;
        case "x":
          Body.setPosition(entity.body, {
            x: initial.x + deltaX,
            y: entity.body.position.y,
          });
          break;
        case "y":
          Body.setPosition(entity.body, {
            x: entity.body.position.x,
            y: initial.y + deltaY,
          });
          break;
      }
    }
  }

  onMouseUp(e, worldPos) {
    if (this.isDragging) {
      // Update working state after moving
      if (this.editor && this.editor.updateWorkingState) {
        this.editor.updateWorkingState();
      }
      this.initialPositions = null;
    }
    this.isDragging = false;
    // Update properties panel after move
    if (this.editor && this.editor.updatePropertiesPanel) {
      this.editor.updatePropertiesPanel();
    }
  }

  getWidgetInteraction(worldPos) {
    if (this.entities.length === 0) return null;

    const pos = this.getCenter();
    const dx = worldPos.x - pos.x;
    const dy = worldPos.y - pos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Check center circle (free move)
    if (dist < 15) return "free";

    // Check arrows
    if (
      Math.abs(dy) < 10 &&
      Math.abs(dx) > 15 &&
      Math.abs(dx) < this.widgetSize
    )
      return "x";
    if (
      Math.abs(dx) < 10 &&
      Math.abs(dy) > 15 &&
      Math.abs(dy) < this.widgetSize
    )
      return "y";

    return null;
  }

  renderWidget(ctx, camera) {
    if (!this.entity) return;

    const { x: screenX, y: screenY, scale } = this.getScreenPosition(camera);
    const widgetScale = this.widgetSize * scale;
    const arrowScale = this.arrowSize * scale;

    // Draw center circle (free move)
    this.renderHandle(ctx, screenX, screenY, scale, "#ffff00", 15);

    // Draw X-axis arrows (red)
    this.renderArrow(
      ctx,
      screenX + 15 * scale,
      screenY,
      screenX + widgetScale,
      screenY,
      scale,
      "#ff0000",
      this.arrowSize
    );
    this.renderArrow(
      ctx,
      screenX - 15 * scale,
      screenY,
      screenX - widgetScale,
      screenY,
      scale,
      "#ff0000",
      this.arrowSize
    );

    // Draw Y-axis arrows (green)
    this.renderArrow(
      ctx,
      screenX,
      screenY + 15 * scale,
      screenX,
      screenY + widgetScale,
      scale,
      "#00ff00",
      this.arrowSize
    );
    this.renderArrow(
      ctx,
      screenX,
      screenY - 15 * scale,
      screenX,
      screenY - widgetScale,
      scale,
      "#00ff00",
      this.arrowSize
    );
  }
}
