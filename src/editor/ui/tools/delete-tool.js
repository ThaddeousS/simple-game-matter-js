import { Tool } from "./tool.js";

export class DeleteTool extends Tool {
  constructor(editor) {
    super(editor, "Delete");
    // Selection box properties
    this.isSelecting = false;
    this.selectionStart = null;
    this.selectionEnd = null;
  }

  onActivate() {
    if (this.editor.game && this.editor.game.render) {
      this.editor.game.render.canvas.style.cursor = "not-allowed";
    }
  }

  onDeactivate() {
    if (this.editor.game && this.editor.game.render) {
      this.editor.game.render.canvas.style.cursor = "grab";
    }
    // Clear selection box on deactivate
    this.isSelecting = false;
    this.selectionStart = null;
    this.selectionEnd = null;
  }

  onMouseDown(e, worldPos) {
    // Left-click only
    if (e.button !== 0) return;

    // Find and delete entity at mouse position (single click delete)
    const entities = this.editor.game.entities;

    for (let i = entities.length - 1; i >= 0; i--) {
      const entity = entities[i];
      if (this.isPointInEntity(worldPos, entity)) {
        // Track this entity as manually deleted
        this.editor.deletedEntityIds.add(entity.body.id);

        entity.destroy();
        this.editor.game.entities.splice(i, 1);

        // Don't save initial state - let deleted entities stay deleted on reset
        return;
      }
    }

    // Check if clicking on player
    if (
      this.editor.game.player &&
      this.isPointInEntity(worldPos, this.editor.game.player)
    ) {
      alert("Cannot delete player directly. Player is managed separately.");
      return;
    }

    // If no entity was clicked, start selection box
    this.isSelecting = true;
    this.selectionStart = { ...worldPos };
    this.selectionEnd = { ...worldPos };
  }

  onMouseMove(e, worldPos) {
    // Update selection box
    if (this.isSelecting) {
      this.selectionEnd = { ...worldPos };
    }
  }

  onMouseUp(e, worldPos) {
    // Finalize selection box and delete entities
    if (this.isSelecting) {
      this.isSelecting = false;
      this.deleteEntitiesInBox();
      this.selectionStart = null;
      this.selectionEnd = null;
    }
  }

  deleteEntitiesInBox() {
    if (!this.selectionStart || !this.selectionEnd) return;

    const minX = Math.min(this.selectionStart.x, this.selectionEnd.x);
    const maxX = Math.max(this.selectionStart.x, this.selectionEnd.x);
    const minY = Math.min(this.selectionStart.y, this.selectionEnd.y);
    const maxY = Math.max(this.selectionStart.y, this.selectionEnd.y);

    // Find all entities within selection box and delete them
    const entities = this.editor.game.entities;

    for (let i = entities.length - 1; i >= 0; i--) {
      const entity = entities[i];
      if (!entity || !entity.body) continue;

      const pos = entity.body.position;
      if (pos.x >= minX && pos.x <= maxX && pos.y >= minY && pos.y <= maxY) {
        // Track this entity as manually deleted
        this.editor.deletedEntityIds.add(entity.body.id);

        entity.destroy();
        this.editor.game.entities.splice(i, 1);
      }
    }
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

      ctx.strokeStyle = "#ff0000";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(
        startScreenX,
        startScreenY,
        endScreenX - startScreenX,
        endScreenY - startScreenY
      );
      ctx.setLineDash([]);

      ctx.fillStyle = "rgba(255, 0, 0, 0.1)";
      ctx.fillRect(
        startScreenX,
        startScreenY,
        endScreenX - startScreenX,
        endScreenY - startScreenY
      );
    }
  }

  isPointInEntity(point, entity) {
    const body = entity.body;
    const dx = point.x - body.position.x;
    const dy = point.y - body.position.y;

    if (entity.config.shape === "circle") {
      const distSq = dx * dx + dy * dy;
      return distSq <= entity.config.radius * entity.config.radius;
    } else {
      // Rectangle (simplified, doesn't account for rotation)
      const halfWidth = entity.config.width / 2;
      const halfHeight = entity.config.height / 2;
      return Math.abs(dx) <= halfWidth && Math.abs(dy) <= halfHeight;
    }
  }
}
