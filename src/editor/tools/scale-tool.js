import { TransformTool } from "./transform-tool.js";
import Matter from "matter-js";

export class ScaleTool extends TransformTool {
  constructor(editor, entity) {
    super(editor, entity, "Scale");
    this.scaleMode = "uniform"; // 'uniform', 'x', 'y'
    this.scaleStart = { x: 0, y: 0 };
    this.initialScale = { width: 0, height: 0, radius: 0 };
    this.handleSize = 12;
  }

  onMouseDown(e, worldPos) {
    if (!this.entity) return;

    const scaleHandle = this.getScaleHandle(worldPos);

    if (scaleHandle) {
      this.scaleMode = scaleHandle;
      this.isDragging = true;
      this.scaleStart = { x: worldPos.x, y: worldPos.y };

      if (this.entity.config.shape === "circle") {
        this.initialScale = { radius: this.entity.config.radius };
      } else {
        this.initialScale = {
          width: this.entity.config.width,
          height: this.entity.config.height,
        };
      }
    }
  }

  onMouseMove(e, worldPos) {
    if (!this.isDragging || !this.entity) return;

    const { Body } = Matter;

    if (this.entity.config.shape === "circle") {
      const dx = worldPos.x - this.scaleStart.x;
      const dy = worldPos.y - this.scaleStart.y;
      const scaleFactor = 1 + (dx + dy) * 0.01;
      const newRadius = Math.max(5, this.initialScale.radius * scaleFactor);
      Body.scale(
        this.entity.body,
        newRadius / this.entity.config.radius,
        newRadius / this.entity.config.radius
      );
      this.entity.config.radius = newRadius;
    } else {
      // Transform delta to entity's local space (account for rotation)
      const dx = worldPos.x - this.scaleStart.x;
      const dy = worldPos.y - this.scaleStart.y;
      const angle = this.entity.body.angle;
      const cos = Math.cos(-angle);
      const sin = Math.sin(-angle);
      const localDX = dx * cos - dy * sin;
      const localDY = dx * sin + dy * cos;

      let newWidth = this.initialScale.width;
      let newHeight = this.initialScale.height;

      switch (this.scaleMode) {
        case "uniform":
          const avgScale = 1 + (localDX + localDY) * 0.01;
          newWidth = Math.max(10, this.initialScale.width * avgScale);
          newHeight = Math.max(10, this.initialScale.height * avgScale);
          break;
        case "x":
          // Scale along rotated X-axis
          newWidth = Math.max(10, this.initialScale.width + localDX * 2);
          break;
        case "y":
          // Scale along rotated Y-axis
          newHeight = Math.max(10, this.initialScale.height + localDY * 2);
          break;
      }

      // Apply scale to body
      const scaleX = newWidth / this.entity.config.width;
      const scaleY = newHeight / this.entity.config.height;

      Body.scale(this.entity.body, scaleX, scaleY);

      // Update config
      this.entity.config.width = newWidth;
      this.entity.config.height = newHeight;
    }
  }

  onMouseUp(e, worldPos) {
    if (this.isDragging && this.entity) {
      if (this.entity.config.shape === "circle") {
        this.initialScale = { radius: this.entity.config.radius };
      } else {
        this.initialScale = {
          width: this.entity.config.width,
          height: this.entity.config.height,
        };
      }
    }
    this.isDragging = false;
    // Update properties panel after scaling
    if (this.editor && this.editor.updatePropertiesPanel) {
      this.editor.updatePropertiesPanel();
    }
  }

  getScaleHandle(worldPos) {
    if (!this.entity) return null;

    const pos = this.entity.body.position;

    if (this.entity.config.shape === "circle") {
      const dx = worldPos.x - (pos.x + this.entity.config.radius);
      const dy = worldPos.y - pos.y;
      if (Math.sqrt(dx * dx + dy * dy) < 15) return "uniform";
    } else {
      const hw = this.entity.config.width / 2;
      const hh = this.entity.config.height / 2;
      const angle = this.entity.body.angle;

      // Transform click position to entity's local space (account for rotation)
      const dx = worldPos.x - pos.x;
      const dy = worldPos.y - pos.y;
      const cos = Math.cos(-angle);
      const sin = Math.sin(-angle);
      const localX = dx * cos - dy * sin;
      const localY = dx * sin + dy * cos;

      // Corner handle (uniform scale) - in local space
      const cornerDX = localX - hw;
      const cornerDY = localY - hh;
      if (Math.sqrt(cornerDX * cornerDX + cornerDY * cornerDY) < 15)
        return "uniform";

      // Right edge (X scale) - in local space
      if (Math.abs(localX - hw) < 15 && Math.abs(localY) < hh) return "x";

      // Bottom edge (Y scale) - in local space
      if (Math.abs(localY - hh) < 15 && Math.abs(localX) < hw) return "y";
    }

    return null;
  }

  renderWidget(ctx, camera) {
    if (!this.entity) return;

    const { x: screenX, y: screenY, scale } = this.getScreenPosition(camera);
    const handleSize = this.handleSize * scale;

    if (this.entity.config.shape === "circle") {
      const radius = this.entity.config.radius * scale;
      this.renderHandle(
        ctx,
        screenX + radius,
        screenY,
        scale,
        "#ff00ff",
        this.handleSize
      );
    } else {
      // Use current entity dimensions for handle positioning
      const width = this.entity.config.width * scale;
      const height = this.entity.config.height * scale;

      // Account for rotation
      const angle = this.entity.body.angle;

      ctx.save();
      ctx.translate(screenX, screenY);
      ctx.rotate(angle);

      // Corner handle (uniform) - magenta
      ctx.fillStyle = "#ff00ff";
      ctx.fillRect(
        width / 2 - handleSize / 2,
        height / 2 - handleSize / 2,
        handleSize,
        handleSize
      );
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 2;
      ctx.strokeRect(
        width / 2 - handleSize / 2,
        height / 2 - handleSize / 2,
        handleSize,
        handleSize
      );

      // Right edge handle (X scale) - red
      ctx.fillStyle = "#ff0000";
      ctx.fillRect(
        width / 2 - handleSize / 2,
        -handleSize / 2,
        handleSize,
        handleSize
      );
      ctx.strokeStyle = "#000000";
      ctx.strokeRect(
        width / 2 - handleSize / 2,
        -handleSize / 2,
        handleSize,
        handleSize
      );

      // Bottom edge handle (Y scale) - green
      ctx.fillStyle = "#00ff00";
      ctx.fillRect(
        -handleSize / 2,
        height / 2 - handleSize / 2,
        handleSize,
        handleSize
      );
      ctx.strokeStyle = "#000000";
      ctx.strokeRect(
        -handleSize / 2,
        height / 2 - handleSize / 2,
        handleSize,
        handleSize
      );

      ctx.restore();
    }
  }
}
