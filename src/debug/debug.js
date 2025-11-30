import { Styles } from "../styles/styles.js";

export class Debug {
  constructor() {
    this.panel = null;
    this.header = null;
    this.cameraPosElement = null;
    this.debugStatusElement = null;
    this.isVisible = false;

    this.createDebugPanel();
  }

  createDebugPanel() {
    // Create main panel container
    this.panel = document.createElement("div");
    this.panel.id = "info";
    this.panel.style.cssText = Styles.debugPanel;
    this.panel.style.display = "none";

    // Create header
    this.header = document.createElement("div");
    this.header.id = "info-header";
    this.header.style.cssText = Styles.debugHeader;
    this.header.innerHTML = "<strong>▼ Controls & Info</strong>";

    // Create content section
    const content = document.createElement("div");
    content.id = "info-content";
    content.style.cssText = "user-select: none; pointer-events: none;";
    content.innerHTML = `
                    <div><strong>Controls:</strong></div>
                    <div>Arrow Keys or WASD - Move Player</div>
                    <div>Space or W/Up - Jump</div>
                    <div>R - Reset World</div>
                    <div>L - Load Level (JSON)</div>
                    <div>G - Load Game Config (JSON)</div>
                    <div>P - Load Player Config (JSON)</div>
                    <div>Ctrl+D - Toggle This Panel</div>
                    <div>Ctrl+I - Toggle Editor Mode</div>
                    <div>Ctrl+L - Toggle Debug Labels</div>
                    <div>Ctrl+Y - Toggle Wireframes</div>
                    <div>Mouse Wheel - Zoom In/Out</div>
                    <div><strong>Test Controls:</strong></div>
                    <div>1 - Damage Player (10 HP)</div>
                    <div>2 - Heal Player (10 HP)</div>
                `;

    // Create status section
    const status = document.createElement("div");
    status.id = "info-status";
    status.style.cssText = Styles.debugStatus;

    // Create camera position element
    this.cameraPosElement = document.createElement("div");
    this.cameraPosElement.id = "camera-pos";
    this.cameraPosElement.textContent =
      "Camera: (0, 0) | Player: (0, 0) | Health: 100/100";

    // Create debug status element
    this.debugStatusElement = document.createElement("div");
    this.debugStatusElement.id = "debug-status";
    this.debugStatusElement.textContent =
      "Debug Labels: OFF | Wireframes: OFF | Zoom: 1.00x";

    // Assemble the panel
    status.appendChild(this.cameraPosElement);
    status.appendChild(this.debugStatusElement);

    this.panel.appendChild(this.header);
    this.panel.appendChild(content);
    this.panel.appendChild(status);

    // Add to body
    document.body.appendChild(this.panel);

    // Make panel draggable
    this.setupDragging();
  }

  setupDragging() {
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    // Make header the drag handle
    this.header.style.cursor = "move";

    this.header.addEventListener("mousedown", (e) => {
      // Only start dragging if clicking directly on header (not on collapsible arrow area)
      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;

      if (e.target === this.header || e.target.parentNode === this.header) {
        isDragging = true;
      }
    });

    document.addEventListener("mousemove", (e) => {
      if (isDragging) {
        e.preventDefault();

        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;

        xOffset = currentX;
        yOffset = currentY;

        this.panel.style.left = `${currentX + 10}px`;
        this.panel.style.top = `${currentY + 10}px`;
      }
    });

    document.addEventListener("mouseup", () => {
      isDragging = false;
    });
  }

  toggle() {
    const currentlyHidden =
      this.panel.style.display === "none" || !this.panel.style.display;
    this.isVisible = currentlyHidden;
    this.panel.style.display = this.isVisible ? "block" : "none";
  }

  show() {
    this.isVisible = true;
    this.panel.style.display = "block";
  }

  hide() {
    this.isVisible = false;
    this.panel.style.display = "none";
  }

  updateCameraPos(text) {
    this.cameraPosElement.textContent = text;
  }

  updateDebugStatus(text) {
    this.debugStatusElement.textContent = text;
  }

  setupHeaderClickListener(callback) {
    this.header.addEventListener("click", callback);
  }

  toggleContent() {
    const infoContent = document.getElementById("info-content");
    const isCollapsed = infoContent.style.display === "none";

    infoContent.style.display = isCollapsed ? "block" : "none";
    this.header.innerHTML = isCollapsed
      ? "<strong>▼ Controls & Info</strong>"
      : "<strong>▶ Controls & Info</strong>";
  }
}
