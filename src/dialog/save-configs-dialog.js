import { Dialog } from "./dialog.js";
import { Styles } from "../styles/styles.js";

export class SaveConfigsDialog extends Dialog {
  constructor(onSaveLevel, onSaveGame) {
    super();
    this.onSaveLevel = onSaveLevel;
    this.onSaveGame = onSaveGame;
    this.createDialog();
  }

  createDialog() {
    // Create main dialog container
    this.dialog = document.createElement("div");
    this.dialog.id = "save-configs-dialog";
    this.dialog.style.cssText = Styles.createWorldDialog;

    // Create title
    const title = document.createElement("h2");
    title.style.cssText = Styles.createWorldDialogTitle;
    title.textContent = "Save Configuration";

    // Create description
    const description = document.createElement("p");
    description.style.cssText = Styles.propertyDialogText;
    description.textContent = "Choose which configuration to save:";

    // Create buttons container
    const buttonsContainer = document.createElement("div");
    buttonsContainer.style.cssText =
      "display: flex; flex-direction: column; gap: 10px; margin: 20px 0;";

    // Create save level button
    const saveLevelBtn = document.createElement("button");
    saveLevelBtn.style.cssText = Styles.createWorldDialogCreateButton;
    saveLevelBtn.textContent = "Save Level Config";
    saveLevelBtn.addEventListener("click", () => {
      this.close();
      if (this.onSaveLevel) this.onSaveLevel();
    });

    // Create save game button
    const saveGameBtn = document.createElement("button");
    saveGameBtn.style.cssText = Styles.createWorldDialogCreateButton;
    saveGameBtn.textContent = "Save Game Config";
    saveGameBtn.addEventListener("click", () => {
      this.close();
      if (this.onSaveGame) this.onSaveGame();
    });

    // Create cancel button
    const cancelBtn = document.createElement("button");
    cancelBtn.style.cssText = Styles.createWorldDialogCancelButton;
    cancelBtn.textContent = "Cancel";
    cancelBtn.addEventListener("click", () => this.close());

    buttonsContainer.appendChild(saveLevelBtn);
    buttonsContainer.appendChild(saveGameBtn);
    buttonsContainer.appendChild(cancelBtn);

    // Assemble dialog
    this.dialog.appendChild(title);
    this.dialog.appendChild(description);
    this.dialog.appendChild(buttonsContainer);

    // Add to body
    document.body.appendChild(this.dialog);
  }
}
