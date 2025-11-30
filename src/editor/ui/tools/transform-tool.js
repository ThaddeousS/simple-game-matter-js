import { Tool } from "./tool.js";

export class TransformTool extends Tool {
  constructor(editor, entities, label) {
    super(editor, label);
    // Support both single entity and array of entities
    this.entities = Array.isArray(entities) ? entities : [entities];
    this.entity = this.entities[0]; // Keep for backward compatibility
    this.isDragging = false;
  }

  // Helper to get center position of all entities
  getCenter() {
    if (this.entities.length === 0) return { x: 0, y: 0 };

    let sumX = 0,
      sumY = 0;
    for (let entity of this.entities) {
      sumX += entity.body.position.x;
      sumY += entity.body.position.y;
    }

    return {
      x: sumX / this.entities.length,
      y: sumY / this.entities.length,
    };
  }

  // Helper to render handles with common styling
  renderHandle(ctx, screenX, screenY, scale, color, size = 12) {
    ctx.fillStyle = color;
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(screenX, screenY, size * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Helper to render arrow
  renderArrow(ctx, startX, startY, endX, endY, scale, color, arrowSize = 15) {
    const angle = Math.atan2(endY - startY, endX - startX);

    // Draw line
    ctx.strokeStyle = color;
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Draw arrow head
    ctx.fillStyle = color;
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - arrowSize * scale * Math.cos(angle - Math.PI / 6),
      endY - arrowSize * scale * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      endX - arrowSize * scale * Math.cos(angle + Math.PI / 6),
      endY - arrowSize * scale * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Helper to convert entity position to screen position
  getScreenPosition(camera) {
    if (this.entities.length === 0) return { x: 0, y: 0, scale: 1 };

    const pos = this.getCenter();
    const viewWidth = camera.width / camera.zoom;
    const scale = camera.width / viewWidth;

    const screenX = (pos.x - camera.x) * scale + camera.width / 2;
    const screenY = (pos.y - camera.y) * scale + camera.height / 2;

    return { x: screenX, y: screenY, scale };
  }
}
