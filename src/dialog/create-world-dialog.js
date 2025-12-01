import { Dialog } from "./dialog.js";
import { Styles } from "../styles/styles.js";

export class CreateWorldDialog extends Dialog {
  constructor(onCreateWorld) {
    super();
    this.onCreateWorld = onCreateWorld;
    this.createDialog();
  }

  createDialog() {
    // Create main dialog container
    this.dialog = document.createElement("div");
    this.dialog.id = "create-world-dialog";
    this.dialog.style.cssText = Styles.createWorldDialog;

    // Create title
    const title = document.createElement("h2");
    title.style.cssText = Styles.createWorldDialogTitle;
    title.textContent = "Create World";

    // Create form container
    const form = document.createElement("div");
    form.style.cssText = Styles.createWorldDialogForm;

    // ========== SECTION 1: Manual World Creation ==========
    const manualSection = document.createElement("div");
    manualSection.style.cssText = Styles.createWorldDialogSection;

    const manualTitle = document.createElement("h3");
    manualTitle.style.cssText = Styles.createWorldDialogSectionTitle;
    manualTitle.textContent = "Manual World Settings";

    // World Size input
    const worldSizeLabel = document.createElement("label");
    worldSizeLabel.style.cssText = Styles.createWorldDialogLabel;
    worldSizeLabel.textContent = "World Size:";

    const worldSizeInput = document.createElement("input");
    worldSizeInput.type = "number";
    worldSizeInput.id = "manual-world-size";
    worldSizeInput.placeholder = "3000 (default)";
    worldSizeInput.style.cssText = Styles.createWorldDialogInput;

    // Gravity input
    const gravityLabel = document.createElement("label");
    gravityLabel.style.cssText = Styles.createWorldDialogLabel;
    gravityLabel.textContent = "Gravity:";

    const gravityInput = document.createElement("input");
    gravityInput.type = "number";
    gravityInput.step = "0.1";
    gravityInput.id = "manual-gravity";
    gravityInput.placeholder = "1 (default)";
    gravityInput.style.cssText = Styles.createWorldDialogInput;

    // Boundaries checkbox
    const boundariesContainer = document.createElement("div");
    boundariesContainer.style.cssText =
      Styles.createWorldDialogCheckboxContainer;

    const boundariesCheckbox = document.createElement("input");
    boundariesCheckbox.type = "checkbox";
    boundariesCheckbox.id = "manual-boundaries";
    boundariesCheckbox.checked = true;

    const boundariesLabel = document.createElement("label");
    boundariesLabel.htmlFor = "manual-boundaries";
    boundariesLabel.style.cssText = `${Styles.createWorldDialogLabel} cursor: pointer;`;
    boundariesLabel.textContent = "Create Boundaries (walls)";

    boundariesContainer.appendChild(boundariesCheckbox);
    boundariesContainer.appendChild(boundariesLabel);

    manualSection.appendChild(manualTitle);
    manualSection.appendChild(worldSizeLabel);
    manualSection.appendChild(worldSizeInput);
    manualSection.appendChild(gravityLabel);
    manualSection.appendChild(gravityInput);
    manualSection.appendChild(boundariesContainer);

    // ========== OR Divider ==========
    const divider = document.createElement("div");
    divider.style.cssText = Styles.createWorldDialogDivider;

    const line1 = document.createElement("div");
    line1.style.cssText = Styles.createWorldDialogDividerLine;

    const orText = document.createElement("span");
    orText.style.cssText = Styles.createWorldDialogDividerText;
    orText.textContent = "OR";

    const line2 = document.createElement("div");
    line2.style.cssText = Styles.createWorldDialogDividerLine;

    divider.appendChild(line1);
    divider.appendChild(orText);
    divider.appendChild(line2);

    // ========== SECTION 2: Load from Config ==========
    const configSection = document.createElement("div");
    configSection.style.cssText = Styles.createWorldDialogSection;

    const configTitle = document.createElement("h3");
    configTitle.style.cssText = Styles.createWorldDialogSectionTitle;
    configTitle.textContent = "Load from Config Files";

    // Game Config Path input
    const gameConfigLabel = document.createElement("label");
    gameConfigLabel.style.cssText = Styles.createWorldDialogLabel;
    gameConfigLabel.textContent = "Game Config Path:";

    const gameConfigInput = document.createElement("input");
    gameConfigInput.type = "text";
    gameConfigInput.id = "game-config-path";
    gameConfigInput.placeholder = "game-config.json (default)";
    gameConfigInput.style.cssText = Styles.createWorldDialogInput;

    // Level Config Path input
    const levelConfigLabel = document.createElement("label");
    levelConfigLabel.style.cssText = Styles.createWorldDialogLabel;
    levelConfigLabel.textContent = "Level Config Path:";

    const levelConfigInput = document.createElement("input");
    levelConfigInput.type = "text";
    levelConfigInput.id = "level-config-path";
    levelConfigInput.placeholder = "level1.json (default)";
    levelConfigInput.style.cssText = Styles.createWorldDialogInput;

    configSection.appendChild(configTitle);
    configSection.appendChild(gameConfigLabel);
    configSection.appendChild(gameConfigInput);
    configSection.appendChild(levelConfigLabel);
    configSection.appendChild(levelConfigInput);

    // ========== Buttons ==========
    const buttonsContainer = document.createElement("div");
    buttonsContainer.style.cssText = Styles.createWorldDialogButtonsContainer;

    // Create button
    const createButton = document.createElement("button");
    createButton.textContent = "Create World";
    createButton.style.cssText = Styles.createWorldDialogCreateButton;
    createButton.addEventListener("click", () => {
      // Gather manual settings
      const manualSettings = {
        worldSize: worldSizeInput.value.trim()
          ? parseInt(worldSizeInput.value)
          : null,
        gravity: gravityInput.value.trim()
          ? parseFloat(gravityInput.value)
          : null,
        boundaries: boundariesCheckbox.checked,
      };

      // Gather config paths
      const configPaths = {
        gameConfigPath: gameConfigInput.value.trim() || null,
        levelConfigPath: levelConfigInput.value.trim() || null,
      };

      if (this.onCreateWorld) {
        this.onCreateWorld(manualSettings, configPaths);
      }
      this.close();
    });

    // Cancel button
    const cancelButton = document.createElement("button");
    cancelButton.textContent = "Cancel";
    cancelButton.style.cssText = Styles.createWorldDialogCancelButton;
    cancelButton.addEventListener("click", () => {
      this.close();
    });

    // Assemble form
    form.appendChild(manualSection);
    form.appendChild(divider);
    form.appendChild(configSection);

    buttonsContainer.appendChild(createButton);
    buttonsContainer.appendChild(cancelButton);

    // Assemble dialog
    this.dialog.appendChild(title);
    this.dialog.appendChild(form);
    this.dialog.appendChild(buttonsContainer);

    // Add to body
    document.body.appendChild(this.dialog);
  }
}
