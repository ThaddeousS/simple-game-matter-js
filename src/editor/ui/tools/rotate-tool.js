import { TransformTool } from "./transform-tool.js";
import Matter from "matter-js";

export class RotateTool extends TransformTool {
  constructor(editor, entity) {
    super(editor, entity, "Rotate");
    this.rotationStart = 0;
    this.widgetRadius = 70;
  }

  onMouseDown(e, worldPos) {
    if (this.entities.length === 0) return;

    const center = this.getCenter();
    const dx = worldPos.x - center.x;
    const dy = worldPos.y - center.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 50 && dist < 90) {
      this.isDragging = true;
      this.rotationStart = Math.atan2(dy, dx);

      // Store initial positions and angles for all entities
      this.initialStates = this.entities.map((entity) => ({
        entity: entity,
        x: entity.body.position.x,
        y: entity.body.position.y,
        angle: entity.body.angle,
        offsetX: entity.body.position.x - center.x,
        offsetY: entity.body.position.y - center.y,
      }));
    }
  }

  onMouseMove(e, worldPos) {
    if (!this.isDragging || this.entities.length === 0 || !this.initialStates)
      return;

    const { Body } = Matter;
    const center = this.getCenter();
    const currentAngle = Math.atan2(
      worldPos.y - center.y,
      worldPos.x - center.x
    );
    const deltaAngle = currentAngle - this.rotationStart;

    // Rotate each entity around the center
    for (let state of this.initialStates) {
      // Rotate position around center
      const cos = Math.cos(deltaAngle);
      const sin = Math.sin(deltaAngle);
      const newX = center.x + (state.offsetX * cos - state.offsetY * sin);
      const newY = center.y + (state.offsetX * sin + state.offsetY * cos);

      Body.setPosition(state.entity.body, { x: newX, y: newY });
      Body.setAngle(state.entity.body, state.angle + deltaAngle);
    }
  }

  onMouseUp(e, worldPos) {
    if (this.isDragging) {
      // Update working state after rotation
      if (this.editor && this.editor.updateWorkingState) {
        this.editor.updateWorkingState();
      }
      this.initialStates = null;
    }
    this.isDragging = false;
    // Update properties panel after rotation
    if (this.editor && this.editor.updatePropertiesPanel) {
      this.editor.updatePropertiesPanel();
    }
  }

  renderWidget(ctx, camera) {
    if (!this.entity) return;

    const { x: screenX, y: screenY, scale } = this.getScreenPosition(camera);
    const radius = this.widgetRadius * scale;

    // Draw rotation circle
    ctx.strokeStyle = "#00ffff";
    ctx.lineWidth = 4 * scale;
    ctx.setLineDash([10 * scale, 5 * scale]);
    ctx.beginPath();
    ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw rotation handle at current angle
    const handleAngle = this.entity.body.angle;
    const handleX = screenX + Math.cos(handleAngle) * radius;
    const handleY = screenY + Math.sin(handleAngle) * radius;

    this.renderHandle(ctx, handleX, handleY, scale, "#00ffff", 10);

    // Draw line from center to handle
    ctx.strokeStyle = "#00ffff";
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.moveTo(screenX, screenY);
    ctx.lineTo(handleX, handleY);
    ctx.stroke();

    // Draw angle arc
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.arc(screenX, screenY, radius * 0.5, 0, handleAngle);
    ctx.stroke();

    // Draw angle text
    const degrees = Math.round(((handleAngle * 180) / Math.PI) % 360);
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${14 * scale}px Arial`;
    ctx.textAlign = "center";
    ctx.fillText(`${degrees}°`, screenX, screenY - radius - 15 * scale);
  }
}
