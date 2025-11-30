import { Dialog } from "./dialog.js";
import { Styles } from "../styles/styles.js";

export class GameOverDialog extends Dialog {
  constructor(onReset) {
    super();
    this.onReset = onReset;
    this.resetButton = null;
    this.createDialog();
  }

  createDialog() {
    // Create main dialog container
    this.dialog = document.createElement("div");
    this.dialog.id = "game-over-dialog";
    this.dialog.style.cssText = Styles.gameOverDialog;

    // Create title
    const title = document.createElement("h1");
    title.style.cssText = Styles.gameOverTitle;
    title.textContent = "GAME OVER";

    // Create message
    const message = document.createElement("p");
    message.style.cssText = Styles.gameOverMessage;
    message.textContent = "You fell out of the world!";

    // Create reset button
    this.resetButton = document.createElement("button");
    this.resetButton.id = "reset-button";
    this.resetButton.style.cssText = Styles.gameOverButton;
    this.resetButton.textContent = "RESET GAME";

    // Set up reset button click handler
    if (this.onReset) {
      this.resetButton.addEventListener("click", this.onReset);
    }

    // Assemble the dialog
    this.dialog.appendChild(title);
    this.dialog.appendChild(message);
    this.dialog.appendChild(this.resetButton);

    // Add to body
    document.body.appendChild(this.dialog);
  }

  setResetCallback(callback) {
    this.onReset = callback;
    if (this.resetButton && callback) {
      // Remove old listeners by replacing the button
      const newButton = this.resetButton.cloneNode(true);
      this.resetButton.parentNode.replaceChild(newButton, this.resetButton);
      this.resetButton = newButton;
      this.resetButton.addEventListener("click", callback);
    }
  }
}
