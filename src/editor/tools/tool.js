export class Tool {
  constructor(editor, label) {
    this.editor = editor;
    this.label = label;
    this.isActive = false;
  }

  activate() {
    this.isActive = true;
    this.onActivate();
  }

  deactivate() {
    this.isActive = false;
    this.onDeactivate();
  }

  // Override in subclasses
  onActivate() {
    // Called when tool is activated
  }

  // Override in subclasses
  onDeactivate() {
    // Called when tool is deactivated
  }

  // Override in subclasses
  onMouseDown(e, worldPos) {
    // Called when mouse is pressed on canvas
  }

  // Override in subclasses
  onMouseMove(e, worldPos) {
    // Called when mouse moves on canvas
  }

  // Override in subclasses
  onMouseUp(e, worldPos) {
    // Called when mouse is released on canvas
  }

  // Override in subclasses
  onKeyDown(e) {
    // Called when key is pressed
  }

  // Helper to convert screen position to world position
  screenToWorld(screenX, screenY) {
    const camera = this.editor.game.camera;
    const scale = camera.width / (camera.width / camera.zoom);
    const worldX = (screenX - camera.width / 2) / scale + camera.x;
    const worldY = (screenY - camera.height / 2) / scale + camera.y;
    return { x: worldX, y: worldY };
  }
}
