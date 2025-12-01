import { ToolBar } from "./tool-bar.js";
import { Styles } from "../../../styles/styles.js";

export class TopToolBar extends ToolBar {
  constructor() {
    super("editor-top-toolbar", Styles.editorTopToolbar);
  }

  createContent() {
    const html = `
                    <button class="editor-btn" id="editor-create-world-btn" style="${Styles.editorButton}">Create World</button>
                    <button class="editor-btn" id="editor-revert-btn" style="${Styles.buttonWarning}">Reset State</button>
                    <button class="editor-btn" id="editor-reload-level-btn" style="${Styles.buttonWarning}">Reload Level</button>
                    <button class="editor-btn" id="editor-save-btn" style="${Styles.editorButton}">Save</button>
                    <button class="editor-btn" id="editor-save-configs-btn" style="${Styles.editorButton}">Save Configs</button>
                    <button class="editor-btn" id="editor-exit-btn" style="${Styles.editorExitButton}">Exit</button>
                `;
    this.setContent(html);
  }
}
