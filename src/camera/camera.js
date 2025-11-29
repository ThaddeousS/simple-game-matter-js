export class Camera {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.target = null;
    this.smoothing = 0.1; // Smooth camera follow (0 = instant, 1 = no follow)
    this.zoom = 1; // Default zoom level (1 = normal, >1 = zoomed in, <1 = zoomed out)
    this.followEnabled = true; // Can be disabled in editor mode
  }

  setTarget(target) {
    this.target = target;
  }

  update() {
    if (this.target && this.followEnabled) {
      // Smoothly move camera towards target
      const targetX = this.target.position.x;
      const targetY = this.target.position.y;

      this.x += (targetX - this.x) * this.smoothing;
      this.y += (targetY - this.y) * this.smoothing;
    }
  }

  setZoom(zoomLevel) {
    // Clamp zoom between 0.1 and 5
    this.zoom = Math.max(0.1, Math.min(5, zoomLevel));
  }

  resetZoom() {
    this.zoom = 1;
  }

  worldToScreen(worldX, worldY) {
    return {
      x: worldX - this.x + this.width / 2,
      y: worldY - this.y + this.height / 2,
    };
  }

  screenToWorld(screenX, screenY) {
    return {
      x: screenX + this.x - this.width / 2,
      y: screenY + this.y - this.height / 2,
    };
  }
}
