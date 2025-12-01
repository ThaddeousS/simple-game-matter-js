import { ToolBar } from "./tool-bar.js";
import { Styles } from "../../../styles/styles.js";

export class RightToolBar extends ToolBar {
  constructor(defaultWidth) {
    super("editor-right-toolbar", Styles.editorRightToolbarWithPadding);
    this.defaultWidth = defaultWidth;
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
                    <div style="${Styles.toolbarHeaderContainer}">
                        <button id="right-expand-btn" style="${Styles.editorExpandButton}">◀</button>
                        <h3 style="${Styles.propertiesPanelTitle}">Properties</h3>
                    </div>
                    <div id="editor-properties">
                        <p style="${Styles.propertiesPanelEmpty}">Select an object to edit properties</p>
                    </div>
                `;
    this.setContent(html);
  }

  toggleExpand() {
    this.isExpanded = !this.isExpanded;
    const newWidth = this.isExpanded
      ? this.defaultWidth * 2
      : this.defaultWidth;
    this.setWidth(newWidth);

    const expandBtn = document.getElementById("right-expand-btn");
    if (expandBtn) {
      expandBtn.textContent = this.isExpanded ? "▶" : "◀";
    }
  }

  setPropertiesContent(html) {
    const propertiesDiv = document.getElementById("editor-properties");
    if (propertiesDiv) {
      propertiesDiv.innerHTML = html;
    }
  }
}
