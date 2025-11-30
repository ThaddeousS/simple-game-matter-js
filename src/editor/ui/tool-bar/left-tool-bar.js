import { ToolBar } from "./tool-bar.js";
import { Styles } from "../../../styles/styles.js";

export class LeftToolBar extends ToolBar {
  constructor(defaultWidth) {
    super("editor-left-toolbar", Styles.editorLeftToolbar);
    this.defaultWidth = defaultWidth;
    this.currentTab = "tools";
  }

  createElement() {
    this.element = document.createElement("div");
    this.element.id = this.id;
    // Set cssText with width included
    this.element.style.cssText = `${this.baseStyles} width: ${this.defaultWidth}px;`;
    this.width = this.defaultWidth;
    return this.element;
  }

  createContent() {
    const html = `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <div style="display: flex; gap: 5px;">
                            <button class="left-tab-btn" id="tools-tab-btn" style="${Styles.editorTabButtonActive}">Tools</button>
                            <button class="left-tab-btn" id="hierarchy-tab-btn" style="${Styles.editorTabButton}">Hierarchy</button>
                        </div>
                        <button id="left-expand-btn" style="${Styles.editorExpandButton}">▶</button>
                    </div>
                    <div id="tools-tab-content" style="display: flex; flex-direction: column; gap: 8px;">
                        <button class="editor-tool-btn" id="tool-select" style="${Styles.editorToolButton}">Select</button>
                        <button class="editor-tool-btn" id="tool-entity" style="${Styles.editorToolButton}">Add Entity</button>
                        <button class="editor-tool-btn" id="tool-delete" style="${Styles.editorToolButton}">Delete</button>
                    </div>
                    <div id="hierarchy-tab-content" style="display: none;"></div>
                `;
    this.setContent(html);
  }

  switchTab(tab) {
    this.currentTab = tab;

    const toolsTabBtn = document.getElementById("tools-tab-btn");
    const hierarchyTabBtn = document.getElementById("hierarchy-tab-btn");

    if (toolsTabBtn && hierarchyTabBtn) {
      if (tab === "tools") {
        toolsTabBtn.style.cssText = Styles.editorTabButtonActive;
        hierarchyTabBtn.style.cssText = Styles.editorTabButton;
      } else {
        toolsTabBtn.style.cssText = Styles.editorTabButton;
        hierarchyTabBtn.style.cssText = Styles.editorTabButtonActive;
      }
    }

    const toolsContent = document.getElementById("tools-tab-content");
    const hierarchyContent = document.getElementById("hierarchy-tab-content");

    if (toolsContent && hierarchyContent) {
      toolsContent.style.display = tab === "tools" ? "flex" : "none";
      hierarchyContent.style.display = tab === "hierarchy" ? "block" : "none";
    }
  }

  toggleExpand() {
    this.isExpanded = !this.isExpanded;
    const newWidth = this.isExpanded
      ? this.defaultWidth * 2
      : this.defaultWidth;
    this.setWidth(newWidth);

    const expandBtn = document.getElementById("left-expand-btn");
    if (expandBtn) {
      expandBtn.textContent = this.isExpanded ? "◀" : "▶";
    }
  }
}
