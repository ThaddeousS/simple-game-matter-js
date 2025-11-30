import { Dialog } from "./dialog.js";

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
    this.dialog.style.cssText = `
                    display: none;
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: rgba(20, 20, 30, 0.98);
                    border: 3px solid #3498db;
                    border-radius: 10px;
                    padding: 30px;
                    z-index: 10000;
                    min-width: 500px;
                    max-width: 600px;
                    box-shadow: 0 0 30px rgba(0, 0, 0, 0.8);
                    max-height: 80vh;
                    overflow-y: auto;
                `;

    // Create title
    const title = document.createElement("h2");
    title.style.cssText = `
                    color: #3498db;
                    margin: 0 0 20px 0;
                    font-size: 24px;
                    text-align: center;
                `;
    title.textContent = "Create World";

    // Create form container
    const form = document.createElement("div");
    form.style.cssText = `
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                `;

    // ========== SECTION 1: Manual World Creation ==========
    const manualSection = document.createElement("div");
    manualSection.style.cssText = `
                    border: 1px solid #555;
                    border-radius: 8px;
                    padding: 20px;
                    background: rgba(255, 255, 255, 0.05);
                `;

    const manualTitle = document.createElement("h3");
    manualTitle.style.cssText =
      "color: #3498db; margin: 0 0 15px 0; font-size: 16px;";
    manualTitle.textContent = "Manual World Settings";

    // World Size input
    const worldSizeLabel = document.createElement("label");
    worldSizeLabel.style.cssText =
      "color: white; font-size: 14px; display: block; margin-bottom: 5px;";
    worldSizeLabel.textContent = "World Size:";

    const worldSizeInput = document.createElement("input");
    worldSizeInput.type = "number";
    worldSizeInput.id = "manual-world-size";
    worldSizeInput.placeholder = "3000 (default)";
    worldSizeInput.style.cssText = `
                    padding: 8px;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid #555;
                    border-radius: 4px;
                    color: white;
                    font-size: 14px;
                    width: 100%;
                    margin-bottom: 15px;
                `;

    // Gravity input
    const gravityLabel = document.createElement("label");
    gravityLabel.style.cssText =
      "color: white; font-size: 14px; display: block; margin-bottom: 5px;";
    gravityLabel.textContent = "Gravity:";

    const gravityInput = document.createElement("input");
    gravityInput.type = "number";
    gravityInput.step = "0.1";
    gravityInput.id = "manual-gravity";
    gravityInput.placeholder = "1 (default)";
    gravityInput.style.cssText = `
                    padding: 8px;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid #555;
                    border-radius: 4px;
                    color: white;
                    font-size: 14px;
                    width: 100%;
                    margin-bottom: 15px;
                `;

    // Boundaries checkbox
    const boundariesContainer = document.createElement("div");
    boundariesContainer.style.cssText =
      "display: flex; align-items: center; gap: 10px; margin-bottom: 10px;";

    const boundariesCheckbox = document.createElement("input");
    boundariesCheckbox.type = "checkbox";
    boundariesCheckbox.id = "manual-boundaries";
    boundariesCheckbox.checked = true;

    const boundariesLabel = document.createElement("label");
    boundariesLabel.htmlFor = "manual-boundaries";
    boundariesLabel.style.cssText =
      "color: white; font-size: 14px; cursor: pointer;";
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
    divider.style.cssText = `
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    margin: 10px 0;
                `;

    const line1 = document.createElement("div");
    line1.style.cssText = "flex: 1; height: 1px; background: #555;";

    const orText = document.createElement("span");
    orText.style.cssText =
      "color: #7f8c8d; font-size: 14px; font-weight: bold;";
    orText.textContent = "OR";

    const line2 = document.createElement("div");
    line2.style.cssText = "flex: 1; height: 1px; background: #555;";

    divider.appendChild(line1);
    divider.appendChild(orText);
    divider.appendChild(line2);

    // ========== SECTION 2: Load from Config ==========
    const configSection = document.createElement("div");
    configSection.style.cssText = `
                    border: 1px solid #555;
                    border-radius: 8px;
                    padding: 20px;
                    background: rgba(255, 255, 255, 0.05);
                `;

    const configTitle = document.createElement("h3");
    configTitle.style.cssText =
      "color: #3498db; margin: 0 0 15px 0; font-size: 16px;";
    configTitle.textContent = "Load from Config Files";

    // Game Config Path input
    const gameConfigLabel = document.createElement("label");
    gameConfigLabel.style.cssText =
      "color: white; font-size: 14px; display: block; margin-bottom: 5px;";
    gameConfigLabel.textContent = "Game Config Path:";

    const gameConfigInput = document.createElement("input");
    gameConfigInput.type = "text";
    gameConfigInput.id = "game-config-path";
    gameConfigInput.placeholder = "game-config.json (default)";
    gameConfigInput.style.cssText = `
                    padding: 8px;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid #555;
                    border-radius: 4px;
                    color: white;
                    font-size: 14px;
                    width: 100%;
                    margin-bottom: 15px;
                `;

    // Level Config Path input
    const levelConfigLabel = document.createElement("label");
    levelConfigLabel.style.cssText =
      "color: white; font-size: 14px; display: block; margin-bottom: 5px;";
    levelConfigLabel.textContent = "Level Config Path:";

    const levelConfigInput = document.createElement("input");
    levelConfigInput.type = "text";
    levelConfigInput.id = "level-config-path";
    levelConfigInput.placeholder = "level1.json (default)";
    levelConfigInput.style.cssText = `
                    padding: 8px;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid #555;
                    border-radius: 4px;
                    color: white;
                    font-size: 14px;
                    width: 100%;
                `;

    configSection.appendChild(configTitle);
    configSection.appendChild(gameConfigLabel);
    configSection.appendChild(gameConfigInput);
    configSection.appendChild(levelConfigLabel);
    configSection.appendChild(levelConfigInput);

    // ========== Buttons ==========
    const buttonsContainer = document.createElement("div");
    buttonsContainer.style.cssText = `
                    display: flex;
                    gap: 10px;
                    margin-top: 20px;
                    justify-content: center;
                `;

    // Create button
    const createButton = document.createElement("button");
    createButton.textContent = "Create World";
    createButton.style.cssText = `
                    padding: 12px 30px;
                    background: #3498db;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: bold;
                `;
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
    cancelButton.style.cssText = `
                    padding: 12px 30px;
                    background: #7f8c8d;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 16px;
                `;
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
