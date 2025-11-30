import { TopToolBar } from "./tool-bar/top-tool-bar.js";
import { LeftToolBar } from "./tool-bar/left-tool-bar.js";
import { RightToolBar } from "./tool-bar/right-tool-bar.js";
import { Styles } from "../../styles/styles.js";

export class EditorUI {
  constructor(editor) {
    this.editor = editor;
    this.container = null;
    this.topToolbar = null;
    this.leftToolbar = null;
    this.rightToolbar = null;
  }

  create() {
    // Create container
    this.container = document.createElement("div");
    this.container.id = "editor-container";
    this.container.style.cssText = Styles.editorContainer;

    // Create toolbars
    this.topToolbar = new TopToolBar();
    this.topToolbar.createElement();
    this.topToolbar.createContent();

    this.leftToolbar = new LeftToolBar(this.editor.leftToolbarDefaultWidth);
    this.leftToolbar.createElement();
    this.leftToolbar.createContent();

    this.rightToolbar = new RightToolBar(this.editor.rightToolbarDefaultWidth);
    this.rightToolbar.createElement();
    this.rightToolbar.createContent();

    // Append toolbars to container
    this.topToolbar.appendTo(this.container);
    this.leftToolbar.appendTo(this.container);
    this.rightToolbar.appendTo(this.container);

    // Add container to document
    document.body.appendChild(this.container);

    // Setup event listeners
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Setup UI button listeners (don't need canvas)

    // Top toolbar buttons
    const createWorldBtn = document.getElementById("editor-create-world-btn");
    if (createWorldBtn) {
      createWorldBtn.addEventListener("click", () => {
        if (this.editor.createWorldDialog) {
          this.editor.createWorldDialog.open();
        }
      });
    }

    const revertBtn = document.getElementById("editor-revert-btn");
    if (revertBtn) {
      revertBtn.addEventListener("click", () => this.editor.revertToDefault());
    }

    const saveBtn = document.getElementById("editor-save-btn");
    if (saveBtn) {
      saveBtn.addEventListener("click", () => this.editor.showSaveDialog());
    }

    const loadBtn = document.getElementById("editor-load-btn");
    if (loadBtn) {
      saveBtn.addEventListener("click", () => this.editor.showLoadDialog());
    }

    const exitBtn = document.getElementById("editor-exit-btn");
    if (exitBtn) {
      exitBtn.addEventListener("click", () => this.editor.toggle());
    }

    // Left toolbar tabs
    const toolsTabBtn = document.getElementById("tools-tab-btn");
    if (toolsTabBtn) {
      toolsTabBtn.addEventListener("click", () => this.switchLeftTab("tools"));
    }

    const hierarchyTabBtn = document.getElementById("hierarchy-tab-btn");
    if (hierarchyTabBtn) {
      hierarchyTabBtn.addEventListener("click", () =>
        this.switchLeftTab("hierarchy")
      );
    }

    // Left toolbar expand button
    const leftExpandBtn = document.getElementById("left-expand-btn");
    if (leftExpandBtn) {
      leftExpandBtn.addEventListener("click", () =>
        this.leftToolbar.toggleExpand()
      );
    }

    // Right toolbar expand button
    const rightExpandBtn = document.getElementById("right-expand-btn");
    if (rightExpandBtn) {
      rightExpandBtn.addEventListener("click", () =>
        this.rightToolbar.toggleExpand()
      );
    }

    // Tool buttons
    const selectBtn = document.getElementById("tool-select");
    if (selectBtn) {
      selectBtn.addEventListener("click", () =>
        this.editor.selectTool("select")
      );
    }

    const entityBtn = document.getElementById("tool-entity");
    if (entityBtn) {
      entityBtn.addEventListener("click", () =>
        this.editor.selectTool("entity")
      );
    }

    const deleteBtn = document.getElementById("tool-delete");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", () =>
        this.editor.selectTool("delete")
      );
    }
  }

  setupCanvasListeners() {
    // Only setup canvas listeners when game exists
    if (!this.editor.game || !this.editor.game.render) {
      return;
    }

    const canvas = this.editor.game.render.canvas;

    // Canvas events for tools
    canvas.addEventListener("contextmenu", (e) => {
      if (this.editor.isActive) {
        e.preventDefault();
      }
    });

    canvas.addEventListener("mousedown", (e) => {
      if (!this.editor.isActive || this.editor.isDragging) return;

      // Don't trigger tool events if clicking on context menu
      if (
        e.target.closest("#entity-context-menu") ||
        e.target.closest("#select-context-menu")
      )
        return;

      const rect = canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const worldPos = this.editor.currentTool.screenToWorld(screenX, screenY);

      this.editor.currentTool.onMouseDown(e, worldPos);
    });

    canvas.addEventListener("mousemove", (e) => {
      if (!this.editor.isActive) return;

      const rect = canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const worldPos = this.editor.currentTool.screenToWorld(screenX, screenY);

      this.editor.currentTool.onMouseMove(e, worldPos);
    });

    canvas.addEventListener("mouseup", (e) => {
      if (!this.editor.isActive) return;

      const rect = canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const worldPos = this.editor.currentTool.screenToWorld(screenX, screenY);

      this.editor.currentTool.onMouseUp(e, worldPos);
    });

    document.addEventListener("keydown", (e) => {
      if (!this.editor.isActive) return;
      this.editor.currentTool.onKeyDown(e);
    });
  }

  switchLeftTab(tab) {
    this.leftToolbar.switchTab(tab);

    if (tab === "hierarchy") {
      this.editor.renderHierarchy();
    }
  }

  show() {
    if (this.container) {
      this.container.style.display = "block";
    }
  }

  hide() {
    if (this.container) {
      this.container.style.display = "none";
    }
  }

  updateToolButtonHighlight(activeTool) {
    // Reset all tool buttons
    document.querySelectorAll(".editor-tool-btn").forEach((btn) => {
      btn.style.background = "#3498db";
    });

    // Highlight active tool
    const activeBtn = document.getElementById(`tool-${activeTool}`);
    if (activeBtn) {
      activeBtn.style.background = "#2ecc71";
    }
  }
}
