export class EditorMouseManager {
  constructor(editor) {
    this.editor = editor;

    // Mouse navigation state
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.cameraStartX = 0;
    this.cameraStartY = 0;

    // Track if listeners are set up
    this.listenersInitialized = false;
  }

  initialize() {
    // Wait until game is created to setup mouse navigation
    if (!this.editor.game || !this.editor.game.render) {
      return;
    }

    // Avoid setting up listeners multiple times
    if (this.listenersInitialized) {
      return;
    }

    const canvas = this.editor.game.render.canvas;

    canvas.addEventListener("mousedown", (e) => this.onMouseDown(e, canvas));
    canvas.addEventListener("mousemove", (e) => this.onMouseMove(e, canvas));
    canvas.addEventListener("mouseup", () => this.onMouseUp(canvas));
    canvas.addEventListener("mouseleave", () => this.onMouseLeave());

    this.listenersInitialized = true;
  }

  onMouseDown(e, canvas) {
    if (!this.editor.isActive) return;

    // Only start camera dragging if Ctrl key is held
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault(); // Prevent default Ctrl+click behavior
      this.isDragging = true;
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
      this.cameraStartX = this.editor.game.camera.x;
      this.cameraStartY = this.editor.game.camera.y;
      canvas.style.cursor = "grabbing";
    }
  }

  onMouseMove(e, canvas) {
    if (!this.editor.isActive) return;

    // Update cursor based on Ctrl key state
    if (!this.isDragging) {
      if (e.ctrlKey || e.metaKey) {
        canvas.style.cursor = "grab";
      } else if (this.editor.currentTool) {
        // Restore tool cursor
        this.updateToolCursor(canvas);
      }
    }

    if (this.isDragging) {
      // Calculate camera movement in world space (accounting for zoom)
      const deltaScreenX = e.clientX - this.dragStartX;
      const deltaScreenY = e.clientY - this.dragStartY;

      // Convert screen space delta to world space delta
      const scale =
        this.editor.game.camera.width /
        (this.editor.game.camera.width / this.editor.game.camera.zoom);
      const deltaWorldX = deltaScreenX / scale;
      const deltaWorldY = deltaScreenY / scale;

      // Update camera position (invert for natural dragging)
      this.editor.game.camera.x = this.cameraStartX - deltaWorldX;
      this.editor.game.camera.y = this.cameraStartY - deltaWorldY;
    }
  }

  onMouseUp(canvas) {
    if (!this.editor.isActive) return;

    if (this.isDragging) {
      this.isDragging = false;
      // Reset cursor based on current tool
      if (this.editor.currentTool) {
        this.updateToolCursor(canvas);
      }
    }
  }

  onMouseLeave() {
    if (!this.editor.isActive) return;
    this.isDragging = false;
  }

  updateToolCursor(canvas) {
    if (this.editor.currentTool === this.editor.tools.select) {
      canvas.style.cursor = "default";
    } else if (this.editor.currentTool === this.editor.tools.entity) {
      canvas.style.cursor = "crosshair";
    } else if (this.editor.currentTool === this.editor.tools.delete) {
      canvas.style.cursor = "not-allowed";
    }
  }
}
