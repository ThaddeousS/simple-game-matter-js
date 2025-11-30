import { ToolBar } from "./tool-bar.js";
import { Styles } from "../../../styles/styles.js";

export class TopToolBar extends ToolBar {
  constructor() {
    super("editor-top-toolbar", Styles.editorTopToolbar);
  }

  createContent() {
    const html = `
                    <button class="editor-btn" id="editor-create-world-btn" style="${Styles.editorButton}">Create World</button>
                    <button class="editor-btn" id="editor-revert-btn" style="${Styles.buttonWarning}">Reset</button>
                    <button class="editor-btn" id="editor-save-btn" style="${Styles.editorButton}">Save</button>
                    <button class="editor-btn" id="editor-load-btn" style="${Styles.editorButton}">Load</button>
                    <button class="editor-btn" id="editor-exit-btn" style="background: #e74c3c; padding: 8px 20px; font-size: 14px; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">Exit</button>
                `;
    this.setContent(html);
  }
}
